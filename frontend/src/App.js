/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, RefreshCcw, Menu, TrendingUp, Factory, Truck, History, Settings, ChevronRight, CreditCard, Edit3, Trash2, Save, Play, CheckCircle, MapPin, Box, Database, Receipt
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

  if (loadingSession) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-2xl uppercase tracking-tighter italic">AccuCloud Pro 2026 Cargando...</div>;
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

  // FILTRADO DE MÓDULOS SEGÚN TU PETICIÓN
  const canSee = (roles) => roles.includes(user?.cargo) || user?.cargo === 'Admin';

  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard/>, roles: ['Admin', 'Contador'] },
    { id: 'ventas', label: 'Ventas (TPV)', icon: <ShoppingCart/>, roles: ['Admin', 'Vendedor'] },
    { id: 'inventario', label: 'Bodegas e Inv.', icon: <Package/>, roles: ['Admin', 'Bodeguero'] },
    { id: 'produccion', label: 'Producción Ind.', icon: <Factory/>, roles: ['Admin', 'Prealistador', 'Produccion', 'Logistica'] },
    { id: 'nomina', label: 'Nómina PRO', icon: <Users/>, roles: ['Admin', 'Nomina'] },
    { id: 'conta', label: 'Contabilidad', icon: <Calculator/>, roles: ['Admin', 'Contador'] },
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
            <button key={m.id} onClick={() => { setActiveTab(m.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center px-6 py-4 rounded-[22px] transition-all ${activeTab === m.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/50 scale-105' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <span className="mr-3">{m.icon}</span> <span className="font-bold text-sm tracking-tight">{m.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white">{user?.nombre?.charAt(0)}</div>
                <div className="overflow-hidden"><p className="font-bold text-xs truncate">{user?.nombre}</p><p className="text-[9px] text-blue-500 font-black uppercase tracking-widest">{user?.cargo}</p></div>
            </div>
            <button onClick={onLogout} className="w-full text-red-500 text-[10px] font-black uppercase text-left hover:text-red-400 transition-colors">Cerrar Sesión</button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-4 md:p-10 relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{activeTab}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sistema AccuCloud v2.6 - 2026</p>
            </div>
            {turnoActivo ? (
                <div className="bg-green-50 text-green-700 px-6 py-3 rounded-2xl text-[10px] font-black border border-green-200 flex items-center gap-3 shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    VENTAS TURNO: {fmt(turnoActivo.total_vendido)}
                </div>
            ) : (
                <div className="bg-red-50 text-red-700 px-6 py-3 rounded-2xl text-[10px] font-black border border-red-200 uppercase tracking-widest">Sistema Bloqueado / Caja Cerrada</div>
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
            if (form.id) {
                await axios.put(`/admin/usuarios/${form.id}`, form);
                window.alert("¡Usuario modificado exitosamente!");
            } else {
                await axios.post('/admin/usuarios', { ...form, company_id: user.company_id });
                window.alert("¡Usuario creado con éxito!");
            }
            setForm({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' });
            load();
        } catch (e) { window.alert("Ocurrió un error al procesar."); }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-10 rounded-[45px] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Users size={100}/></div>
                <h3 className="font-black text-2xl mb-8 italic uppercase tracking-tighter text-slate-800">
                    {form.id ? 'Editar Datos de Acceso' : 'Vincular Nuevo Usuario'}
                </h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Nombre Completo</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-blue-500 transition-all" placeholder="Juan Perez" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Email Corporativo</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-blue-500 transition-all" placeholder="juan@empresa.com" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Password</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-blue-500 transition-all" type="password" placeholder="********" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required={!form.id}/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Rol/Cargo</label>
                        <select className="w-full p-4 bg-slate-50 rounded-2xl font-black text-slate-700 outline-none focus:ring-2 ring-blue-500" value={form.cargo} onChange={e=>setForm({...form, cargo: e.target.value})}>
                            <option value="Admin">Administrador General</option>
                            <option value="Vendedor">Vendedor / Cajero</option>
                            <option value="Bodeguero">Bodeguero / Almacén</option>
                            <option value="Prealistador">Prealistador (Producción)</option>
                            <option value="Produccion">Técnico de Producción</option>
                            <option value="Logistica">Logística y Despacho</option>
                            <option value="Nomina">Gestor de Nómina</option>
                            <option value="Contador">Contador</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all transform active:scale-95 uppercase text-xs tracking-widest">
                            {form.id ? 'Guardar Cambios' : 'Crear Acceso'}
                        </button>
                    </div>
                </form>
                {form.id && <button onClick={()=>setForm({id:null, nombre:'', email:'', password:'', cargo:'Vendedor'})} className="mt-6 text-[10px] font-black text-red-500 uppercase tracking-widest underline decoration-2">Cancelar edición actual</button>}
            </div>

            <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-[3px] text-slate-400"><tr><th className="p-10">Usuario</th><th>Email</th><th>Rol del Sistema</th><th className="text-center">Operaciones</th></tr></thead>
                    <tbody>{usuarios.map(u => (
                        <tr key={u.id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="p-10 font-black text-slate-800 text-lg tracking-tighter">{u.nombre}</td>
                            <td className="font-medium text-slate-500">{u.email}</td>
                            <td><span className="bg-blue-100 text-blue-700 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">{u.cargo}</span></td>
                            <td className="p-10 text-center flex justify-center gap-4">
                                <button onClick={()=> { setForm(u); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-4 bg-blue-50 text-blue-600 rounded-[20px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={20}/></button>
                                <button onClick={async ()=>{if(window.confirm("¿Seguro que deseas eliminar este acceso permanente?")){ await axios.delete(`/admin/usuarios/${u.id}`); load(); }}} className="p-4 bg-red-50 text-red-500 rounded-[20px] hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={20}/></button>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
                {usuarios.length === 0 && <div className="p-20 text-center text-slate-300 font-black uppercase italic tracking-tighter text-2xl">No hay sub-usuarios registrados</div>}
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: PRODUCCIÓN INDUSTRIAL (PRO)
// ==========================================
function ProduccionView({ user }) {
    const [subTab, setSubTab] = useState('materia');
    const [materias, setMaterias] = useState([]);
    const [ordenes, setOrdenes] = useState([]);
    const [recetas, setRecetas] = useState([]);
    const [formM, setFormM] = useState({ nombre: '', unidad: 'mg', cantidad: 0, costo: 0, proposito: '' });

    const load = useCallback(async () => {
        const resM = await axios.get(`/produccion/materia?company_id=${user.company_id}`);
        const resO = await axios.get(`/produccion/ordenes?company_id=${user.company_id}`);
        setMaterias(Array.isArray(resM.data) ? resM.data : []);
        setOrdenes(Array.isArray(resO.data) ? resO.data : []);
    }, [user.company_id]);

    useEffect(() => { load(); }, [load, subTab]);

    const handleAvanzar = async (id, nuevoEstado) => {
        if(window.confirm(`¿Confirmas el paso a la etapa de ${nuevoEstado}?`)) {
            await axios.put(`/produccion/ordenes/${id}/estado`, { estado: nuevoEstado });
            load();
        }
    };

    const canDo = (stepRoles) => stepRoles.includes(user?.cargo) || user?.cargo === 'Admin';

    return (
        <div className="space-y-8">
            {/* SUB-MENU DE PRODUCCIÓN */}
            <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm overflow-x-auto">
                {canDo(['Prealistador']) && <button onClick={()=>setSubTab('materia')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${subTab==='materia'?'bg-blue-600 text-white shadow-xl shadow-blue-200':'text-slate-400'}`}>Stock Materia Prima</button>}
                {canDo(['Prealistador']) && <button onClick={()=>setSubTab('recetas')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${subTab==='recetas'?'bg-blue-600 text-white shadow-xl shadow-blue-200':'text-slate-400'}`}>Recetas y Fórmulas</button>}
                {canDo(['Prealistador', 'Produccion']) && <button onClick={()=>setSubTab('ordenes')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${subTab==='ordenes'?'bg-blue-600 text-white shadow-xl shadow-blue-200':'text-slate-400'}`}>Órdenes de Trabajo</button>}
                {canDo(['Logistica']) && <button onClick={()=>setSubTab('logistica')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${subTab==='logistica'?'bg-blue-600 text-white shadow-xl shadow-blue-200':'text-slate-400'}`}>Logística/Despacho</button>}
            </div>

            {subTab === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="bg-white p-12 rounded-[50px] shadow-sm border border-slate-100 h-fit">
                        <h3 className="font-black text-xl mb-8 uppercase italic tracking-tighter text-slate-800 flex items-center gap-2"><Database size={20} className="text-blue-600"/> Ingreso de Materia</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/produccion/materia', {...formM, company_id: user.company_id}); load(); setFormM({nombre:'', unidad:'mg', cantidad:0, costo:0, proposito:''})}} className="space-y-5">
                            <input className="w-full p-5 bg-slate-50 border-none rounded-3xl font-bold outline-none focus:ring-2 ring-blue-500" placeholder="Nombre (Ej: Ácido Cítrico)" value={formM.nombre} onChange={e=>setFormM({...formM, nombre: e.target.value})} required/>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="p-5 bg-slate-50 border-none rounded-3xl font-black text-slate-600 outline-none" value={formM.unidad} onChange={e=>setFormM({...formM, unidad: e.target.value})}>
                                    <option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option><option value="unidades">uds</option>
                                </select>
                                <input className="p-5 bg-slate-50 border-none rounded-3xl font-bold outline-none" type="number" placeholder="Stock" value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad: e.target.value})} required/>
                            </div>
                            <input className="w-full p-5 bg-slate-50 border-none rounded-3xl font-bold outline-none" placeholder="Costo por unidad" type="number" value={formM.costo} onChange={e=>setFormM({...formM, costo: e.target.value})} required/>
                            <button className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-black uppercase text-xs tracking-widest">Registrar en Almacén</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[50px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-widest text-slate-400"><tr><th className="p-10">Insumo Técnico</th><th>Disponibilidad</th><th>Costo unit.</th><th className="p-10">Valor Total</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b hover:bg-slate-50 transition-colors"><td className="p-10 font-black text-slate-800 uppercase text-xs">{m.nombre}</td><td className="font-bold text-blue-600">{m.cantidad} {m.unidad_medida}</td><td>{fmt(m.costo)}</td><td className="p-10 font-black text-slate-900">{fmt(m.cantidad * m.costo)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {subTab === 'ordenes' && (
                <div className="space-y-8">
                    <div className="bg-blue-600 p-12 rounded-[60px] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 p-10 opacity-10 rotate-12"><Factory size={200}/></div>
                        <div className="relative z-10 text-center md:text-left mb-8 md:mb-0">
                            <h3 className="text-4xl font-black tracking-tighter uppercase italic">Control de Fabricación</h3>
                            <p className="font-bold opacity-80 text-sm italic">Transformación de materias primas en productos terminados</p>
                        </div>
                        {canDo(['Prealistador']) && <button onClick={async ()=>{ const n = window.prompt("Nombre del producto a fabricar:"); if(n){ await axios.post('/produccion/ordenes', {nombre_producto: n, cantidad: 10, company_id: user.company_id}); load(); } }} className="relative z-10 px-12 py-5 bg-white text-blue-600 font-black rounded-[25px] shadow-xl hover:scale-105 transition-all uppercase text-xs tracking-widest">+ Generar Orden OP</button>}
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        {ordenes.filter(o => ['Prealistamiento', 'Produccion'].includes(o.estado)).map(o => (
                            <div key={o.id} className="bg-white p-10 rounded-[50px] shadow-md border-l-[20px] border-blue-500 flex flex-col lg:flex-row justify-between items-center group transition-all hover:shadow-2xl">
                                <div className="text-center lg:text-left mb-6 lg:mb-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mb-2">IDENTIFICADOR OP-{o.id}</p>
                                    <h4 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">{o.nombre_producto}</h4>
                                    <div className="mt-4 flex items-center gap-2 justify-center lg:justify-start">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${o.estado==='Produccion'?'bg-orange-100 text-orange-600':'bg-blue-100 text-blue-600'}`}>{o.estado}</span>
                                        <p className="text-[10px] font-bold text-slate-400">Creado: {new Date(o.fecha_creacion).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    {o.estado === 'Prealistamiento' && canDo(['Prealistador']) && (
                                        <button onClick={()=>handleAvanzar(o.id, 'Produccion')} className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white font-black rounded-[25px] shadow-xl hover:bg-black uppercase text-xs tracking-widest active:scale-95 transition-all"><Play size={18}/> Iniciar Mezcla y Fabricación</button>
                                    )}
                                    {o.estado === 'Produccion' && canDo(['Produccion']) && (
                                        <button onClick={()=>handleAvanzar(o.id, 'Logistica')} className="flex items-center gap-3 px-10 py-5 bg-green-600 text-white font-black rounded-[25px] shadow-xl hover:bg-green-700 uppercase text-xs tracking-widest active:scale-95 transition-all"><CheckCircle size={18}/> Finalizar y Enviar a Despacho</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {subTab === 'logistica' && (
                <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest"><tr><th className="p-10">Orden #</th><th>Producto Terminado</th><th>Destino / Logística</th><th className="text-center p-10">Operación</th></tr></thead>
                        <tbody>{ordenes.filter(o => o.estado === 'Logistica').map(o => (
                            <tr key={o.id} className="border-b hover:bg-slate-50 transition-all">
                                <td className="p-10 font-black text-blue-600 text-lg italic">OP-{o.id}</td>
                                <td className="font-black text-slate-800 uppercase tracking-tighter text-xl">{o.nombre_producto}</td>
                                <td>
                                    <div className="flex flex-col gap-1 text-xs text-slate-500 font-bold">
                                        <div className="flex items-center gap-2"><MapPin size={14}/> Por asignar dirección...</div>
                                        <div className="flex items-center gap-2"><Truck size={14}/> Pendiente Transportadora</div>
                                    </div>
                                </td>
                                <td className="text-center p-10">
                                    <button onClick={async ()=>{ const d = window.prompt("Introduce Ciudad, Dirección y Guía de Envío:"); if(d){ await axios.put(`/produccion/ordenes/${o.id}/estado`, {estado: 'Cerrado'}); load(); window.alert("Orden cerrada y despachada."); } }} className="px-10 py-4 bg-blue-600 text-white font-black rounded-3xl text-xs shadow-lg hover:bg-black uppercase tracking-widest transition-all">Sellar y Despachar</button>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                    {ordenes.filter(o=>o.estado==='Logistica').length === 0 && (
                        <div className="p-32 text-center text-slate-300 font-black uppercase italic tracking-tighter text-3xl opacity-50">
                            No hay productos listos para despacho
                        </div>
                    )}
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
        const pass = window.prompt("ACCESO RESTRINGIDO: Introduce la CLAVE MAESTRA para autorizar apertura de caja:");
        if (!pass) return;
        try {
            const resV = await axios.post('/turnos/verificar-maestra', { company_id: user.company_id, password: pass });
            if (resV.data.success) {
                const base = window.prompt("Ingresa el monto de BASE INICIAL en efectivo:", "0");
                await axios.post('/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id });
                onUpdate();
            } else {
                window.alert("❌ Error: Clave maestra incorrecta. Intento bloqueado.");
            }
        } catch (e) { window.alert("Error de seguridad en el servidor."); }
    };

    return (
        <div className="bg-white p-20 rounded-[70px] shadow-2xl text-center max-w-2xl mx-auto border-t-[30px] border-blue-600 animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 left-0 p-10 opacity-5 -rotate-12"><Wallet size={150}/></div>
            <div className={`w-24 h-24 mx-auto mb-10 rounded-[35px] flex items-center justify-center shadow-inner ${turnoActivo ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                {turnoActivo ? <Lock size={48} /> : <Lock size={48} />}
            </div>
            <h3 className="text-5xl font-black mb-4 uppercase italic tracking-tighter text-slate-800">{turnoActivo ? "TURNO OPERATIVO" : "SISTEMA CERRADO"}</h3>
            <p className="text-slate-400 font-bold mb-12 italic uppercase text-xs tracking-widest">Módulo de Seguridad AccuCloud</p>

            {turnoActivo ? (
                <div className="space-y-10">
                    <div className="p-16 bg-slate-50 rounded-[55px] border-2 border-dashed border-slate-200 shadow-inner">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[6px] mb-4">Ventas Acumuladas Hoy</p>
                        <h2 className="text-8xl font-black text-green-600 tracking-tighter">{fmt(turnoActivo.total_vendido)}</h2>
                    </div>
                    <button onClick={async ()=>{ if(window.confirm("¿Realizar arqueo de caja y cerrar turno definitivamente?")){ await axios.put('/turnos/finalizar', { turno_id: turnoActivo.id }); onUpdate(); } }} className="w-full py-8 bg-red-500 text-white font-black rounded-[35px] shadow-xl hover:bg-red-600 transition-all uppercase text-xs tracking-[2px]">Realizar Cierre de Turno</button>
                </div>
            ) : (
                <div className="space-y-8">
                    <p className="text-slate-400 font-medium px-16 text-sm">Esta caja solo puede ser habilitada por personal administrativo con autorización maestra.</p>
                    <button onClick={handleApertura} className="w-full py-8 bg-blue-600 text-white font-black rounded-[35px] shadow-2xl animate-bounce uppercase text-xs tracking-[2px] hover:bg-black transition-all">Aperturar con Clave Maestra</button>
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: NÓMINA (LIQUIDADOR 2026)
// ==========================================
function NominaView({ user }) {
  const [mode, setMode] = useState('liquidar');
  const [empleados, setEmpleados] = useState([]);
  const [nominas, setNominas] = useState([]);
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
    const aux = (sal <= 3501810) ? Math.round((249095 / 30) * dias) : 0; // Aux Transporte Est. 2026
    const salud = Math.round(basico * 0.04);
    const pension = Math.round(basico * 0.04);
    const neto = (basico + aux) - (salud + pension);
    setPreview({ nombre: e.nombre, neto, basico, aux, salud, pension });
  };

  return (
    <div className="space-y-10">
      <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm overflow-x-auto">
        <button onClick={()=>setMode('liquidar')} className={`px-12 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${mode==='liquidar'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Liquidador 2026</button>
        <button onClick={()=>setMode('history')} className={`px-12 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${mode==='history'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Historial de Pagos</button>
      </div>

      {mode === 'liquidar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
              <div className="bg-white p-16 rounded-[60px] shadow-xl border border-green-100 h-fit">
                  <h3 className="font-black text-3xl mb-10 text-green-800 tracking-tighter italic uppercase underline decoration-blue-500">Cálculo de Prestaciones</h3>
                  <div className="space-y-8">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-[3px]">Seleccionar Funcionario</label>
                        <select className="w-full p-6 bg-slate-50 border-none rounded-[30px] font-black text-slate-700 outline-none focus:ring-2 ring-green-400 transition-all" onChange={e=>setFormLiq({...formLiq, empleado_id: e.target.value})}>
                          <option>-- Listado de Personal --</option>
                          {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre} ({fmt(e.salario)})</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-6">Días Laborados</label>
                            <input type="number" className="w-full p-6 bg-slate-50 border-none rounded-[30px] font-black outline-none" value={formLiq.dias} onChange={e=>setFormLiq({...formLiq, dias: e.target.value})}/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-6">Recargos/Extras</label>
                            <input type="number" className="w-full p-6 bg-slate-50 border-none rounded-[30px] font-black outline-none" placeholder="0" onChange={e=>setFormLiq({...formLiq, extras: e.target.value})}/>
                        </div>
                      </div>
                      <button onClick={calcularNomina} className="w-full bg-slate-900 text-white font-black py-7 rounded-[35px] shadow-2xl hover:bg-black transition-all text-xs tracking-widest uppercase mt-4">Simular Desprendible</button>
                  </div>
              </div>
              <div className="bg-white p-16 rounded-[60px] shadow-2xl border-l-[20px] border-blue-600 flex flex-col justify-between">
                  {preview ? (
                      <div className="space-y-8 animate-fade-in">
                          <div className="text-center"><h4 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">{preview.nombre}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liquidación del Periodo</p></div>
                          <div className="space-y-4 border-y py-8 font-bold text-slate-600">
                            <div className="flex justify-between"><span>Sueldo Base:</span><span>{fmt(preview.basico)}</span></div>
                            <div className="flex justify-between text-green-600 italic"><span>(+) Auxilio Transporte:</span><span>{fmt(preview.aux)}</span></div>
                            <div className="flex justify-between text-red-500"><span>(-) Deducción Salud (4%):</span><span>-{fmt(preview.salud)}</span></div>
                            <div className="flex justify-between text-red-500"><span>(-) Deducción Pensión (4%):</span><span>-{fmt(preview.pension)}</span></div>
                          </div>
                          <div className="bg-blue-600 p-12 rounded-[45px] text-center text-7xl font-black text-white shadow-xl shadow-blue-200">
                            <p className="text-[10px] uppercase font-black mb-3 opacity-60 tracking-[4px]">Neto Pagado</p>
                            {fmt(preview.neto)}
                          </div>
                          <button onClick={async ()=>{if(window.confirm("¿Confirmas el pago real? Esto afectará los libros contables.")){await axios.post('/nomina/liquidar', {...formLiq, responsable: user.nombre, company_id: user.company_id}); setPreview(null); load(); window.alert("¡Nómina pagada y registrada!");}}} className="w-full bg-slate-900 text-white font-black py-7 rounded-[35px] shadow-xl uppercase text-xs tracking-widest active:scale-95 transition-all">Confirmar Pago y Guardar</button>
                      </div>
                  ) : <div className="h-full flex items-center justify-center opacity-10 flex-col"><Calculator size={180}/><p className="font-black mt-6 uppercase text-3xl tracking-tighter">Panel de Cálculo</p></div>}
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
            <div className="bg-white p-16 rounded-[80px] shadow-2xl max-w-4xl w-full text-center border-t-[30px] border-blue-600 relative overflow-hidden animate-slide-up">
                <div className="absolute top-0 right-0 p-12 opacity-5 text-blue-600"><TrendingUp size={300}/></div>
                <h1 className="text-6xl font-black text-slate-800 mb-6 tracking-tighter uppercase italic">Adquiere AccuCloud PRO</h1>
                <p className="text-slate-400 font-bold mb-12 italic text-lg tracking-tight">El ERP más potente de Colombia para farmacéuticas y comercios.</p>
                
                <div className="bg-blue-50 p-16 rounded-[65px] mb-12 border border-blue-100 shadow-inner">
                    <span className="text-[12px] font-black text-blue-400 uppercase tracking-[8px] block mb-6">Acceso Ilimitado Mensual</span>
                    <h2 className="text-9xl font-black text-blue-600 tracking-tighter">$600.000</h2>
                    <p className="text-xs text-blue-400 mt-8 font-black uppercase tracking-[2px]">Transacción Segura 256-bit vía PSE</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {["Producción Real", "Nómina 2026", "Contabilidad", "Stock Lotes"].map((feat) => (
                        <div key={feat} className="p-5 bg-slate-50 rounded-[25px] text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-100 flex items-center justify-center gap-2 italic">
                            <CheckCircle size={14} className="text-green-500"/> {feat}
                        </div>
                    ))}
                </div>

                <button onClick={()=>window.alert("Redirigiendo a Pasarela Segura PSE Bancolombia/Davivienda...")} className="w-full py-10 bg-slate-900 text-white font-black rounded-[45px] shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all text-lg uppercase tracking-widest active:scale-95 group">
                    <CreditCard size={32} className="group-hover:rotate-12 transition-transform"/> PAGAR SUSCRIPCIÓN CON PSE
                </button>
                <button onClick={onBack} className="mt-12 text-slate-400 font-black text-xs uppercase tracking-[3px] underline hover:text-slate-800 transition-colors">Volver al sistema principal</button>
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
        else window.alert('Credenciales inválidas para esta empresa corporativa.');
    } catch (e) { window.alert('Backend en reposo... reintenta en instantes.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20 blur-3xl"></div>
      <div className="bg-white p-16 rounded-[80px] shadow-2xl w-full max-w-md animate-slide-up relative z-10 border-t-[12px] border-slate-900">
        <h1 className="text-5xl font-black text-center text-slate-800 mb-4 italic tracking-tighter">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[4px] mb-12">Business Intelligence ERP</p>
        <form onSubmit={handleAuth} className="space-y-6">
          <input className="w-full p-6 bg-slate-100 rounded-[30px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
          <input type="password" class="w-full p-6 bg-slate-100 rounded-[30px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} required />
          <button className="w-full bg-slate-900 text-white font-black py-7 rounded-[30px] shadow-2xl hover:bg-black transition-all active:scale-95 uppercase text-xs tracking-widest mt-6">INGRESAR AL SISTEMA</button>
        </form>
        <div className="mt-16 p-10 bg-green-50 border-2 border-green-200 rounded-[50px] text-center shadow-inner relative group cursor-pointer" onClick={onBuy}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Novedad</div>
            <p className="text-[13px] font-black text-green-700 uppercase mb-5 tracking-tighter leading-tight italic">¡Haz parte del mejor sistema para tu negocio!</p>
            <button className="w-full py-4 bg-green-600 text-white font-black rounded-[20px] text-[10px] shadow-lg group-hover:scale-105 transition-all uppercase tracking-widest flex items-center justify-center gap-3">
                <CreditCard size={18}/> Adquirir Plan Pro 2026
            </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
//      MÓDULO: INVENTARIO (LOTES REALES)
// ==========================================
function InventarioView({ user }) {
    const [productos, setProductos] = useState([]);
    const load = () => axios.get(`/productos?company_id=${user.company_id}`).then(res => setProductos(Array.isArray(res.data) ? res.data : []));
    useEffect(() => { load(); }, []);

    return (
        <div className="bg-white rounded-[60px] shadow-sm border border-slate-100 overflow-hidden pr-2">
            <div className="p-10 bg-slate-50/50 flex justify-between items-center border-b">
                <h3 className="font-black text-2xl tracking-tighter uppercase italic text-slate-800">Control de Existencias y Lotes</h3>
                <div className="flex gap-4">
                    <button className="p-4 bg-white border rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-colors"><RefreshCcw size={20}/></button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-[3px] text-slate-400"><tr><th className="p-10">Producto</th><th>Lote / Batch</th><th>Disponibilidad</th><th>Fecha Vencimiento</th><th>Estado</th></tr></thead>
                    <tbody>{productos.map(p => (
                        <tr key={p.id} className="border-b hover:bg-slate-50 transition-colors">
                            <td className="p-10 font-black text-slate-800 text-xl tracking-tighter">{p.nombre}</td>
                            <td className="font-bold text-blue-600 uppercase tracking-widest text-xs">{p.lote || 'N/A'}</td>
                            <td className="font-black text-lg">{p.stock} <span className="text-[10px] text-slate-400">uds</span></td>
                            <td className="text-xs text-red-500 font-bold">{p.vencimiento ? new Date(p.vencimiento).toLocaleDateString() : 'SIN FECHA'}</td>
                            <td><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${p.stock > 10 ? 'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{p.stock > 10 ? 'Optimo' : 'Crítico'}</span></td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
            {productos.length === 0 && <div className="p-32 text-center text-slate-300 font-black uppercase italic tracking-tighter text-3xl">Inventario de Lotes vacío</div>}
        </div>
    );
}

// ==========================================
//      MÓDULO: CONTABILIDAD (LIBRO DIARIO)
// ==========================================
function ContabilidadView({ user }) {
    const [datos, setDatos] = useState([]);
    useEffect(() => { axios.get(`/contabilidad/ventas?company_id=${user.company_id}`).then(res => setDatos(Array.isArray(res.data) ? res.data : [])); }, []);
    return (
        <div className="bg-white p-12 rounded-[60px] shadow-sm border border-slate-100 overflow-hidden pr-2">
            <h3 className="font-black text-2xl mb-10 italic text-blue-600 uppercase tracking-tighter flex items-center gap-3"><Receipt size={28}/> Libro Diario de Ingresos</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-[4px]"><tr><th className="p-10 text-slate-400">Fecha y Hora</th><th className="text-slate-400">Cajero Responsable</th><th className="text-slate-400">Detalle de Operación</th><th className="text-right p-10 text-slate-400">Monto Final</th></tr></thead>
                    <tbody>{datos.map(d=>(<tr key={d.id} className="border-b hover:bg-slate-50 transition-all">
                        <td className="p-10 text-xs font-bold text-slate-500">{new Date(d.fecha).toLocaleString()}</td>
                        <td className="font-black text-blue-600 uppercase text-xs tracking-widest">{d.responsable}</td>
                        <td className="font-black text-slate-800 text-sm tracking-tight">Comprobante de Ingreso #{d.id} (Sincronizado TPV)</td>
                        <td className="p-10 text-right font-black text-slate-900 text-xl">{fmt(d.total)}</td>
                    </tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: VENTAS TPV (DISEÑO REAL)
// ==========================================
function VentasView({ user, turnoActivo }) {
    if(!turnoActivo) return (
        <div className="h-[500px] flex flex-col items-center justify-center bg-white rounded-[70px] border-4 border-dashed border-slate-100 opacity-30 italic animate-pulse">
            <ShoppingCart size={150} className="mb-6"/>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Caja Inactiva</h2>
            <p className="font-bold">Abre un turno para habilitar las ventas</p>
        </div>
    );
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 h-[700px]">
            <div className="lg:col-span-2 bg-white rounded-[60px] shadow-sm border border-slate-100 p-12 flex flex-col">
                <div className="flex items-center bg-slate-100 p-8 rounded-[40px] focus-within:ring-8 ring-blue-50 transition-all">
                    <ScanBarcode className="mr-6 text-slate-400" size={32}/>
                    <input className="bg-transparent border-none outline-none font-black text-2xl w-full text-slate-800 placeholder:text-slate-300" placeholder="ESCANEA EL CÓDIGO O BUSCA UN PRODUCTO..." autoFocus/>
                </div>
                <div className="flex-1 mt-12 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[50px]">
                    <div className="text-center opacity-10 font-black italic text-2xl uppercase tracking-tighter">Área de Visualización de Productos en Carrito</div>
                </div>
            </div>
            <div className="bg-slate-900 rounded-[60px] shadow-2xl p-12 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-45"><DollarSign size={250}/></div>
                <div className="relative z-10">
                    <h3 className="text-3xl font-black italic uppercase text-blue-400 mb-10 underline decoration-white decoration-4 underline-offset-8 tracking-tighter">Resumen de Venta</h3>
                    <div className="space-y-6">
                        <div className="flex justify-between font-black text-slate-500 uppercase text-xs tracking-widest"><span>Subtotal Neto:</span><span>$0</span></div>
                        <div className="flex justify-between font-black text-slate-500 uppercase text-xs tracking-widest"><span>Iva (19%):</span><span>$0</span></div>
                        <div className="flex justify-between font-black text-blue-500 uppercase text-xs tracking-widest pt-6 border-t border-slate-800"><span>Monto Gravado:</span><span>$0</span></div>
                    </div>
                </div>
                <div className="relative z-10">
                    <div className="text-[10px] font-black uppercase tracking-[5px] text-slate-500 mb-2">Total a Cobrar</div>
                    <div className="text-8xl font-black tracking-tighter mb-10 text-white">{fmt(0)}</div>
                    <button className="w-full py-8 bg-blue-600 text-white font-black rounded-[35px] shadow-xl hover:bg-white hover:text-blue-600 transition-all uppercase text-sm tracking-widest active:scale-95 shadow-blue-900/50">PROCESAR PAGO</button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
//      RESUMEN Y COMPONENTES VISUALES
// ==========================================
function ResumenView({ user }) {
  const [data, setData] = useState({ cajaMayor: 0, cajaMenor: 0, valorInventario: 0, lowStock: 0 });
  useEffect(() => { if(user?.company_id) axios.get(`/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); }, [user]);
  
  return (
    <div className="space-y-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <CardStat title="Balance Empresa" value={fmt(data.cajaMayor)} color="blue" icon={<TrendingUp/>}/>
            <CardStat title="Efectivo TPV" value={fmt(data.cajaMenor)} color="green" icon={<Wallet/>}/>
            <CardStat title="Valoración Stock" value={fmt(data.valorInventario)} color="purple" icon={<Box/>}/>
            <CardStat title="Items Críticos" value={data.lowStock} color="red" icon={<AlertTriangle/>}/>
        </div>
        <div className="bg-white p-12 rounded-[60px] shadow-sm border border-slate-100 h-96 flex items-center justify-center">
            <div className="text-center opacity-10 font-black italic text-3xl uppercase tracking-tighter">Área de Inteligencia de Datos (Gráficas)</div>
        </div>
    </div>
  );
}

function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return (
        <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mb-8 shadow-sm ${c[color]}`}>{icon}</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-2">{title}</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{value}</h3>
        </div>
    ); 
}