/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, RefreshCcw, Menu, TrendingUp, Factory, Truck, CreditCard, Settings, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// CONFIGURACIÓN DE RED
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
axios.defaults.baseURL = window.location.origin + '/api';

const fmt = (number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(number || 0);

// --- FUNCIÓN IMPRESIÓN DE FACTURA ---
const imprimirFactura = (cart, total, responsable, metodo, cliente, recibido, cambio) => {
    try {
        const doc = new jsPDF({ unit: 'mm', format: [80, 150 + (cart.length * 10)] }); 
        const ancho = 80;
        doc.setFontSize(14); doc.text("ACCUCLOUD ERP", ancho/2, 10, {align: 'center'});
        doc.setFontSize(8);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 5, 20);
        doc.text(`Cajero: ${responsable}`, 5, 24);
        doc.text(`Cliente: ${cliente?.nombre || 'General'}`, 5, 28);
        autoTable(doc, {
            startY: 35, margin: { left: 2, right: 2 },
            head: [['Cant', 'Producto', 'Subt']],
            body: cart.map(p => [p.cantidad, p.nombre.substring(0,12), fmt(p.precio * p.cantidad)]),
            theme: 'plain', styles: { fontSize: 7 }
        });
        const finalY = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(10);
        doc.text(`TOTAL: ${fmt(total)}`, ancho - 5, finalY, { align: 'right' });
        doc.setFontSize(7);
        doc.text(`Recibido: ${fmt(recibido || total)}`, 5, finalY + 5);
        doc.text(`Cambio: ${fmt(cambio || 0)}`, 5, finalY + 9);
        window.open(doc.output('bloburl'), '_blank');
    } catch (e) { console.error(e); }
};

// ==========================================
//           COMPONENTE PRINCIPAL
// ==========================================
function App() {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [showPSE, setShowPSE] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('erp_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoadingSession(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('erp_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('erp_user');
  };

  if (loadingSession) return <div className="h-screen flex items-center justify-center font-black text-blue-600">CARGANDO...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? <LoginScreen onLogin={handleLogin} onBuy={() => setShowPSE(true)} /> : <Dashboard user={user} onLogout={handleLogout} />}
    </div>
  );
}

// --- LOGIN ---
function LoginScreen({ onLogin, onBuy }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regForm, setRegForm] = useState({ nombre: '', email: '', password: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await axios.post('/register', regForm);
        window.alert("Empresa registrada."); setIsRegistering(false);
      } else {
        const res = await axios.post('/login', { email, password });
        if (res.data.success) onLogin(res.data.user);
        else window.alert('Datos incorrectos');
      }
    } catch (e) { window.alert('Backend despertando... reintenta en 10 segundos.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4">
      <div className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md">
        <h1 className="text-4xl font-black text-center text-slate-800 mb-2 italic tracking-tighter">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-center text-slate-400 font-bold text-[10px] uppercase mb-10 tracking-widest">{isRegistering ? 'Crear Cuenta' : 'Ingreso'}</p>
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Nombre Empresa" onChange={e=>setRegForm({...regForm, nombre:e.target.value})} required/>}
          <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={isRegistering ? regForm.email : email} onChange={e => isRegistering ? setRegForm({...regForm, email:e.target.value}) : setEmail(e.target.value)} placeholder="Email" required />
          <input type="password" class="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={isRegistering ? regForm.password : password} onChange={e => isRegistering ? setRegForm({...regForm, password:e.target.value}) : setPassword(e.target.value)} placeholder="Contraseña" required />
          <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all">
            {isRegistering ? 'REGISTRARME' : 'INGRESAR'}
          </button>
        </form>
        <button onClick={onBuy} className="w-full mt-10 p-4 bg-green-50 text-green-600 border-2 border-green-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-100 transition-all">
            Haz parte del mejor sistema para tu negocio
        </button>
        <button onClick={()=>setIsRegistering(!isRegistering)} className="w-full mt-4 text-blue-600 font-black text-sm hover:underline uppercase tracking-tighter">
            {isRegistering ? 'Ya tengo cuenta' : 'Registrar Nueva Empresa'}
        </button>
      </div>
    </div>
  );
}

// --- DASHBOARD LAYOUT ---
function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const recargarTurno = useCallback(() => {
    axios.get('/turnos/activo/' + user.id).then(res => setTurnoActivo(res.data));
  }, [user.id]);

  useEffect(() => { recargarTurno(); }, [recargarTurno]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 flex-col md:flex-row">
      <div className="md:hidden bg-white p-4 flex justify-between items-center border-b shadow-sm z-30">
        <h1 className="font-black text-xl italic">ACCUCLOUD<span className="text-blue-600">.</span></h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-100 rounded-xl">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r transform transition-transform duration-300 ease-in-out px-6 flex flex-col md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-28 hidden md:flex items-center font-black text-2xl text-slate-800 italic uppercase tracking-tighter">ACCUCLOUD <span className="text-blue-600">.</span></div>
        <nav className="flex-1 space-y-1 overflow-y-auto mt-10 md:mt-0">
          {['Admin', 'Contador'].includes(user.cargo) && <MenuButton icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab==='dashboard'} onClick={()=>{setActiveTab('dashboard'); setIsMobileMenuOpen(false);}} />}
          {['Admin', 'Vendedor'].includes(user.cargo) && <MenuButton icon={<ShoppingCart size={20}/>} label="Ventas (TPV)" active={activeTab==='ventas'} onClick={()=>{setActiveTab('ventas'); setIsMobileMenuOpen(false);}} />}
          {['Admin', 'Bodeguero'].includes(user.cargo) && <MenuButton icon={<Package size={20}/>} label="Inventario" active={activeTab==='inventario'} onClick={()=>{setActiveTab('inventario'); setIsMobileMenuOpen(false);}} />}
          {['Admin', 'Prealistador', 'Produccion', 'Logistica'].includes(user.cargo) && <MenuButton icon={<Factory size={20}/>} label="Producción" active={activeTab==='produccion'} onClick={()=>{setActiveTab('produccion'); setIsMobileMenuOpen(false);}} />}
          {['Admin', 'Nomina'].includes(user.cargo) && <MenuButton icon={<Users size={20}/>} label="Nómina PRO" active={activeTab==='nomina'} onClick={()=>{setActiveTab('nomina'); setIsMobileMenuOpen(false);}} />}
          {['Admin', 'Contador'].includes(user.cargo) && <MenuButton icon={<Calculator size={20}/>} label="Contabilidad" active={activeTab==='conta'} onClick={()=>{setActiveTab('conta'); setIsMobileMenuOpen(false);}} />}
          {['Admin', 'Vendedor'].includes(user.cargo) && <MenuButton icon={<Wallet size={20}/>} label="Caja y Turnos" active={activeTab==='caja'} onClick={()=>{setActiveTab('caja'); setIsMobileMenuOpen(false);}} />}
          {user.cargo === 'Admin' && <MenuButton icon={<ShieldCheck size={20}/>} label="Configuración" active={activeTab==='admin'} onClick={()=>{setActiveTab('admin'); setIsMobileMenuOpen(false);}} />}
        </nav>
        <div className="py-8 border-t space-y-4">
            <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-3 border border-slate-100">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black">{user.nombre.charAt(0)}</div>
                <div className="overflow-hidden"><p className="font-black text-slate-800 text-sm truncate">{user.nombre}</p></div>
            </div>
            <button onClick={onLogout} className="w-full text-red-500 text-xs font-black py-2 hover:bg-red-50 rounded-xl transition uppercase tracking-widest">Salir</button>
        </div>
      </aside>

      {isMobileMenuOpen && <div onClick={()=>setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"></div>}

      <main className="flex-1 overflow-auto p-4 md:p-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{activeTab}</h2>
            {turnoActivo ? <div className="w-full md:w-auto px-4 py-2 bg-green-100 text-green-700 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 border border-green-200 uppercase tracking-widest"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> EN TURNO: {user.nombre.toUpperCase()} | {fmt(turnoActivo.total_vendido)}</div> : <div className="w-full md:w-auto px-4 py-2 bg-red-100 text-red-700 rounded-xl text-[10px] font-black border border-red-200 text-center uppercase tracking-widest">Caja Cerrada</div>}
        </header>
        <div className="pb-20 md:pb-0">
          {activeTab==='dashboard' && <ResumenView user={user}/>}
          {activeTab==='caja' && <CajaView user={user} turnoActivo={turnoActivo} onUpdate={recargarTurno}/>}
          {activeTab==='ventas' && <VentasView user={user} turnoActivo={turnoActivo}/>}
          {activeTab==='inventario' && <InventarioView user={user}/>}
          {activeTab==='nomina' && <NominaView user={user}/>}
          {activeTab==='conta' && <ContabilidadView user={user}/>}
          {activeTab==='admin' && <AdminView user={user}/>}
          {activeTab==='produccion' && <ProduccionView user={user}/>}
        </div>
      </main>
    </div>
  );
}

// --- MÓDULO PRODUCCIÓN ---
function ProduccionView({ user }) {
    const [subTab, setSubTab] = useState('materia');
    const [materias, setMaterias] = useState([]);
    const [ordenes, setOrdenes] = useState([]);
    const [formMateria, setFormMateria] = useState({ nombre: '', unidad: 'mg', cantidad: 0, proposito: '', costo: 0 });

    const load = useCallback(async () => {
        const resM = await axios.get(`/produccion/materia?company_id=${user.company_id}`);
        const resO = await axios.get(`/produccion/ordenes?company_id=${user.company_id}`);
        setMaterias(Array.isArray(resM.data) ? resM.data : []);
        setOrdenes(Array.isArray(resO.data) ? resO.data : []);
    }, [user.company_id]);

    useEffect(() => { load(); }, [load, subTab]);

    const avanzarOrden = async (id, nuevoEstado) => {
        if(window.confirm(`¿Avanzar orden a ${nuevoEstado}?`)) {
            await axios.put(`/produccion/ordenes/${id}/estado`, { estado: nuevoEstado });
            load();
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm overflow-x-auto">
                {['Admin', 'Prealistador'].includes(user.cargo) && <button onClick={()=>setSubTab('materia')} className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${subTab==='materia'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Materia Prima</button>}
                {['Admin', 'Prealistador', 'Produccion'].includes(user.cargo) && <button onClick={()=>setSubTab('ordenes')} className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${subTab==='ordenes'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Órdenes</button>}
                {['Admin', 'Logistica'].includes(user.cargo) && <button onClick={()=>setSubTab('logistica')} className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${subTab==='logistica'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Logística</button>}
            </div>

            {subTab === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border h-fit">
                        <h3 className="font-black text-xl mb-6 uppercase italic">Ingresar Insumo</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/produccion/materia', {...formMateria, company_id: user.company_id}); load();}} className="space-y-4">
                            <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Nombre (Ej: Alcohol)" onChange={e=>setFormMateria({...formMateria, nombre: e.target.value})} required/>
                            <select className="w-full p-4 bg-slate-50 rounded-2xl font-black" onChange={e=>setFormMateria({...formMateria, unidad: e.target.value})}>
                                <option value="mg">Miligramos (mg)</option><option value="g">Gramos (g)</option><option value="ml">Mililitros (ml)</option><option value="unidades">Unidades</option>
                            </select>
                            <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" type="number" placeholder="Cantidad" onChange={e=>setFormMateria({...formMateria, cantidad: e.target.value})} required/>
                            <button className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl">GUARDAR EN STOCK</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[40px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr><th className="p-6">Insumo</th><th>Cantidad</th><th>Costo</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b"><td className="p-6 font-black">{m.nombre}</td><td>{m.cantidad} {m.unidad_medida}</td><td className="font-bold text-blue-600">{fmt(m.costo)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {subTab === 'ordenes' && (
                <div className="grid grid-cols-1 gap-6">
                    {ordenes.filter(o => o.estado === 'Prealistamiento' || o.estado === 'Produccion').map(o => (
                        <div key={o.id} className="bg-white p-8 rounded-[40px] shadow-md border-l-[15px] border-blue-500 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orden #{o.id}</p>
                                <h4 className="text-2xl font-black text-slate-800">{o.nombre_producto}</h4>
                                <p className="font-bold text-blue-600 uppercase text-xs">Estado: {o.estado}</p>
                            </div>
                            <div className="flex gap-3">
                                {o.estado === 'Prealistamiento' && user.cargo !== 'Produccion' && <button onClick={()=>avanzarOrden(o.id, 'Produccion')} className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl">INICIAR PRODUCCIÓN</button>}
                                {o.estado === 'Produccion' && user.cargo !== 'Prealistador' && <button onClick={()=>avanzarOrden(o.id, 'Logistica')} className="px-8 py-3 bg-green-600 text-white font-black rounded-2xl">ENVIAR A LOGÍSTICA</button>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- VISTA CAJA CON CLAVE MAESTRA ---
function CajaView({ user, onUpdate }) {
    const [turnoActivo, setTurnoActivo] = useState(null);
    const recargar = () => axios.get('/turnos/activo/' + user.id).then(res => setTurnoActivo(res.data));
    useEffect(() => { recargar(); }, []);

    const handleApertura = async () => {
        const pass = window.prompt("Introduce la CLAVE MAESTRA de la empresa:");
        const resV = await axios.post('/turnos/verificar-maestra', { company_id: user.company_id, password: pass });
        
        if (resV.data.success) {
            const base = window.prompt("¿Base de apertura?", "0");
            await axios.post('/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id });
            recargar();
        } else {
            window.alert("❌ Clave maestra incorrecta.");
        }
    };

    return (
        <div className="bg-white p-10 rounded-[40px] shadow-xl text-center max-w-lg mx-auto border border-blue-50 animate-fade-in">
            <Wallet size={60} className="mx-auto mb-6 text-blue-600"/>
            <h3 className="text-3xl font-black mb-6 uppercase italic tracking-tighter">{turnoActivo ? "CAJA ABIERTA" : "SISTEMA BLOQUEADO"}</h3>
            {turnoActivo ? (
                <div className="space-y-4">
                    <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">VENTAS EN TIEMPO REAL</p>
                        <h2 className="text-5xl font-black text-green-600 tracking-tighter">{fmt(turnoActivo.total_vendido)}</h2>
                    </div>
                    <button onClick={async ()=>{ if(window.confirm("¿Cerrar turno?")){ await axios.put('/turnos/finalizar', { turno_id: turnoActivo.id }); recargar(); } }} className="w-full py-5 bg-red-500 text-white font-black rounded-3xl shadow-xl hover:brightness-110 transition-all uppercase tracking-widest text-xs">REALIZAR CIERRE FINAL</button>
                </div>
            ) : (
                <button onClick={handleApertura} className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:brightness-110 transition-all uppercase tracking-widest text-xs">APERTURA CON CLAVE MAESTRA</button>
            )}
        </div>
    );
}

// --- PÁGINA DE VENTA PSE ---
function PSEPage({ onBack }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-12 rounded-[50px] shadow-2xl max-w-2xl w-full text-center border-t-[20px] border-blue-600">
                <h1 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter uppercase italic">AccuCloud PRO 2026</h1>
                <p className="text-slate-400 font-bold mb-8">El sistema más avanzado para tu empresa farmacéutica o comercial.</p>
                <div className="bg-blue-50 p-10 rounded-[40px] mb-10 border border-blue-100">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[4px] block mb-2">Suscripción Mensual</span>
                    <h2 className="text-7xl font-black text-blue-600 tracking-tighter">$600.000</h2>
                    <p className="text-xs text-blue-400 mt-4 font-bold uppercase tracking-widest">Pago Seguro vía PSE</p>
                </div>
                <button onClick={()=>window.alert("Redirigiendo a pasarela de pagos...")} className="w-full py-6 bg-slate-900 text-white font-black rounded-[30px] shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all uppercase tracking-widest text-sm">
                    <CreditCard /> PAGAR CON PSE
                </button>
                <button onClick={onBack} className="mt-8 text-slate-400 font-bold text-xs uppercase tracking-widest underline">VOLVER AL LOGIN</button>
            </div>
        </div>
    );
}

// --- VISTA ADMINISTRACIÓN ---
function AdminView({ user }) {
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' });
    const [mode, setMode] = useState('list');

    const load = useCallback(() => axios.get(`/admin/usuarios?company_id=${user.company_id}`).then(res => setUsuarios(res.data)), [user.company_id]);
    useEffect(() => { load(); }, [load]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (form.id) {
            await axios.put(`/admin/usuarios/${form.id}`, form);
            window.alert("Usuario actualizado");
        } else {
            await axios.post('/admin/usuarios', { ...form, company_id: user.company_id });
            window.alert("Usuario creado");
        }
        setForm({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' });
        setMode('list'); load();
    };

    const handleDelete = async (id) => {
        if(window.confirm("¿Eliminar?")) { await axios.delete(`/admin/usuarios/${id}`); load(); }
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 h-fit">
                <h3 className="font-black text-xl mb-8 tracking-tighter uppercase italic">{form.id ? 'Editar Acceso' : 'Nuevo Acceso'}</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/>
                    <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/>
                    <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" type="password" placeholder="Pass" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required={!form.id}/>
                    <select className="p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-700 text-sm" value={form.cargo} onChange={e=>setForm({...form, cargo: e.target.value})}>
                        <option value="Admin">Admin</option><option value="Vendedor">Vendedor</option><option value="Contador">Contador</option>
                        <option value="Bodeguero">Bodeguero</option><option value="Prealistador">Prealistador</option><option value="Produccion">Produccion</option><option value="Logistica">Logistica</option>
                    </select>
                    <button className="bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-[10px] tracking-widest">{form.id ? 'ACTUALIZAR' : 'AGREGAR'}</button>
                </form>
            </div>
            <div className="bg-white rounded-[40px] shadow-sm overflow-hidden border border-slate-100 pr-2">
                <div className="overflow-x-auto"><table className="w-full text-left min-w-[500px]"><thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Nombre</th><th>Email</th><th>Rol</th><th className="p-8 text-center">Acciones</th></tr></thead>
                <tbody>{usuarios.map(u => (<tr key={u.id} className="border-b hover:bg-slate-50 transition"><td className="p-8 font-black">{u.nombre}</td><td>{u.email}</td><td><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{u.cargo}</span></td>
                <td className="p-8 text-center flex justify-center gap-2">
                    <button onClick={()=>{setForm(u); window.scrollTo(0,0);}} className="text-blue-600 font-bold text-xs uppercase">Editar</button>
                    <button onClick={()=>handleDelete(u.id)} className="text-red-500 font-bold text-xs uppercase">Eliminar</button>
                </td></tr>))}</tbody></table></div>
            </div>
        </div>
    );
}

// --- VISTA DASHBOARD ---
function ResumenView({ user }) {
  const [data, setData] = useState({ cajaMayor: 0, cajaMenor: 0, valorInventario: 0, lowStock: 0, recentSales: [] });
  useEffect(() => { axios.get(`/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); }, []);
  const chartData = [{ name: 'L', v: 400 }, { name: 'M', v: 300 }, { name: 'M', v: 600 }, { name: 'J', v: 800 }, { name: 'V', v: 500 }, { name: 'S', v: 900 }, { name: 'D', v: 200 }];
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <CardStat title="Balance" value={fmt(data.cajaMayor)} icon={<DollarSign size={16}/>} color="blue" />
        <CardStat title="Caja" value={fmt(data.cajaMenor)} icon={<Wallet size={16}/>} color="green" />
        <CardStat title="Stock" value={fmt(data.valorInventario)} icon={<Package size={16}/>} color="purple" />
        <CardStat title="Alertas" value={data.lowStock} icon={<AlertTriangle size={16}/>} color="red" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[40px] shadow-sm border border-slate-100 h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '15px', border: 'none'}} />
                      <Bar dataKey="v" radius={[10, 10, 0, 0]} fill="#2563eb" />
                  </BarChart>
              </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[40px] shadow-sm border border-slate-100 h-80 md:h-96 overflow-auto">
              <h3 className="font-black text-slate-800 mb-6 tracking-tighter text-lg uppercase italic">Ventas Recientes</h3>
              {data.recentSales.map(v => (
                  <div key={v.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl mb-2">
                      <div className="text-xs font-bold text-slate-700 truncate mr-2">{v.nombre_producto}</div>
                      <span className="font-black text-slate-800 text-sm whitespace-nowrap">{fmt(v.total)}</span>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}

// --- VISTA CONTABILIDAD ---
function ContabilidadView({ user }) {
    const [subTab, setSubTab] = useState('ventas');
    const [datos, setDatos] = useState([]);
    const [sort, setSort] = useState('fecha DESC');
    const load = async () => {
        const res = await axios.get(`/contabilidad/${subTab}?sort=${sort}&company_id=${user.company_id}`);
        setDatos(Array.isArray(res.data) ? res.data : []);
    };
    useEffect(() => { load(); }, [subTab, sort]);
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm overflow-x-auto">
                <button onClick={()=>setSubTab('ventas')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${subTab==='ventas'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Libro Ventas</button>
                <button onClick={()=>setSubTab('compras')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${subTab==='compras'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Proveedores</button>
                <button onClick={()=>setSubTab('balance')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${subTab==='balance'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Balance General</button>
            </div>
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                <div className="overflow-x-auto"><table className="w-full text-left min-w-[600px]"><thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-6">Fecha</th><th>Detalle</th><th className="text-right p-6">Total</th></tr></thead><tbody>{datos.map(d=>(<tr key={d.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-6 text-xs font-bold text-slate-400">{new Date(d.fecha).toLocaleDateString()}</td><td className="font-black text-slate-700 uppercase text-xs">{d.nombre_producto || d.proveedor_nombre}</td><td className="p-6 text-right font-black text-blue-600">{fmt(d.total)}</td></tr>))}</tbody></table></div>
            </div>
        </div>
    );
}

// --- HELPERS ---
function MenuButton({ icon, label, active, onClick }) { return <button onClick={onClick} className={`w-full flex items-center px-6 py-5 rounded-[24px] mb-2 transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 -translate-y-1 scale-105' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}><span className="mr-4">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; }
function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow duration-300">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center mb-4 ${c[color]}`}>{icon}</div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-xs">{title}</p>
        <h3 className="text-sm md:text-2xl font-black text-slate-800 mt-1 tracking-tighter leading-none">{value}</h3>
    </div>; 
}

export default App;