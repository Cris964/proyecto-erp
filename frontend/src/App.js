/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, RefreshCcw, Menu, TrendingUp, Factory, Truck, History, Settings, ChevronRight, CreditCard, Edit3, Trash2, Save, Play, CheckCircle, MapPin, Box, Database, Receipt, Layers, Plus, Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// CONFIGURACIÓN DE RED
axios.defaults.baseURL = window.location.origin + '/api';
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPSE, setShowPSE] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved && saved !== "undefined") {
        try { 
            const parsed = JSON.parse(saved);
            if(parsed && parsed.id) setUser(parsed);
        } catch (e) { localStorage.removeItem('erp_user'); }
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-2xl uppercase">AccuCloud Pro 2026...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? (
        <LoginScreen onLogin={(u) => { setUser(u); localStorage.setItem('erp_user', JSON.stringify(u)); }} onBuy={()=>setShowPSE(true)} />
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={()=>{setUser(null); localStorage.removeItem('erp_user');}} />
          <main className="flex-1 overflow-auto p-10 bg-slate-50 relative">
             <header className="flex justify-between items-center mb-10">
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">{activeTab}</h2>
                <div className="bg-white px-6 py-3 rounded-2xl border shadow-sm font-black text-[10px] uppercase text-blue-600 flex items-center gap-3">
                    <UserCircle size={18}/> {user.nombre} ({user.cargo})
                </div>
             </header>

             <div className="animate-fade-in">
                {activeTab === 'dashboard' && <ResumenView user={user}/>}
                {activeTab === 'ventas' && <VentasTPV user={user}/>}
                {activeTab === 'inventario' && <InventarioIndustrial user={user}/>}
                {activeTab === 'produccion' && <ProduccionIndustrial user={user}/>}
                {activeTab === 'nomina' && <NominaIndustrial user={user}/>}
                {activeTab === 'conta' && <ContabilidadView user={user}/>}
                {activeTab === 'admin' && <AdminUsuariosView user={user}/>}
                {activeTab === 'caja' && <CajaMasterView user={user}/>}
             </div>
          </main>
        </div>
      )}
    </div>
  );
}

// --- BARRA LATERAL ---
function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
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
        <aside className="w-72 bg-slate-900 text-white flex flex-col p-6 shadow-2xl relative z-40">
            <h1 className="text-2xl font-black italic mb-10 text-blue-400 uppercase tracking-tighter">AccuCloud.</h1>
            <nav className="flex-1 space-y-2 overflow-y-auto">
                {menuItems.filter(m => m.roles.includes(user?.cargo)).map(m => (
                    <button key={m.id} onClick={()=>setActiveTab(m.id)} className={`w-full flex items-center p-4 rounded-[22px] transition-all ${activeTab===m.id?'bg-blue-600 text-white shadow-xl scale-105':'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                        <span className="mr-3">{m.icon}</span> <span className="font-bold text-sm tracking-tight">{m.label}</span>
                    </button>
                ))}
            </nav>
            <button onClick={onLogout} className="text-red-500 font-black text-[10px] uppercase p-4 hover:underline mt-auto">Cerrar Sesión</button>
        </aside>
    );
}

// ==========================================
//      MÓDULO: NÓMINA (AGREGAR Y LIQUIDAR)
// ==========================================
function NominaIndustrial({ user }) {
    const [tab, setTab] = useState('list');
    const [empleados, setEmpleados] = useState([]);
    const [form, setForm] = useState({ nombre: '', email: '', salario: '', eps: '', arl: '', pension: '' });
    const [preview, setPreview] = useState(null);

    const load = () => axios.get(`/empleados?company_id=${user.company_id}`).then(res => setEmpleados(res.data)).catch(e => console.error(e));
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/empleados', { ...form, company_id: user.company_id });
            window.alert("Colaborador agregado."); setForm({nombre:'', email:'', salario:'', eps:'', arl:'', pension:''}); setTab('list'); load();
        } catch (e) { window.alert("Error al procesar registro."); }
    };

    const liquidar = (emp) => {
        const sal = parseFloat(emp.salario);
        const aux = (sal <= 3501810) ? 249095 : 0; 
        const neto = (sal + aux) - (sal * 0.08);
        setPreview({ ...emp, neto, aux, sal });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm">
                <button onClick={()=>setTab('list')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>LISTADO PERSONAL</button>
                <button onClick={()=>setTab('add')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='add'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>+ AGREGAR COLABORADOR</button>
            </div>

            {tab === 'add' && (
                <div className="bg-white p-12 rounded-[60px] shadow-sm border max-w-4xl">
                    <h3 className="text-3xl font-black italic mb-10 uppercase text-slate-800 tracking-tighter">Vinculación de Personal</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-2 gap-8">
                        <input className="p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-2 ring-blue-500" placeholder="Nombre Completo" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                        <input className="p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-2 ring-blue-500" placeholder="Email (Comprobante)" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/>
                        <input className="p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-2 ring-blue-500" type="number" placeholder="Salario Mensual" value={form.salario} onChange={e=>setForm({...form, salario:e.target.value})} required/>
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <input className="p-4 bg-slate-100 rounded-2xl font-black text-xs" placeholder="EPS" onChange={e=>setForm({...form, eps:e.target.value})}/>
                            <input className="p-4 bg-slate-100 rounded-2xl font-black text-xs" placeholder="ARL" onChange={e=>setForm({...form, arl:e.target.value})}/>
                            <input className="p-4 bg-slate-100 rounded-2xl font-black text-xs" placeholder="PENSIÓN" onChange={e=>setForm({...form, pension:e.target.value})}/>
                        </div>
                        <button className="col-span-2 py-8 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase active:scale-95 transition-all">REGISTRAR EN NÓMINA</button>
                    </form>
                </div>
            )}

            {tab === 'list' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white rounded-[50px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b tracking-[3px]"><tr><th className="p-10">Colaborador</th><th>Salario Base</th><th className="text-center">Acción</th></tr></thead>
                            <tbody>{empleados.map(e=>(
                                <tr key={e.id} className="border-b hover:bg-slate-50 transition">
                                    <td className="p-10 font-black text-slate-800 text-lg uppercase italic">{e.nombre} <br/><span className="text-[10px] text-blue-500 font-bold lowercase">{e.email}</span></td>
                                    <td className="font-black text-slate-600">{fmt(e.salario)}</td>
                                    <td className="text-center"><button onClick={()=>liquidar(e)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Calculator size={22}/></button></td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                    {preview && (
                        <div className="bg-white p-12 rounded-[60px] shadow-2xl border-l-[25px] border-blue-600 animate-slide-up">
                            <h4 className="text-4xl font-black text-slate-800 uppercase mb-8 tracking-tighter">{preview.nombre}</h4>
                            <div className="space-y-4 border-y py-10 font-bold text-slate-500 uppercase text-xs tracking-widest">
                                <div className="flex justify-between"><span>Sueldo Bruto:</span><span>{fmt(preview.sal)}</span></div>
                                <div className="flex justify-between text-green-600 italic"><span>(+) Auxilio Transporte:</span><span>{fmt(preview.aux)}</span></div>
                                <div className="flex justify-between text-red-500"><span>(-) Deducciones (8%):</span><span>-{fmt(preview.sal * 0.08)}</span></div>
                            </div>
                            <div className="bg-blue-600 p-12 rounded-[55px] text-center text-7xl font-black text-white shadow-xl shadow-blue-200 mt-10 tracking-tighter leading-none">{fmt(preview.neto)}</div>
                            <button onClick={()=>window.alert("Desprendible enviado.")} className="w-full py-8 bg-slate-900 text-white font-black rounded-[40px] shadow-xl mt-12 uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"><Mail size={20}/> ENVIAR POR EMAIL</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: PRODUCCIÓN (KITS INTEGRADOS)
// ==========================================
function ProduccionIndustrial({ user }) {
    const [sub, setSub] = useState('materia');
    const [materias, setMaterias] = useState([]);
    const [ordenes, setOrdenes] = useState([]);
    const [numOrden, setNumOrden] = useState('0001');

    const load = async () => {
        const resM = await axios.get(`/produccion/materia?company_id=${user.company_id}`);
        const resO = await axios.get(`/produccion/ordenes?company_id=${user.company_id}`);
        const resN = await axios.get(`/produccion/siguiente-numero?company_id=${user.company_id}`);
        setMaterias(Array.isArray(resM.data) ? resM.data : []);
        setOrdenes(Array.isArray(resO.data) ? resO.data : []);
        setNumOrden(resN.data.numero || '0001');
    };
    useEffect(() => { load(); }, [sub]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm overflow-x-auto">
                <button onClick={()=>setSub('materia')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='materia'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>1. STOCK INSUMOS</button>
                <button onClick={()=>setSub('kits')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='kits'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>2. CREACIÓN DE KITS</button>
                <button onClick={()=>setSub('ordenes')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='ordenes'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>3. ÓRDENES (OP-{numOrden})</button>
            </div>

            {sub === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="bg-white p-12 rounded-[60px] shadow-sm border h-fit">
                        <h3 className="font-black text-2xl mb-8 uppercase italic flex items-center gap-4 text-slate-800 tracking-tighter underline decoration-blue-500"><Database className="text-blue-600" size={32}/> Insumos Industriales</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); const d={nombre:e.target[0].value, unidad_medida:e.target[1].value, cantidad:e.target[2].value, costo:e.target[3].value, company_id:user.company_id}; await axios.post('/api/produccion/materia', d); load();}} className="space-y-6">
                            <input className="w-full p-5 bg-slate-50 rounded-[30px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm" placeholder="Nombre del Químico"/>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="p-5 bg-slate-50 rounded-[30px] font-black text-slate-600 outline-none"><option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option><option value="unidades">uds</option></select>
                                <input className="p-5 bg-slate-50 rounded-[30px] font-bold outline-none" type="number" placeholder="Cantidad"/>
                            </div>
                            <input className="w-full p-5 bg-slate-50 rounded-[30px] font-bold outline-none" placeholder="Costo por unidad" type="number"/>
                            <button className="w-full py-7 bg-slate-900 text-white font-black rounded-[35px] shadow-2xl hover:bg-black transition-all uppercase text-[10px] tracking-[3px]">Ingresar a Almacén Técnico</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[60px] shadow-sm border overflow-hidden pr-2">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-[4px] text-slate-400"><tr><th className="p-10">Materia Prima</th><th>Stock</th><th>Costo unit.</th><th className="p-10 text-right">Valorizado</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b hover:bg-slate-50 transition"><td className="p-10 font-black text-slate-800 uppercase italic tracking-tighter text-xl">{m.nombre}</td><td className="font-bold text-blue-600 text-lg">{m.cantidad} {m.unidad_medida}</td><td className="font-medium text-slate-500">{fmt(m.costo)}</td><td className="p-10 text-right font-black text-slate-900 text-xl">{fmt(m.cantidad * m.costo)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {sub === 'kits' && (
                <div className="bg-slate-900 p-20 rounded-[80px] shadow-2xl relative overflow-hidden text-white animate-slide-up">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-45 scale-150"><Layers size={300}/></div>
                    <div className="max-w-2xl relative z-10">
                        <h3 className="text-5xl font-black italic uppercase tracking-tighter text-blue-400 mb-6 underline decoration-white decoration-8 underline-offset-8">Armado de Kits Dinámicos</h3>
                        <p className="text-slate-400 font-bold mb-12 text-lg italic">Genera combos corporativos sincronizando el stock técnico.</p>
                        <form className="space-y-6">
                            <input className="w-full p-8 bg-slate-800 rounded-[35px] font-black border-none outline-none focus:ring-4 ring-blue-500 transition-all text-xl" placeholder="Nombre del Combo Permanente"/>
                            <div className="p-10 bg-slate-800/50 rounded-[45px] border border-slate-700">
                                <p className="text-[11px] font-black text-slate-500 uppercase mb-6 tracking-widest leading-none">Vincular Ítems de Bodega</p>
                                <select className="w-full bg-transparent font-black text-2xl text-blue-400 outline-none border-b border-slate-700 pb-4">
                                    <option>-- Buscar Producto --</option>
                                    {materias.map(m=><option key={m.id}>{m.nombre}</option>)}
                                </select>
                            </div>
                            <button className="px-16 py-8 bg-blue-600 rounded-[40px] font-black shadow-xl uppercase text-sm tracking-widest active:scale-95 transition-all">+ Generar Nuevo SKU de Kit</button>
                        </form>
                    </div>
                </div>
            )}

            {sub === 'ordenes' && (
                <div className="space-y-10">
                    <div className="bg-blue-600 p-16 rounded-[80px] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 p-10 opacity-10 rotate-45 scale-150"><Factory size={300}/></div>
                        <div className="relative z-10 text-center md:text-left mb-10 md:mb-0">
                            <p className="text-[12px] font-black uppercase tracking-[6px] mb-4 opacity-70 tracking-widest">Sistema de Batch Control</p>
                            <h3 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-4">OP-{numOrden}</h3>
                        </div>
                        <button onClick={async ()=>{ 
                            const n = window.prompt("Nombre del Producto a Fabricar:"); 
                            if(n){ await axios.post('/api/produccion/ordenes', {numero_orden: numOrden, nombre_producto: n, cantidad: 10, company_id: user.company_id}); load(); } 
                        }} className="relative z-10 px-16 py-7 bg-white text-blue-600 font-black rounded-[40px] shadow-2xl hover:scale-110 transition-all uppercase text-sm active:scale-95 shadow-blue-900/50">+ Lanzar Nueva Orden OP</button>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                        {ordenes.filter(o => ['Prealistamiento', 'Produccion'].includes(o.estado)).map(o => (
                            <div key={o.id} className="bg-white p-12 rounded-[70px] shadow-md border-l-[30px] border-blue-500 flex flex-col lg:flex-row justify-between items-center transition-all hover:shadow-2xl">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[5px] mb-3 leading-none tracking-widest">ORDEN INTERNA ID: {o.numero_orden}</p>
                                    <h4 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic mb-4 leading-none">{o.nombre_producto}</h4>
                                    <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${o.estado==='Produccion'?'bg-orange-100 text-orange-600':'bg-blue-100 text-blue-600'}`}>{o.estado}</span>
                                </div>
                                <div className="flex gap-6 mt-10 lg:mt-0">
                                    {o.estado === 'Prealistamiento' && <button onClick={async ()=>{ await axios.put(`/api/produccion/ordenes/${o.id}`, {estado: 'Produccion'}); load(); }} className="flex items-center gap-4 px-12 py-6 bg-slate-900 text-white font-black rounded-[35px] shadow-2xl hover:bg-black transition-all uppercase text-xs active:scale-95 tracking-widest"><Play size={24}/> Iniciar Etapa</button>}
                                    {o.estado === 'Produccion' && <button onClick={async ()=>{ await axios.put(`/api/produccion/ordenes/${o.id}`, {estado: 'Logistica'}); load(); }} className="flex items-center gap-4 px-12 py-6 bg-green-600 text-white font-black rounded-[35px] shadow-2xl hover:bg-green-700 transition-all uppercase text-xs active:scale-95 tracking-widest"><CheckCircle size={24}/> Sellar y Finalizar</button>}
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
//      MÓDULO: INVENTARIO ( MANUAL Y EXCEL )
// ==========================================
function InventarioIndustrial({ user }) {
    const [tab, setTab] = useState('list');
    const [productos, setProductos] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [form, setForm] = useState({ nombre: '', sku: '', precio: '', stock: '', bodega_id: '' });

    const load = () => {
        axios.get(`/productos?company_id=${user.company_id}`).then(res => setProductos(Array.isArray(res.data) ? res.data : []));
        axios.get(`/bodegas?company_id=${user.company_id}`).then(res => setBodegas(Array.isArray(res.data) ? res.data : []));
    };
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/productos', { ...form, company_id: user.company_id });
            setForm({nombre:'', sku:'', precio:'', stock:'', bodega_id:''}); setTab('list'); load();
            window.alert("¡Producto Sincronizado!");
        } catch (e) { window.alert("Error al registrar."); }
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            await axios.post('/api/productos/importar', { productos: data, company_id: user.company_id });
            load(); window.alert("Importación Masiva Exitosa.");
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm">
                <button onClick={()=>setTab('list')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>CONSULTAR EXISTENCIAS</button>
                <button onClick={()=>setTab('new')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='new'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>+ CREACIÓN MANUAL</button>
                <button onClick={()=>setTab('bodegas')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='bodegas'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>GESTIÓN BODEGAS</button>
                <label className="bg-green-600 text-white px-10 py-3 rounded-2xl font-black text-[10px] cursor-pointer flex items-center gap-2 hover:bg-green-700 shadow-xl transition-all">
                    <Upload size={14}/> CARGAR EXCEL <input type="file" className="hidden" onChange={handleImportExcel} accept=".xlsx, .xls"/>
                </label>
            </div>

            {tab === 'new' && (
                <div className="bg-white p-16 rounded-[70px] shadow-sm border max-w-4xl animate-slide-up">
                    <h3 className="text-3xl font-black italic mb-10 uppercase tracking-tighter text-slate-800 underline decoration-blue-500 decoration-8 underline-offset-8">Ficha Técnica de Nuevo Item</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-2 gap-8">
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nombre Comercial</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Lote / SKU</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Precio Venta Público</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50" type="number" value={form.precio} onChange={e=>setForm({...form, precio:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Cant. Inicial</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} required/></div>
                        <select className="col-span-2 p-6 bg-slate-50 rounded-3xl font-black outline-none focus:ring-4 ring-blue-50" onChange={e=>setForm({...form, bodega_id: e.target.value})} required>
                            <option value="">-- Seleccionar Bodega de Destino --</option>
                            {bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                        <button className="col-span-2 py-8 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase tracking-widest active:scale-95 transition-all">Sincronizar al Inventario</button>
                    </form>
                </div>
            )}

            {tab === 'bodegas' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white p-12 rounded-[60px] shadow-sm border h-fit">
                        <h3 className="font-black text-2xl mb-8 uppercase italic tracking-tighter">Gestionar Zonas</h3>
                        <div className="flex gap-4">
                            <input className="flex-1 p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none" placeholder="Nombre Zona (Bodega Principal...)" id="nbn_bodega"/>
                            <button onClick={async ()=>{ const n=document.getElementById('nbn_bodega').value; await axios.post('/api/bodegas', {nombre: n, company_id: user.company_id}); load(); }} className="bg-blue-600 text-white px-10 rounded-3xl font-black shadow-xl hover:bg-black transition-all">AÑADIR</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-[50px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase"><tr><th className="p-8">Zona Registrada</th><th className="text-right p-8">Opción</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b"><td className="p-8 font-black uppercase italic tracking-tighter text-xl text-slate-800">{b.nombre}</td><td className="text-right p-8 text-red-500 font-bold cursor-pointer hover:underline text-[10px] uppercase">Eliminar</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'list' && (
                <div className="bg-white rounded-[60px] shadow-sm border overflow-hidden pr-2">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase border-b text-slate-400 tracking-widest"><tr><th className="p-10">Descripción Item</th><th>Batch ID</th><th>Bodega</th><th>Existencias</th><th className="text-center">Operación</th></tr></thead>
                        <tbody>{productos.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition">
                                <td className="p-10 font-black text-slate-800 text-2xl tracking-tighter uppercase italic leading-none">{p.nombre}</td>
                                <td className="font-bold text-blue-500 text-sm tracking-[2px]">{p.sku}</td>
                                <td className="text-xs font-black uppercase italic">{bodegas.find(b=>b.id===p.bodega_id)?.nombre || 'Gral'}</td>
                                <td className="font-black text-5xl leading-none scale-x-90 origin-left">{p.stock}</td>
                                <td className="text-center p-10"><button className="p-5 bg-slate-50 text-slate-400 rounded-[25px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={24}/></button></td>
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
        const pass = window.prompt("SEGURIDAD: Introduce la CLAVE MAESTRA corporativa (admin123):");
        if (!pass) return;
        try {
            const resV = await axios.post('/api/turnos/verificar-maestra', { company_id: user.company_id, password: pass });
            if (resV.data.success) {
                const base = window.prompt("¿Monto de base inicial en efectivo?", "0");
                await axios.post('/api/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id });
                onUpdate();
            } else { window.alert("❌ Clave administrativa incorrecta. Acceso denegado."); }
        } catch (e) { window.alert("Error de validación corporativa."); }
    };

    return (
        <div className="bg-white p-24 rounded-[90px] shadow-2xl text-center max-w-2xl mx-auto border-t-[30px] border-blue-600 animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 left-0 p-10 opacity-5 -rotate-12"><Wallet size={150}/></div>
            <div className={`w-32 h-32 mx-auto mb-10 rounded-[45px] flex items-center justify-center shadow-inner ${turnoActivo ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                <Lock size={64}/>
            </div>
            <h3 className="text-6xl font-black mb-8 uppercase italic tracking-tighter text-slate-800 leading-none">{turnoActivo ? "CAJA ACTIVA" : "CAJA BLOQUEADA"}</h3>
            {turnoActivo ? (
                <div className="space-y-12">
                    <div className="p-16 bg-slate-50 rounded-[60px] border-2 border-dashed border-slate-200 shadow-inner">
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[8px] mb-4">Ventas Acumuladas Hoy</p>
                        <h2 className="text-9xl font-black text-green-600 tracking-tighter leading-none">{fmt(turnoActivo.total_vendido)}</h2>
                    </div>
                    <button onClick={async ()=>{ if(window.confirm("¿Realizar arqueo y cerrar turno?")){ await axios.put('/api/turnos/finalizar', { turno_id: turnoActivo.id }); onUpdate(); } }} className="w-full py-10 bg-red-500 text-white font-black rounded-[45px] shadow-xl hover:bg-red-600 transition-all uppercase text-sm tracking-widest active:scale-95">Realizar Cierre de Turno</button>
                </div>
            ) : (
                <div className="space-y-10">
                    <p className="text-slate-400 font-bold px-20 text-xl italic tracking-tight opacity-60 uppercase">Módulo restringido a nivel administrativo maestro para operaciones de flujo de efectivo</p>
                    <button onClick={handleApertura} className="w-full py-10 bg-blue-600 text-white font-black rounded-[45px] shadow-2xl animate-bounce uppercase text-xs tracking-[5px] hover:bg-black transition-all">Aperturar con Clave Maestra</button>
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: VENTAS TPV (DISEÑO TOTAL)
// ==========================================
function VentasTPV({ user, turnoActivo }) {
    const [cart, setCart] = useState([]);
    const [prods, setProds] = useState([]);
    const [search, setSearch] = useState('');

    const load = () => axios.get(`/api/productos?company_id=${user.company_id}`).then(res => setProds(Array.isArray(res.data) ? res.data : []));
    useEffect(() => { load(); }, []);

    if(!turnoActivo) return <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-[90px] border-4 border-dashed border-slate-100 opacity-20 italic">Caja Bloqueada</div>;

    const total = cart.reduce((acc, x) => acc + (x.precio * x.cant), 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 h-[750px] animate-fade-in">
            <div className="lg:col-span-2 bg-white rounded-[70px] shadow-sm border border-slate-100 p-12 flex flex-col">
                <div className="flex items-center bg-slate-100 p-10 rounded-[50px] focus-within:ring-8 ring-blue-50 transition-all shadow-inner">
                    <ScanBarcode className="mr-8 text-slate-400" size={40}/>
                    <input className="bg-transparent border-none outline-none font-black text-3xl w-full text-slate-800" placeholder="BUSCAR O ESCANEAR..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus/>
                </div>
                <div className="flex-1 mt-12 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-6">
                    {prods.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase())).map(p=>(
                        <div key={p.id} onClick={()=>{const ex=cart.find(x=>x.id===p.id); if(ex)setCart(cart.map(x=>x.id===p.id?{...x,cant:x.cant+1}:x)); else setCart([...cart,{...p,cant:1}])}} className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 hover:border-blue-500 hover:scale-105 cursor-pointer transition-all flex flex-col justify-between group shadow-sm">
                            <p className="font-black text-slate-800 uppercase text-sm group-hover:text-blue-600 transition-colors leading-tight italic">{p.nombre}</p>
                            <p className="font-black text-blue-600 text-3xl tracking-tighter mt-4">{fmt(p.precio)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-slate-900 rounded-[70px] shadow-2xl p-12 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-45 scale-150"><DollarSign size={250}/></div>
                <div className="relative z-10 flex-1 overflow-y-auto pr-2">
                    <h3 className="text-4xl font-black italic uppercase text-blue-400 mb-12 underline decoration-white decoration-4 underline-offset-8 tracking-tighter">Ticket TPV</h3>
                    <div className="space-y-6">
                        {cart.map(x=>(
                            <div key={x.id} className="flex justify-between items-center font-bold border-b border-slate-800 pb-4">
                                <div className="flex flex-col"><span className="text-xl uppercase italic leading-none">{x.nombre.substring(0,14)}</span><span className="text-blue-400 text-[10px] font-black uppercase mt-2">Cant: {x.cant}</span></div>
                                <div className="flex items-center gap-4"><span className="text-2xl tracking-tighter">{fmt(x.precio * x.cant)}</span><button onClick={()=>setCart(cart.filter(it=>it.id!==x.id))} className="p-2 text-red-500"><X size={18}/></button></div>
                            </div>
                        ))}
                        {cart.length === 0 && <div className="p-20 text-center opacity-20 font-black italic text-xl uppercase tracking-tighter">LISTO PARA VENDER</div>}
                    </div>
                </div>
                <div className="relative z-10 mt-10">
                    <p className="text-[12px] font-black uppercase tracking-[6px] text-slate-500 mb-2">Monto Final</p>
                    <div className="text-8xl font-black tracking-tighter mb-12 text-white leading-none scale-x-90 origin-left">{fmt(total)}</div>
                    <button onClick={async ()=>{
                        await axios.post('/api/ventas', {productos: cart, responsable: user.nombre, turno_id: turnoActivo.id, company_id: user.company_id});
                        setCart([]); window.alert("Venta registrada exitosamente."); load();
                    }} className="w-full py-10 bg-blue-600 text-white font-black rounded-[40px] shadow-xl uppercase active:scale-95 transition-all text-sm tracking-widest">Procesar Venta</button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: ADMINISTRACIÓN (CRUD FULL)
// ==========================================
function AdminUsuariosView({ user }) {
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' });

    const load = () => axios.get(`/api/admin/usuarios?company_id=${user.company_id}`).then(res => setUsuarios(Array.isArray(res.data) ? res.data : []));
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (form.id) await axios.put(`/api/admin/usuarios/${form.id}`, form);
        else await axios.post('/api/admin/usuarios', { ...form, company_id: user.company_id });
        setForm({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' }); load();
        window.alert("¡Acceso guardado!");
    };

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="bg-white p-16 rounded-[80px] shadow-sm border border-slate-100 relative">
                <h3 className="font-black text-3xl mb-12 italic uppercase tracking-tighter text-slate-800 underline decoration-blue-500 decoration-8 underline-offset-8">{form.id ? 'Modificar Acceso' : 'Nuevo Colaborador'}</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6">Nombre</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6">Email</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6">Password</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all" type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required={!form.id}/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6">Cargo</label><select className="w-full p-6 bg-slate-50 rounded-[35px] font-black text-slate-700 outline-none focus:ring-4 ring-blue-50" value={form.cargo} onChange={e=>setForm({...form, cargo: e.target.value})}>
                        <option value="Admin">Admin</option><option value="Vendedor">Vendedor</option><option value="Bodeguero">Bodeguero</option>
                        <option value="Prealistador">Prealistador</option><option value="Produccion">Produccion</option><option value="Logistica">Logistica</option>
                    </select></div>
                    <div className="flex items-end"><button className="w-full py-6 bg-blue-600 text-white font-black rounded-[35px] shadow-2xl hover:bg-black transition-all transform active:scale-95 uppercase text-xs tracking-widest">Guardar</button></div>
                </form>
            </div>
            <div className="bg-white rounded-[70px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-[4px] text-slate-400"><tr><th className="p-12">Nombre del Usuario</th><th>Email</th><th>Rol Corporativo</th><th className="text-center">Operaciones</th></tr></thead>
                    <tbody>{usuarios.map(u => (
                        <tr key={u.id} className="border-b hover:bg-slate-50 transition-all">
                            <td className="p-12 font-black text-slate-800 text-2xl tracking-tighter italic uppercase">{u.nombre}</td>
                            <td className="font-bold text-slate-400">{u.email}</td>
                            <td><span className="bg-blue-50 text-blue-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{u.cargo}</span></td>
                            <td className="p-12 text-center flex justify-center gap-6">
                                <button onClick={()=> {setForm(u); window.scrollTo({top:0, behavior:'smooth'})}} className="p-5 bg-blue-50 text-blue-600 rounded-[25px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={24}/></button>
                                <button onClick={async ()=>{if(window.confirm("¿Eliminar acceso?")){ await axios.delete(`/api/admin/usuarios/${u.id}`); load(); }}} className="p-5 bg-red-50 text-red-500 rounded-[25px] hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={24}/></button>
                            </td>
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
    useEffect(() => { axios.get(`/api/contabilidad/ventas?company_id=${user.company_id}`).then(res => setDatos(Array.isArray(res.data) ? res.data : [])); }, []);
    return (
        <div className="bg-white p-16 rounded-[80px] shadow-sm border border-slate-100 overflow-hidden pr-2 animate-fade-in">
            <h3 className="font-black text-3xl mb-12 italic text-blue-600 uppercase tracking-tighter flex items-center gap-5 underline decoration-blue-100 decoration-8 underline-offset-8"><Receipt size={40}/> Libro de Ventas TPV</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50 text-[11px] font-black uppercase border-b tracking-[5px] text-slate-400"><tr><th className="p-10">Fecha / Hora</th><th>Responsable</th><th>Detalle</th><th className="text-right p-10">Total Bruto</th></tr></thead>
                    <tbody>{datos.map(d=>(<tr key={d.id} className="border-b hover:bg-slate-50 transition-all">
                        <td className="p-10 text-sm font-bold text-slate-500">{new Date(d.fecha).toLocaleString()}</td>
                        <td className="font-black text-blue-600 uppercase text-xs">{d.responsable}</td>
                        <td className="font-black text-slate-800 text-lg tracking-tight italic leading-none">Comprobante de Ingreso TPV #{d.id}</td>
                        <td className="p-10 text-right font-black text-slate-900 text-4xl tracking-tighter">{fmt(d.total)}</td>
                    </tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: DASHBOARD (GRÁFICAS REALES)
// ==========================================
function ResumenView({ user }) {
  const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
  const [chartData] = useState([
    { name: 'Lun', v: 400 }, { name: 'Mar', v: 300 }, { name: 'Mie', v: 600 }, { name: 'Jue', v: 800 }, { name: 'Vie', v: 500 }, { name: 'Sab', v: 900 }, { name: 'Dom', v: 200 }
  ]);

  useEffect(() => { axios.get(`/api/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); }, [user]);

  return (
    <div className="space-y-12 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <CardStat title="Balance General" value={fmt(data.cajaMayor)} color="blue" icon={<TrendingUp size={32}/>}/>
            <CardStat title="Efectivo TPV" value={fmt(0)} color="green" icon={<Wallet size={32}/>}/>
            <CardStat title="Valoración Stock" value={fmt(data.valorInventario)} color="purple" icon={<Box size={32}/>}/>
            <CardStat title="Alertas Stock" value={data.lowStock} color="red" icon={<AlertTriangle size={32}/>}/>
        </div>
        <div className="bg-white p-20 rounded-[80px] shadow-sm border h-[600px] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-5"><TrendingUp size={300}/></div>
             <h3 className="font-black text-4xl mb-16 uppercase italic text-slate-800 tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-8">Desempeño Semanal</h3>
             <ResponsiveContainer width="100%" height="80%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 16, fontWeight: '900', fill: '#94a3b8'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '35px', border: 'none', boxShadow: '0 35px 60px -15px rgb(0 0 0 / 0.3)'}} />
                    <Bar dataKey="v" radius={[25, 25, 0, 0]} fill="#2563eb">
                         {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 5 ? '#2563eb' : '#e2e8f0'} />))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
        </div>
    </div>
  );
}

function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50 shadow-green-200", blue: "text-blue-600 bg-blue-50 shadow-blue-200", purple: "text-purple-600 bg-purple-50 shadow-purple-200", red: "text-red-600 bg-red-50 shadow-red-200" };
    return <div className="bg-white p-16 rounded-[70px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-5 transition-all duration-1000 group"><div className={`w-24 h-24 rounded-[40px] flex items-center justify-center mb-12 shadow-2xl group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div><p className="text-[12px] font-black text-slate-400 uppercase tracking-[6px] mb-4 leading-none italic">{title}</p><h3 className="text-6xl font-black text-slate-800 tracking-tighter leading-none italic">{value}</h3></div>; 
}
function PSEPage({ onBack }) { return <div className="h-screen bg-slate-900 text-white flex items-center justify-center text-8xl font-black uppercase italic tracking-widest text-center px-20">Pasarela Bancaria PSE $600.000 COP</div>; }