/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, RefreshCcw, Menu, TrendingUp, Factory, Truck, History, Settings, ChevronRight, CreditCard, Edit3, Trash2, Save, Play, CheckCircle, MapPin, Box
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// CONFIGURACIÓN DE RED (Sincronizada con Vercel)
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
axios.defaults.baseURL = window.location.origin + '/api';

const fmt = (number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(number || 0);

// ==========================================
//           COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [showPSE, setShowPSE] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('erp_user');
    if (savedUser && savedUser !== "undefined") {
        try { 
            const parsed = JSON.parse(savedUser);
            if(parsed && parsed.id) setUser(parsed);
        } catch (e) { localStorage.removeItem('erp_user'); }
    }
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

  if (loadingSession) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-2xl">INICIANDO ACCUCLOUD PRO...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? <LoginScreen onLogin={handleLogin} onBuy={() => setShowPSE(true)} /> : <Dashboard user={user} onLogout={handleLogout} />}
    </div>
  );
}

// ==========================================
//      ESTRUCTURA DASHBOARD (CON ROLES)
// ==========================================
function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const recargarTurno = useCallback(() => {
    if (user?.id) axios.get('/turnos/activo/' + user.id).then(res => setTurnoActivo(res.data)).catch(() => setTurnoActivo(null));
  }, [user?.id]);

  useEffect(() => { recargarTurno(); }, [recargarTurno]);

  // FILTRADO DE MÓDULOS POR ROL
  const canSee = (roles) => roles.includes(user?.cargo) || user?.cargo === 'Admin';

  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard/>, roles: ['Admin', 'Contador'] },
    { id: 'ventas', label: 'Ventas TPV', icon: <ShoppingCart/>, roles: ['Admin', 'Vendedor'] },
    { id: 'inventario', label: 'Inventario/Lotes', icon: <Package/>, roles: ['Admin', 'Bodeguero'] },
    { id: 'produccion', label: 'Producción', icon: <Factory/>, roles: ['Admin', 'Prealistador', 'Produccion', 'Logistica'] },
    { id: 'nomina', label: 'Nómina PRO', icon: <Users/>, roles: ['Admin', 'Nomina'] },
    { id: 'conta', label: 'Contabilidad', icon: <Calculator/>, roles: ['Admin', 'Contador'] },
    { id: 'caja', label: 'Caja', icon: <Wallet/>, roles: ['Admin', 'Vendedor'] },
    { id: 'admin', label: 'Configuración', icon: <ShieldCheck/>, roles: ['Admin'] },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 flex-col md:flex-row">
      <div className="md:hidden bg-white p-4 flex justify-between items-center border-b z-50 shadow-sm">
        <h1 className="font-black text-xl italic">ACCUCLOUD<span className="text-blue-600">.</span></h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-100 rounded-xl"><Menu /></button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-28 hidden md:flex items-center px-8 font-black text-2xl italic text-blue-400">ACCUCLOUD .</div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 mt-4">
          {menuItems.filter(m => canSee(m.roles)).map(m => (
            <button key={m.id} onClick={() => { setActiveTab(m.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center px-6 py-4 rounded-2xl transition-all ${activeTab === m.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="mr-3">{m.icon}</span> <span className="font-bold text-sm">{m.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-slate-800">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Sesión Activa</p>
            <p className="font-bold text-sm truncate">{user?.nombre}</p>
            <p className="text-[10px] text-blue-500 font-black uppercase">{user?.cargo}</p>
            <button onClick={onLogout} className="w-full text-red-500 text-[10px] font-black mt-6 uppercase text-left hover:underline">Cerrar Sesión</button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-4 md:p-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{activeTab}</h2>
            {turnoActivo ? (
                <div className="bg-green-100 text-green-700 px-5 py-2 rounded-2xl text-[10px] font-black border border-green-200 animate-pulse">TURNO ABIERTO: {fmt(turnoActivo.total_vendido)}</div>
            ) : (
                <div className="bg-red-100 text-red-700 px-5 py-2 rounded-2xl text-[10px] font-black border border-red-200 uppercase">Sistema Bloqueado / Caja Cerrada</div>
            )}
        </header>

        <div className="animate-fade-in pb-20">
          {activeTab==='dashboard' && <ResumenView user={user}/>}
          {activeTab==='admin' && <AdminUsuariosView user={user}/>}
          {activeTab==='produccion' && <ProduccionView user={user}/>}
          {activeTab==='caja' && <CajaMasterView user={user} turnoActivo={turnoActivo} onUpdate={recargarTurno}/>}
          {activeTab==='ventas' && <VentasView user={user} turnoActivo={turnoActivo}/>}
          {activeTab==='inventario' && <InventarioView user={user}/>}
          {activeTab==='nomina' && <NominaView user={user}/>}
          {activeTab==='conta' && <ContabilidadView user={user}/>}
        </div>
      </main>
    </div>
  );
}

// ==========================================
//      MÓDULO: ADMINISTRACIÓN (EDICIÓN)
// ==========================================
function AdminUsuariosView({ user }) {
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' });

    const load = () => axios.get(`/admin/usuarios?company_id=${user.company_id}`).then(res => setUsuarios(res.data));
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (form.id) await axios.put(`/admin/usuarios/${form.id}`, form);
        else await axios.post('/admin/usuarios', { ...form, company_id: user.company_id });
        setForm({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' });
        load(); window.alert("Actualización exitosa.");
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                <h3 className="font-black text-xl mb-6 italic uppercase">{form.id ? 'Modificar Usuario' : 'Crear Nuevo Acceso'}</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/>
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/>
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none" type="password" placeholder="Contraseña" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required={!form.id}/>
                    <select className="p-4 bg-slate-50 rounded-2xl font-black text-slate-700" value={form.cargo} onChange={e=>setForm({...form, cargo: e.target.value})}>
                        <option value="Admin">Admin</option>
                        <option value="Vendedor">Vendedor</option>
                        <option value="Bodeguero">Bodeguero</option>
                        <option value="Prealistador">Prealistador</option>
                        <option value="Produccion">Producción</option>
                        <option value="Logistica">Logística</option>
                        <option value="Nomina">Nómina</option>
                        <option value="Contador">Contador</option>
                    </select>
                    <button className="bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all">GUARDAR CAMBIOS</button>
                </form>
                {form.id && <button onClick={()=>setForm({id:null, nombre:'', email:'', password:'', cargo:'Vendedor'})} className="mt-4 text-xs font-bold text-slate-400 underline">Cancelar edición</button>}
            </div>
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr><th className="p-8">Usuario</th><th>Email</th><th>Rol</th><th className="text-center">Acciones</th></tr></thead>
                    <tbody>{usuarios.map(u => (
                        <tr key={u.id} className="border-b hover:bg-slate-50 transition">
                            <td className="p-8 font-black text-slate-800">{u.nombre}</td>
                            <td>{u.email}</td>
                            <td><span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-[9px] font-black uppercase">{u.cargo}</span></td>
                            <td className="p-8 text-center flex justify-center gap-2">
                                <button onClick={()=>setForm(u)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={18}/></button>
                                <button onClick={async ()=>{if(window.confirm("¿Eliminar acceso?")){ await axios.delete(`/admin/usuarios/${u.id}`); load(); }}} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: PRODUCCIÓN (COMPLETO)
// ==========================================
function ProduccionView({ user }) {
    const [subTab, setSubTab] = useState('materia');
    const [materias, setMaterias] = useState([]);
    const [ordenes, setOrdenes] = useState([]);
    const [formM, setFormM] = useState({ nombre: '', unidad: 'mg', cantidad: 0, proposito: '', costo: 0 });

    const load = useCallback(async () => {
        const resM = await axios.get(`/produccion/materia?company_id=${user.company_id}`);
        const resO = await axios.get(`/produccion/ordenes?company_id=${user.company_id}`);
        setMaterias(Array.isArray(resM.data) ? resM.data : []);
        setOrdenes(Array.isArray(resO.data) ? resO.data : []);
    }, [user.company_id]);

    useEffect(() => { load(); }, [load, subTab]);

    const canDo = (stepRoles) => stepRoles.includes(user?.cargo) || user?.cargo === 'Admin';

    return (
        <div className="space-y-8">
            <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm overflow-x-auto">
                {canDo(['Prealistador']) && <button onClick={()=>setSubTab('materia')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${subTab==='materia'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Materia Prima</button>}
                {canDo(['Prealistador', 'Produccion']) && <button onClick={()=>setSubTab('ordenes')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${subTab==='ordenes'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Órdenes de Trabajo</button>}
                {canDo(['Logistica']) && <button onClick={()=>setSubTab('logistica')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${subTab==='logistica'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Logística/Despacho</button>}
            </div>

            {subTab === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border h-fit">
                        <h3 className="font-black text-xl mb-6 uppercase italic tracking-tighter">Entrada de Insumos</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/produccion/materia', {...formM, company_id: user.company_id}); load();}} className="space-y-4">
                            <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Nombre Químico" onChange={e=>setFormM({...formM, nombre: e.target.value})} required/>
                            <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black" onChange={e=>setFormM({...formM, unidad: e.target.value})}>
                                <option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option><option value="unidades">unidades</option>
                            </select>
                            <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" type="number" placeholder="Cantidad" onChange={e=>setFormM({...formM, cantidad: e.target.value})} required/>
                            <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Propósito (Opcional)" onChange={e=>setFormM({...formM, proposito: e.target.value})}/>
                            <button className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all">CARGAR A INVENTARIO TÉCNICO</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[40px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr><th className="p-8">Insumo</th><th>Stock</th><th>Función</th><th>Costo</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b"><td className="p-8 font-black text-slate-800 uppercase text-xs">{m.nombre}</td><td>{m.cantidad} {m.unidad_medida}</td><td className="text-xs text-slate-400 italic">{m.proposito || 'N/A'}</td><td className="font-bold text-blue-600">{fmt(m.costo)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {subTab === 'ordenes' && (
                <div className="space-y-6">
                    {canDo(['Prealistador']) && <button onClick={async ()=>{ const n = window.prompt("¿Qué producto vamos a fabricar?"); if(n){ await axios.post('/produccion/ordenes', {nombre_producto: n, cantidad: 10, company_id: user.company_id}); load(); } }} className="px-10 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:scale-105 transition-all uppercase text-xs">+ Nueva Orden OP</button>}
                    <div className="grid grid-cols-1 gap-6">
                        {ordenes.filter(o => ['Prealistamiento', 'Produccion'].includes(o.estado)).map(o => (
                            <div key={o.id} className="bg-white p-10 rounded-[40px] shadow-md border-l-[20px] border-blue-500 flex flex-col md:flex-row justify-between items-center group transition-all">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ORDEN INTERNA OP-{o.id}</p>
                                    <h4 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">{o.nombre_producto}</h4>
                                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${o.estado==='Produccion'?'bg-orange-100 text-orange-600':'bg-blue-100 text-blue-600'}`}>ESTADO: {o.estado}</span>
                                </div>
                                <div className="flex gap-4 mt-8 md:mt-0">
                                    {o.estado === 'Prealistamiento' && canDo(['Prealistador']) && (
                                        <button onClick={async ()=>{ await axios.put(`/produccion/ordenes/${o.id}/estado`, {estado: 'Produccion'}); load(); }} className="flex items-center gap-2 px-10 py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-black uppercase text-xs"><Play size={18}/> Iniciar Mezcla/Fabricación</button>
                                    )}
                                    {o.estado === 'Produccion' && canDo(['Produccion']) && (
                                        <button onClick={async ()=>{ await axios.put(`/produccion/ordenes/${o.id}/estado`, {estado: 'Logistica'}); load(); }} className="flex items-center gap-2 px-10 py-5 bg-green-600 text-white font-black rounded-3xl shadow-xl hover:bg-green-700 uppercase text-xs"><CheckCircle size={18}/> Finalizar y Enviar a Despacho</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {subTab === 'logistica' && (
                <div className="bg-white rounded-[40px] shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest"><tr><th className="p-10">Orden</th><th>Producto</th><th>Destino Sugerido</th><th className="text-center">Operación</th></tr></thead>
                        <tbody>{ordenes.filter(o => o.estado === 'Logistica').map(o => (
                            <tr key={o.id} className="border-b">
                                <td className="p-10 font-black text-blue-600">OP-{o.id}</td>
                                <td className="font-bold text-slate-800">{o.nombre_producto}</td>
                                <td><div className="flex items-center gap-2 text-xs text-slate-400"><MapPin size={14}/> Pendiente asignar datos...</div></td>
                                <td className="text-center p-10">
                                    <button onClick={async ()=>{ const d = window.prompt("Ciudad y Dirección de entrega:"); if(d){ await axios.put(`/produccion/ordenes/${o.id}/estado`, {estado: 'Cerrado'}); load(); } }} className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl text-[10px] shadow-lg hover:bg-black transition-all">REGISTRAR ENVÍO Y CERRAR</button>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                    {ordenes.filter(o=>o.estado==='Logistica').length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase italic tracking-tighter">No hay pedidos pendientes de despacho</div>}
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: CAJA CON CLAVE MAESTRA
// ==========================================
function CajaMasterView({ user, turnoActivo, onUpdate }) {
    const handleApertura = async () => {
        const pass = window.prompt("SEGURIDAD: Introduce la CLAVE MAESTRA de la empresa para abrir caja:");
        if (!pass) return;
        try {
            const resV = await axios.post('/turnos/verificar-maestra', { company_id: user.company_id, password: pass });
            if (resV.data.success) {
                const base = window.prompt("¿Valor de base inicial en efectivo?", "0");
                await axios.post('/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id });
                onUpdate();
            } else {
                window.alert("❌ CLAVE MAESTRA INCORRECTA. Apertura denegada.");
            }
        } catch (e) { window.alert("Error de validación."); }
    };

    return (
        <div className="bg-white p-16 rounded-[60px] shadow-2xl text-center max-w-xl mx-auto border-t-[25px] border-blue-600 animate-slide-up">
            <div className={`w-24 h-24 mx-auto mb-8 rounded-[35px] flex items-center justify-center ${turnoActivo ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                {turnoActivo ? <Lock size={48} /> : <Lock size={48} />}
            </div>
            <h3 className="text-4xl font-black mb-4 uppercase italic tracking-tighter">{turnoActivo ? "TURNO ABIERTO" : "CAJA CERRADA"}</h3>
            {turnoActivo ? (
                <div className="space-y-8">
                    <div className="p-12 bg-slate-50 rounded-[45px] border-2 border-dashed border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mb-4">Ventas en Tiempo Real</p>
                        <h2 className="text-7xl font-black text-green-600 tracking-tighter">{fmt(turnoActivo.total_vendido)}</h2>
                    </div>
                    <button onClick={async ()=>{ if(window.confirm("¿Confirmas el cierre definitivo del turno?")){ await axios.put('/turnos/finalizar', { turno_id: turnoActivo.id }); onUpdate(); } }} className="w-full py-7 bg-red-500 text-white font-black rounded-[35px] shadow-xl hover:brightness-110 transition-all uppercase text-xs tracking-widest">Realizar Arqueo y Cerrar</button>
                </div>
            ) : (
                <div className="space-y-6">
                    <p className="text-slate-400 font-medium px-10">El sistema requiere autorización de nivel administrativo para iniciar operaciones de venta.</p>
                    <button onClick={handleApertura} className="w-full py-7 bg-blue-600 text-white font-black rounded-[35px] shadow-xl animate-bounce uppercase text-xs tracking-widest mt-4">Aperturar con Clave Maestra</button>
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: NÓMINA (CÁLCULO COLOMBIA 2026)
// ==========================================
function NominaView({ user }) {
  const [mode, setMode] = useState('liquidar');
  const [empleados, setEmpleados] = useState([]);
  const [nominas, setNominas] = useState([]);
  const [formEmp, setFormEmp] = useState({ nombre: '', email: '', salario: '' });
  const [formLiq, setFormLiq] = useState({ empleado_id: '', dias: 30, extras: 0 });
  const [preview, setPreview] = useState(null);

  const load = useCallback(() => { 
    if(!user?.company_id) return;
    axios.get(`/empleados?company_id=${user.company_id}`).then(res => setEmpleados(Array.isArray(res.data) ? res.data : [])); 
    axios.get(`/nomina/historial?company_id=${user.company_id}`).then(res => setNominas(Array.isArray(res.data) ? res.data : [])); 
  }, [user?.company_id]);
  useEffect(() => { load(); }, [load]);

  const calcularNomina = () => {
    const e = empleados.find(emp => emp.id === parseInt(formLiq.empleado_id)); 
    if(!e) return;
    const sal = parseFloat(e.salario);
    const dias = parseFloat(formLiq.dias);
    const basico = Math.round((sal / 30) * dias);
    const aux = (sal <= 3501810) ? Math.round((249095 / 30) * dias) : 0; // Aux Transporte 2026 est.
    const salud = Math.round(basico * 0.04);
    const pension = Math.round(basico * 0.04);
    const neto = (basico + aux) - (salud + pension);
    setPreview({ nombre: e.nombre, neto, basico, aux, salud, pension });
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm overflow-x-auto">
        <button onClick={()=>setMode('liquidar')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${mode==='liquidar'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Liquidador Mensual</button>
        <button onClick={()=>setMode('empleados')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${mode==='empleados'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Gestión de Personal</button>
      </div>

      {mode === 'liquidar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white p-12 rounded-[50px] shadow-xl border border-green-100 h-fit">
                  <h3 className="font-black text-2xl mb-8 text-green-800 tracking-tighter italic uppercase underline decoration-blue-500">Cálculo Prestacional</h3>
                  <div className="space-y-6">
                      <select className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black text-slate-700" onChange={e=>setFormLiq({...formLiq, empleado_id: e.target.value})}>
                          <option>-- Seleccionar Empleado --</option>
                          {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre} ({fmt(e.salario)})</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="number" className="p-5 bg-slate-50 border-none rounded-3xl font-black" placeholder="Días (1-30)" value={formLiq.dias} onChange={e=>setFormLiq({...formLiq, dias: e.target.value})}/>
                        <input type="number" className="p-5 bg-slate-50 border-none rounded-3xl font-black" placeholder="H. Extras" onChange={e=>setFormLiq({...formLiq, extras: e.target.value})}/>
                      </div>
                      <button onClick={calcularNomina} className="w-full bg-slate-900 text-white font-black py-6 rounded-[30px] shadow-xl hover:bg-black transition-all text-xs tracking-widest uppercase">Generar Desprendible Simulado</button>
                  </div>
              </div>
              <div className="bg-white p-12 rounded-[50px] shadow-2xl border-l-[15px] border-blue-600">
                  {preview ? (
                      <div className="space-y-6">
                          <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{preview.nombre}</h4>
                          <div className="space-y-2 border-y py-6">
                            <div className="flex justify-between text-sm font-bold"><span>Sueldo Básico:</span><span>{fmt(preview.basico)}</span></div>
                            <div className="flex justify-between text-sm font-bold text-green-600"><span>Auxilio Transporte:</span><span>{fmt(preview.aux)}</span></div>
                            <div className="flex justify-between text-sm font-bold text-red-500"><span>Deducción Salud (4%):</span><span>-{fmt(preview.salud)}</span></div>
                            <div className="flex justify-between text-sm font-bold text-red-500"><span>Deducción Pensión (4%):</span><span>-{fmt(preview.pension)}</span></div>
                          </div>
                          <div className="bg-blue-600 p-10 rounded-[40px] text-center text-6xl font-black text-white shadow-xl">
                            <p className="text-[10px] uppercase font-black mb-2 opacity-70">Neto a Pagar</p>
                            {fmt(preview.neto)}
                          </div>
                          <button onClick={async ()=>{if(window.confirm("¿Procesar pago real?")){await axios.post('/nomina/liquidar', {...formLiq, responsable: user.nombre, company_id: user.company_id}); setPreview(null); load(); window.alert("Pago guardado en historial.");}}} className="w-full bg-slate-900 text-white font-black py-6 rounded-[30px] shadow-xl text-xs uppercase">Confirmar y Cargar a Contabilidad</button>
                      </div>
                  ) : <div className="h-full flex items-center justify-center opacity-10 flex-col"><Calculator size={150}/><p className="font-black mt-4 uppercase text-2xl">Liquidador 2026</p></div>}
              </div>
          </div>
      )}
    </div>
  );
}

// ==========================================
//      MÓDULO: PÁGINA PSE (VENTA SAAS)
// ==========================================
function PSEPage({ onBack }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-12 rounded-[65px] shadow-2xl max-w-3xl w-full text-center border-t-[25px] border-blue-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 text-blue-600"><TrendingUp size={250}/></div>
                <h1 className="text-5xl font-black text-slate-800 mb-4 tracking-tighter uppercase italic">Haz parte de AccuCloud PRO</h1>
                <p className="text-slate-400 font-bold mb-10 italic">El mejor sistema para el crecimiento de tu negocio.</p>
                
                <div className="bg-blue-50 p-12 rounded-[55px] mb-12 border border-blue-100 shadow-inner">
                    <span className="text-[11px] font-black text-blue-400 uppercase tracking-[5px] block mb-4">Suscripción Premium</span>
                    <h2 className="text-8xl font-black text-blue-600 tracking-tighter">$600.000</h2>
                    <p className="text-xs text-blue-400 mt-6 font-black uppercase tracking-widest">Pago Bancario Cifrado vía PSE</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-12">
                    <div className="p-5 bg-slate-50 rounded-3xl text-[11px] font-black uppercase tracking-tighter text-slate-600 border border-slate-100">✔ Producción Farmacéutica</div>
                    <div className="p-5 bg-slate-50 rounded-3xl text-[11px] font-black uppercase tracking-tighter text-slate-600 border border-slate-100">✔ Nómina e Historial</div>
                    <div className="p-5 bg-slate-50 rounded-3xl text-[11px] font-black uppercase tracking-tighter text-slate-600 border border-slate-100">✔ Contabilidad General</div>
                    <div className="p-5 bg-slate-50 rounded-3xl text-[11px] font-black uppercase tracking-tighter text-slate-600 border border-slate-100">✔ Usuarios Ilimitados</div>
                </div>

                <button onClick={()=>window.alert("Redirigiendo a Pasarela de Pagos PSE de Colombia...")} className="w-full py-8 bg-slate-900 text-white font-black rounded-[40px] shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all text-sm uppercase tracking-widest active:scale-95">
                    <CreditCard size={28} /> PAGAR SUSCRIPCIÓN AHORA
                </button>
                <button onClick={onBack} className="mt-10 text-slate-400 font-bold text-[11px] uppercase tracking-widest underline hover:text-slate-800">Cerrar y volver al ingreso</button>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: LOGIN (CON BOTÓN SaaS)
// ==========================================
function LoginScreen({ onLogin, onBuy }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post('/login', { email, password });
        if (res.data.success) onLogin(res.data.user);
        else window.alert('Credenciales no válidas para esta empresa.');
    } catch (e) { window.alert('Backend despertando... espera 10 seg.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4 relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-400 rounded-full translate-x-1/3 translate-y-1/3 opacity-20"></div>

      <div className="bg-white p-16 rounded-[70px] shadow-2xl w-full max-w-md animate-slide-up relative z-10 border-t-[10px] border-slate-900">
        <h1 className="text-5xl font-black text-center text-slate-800 mb-12 italic tracking-tighter">AccuCloud<span className="text-blue-600">.</span></h1>
        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Email Corporativo</label>
            <input className="w-full p-5 bg-slate-100 rounded-[30px] font-bold border-none focus:ring-2 ring-blue-500 transition-all outline-none" placeholder="correo@empresa.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-5 tracking-widest">Contraseña</label>
            <input type="password" class="w-full p-5 bg-slate-100 rounded-[30px] font-bold border-none focus:ring-2 ring-blue-500 transition-all outline-none" placeholder="********" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="w-full bg-slate-900 text-white font-black py-6 rounded-[30px] shadow-xl hover:bg-black transition-all active:scale-95 uppercase text-xs tracking-widest mt-8">ACCEDER AL ERP</button>
        </form>
        
        <div className="mt-16 p-8 bg-green-50 border-2 border-green-200 rounded-[45px] text-center shadow-inner">
            <p className="text-[12px] font-black text-green-700 uppercase mb-5 tracking-tighter leading-tight italic">¡Haz parte del mejor sistema para tu negocio!</p>
            <button onClick={onBuy} className="w-full py-4 bg-green-600 text-white font-black rounded-[25px] text-xs shadow-lg hover:bg-green-700 transition-all uppercase tracking-widest flex items-center justify-center gap-3">
                <CreditCard size={18}/> Adquirir Plan Pro 2026
            </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
//      MÓDULO: INVENTARIO (VISTA REAL)
// ==========================================
function InventarioView({ user }) {
    const [mode, setMode] = useState('list');
    const [productos, setProductos] = useState([]);

    const load = () => axios.get(`/productos?company_id=${user.company_id}`).then(res => setProductos(res.data));
    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-8">
            <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm">
                <button onClick={()=>setMode('list')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase ${mode==='list'?'bg-blue-600 text-white':'text-slate-400'}`}>Stock por Lotes</button>
                <button onClick={()=>setMode('bodegas')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase ${mode==='bodegas'?'bg-blue-600 text-white':'text-slate-400'}`}>Zonas de Bodega</button>
            </div>
            <div className="bg-white rounded-[45px] shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-widest"><tr><th className="p-8">Producto</th><th>Lote</th><th>Stock</th><th>Vencimiento</th></tr></thead>
                    <tbody>{productos.map(p => (
                        <tr key={p.id} className="border-b hover:bg-slate-50">
                            <td className="p-8 font-black text-slate-800">{p.nombre}</td>
                            <td className="font-bold text-blue-600">{p.lote || 'SIN LOTE'}</td>
                            <td className="font-black">{p.stock} uds</td>
                            <td className="text-xs text-red-500 font-bold">{p.vencimiento ? new Date(p.vencimiento).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: CONTABILIDAD (LIBROS REALES)
// ==========================================
function ContabilidadView({ user }) {
    const [datos, setDatos] = useState([]);
    useEffect(() => { axios.get(`/contabilidad/ventas?company_id=${user.company_id}`).then(res => setDatos(res.data)); }, []);
    return (
        <div className="bg-white p-10 rounded-[45px] shadow-sm border border-slate-100 overflow-hidden pr-2">
            <h3 className="font-black text-xl mb-8 italic text-blue-600 uppercase tracking-tighter">Libro Diario de Ingresos (Ventas)</h3>
            <div className="overflow-x-auto"><table className="w-full text-left min-w-[600px]"><thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr><th className="p-8">Fecha</th><th>Cajero / Responsable</th><th>Detalle de Operación</th><th className="text-right p-8">Monto</th></tr></thead><tbody>{datos.map(d=>(<tr key={d.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 text-xs font-bold text-slate-400">{new Date(d.fecha).toLocaleString()}</td><td className="font-black text-blue-500 uppercase text-xs">{d.responsable}</td><td className="font-black text-slate-700 text-xs">Venta Directa #{d.id} (Sincronizada TPV)</td><td className="p-8 text-right font-black text-slate-900">{fmt(d.total)}</td></tr>))}</tbody></table></div>
        </div>
    );
}

// ==========================================
//      MÓDULO: VENTAS TPV (REAL)
// ==========================================
function VentasView({ user, turnoActivo }) {
    if(!turnoActivo) return <div className="h-96 flex items-center justify-center bg-white rounded-[50px] border-4 border-dashed opacity-20"><ShoppingCart size={100}/></div>;
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
            <div className="lg:col-span-2 bg-white rounded-[50px] shadow-sm border p-10">
                <div className="flex items-center bg-slate-50 p-6 rounded-[30px] border focus-within:ring-4 ring-blue-100 transition-all">
                    <ScanBarcode className="mr-4 text-slate-400"/>
                    <input className="bg-transparent border-none outline-none font-black text-lg w-full" placeholder="ESCANEAR CÓDIGO O BUSCAR PRODUCTO..." autoFocus/>
                </div>
                <div className="mt-10 text-center opacity-10 font-black italic">LISTA DE PRODUCTOS EN CARRITO</div>
            </div>
            <div className="bg-slate-900 rounded-[50px] shadow-2xl p-10 text-white flex flex-col justify-between">
                <div>
                    <h3 className="text-2xl font-black italic uppercase text-blue-400 mb-8 underline decoration-white">Resumen Venta</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between font-bold text-slate-400"><span>Subtotal:</span><span>$0</span></div>
                        <div className="flex justify-between font-bold text-slate-400"><span>Impuestos (IVA):</span><span>$0</span></div>
                    </div>
                </div>
                <div>
                    <div className="text-6xl font-black tracking-tighter mb-10">{fmt(0)}</div>
                    <button className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all">PROCESAR PAGO</button>
                </div>
            </div>
        </div>
    );
}

// --- VISTA DASHBOARD (GRÁFICAS) ---
function ResumenView({ user }) {
  const [data, setData] = useState({ cajaMayor: 0, cajaMenor: 0, valorInventario: 0, lowStock: 0 });
  useEffect(() => { if(user?.company_id) axios.get(`/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); }, [user]);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <CardStat title="Balance General" value={fmt(data.cajaMayor)} color="blue" icon={<DollarSign/>}/>
        <CardStat title="Caja TPV Hoy" value={fmt(data.cajaMenor)} color="green" icon={<Wallet/>}/>
        <CardStat title="Valor de Bodega" value={fmt(data.valorInventario)} color="purple" icon={<Package/>}/>
        <CardStat title="Items Críticos" value={data.lowStock} color="red" icon={<AlertTriangle/>}/>
    </div>
  );
}

// --- HELPERS ---
function MenuButton({ icon, label, active, onClick }) { return <button onClick={onClick} className={`w-full flex items-center px-6 py-5 rounded-[24px] mb-2 transition-all ${active ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}><span className="mr-4">{icon}</span><span className="text-sm font-black">{label}</span></button>; }
function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return <div className="bg-white p-8 rounded-[45px] shadow-sm border border-slate-100 hover:shadow-2xl transition-all"><div className={`w-14 h-14 rounded-[20px] flex items-center justify-center mb-6 ${c[color]}`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p><h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{value}</h3></div>; 
}

export default App;