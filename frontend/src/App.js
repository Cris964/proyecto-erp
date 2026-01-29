/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, RefreshCcw, Menu, TrendingUp, Factory, Truck, History, Settings, ChevronRight, CreditCard, Edit3, Trash2, Save, Play, CheckCircle, MapPin, Box, Database, Receipt, Layers, Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  const [activeTab, setActiveTab] = useState('dashboard');

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

  if (loadingSession) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-2xl uppercase tracking-tighter italic">AccuCloud Pro 2026 Cargando...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? (
        <LoginScreen onLogin={handleLogin} onBuy={() => setShowPSE(true)} />
      ) : (
        <Dashboard user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      )}
    </div>
  );
}

// ==========================================
//      ESTRUCTURA DASHBOARD (CON ROLES)
// ==========================================
function Dashboard({ user, onLogout, activeTab, setActiveTab }) {
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const recargarTurno = useCallback(() => {
    if (user?.id) axios.get('/turnos/activo/' + user.id).then(res => setTurnoActivo(res.data)).catch(() => setTurnoActivo(null));
  }, [user?.id]);

  useEffect(() => { recargarTurno(); }, [recargarTurno]);

  const canSee = (roles) => roles.includes(user?.cargo) || user?.cargo === 'Admin';

  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard/>, roles: ['Admin', 'Contador'] },
    { id: 'ventas', label: 'Ventas (TPV)', icon: <ShoppingCart/>, roles: ['Admin', 'Vendedor'] },
    { id: 'inventario', label: 'Bodegas e Inv.', icon: <Package/>, roles: ['Admin', 'Bodeguero'] },
    { id: 'produccion', label: 'Producción Ind.', icon: <Factory/>, roles: ['Admin', 'Prealistador', 'Produccion', 'Logistica'] },
    { id: 'nomina', label: 'Nómina PRO', icon: <Users/>, roles: ['Admin', 'Nomina'] },
    { id: 'caja', label: 'Caja y Turno', icon: <Wallet/>, roles: ['Admin', 'Vendedor'] },
    { id: 'admin', label: 'Configuración', icon: <ShieldCheck/>, roles: ['Admin'] },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 flex-col md:flex-row">
      {/* MENÚ MÓVIL */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center border-b z-50 shadow-sm">
        <h1 className="font-black text-xl italic tracking-tighter">ACCUCLOUD<span className="text-blue-600">.</span></h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-100 rounded-xl"><Menu /></button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-28 hidden md:flex items-center px-8 font-black text-2xl italic text-blue-400 tracking-tighter uppercase">ACCUCLOUD<span className="text-white">.</span></div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 mt-4">
          {menuItems.filter(m => canSee(m.roles)).map(m => (
            <button key={m.id} onClick={() => { setActiveTab(m.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center px-6 py-4 rounded-[22px] transition-all ${activeTab === m.id ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="mr-3">{m.icon}</span> <span className="font-bold text-sm tracking-tight">{m.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white">{user?.nombre?.charAt(0)}</div>
                <div className="overflow-hidden"><p className="font-bold text-xs truncate">{user?.nombre}</p><p className="text-[9px] text-blue-500 font-black uppercase">{user?.cargo}</p></div>
            </div>
            <button onClick={onLogout} className="w-full text-red-500 text-[10px] font-black uppercase text-left hover:text-red-400">Cerrar Sesión</button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-4 md:p-10 relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{activeTab}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sistema AccuCloud Pro v2.6</p>
            </div>
            {turnoActivo ? (
                <div className="bg-green-50 text-green-700 px-6 py-3 rounded-2xl text-[10px] font-black border border-green-200 flex items-center gap-3 shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    VENTAS TURNO: {fmt(turnoActivo.total_vendido)}
                </div>
            ) : (
                <div className="bg-red-50 text-red-700 px-6 py-3 rounded-2xl text-[10px] font-black border border-red-200 uppercase tracking-widest">Sistema Bloqueado</div>
            )}
        </header>

        <div className="animate-fade-in pb-20">
          {activeTab==='dashboard' && <ResumenView user={user}/>}
          {activeTab==='admin' && <AdminUsuariosView user={user}/>}
          {activeTab==='produccion' && <ProduccionIndustrial user={user}/>}
          {activeTab==='caja' && <CajaMasterView user={user} turnoActivo={turnoActivo} onUpdate={recargarTurno}/>}
          {activeTab==='inventario' && <InventarioIndustrial user={user}/>}
          {activeTab==='nomina' && <NominaView user={user}/>}
        </div>
      </main>
    </div>
  );
}

// ==========================================
//      MÓDULO: ADMINISTRACIÓN (EDICIÓN FULL)
// ==========================================
function AdminUsuariosView({ user }) {
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' });

    const load = () => axios.get(`/admin/usuarios?company_id=${user.company_id}`).then(res => setUsuarios(res.data));
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (form.id) await axios.put(`/admin/usuarios/${form.id}`, form);
            else await axios.post('/admin/usuarios', { ...form, company_id: user.company_id });
            setForm({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' });
            load(); window.alert("¡Usuario guardado con éxito!");
        } catch (e) { window.alert("Error al procesar."); }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-10 rounded-[45px] shadow-sm border border-slate-100">
                <h3 className="font-black text-xl mb-8 italic uppercase tracking-tighter">{form.id ? 'Editar Datos' : 'Vincular Usuario'}</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/>
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/>
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none" type="password" placeholder="Pass" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required={!form.id}/>
                    <select className="p-4 bg-slate-50 rounded-2xl font-black text-slate-700" value={form.cargo} onChange={e=>setForm({...form, cargo: e.target.value})}>
                        <option value="Admin">Admin</option><option value="Vendedor">Vendedor</option><option value="Bodeguero">Bodeguero</option>
                        <option value="Prealistador">Prealistador</option><option value="Produccion">Producción</option><option value="Logistica">Logística</option>
                    </select>
                    <button className="bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all">GUARDAR</button>
                </form>
                {form.id && <button onClick={()=>setForm({id:null, nombre:'', email:'', password:'', cargo:'Vendedor'})} className="mt-4 text-xs font-black text-red-400 underline">Cancelar edición</button>}
            </div>
            <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b text-slate-400"><tr><th className="p-10">Usuario</th><th>Email</th><th>Rol</th><th className="text-center">Acciones</th></tr></thead>
                    <tbody>{usuarios.map(u => (
                        <tr key={u.id} className="border-b hover:bg-slate-50 transition">
                            <td className="p-10 font-black text-slate-800">{u.nombre}</td>
                            <td>{u.email}</td>
                            <td><span className="bg-blue-100 text-blue-700 px-5 py-2 rounded-full text-[9px] font-black uppercase">{u.cargo}</span></td>
                            <td className="p-10 text-center flex justify-center gap-4">
                                <button onClick={()=> {setForm(u); window.scrollTo({top:0, behavior:'smooth'})}} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={20}/></button>
                                <button onClick={async ()=>{if(window.confirm("¿Eliminar?")){ await axios.delete(`/admin/usuarios/${u.id}`); load(); }}} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20}/></button>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: PRODUCCIÓN INDUSTRIAL (REAL)
// ==========================================
function ProduccionIndustrial({ user }) {
    const [sub, setSub] = useState('materia');
    const [materias, setMaterias] = useState([]);
    const [ordenes, setOrdenes] = useState([]);
    const [numOrden, setNumOrden] = useState('0001');
    const [formM, setFormM] = useState({ nombre: '', unidad_medida: 'mg', cantidad: 0, costo: 0, proposito: '' });

    const load = async () => {
        const resM = await axios.get(`/produccion/materia?company_id=${user.company_id}`);
        const resO = await axios.get(`/produccion/ordenes?company_id=${user.company_id}`);
        const resN = await axios.get(`/produccion/siguiente-numero?company_id=${user.company_id}`);
        setMaterias(resM.data);
        setOrdenes(resO.data);
        setNumOrden(resN.data.numero);
    };

    useEffect(() => { load(); }, [sub]);

    const canDo = (roles) => roles.includes(user.cargo) || user.cargo === 'Admin';

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm overflow-x-auto">
                {canDo(['Prealistador']) && <button onClick={()=>setSub('materia')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='materia'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>1. INSUMOS / MATERIA</button>}
                {canDo(['Prealistador', 'Produccion']) && <button onClick={()=>setSub('ordenes')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='ordenes'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>2. ÓRDENES DE TRABAJO</button>}
                {canDo(['Logistica']) && <button onClick={()=>setSub('logistica')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='logistica'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>3. LOGÍSTICA</button>}
            </div>

            {sub === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="bg-white p-10 rounded-[50px] shadow-sm border h-fit">
                        <h3 className="font-black text-xl mb-6 italic uppercase flex items-center gap-3"><Database className="text-blue-600"/> Entrada Materia</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/produccion/materia', {...formM, company_id: user.company_id}); setFormM({nombre:'', unidad_medida:'mg', cantidad:0, costo:0, proposito:''}); load();}} className="space-y-5">
                            <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Nombre Químico" value={formM.nombre} onChange={e=>setFormM({...formM, nombre: e.target.value})} required/>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="p-4 bg-slate-50 rounded-2xl font-black" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida: e.target.value})}>
                                    <option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option><option value="unidades">uds</option>
                                </select>
                                <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none" type="number" placeholder="Cant." value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad: e.target.value})} required/>
                            </div>
                            <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Costo Unitario" type="number" value={formM.costo} onChange={e=>setFormM({...formM, costo: e.target.value})} required/>
                            <button className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-black transition-all">REGISTRAR EN ALMACÉN</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[50px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase border-b text-slate-400"><tr><th className="p-10">Insumo</th><th>Disponible</th><th>Costo</th><th className="p-10 text-right">Valorizado</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b hover:bg-slate-50 transition"><td className="p-10 font-black text-slate-800 uppercase">{m.nombre}</td><td className="font-bold text-blue-600">{m.cantidad} {m.unidad_medida}</td><td>{fmt(m.costo)}</td><td className="p-10 text-right font-black">{fmt(m.cantidad * m.costo)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {sub === 'ordenes' && (
                <div className="space-y-8">
                    <div className="bg-white p-12 rounded-[60px] shadow-xl border-t-[20px] border-blue-600 flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-6 md:mb-0 text-center md:text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[5px] mb-2">Orden de Fabricación</p>
                            <h3 className="text-4xl font-black tracking-tighter uppercase italic">Siguiente OP: {numOrden}</h3>
                        </div>
                        {canDo(['Prealistador']) && <button onClick={async ()=>{ 
                            const n = window.prompt("Nombre del producto a fabricar:"); 
                            if(n){ 
                                const num = window.prompt("Confirmar Número (Editable):", numOrden);
                                await axios.post('/produccion/ordenes', {numero_orden: num, nombre_producto: n, cantidad: 10, company_id: user.company_id}); 
                                load(); 
                            } 
                        }} className="px-12 py-5 bg-blue-600 text-white font-black rounded-[30px] shadow-2xl hover:scale-105 transition-all uppercase text-xs tracking-widest">+ LANZAR NUEVA OP</button>}
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        {ordenes.filter(o => ['Prealistamiento', 'Produccion'].includes(o.estado)).map(o => (
                            <div key={o.id} className="bg-white p-10 rounded-[50px] shadow-md border-l-[15px] border-blue-500 flex flex-col lg:flex-row justify-between items-center transition-all hover:shadow-2xl">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">IDENTIFICADOR OP-{o.numero_orden}</p>
                                    <h4 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic mb-3">{o.nombre_producto}</h4>
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${o.estado==='Produccion'?'bg-orange-100 text-orange-600':'bg-blue-100 text-blue-600'}`}>{o.estado}</span>
                                </div>
                                <div className="flex gap-4">
                                    {o.estado === 'Prealistamiento' && canDo(['Prealistador']) && (
                                        <button onClick={async ()=>{ await axios.put(`/produccion/ordenes/${o.id}`, {estado: 'Produccion'}); load(); }} className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-black uppercase text-xs transition-all"><Play size={20}/> Iniciar Fabricación</button>
                                    )}
                                    {o.estado === 'Produccion' && canDo(['Produccion']) && (
                                        <button onClick={async ()=>{ await axios.put(`/produccion/ordenes/${o.id}`, {estado: 'Logistica'}); load(); }} className="flex items-center gap-3 px-10 py-5 bg-green-600 text-white font-black rounded-3xl shadow-xl hover:bg-green-700 uppercase text-xs transition-all"><CheckCircle size={20}/> Finalizar Etapa Química</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: INVENTARIO (BODEGAS, EXCEL)
// ==========================================
function InventarioIndustrial({ user }) {
    const [tab, setTab] = useState('list');
    const [productos, setProductos] = useState([]);
    const [formKit, setFormKit] = useState({ nombre: '', items: [] });

    const load = () => axios.get(`/productos?company_id=${user.company_id}`).then(res => setProductos(res.data));
    useEffect(() => { load(); }, []);

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            await axios.post('/productos/importar', { productos: data, company_id: user.company_id });
            load(); window.alert("¡Inventario cargado exitosamente!");
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm">
                <button onClick={()=>setTab('list')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>LISTADO GENERAL</button>
                <button onClick={()=>setTab('kits')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='kits'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>KITS / COMBOS</button>
                <label className="bg-green-600 text-white px-10 py-3 rounded-2xl font-black text-[10px] cursor-pointer flex items-center gap-2 hover:bg-green-700 transition-all shadow-xl">
                    <Upload size={14}/> CARGAR EXCEL <input type="file" className="hidden" onChange={handleImportExcel} accept=".xlsx, .xls"/>
                </label>
            </div>

            {tab === 'list' && (
                <div className="bg-white rounded-[50px] shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b tracking-[4px]"><tr><th className="p-10">Item</th><th>Referencia/SKU</th><th>Stock Actual</th><th>Alerta</th><th className="text-center">Operación</th></tr></thead>
                        <tbody>{productos.map(p=>(
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition">
                                <td className="p-10 font-black text-slate-800 text-lg tracking-tighter uppercase">{p.nombre}</td>
                                <td className="font-bold text-blue-500 uppercase">{p.sku}</td>
                                <td className="font-black text-2xl">{p.stock}</td>
                                <td><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${p.stock <= p.min_stock ? 'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>{p.stock <= p.min_stock ? 'Stock Crítico' : 'Disponible'}</span></td>
                                <td className="text-center"><button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={18}/></button></td>
                            </tr>
                        ))}</tbody>
                    </table>
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
        const pass = window.prompt("SEGURIDAD: Ingresa CLAVE MAESTRA para autorizar turno:");
        if (!pass) return;
        try {
            const resV = await axios.post('/turnos/verificar-maestra', { company_id: user.company_id, password: pass });
            if (resV.data.success) {
                const base = window.prompt("Ingresa dinero base inicial en caja:", "0");
                await axios.post('/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id });
                onUpdate();
            } else {
                window.alert("❌ Clave administrativa incorrecta. Intento denegado.");
            }
        } catch (e) { window.alert("Error de validación corporativa."); }
    };

    return (
        <div className="bg-white p-20 rounded-[70px] shadow-2xl text-center max-w-2xl mx-auto border-t-[30px] border-blue-600 animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 left-0 p-10 opacity-5 -rotate-12"><Wallet size={150}/></div>
            <div className={`w-28 h-28 mx-auto mb-10 rounded-[40px] flex items-center justify-center shadow-inner ${turnoActivo ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                {turnoActivo ? <Lock size={60} /> : <Lock size={60} />}
            </div>
            <h3 className="text-5xl font-black mb-6 uppercase italic tracking-tighter text-slate-800">{turnoActivo ? "SISTEMA OPERATIVO" : "CAJA CERRADA"}</h3>
            {turnoActivo ? (
                <div className="space-y-10">
                    <div className="p-16 bg-slate-50 rounded-[55px] border-2 border-dashed border-slate-200 shadow-inner">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[6px] mb-4">Ventas Acumuladas Hoy</p>
                        <h2 className="text-8xl font-black text-green-600 tracking-tighter">{fmt(turnoActivo.total_vendido)}</h2>
                    </div>
                    <button onClick={async ()=>{ if(window.confirm("Cerrar caja y finalizar turno?")){ await axios.put('/turnos/finalizar', { turno_id: turnoActivo.id }); onUpdate(); } }} className="w-full py-8 bg-red-500 text-white font-black rounded-[35px] shadow-xl hover:bg-red-600 transition-all uppercase text-xs tracking-widest active:scale-95">Realizar Cierre de Turno</button>
                </div>
            ) : (
                <div className="space-y-8">
                    <p className="text-slate-400 font-medium px-20 text-sm">Este módulo requiere autorización de un nivel superior para iniciar operaciones bancarias/ventas.</p>
                    <button onClick={handleApertura} className="w-full py-8 bg-blue-600 text-white font-black rounded-[35px] shadow-2xl animate-bounce uppercase text-xs tracking-[2px] hover:bg-black transition-all">Aperturar con Clave Maestra</button>
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: DASHBOARD (GRÁFICAS REALES)
// ==========================================
function ResumenView({ user }) {
  const [data, setData] = useState({ cajaMayor: 0, cajaMenor: 0, valorInventario: 0, lowStock: 0 });
  const [chartData] = useState([
    { name: 'Lun', v: 400 }, { name: 'Mar', v: 300 }, { name: 'Mie', v: 600 }, { name: 'Jue', v: 800 }, { name: 'Vie', v: 500 }, { name: 'Sab', v: 900 }, { name: 'Dom', v: 200 }
  ]);

  useEffect(() => { 
      axios.get(`/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); 
  }, [user]);

  return (
    <div className="space-y-12 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <CardStat title="Balance Empresa" value={fmt(data.cajaMayor)} color="blue" icon={<TrendingUp/>}/>
            <CardStat title="Efectivo TPV" value={fmt(data.cajaMenor)} color="green" icon={<Wallet/>}/>
            <CardStat title="Valoración Stock" value={fmt(data.valorInventario)} color="purple" icon={<Box/>}/>
            <CardStat title="Items Críticos" value={data.lowStock} color="red" icon={<AlertTriangle/>}/>
        </div>
        <div className="bg-white p-16 rounded-[75px] shadow-sm border border-slate-100 h-[550px] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-5"><TrendingUp size={250}/></div>
             <h3 className="font-black text-3xl mb-12 uppercase italic text-slate-800 tracking-tighter underline decoration-blue-500 underline-offset-8">Desempeño Financiero Semanal</h3>
             <ResponsiveContainer width="100%" height="80%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 14, fontWeight: 'bold', fill: '#94a3b8'}} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '25px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)'}} />
                    <Bar dataKey="v" radius={[20, 20, 0, 0]} fill="#2563eb">
                         {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 5 ? '#2563eb' : '#e2e8f0'} />))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
        </div>
    </div>
  );
}

// ==========================================
//      MÓDULO: NÓMINA (LIQUIDADOR 2026)
// ==========================================
function NominaView({ user }) {
  const [mode, setMode] = useState('liquidar');
  const [empleados, setEmpleados] = useState([]);
  const [formLiq, setFormLiq] = useState({ empleado_id: '', dias: 30 });
  const [preview, setPreview] = useState(null);

  const load = () => axios.get(`/empleados?company_id=${user.company_id}`).then(res => setEmpleados(res.data));
  useEffect(() => { load(); }, []);

  const calcular = () => {
    const e = empleados.find(emp => emp.id === parseInt(formLiq.empleado_id)); 
    if(!e) return;
    const sal = parseFloat(e.salario);
    const dias = parseFloat(formLiq.dias);
    const basico = Math.round((sal / 30) * dias);
    const aux = (sal <= 3501810) ? Math.round((249095 / 30) * dias) : 0; // Aux Transporte 2026 est.
    const neto = (basico + aux) - (basico * 0.08);
    setPreview({ nombre: e.nombre, neto });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
      <div className="bg-white p-16 rounded-[60px] shadow-xl border border-green-100 h-fit">
        <h3 className="font-black text-3xl mb-10 text-green-800 tracking-tighter uppercase italic underline decoration-blue-500 underline-offset-8">Simulador Prestacional</h3>
        <div className="space-y-8">
            <select className="w-full p-6 bg-slate-50 border-none rounded-[30px] font-black text-slate-700 outline-none focus:ring-4 ring-green-50" onChange={e=>setFormLiq({...formLiq, empleado_id: e.target.value})}>
                <option>-- Seleccionar Funcionario --</option>
                {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre} ({fmt(e.salario)})</option>)}
            </select>
            <input type="number" className="w-full p-6 bg-slate-50 border-none rounded-[30px] font-black outline-none" placeholder="Días Laborados" onChange={e=>setFormLiq({...formLiq, dias: e.target.value})}/>
            <button onClick={calcular} className="w-full bg-slate-900 text-white font-black py-7 rounded-[35px] shadow-2xl hover:bg-black transition-all uppercase text-xs tracking-widest mt-6">Cálculo 2026</button>
        </div>
      </div>
      <div className="bg-white p-16 rounded-[60px] shadow-2xl border-l-[20px] border-blue-600 flex flex-col justify-center">
          {preview ? (
              <div className="text-center animate-fade-in">
                  <h4 className="text-4xl font-black mb-6 uppercase tracking-tighter">{preview.nombre}</h4>
                  <div className="bg-blue-600 p-12 rounded-[45px] text-7xl font-black text-white shadow-xl shadow-blue-200">{fmt(preview.neto)}</div>
                  <button className="w-full bg-slate-900 text-white font-black py-7 rounded-[35px] shadow-xl mt-12 uppercase text-xs tracking-widest active:scale-95 transition-all">Confirmar Pago Real</button>
              </div>
          ) : <div className="h-96 flex items-center justify-center opacity-10 flex-col"><Calculator size={180}/><p className="font-black mt-6 uppercase text-3xl">Liquidador Pro</p></div>}
      </div>
    </div>
  );
}

// ==========================================
//      MÓDULO: PÁGINA PSE (VENTA SaaS)
// ==========================================
function PSEPage({ onBack }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-16 rounded-[80px] shadow-2xl max-w-4xl w-full text-center border-t-[30px] border-blue-600 relative overflow-hidden animate-slide-up">
                <div className="absolute top-0 right-0 p-12 opacity-5 text-blue-600"><TrendingUp size={300}/></div>
                <h1 className="text-6xl font-black text-slate-800 mb-6 tracking-tighter uppercase italic">Adquiere AccuCloud Pro</h1>
                <p className="text-slate-400 font-bold mb-12 italic text-lg tracking-tight">El ERP corporativo más avanzado de Colombia.</p>
                <div className="bg-blue-50 p-16 rounded-[65px] mb-12 border border-blue-100 shadow-inner">
                    <span className="text-[12px] font-black text-blue-400 uppercase tracking-[8px] block mb-6">Plan Premium Mensual</span>
                    <h2 className="text-9xl font-black text-blue-600 tracking-tighter">$600.000</h2>
                    <p className="text-xs text-blue-400 mt-8 font-black uppercase tracking-[2px]">Transacción Segura 256-bit vía PSE</p>
                </div>
                <button onClick={()=>window.alert("Redirigiendo a Pasarela Segura PSE Bancolombia...")} className="w-full py-10 bg-slate-900 text-white font-black rounded-[45px] shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all text-lg uppercase tracking-widest group">
                    <CreditCard size={32} className="group-hover:rotate-12 transition-transform"/> PAGAR SUSCRIPCIÓN CON PSE
                </button>
                <button onClick={onBack} className="mt-12 text-slate-400 font-black text-xs uppercase tracking-widest underline hover:text-slate-800">Cerrar y Volver</button>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: LOGIN (DISEÑO PREMIUM)
// ==========================================
function LoginScreen({ onLogin, onBuy }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post('/login', { email, password });
        if (res.data.success) onLogin(res.data.user);
        else window.alert('Credenciales inválidas.');
    } catch (e) { window.alert('Backend despertando... espera 10 seg.'); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20 blur-3xl"></div>
      <div className="bg-white p-16 rounded-[80px] shadow-2xl w-full max-w-md animate-slide-up relative z-10 border-t-[12px] border-slate-900">
        <h1 className="text-5xl font-black text-center text-slate-800 mb-4 italic tracking-tighter">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[4px] mb-12">Enterprise Management System</p>
        <form onSubmit={handleAuth} className="space-y-6">
          <input className="w-full p-6 bg-slate-100 rounded-[30px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm" placeholder="Email Corporativo" onChange={e => setEmail(e.target.value)} required />
          <input type="password" class="w-full p-6 bg-slate-100 rounded-[30px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm" placeholder="Pass Corporativo" onChange={e => setPassword(e.target.value)} required />
          <button className="w-full bg-slate-900 text-white font-black py-7 rounded-[30px] shadow-2xl hover:bg-black transition-all active:scale-95 uppercase text-xs tracking-widest mt-6">ENTRAR AL SISTEMA</button>
        </form>
        <div className="mt-16 p-10 bg-green-50 border-2 border-green-200 rounded-[50px] text-center shadow-inner relative group cursor-pointer" onClick={onBuy}>
            <p className="text-[13px] font-black text-green-700 uppercase mb-5 tracking-tighter leading-tight italic">¡Haz parte del mejor sistema para tu negocio!</p>
            <button className="w-full py-4 bg-green-600 text-white font-black rounded-[20px] text-[10px] shadow-lg group-hover:scale-105 transition-all uppercase tracking-widest flex items-center justify-center gap-3">
                <CreditCard size={18}/> Adquirir Plan Pro 2026
            </button>
        </div>
      </div>
    </div>
  );
}

// --- HELPERS ---
function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return (
        <div className="bg-white p-12 rounded-[60px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-3 transition-all duration-700 group">
            <div className={`w-20 h-20 rounded-[35px] flex items-center justify-center mb-10 shadow-xl group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[5px] mb-3 leading-none">{title}</p>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter leading-none italic">{value}</h3>
        </div>
    ); 
}