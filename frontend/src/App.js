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

axios.defaults.baseURL = window.location.origin + '/api';
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPSE, setShowPSE] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-2xl uppercase italic">AccuCloud Pro 2026...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? (
        <LoginScreen onLogin={(u) => { setUser(u); localStorage.setItem('erp_user', JSON.stringify(u)); }} onBuy={()=>setShowPSE(true)} />
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={()=>{setUser(null); localStorage.removeItem('erp_user');}} />
          <main className="flex-1 overflow-auto p-10 bg-slate-50">
             <header className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">{activeTab}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px]">AccuCloud Enterprise v2.6</p>
                </div>
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
    const menu = [
        { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard/>, roles: ['Admin', 'Contador'] },
        { id: 'ventas', label: 'Ventas (TPV)', icon: <ShoppingCart/>, roles: ['Admin', 'Vendedor'] },
        { id: 'inventario', label: 'Bodegas e Inv.', icon: <Package/>, roles: ['Admin', 'Bodeguero'] },
        { id: 'produccion', label: 'Producción Ind.', icon: <Factory/>, roles: ['Admin', 'Prealistador', 'Produccion', 'Logistica'] },
        { id: 'nomina', label: 'Nómina PRO', icon: <Users/>, roles: ['Admin', 'Nomina'] },
        { id: 'admin', label: 'Configuración', icon: <ShieldCheck/>, roles: ['Admin'] },
    ];
    return (
        <aside className="w-72 bg-slate-900 text-white flex flex-col p-6 shadow-2xl relative z-40">
            <h1 className="text-2xl font-black italic mb-10 text-blue-400 uppercase tracking-tighter">AccuCloud.</h1>
            <nav className="flex-1 space-y-2">
                {menu.filter(m => m.roles.includes(user?.cargo)).map(m => (
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
//      MÓDULO: NÓMINA PRO (COLABORADORES)
// ==========================================
function NominaIndustrial({ user }) {
    const [tab, setTab] = useState('list');
    const [empleados, setEmpleados] = useState([]);
    const [form, setForm] = useState({ nombre: '', email: '', salario: '', eps: '', arl: '', pension: '' });
    const [preview, setPreview] = useState(null);

    const load = () => axios.get(`/empleados?company_id=${user.company_id}`).then(res => setEmpleados(res.data));
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        await axios.post('/api/empleados', { ...form, company_id: user.company_id });
        window.alert("Colaborador agregado."); setForm({nombre:'', email:'', salario:'', eps:'', arl:'', pension:''}); setTab('list'); load();
    };

    const simular = (e) => {
        const sal = parseFloat(e.salario);
        const aux = (sal <= 3501810) ? 249095 : 0; 
        const neto = (sal + aux) - (sal * 0.08);
        setPreview({ ...e, neto, aux, sal });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm">
                <button onClick={()=>setTab('list')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>LISTADO PERSONAL</button>
                <button onClick={()=>setTab('add')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='add'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>+ AGREGAR COLABORADOR</button>
            </div>
            {tab === 'add' ? (
                <div className="bg-white p-12 rounded-[50px] shadow-sm border max-w-4xl">
                    <h3 className="text-3xl font-black italic mb-10 uppercase text-slate-800 tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-8">Vinculación de Personal</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-2 gap-8">
                        <input className="p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                        <input className="p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/>
                        <input className="p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all" type="number" placeholder="Salario" value={form.salario} onChange={e=>setForm({...form, salario:e.target.value})} required/>
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <input className="p-4 bg-slate-100 rounded-2xl font-black text-xs" placeholder="EPS" onChange={e=>setForm({...form, eps:e.target.value})}/>
                            <input className="p-4 bg-slate-100 rounded-2xl font-black text-xs" placeholder="ARL" onChange={e=>setForm({...form, arl:e.target.value})}/>
                            <input className="p-4 bg-slate-100 rounded-2xl font-black text-xs" placeholder="PENSION" onChange={e=>setForm({...form, pension:e.target.value})}/>
                        </div>
                        <button className="col-span-2 py-8 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase tracking-widest active:scale-95 transition-all mt-6">REGISTRAR EN NÓMINA</button>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white rounded-[50px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b tracking-widest"><tr><th className="p-10">Funcionario</th><th>Salario Base</th><th className="text-center">Acción</th></tr></thead>
                            <tbody>{empleados.map(e=>(<tr key={e.id} className="border-b hover:bg-slate-50 transition"><td className="p-10 font-black text-slate-800 uppercase italic leading-tight">{e.nombre} <br/><span className="text-[10px] text-blue-500 font-bold lowercase">{e.email}</span></td><td className="font-black text-slate-600">{fmt(e.salario)}</td><td className="text-center"><button onClick={()=>simular(e)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Calculator size={22}/></button></td></tr>))}</tbody>
                        </table>
                    </div>
                    {preview && (
                        <div className="bg-white p-12 rounded-[60px] shadow-2xl border-l-[25px] border-blue-600 animate-slide-up">
                            <h4 className="text-4xl font-black text-slate-800 uppercase mb-8 tracking-tighter underline decoration-blue-200 decoration-8">{preview.nombre}</h4>
                            <div className="space-y-4 border-y py-10 font-bold text-slate-500 uppercase text-xs tracking-widest">
                                <div className="flex justify-between"><span>Sueldo Bruto:</span><span>{fmt(preview.sal)}</span></div>
                                <div className="flex justify-between text-green-600"><span>(+) Auxilio Transporte:</span><span>{fmt(preview.aux)}</span></div>
                                <div className="flex justify-between text-red-500"><span>(-) Salud y Pensión (8%):</span><span>-{fmt(preview.sal * 0.08)}</span></div>
                            </div>
                            <div className="bg-blue-600 p-12 rounded-[55px] text-center text-7xl font-black text-white shadow-xl shadow-blue-200 mt-10 tracking-tighter leading-none">{fmt(preview.neto)}</div>
                            <button onClick={async ()=>{if(window.confirm("¿Enviar desprendible?")){await axios.post('/api/nomina/liquidar', preview); window.alert("¡Enviado!");}}} className="w-full py-8 bg-slate-900 text-white font-black rounded-[40px] shadow-xl mt-12 uppercase text-sm tracking-widest active:scale-95 transition-all"><Mail size={20}/> ENVIAR COMPROBANTE</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: PRODUCCIÓN INDUSTRIAL (PRO)
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
        setMaterias(resM.data); setOrdenes(resO.data); setNumOrden(resN.data.numero);
    };
    useEffect(() => { load(); }, [sub]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm overflow-x-auto">
                <button onClick={()=>setSub('materia')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='materia'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>1. STOCK INSUMOS</button>
                <button onClick={()=>setSub('kits')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='kits'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>2. CREACIÓN DE KITS</button>
                <button onClick={()=>setSub('ordenes')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='ordenes'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>3. ÓRDENES OP-{numOrden}</button>
                <button onClick={()=>setSub('logistica')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='logistica'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>4. LOGÍSTICA</button>
            </div>

            {sub === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="bg-white p-12 rounded-[60px] shadow-sm border h-fit">
                        <h3 className="font-black text-2xl mb-8 uppercase italic flex items-center gap-4 text-slate-800 tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-8"><Database size={32} className="text-blue-600"/> Insumos Técnicos</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); const d={nombre:e.target[0].value, unidad_medida:e.target[1].value, cantidad:e.target[2].value, costo:e.target[3].value, company_id:user.company_id}; await axios.post('/api/produccion/materia', d); load(); e.target.reset();}} className="space-y-6">
                            <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm" placeholder="Nombre Químico"/>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="p-5 bg-slate-50 rounded-3xl font-black text-slate-600 outline-none"><option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option><option value="unidades">uds</option></select>
                                <input className="p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none" type="number" placeholder="Cantidad"/>
                            </div>
                            <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none" placeholder="Costo por unidad" type="number"/>
                            <button className="w-full py-7 bg-slate-900 text-white font-black rounded-[35px] shadow-2xl hover:bg-black transition-all uppercase text-[10px] tracking-[3px]">Ingresar a Almacén Técnico</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[60px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-widest text-slate-400"><tr><th className="p-10">Materia Prima</th><th>Stock Disponible</th><th>Costo unit.</th><th className="p-10 text-right">Valorizado</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-10 font-black text-slate-800 uppercase italic tracking-tighter text-xl leading-none">{m.nombre}</td><td className="font-bold text-blue-600 text-lg leading-none">{m.cantidad} {m.unidad_medida}</td><td className="font-medium text-slate-500 leading-none">{fmt(m.costo)}</td><td className="p-10 text-right font-black text-slate-900 text-xl leading-none">{fmt(m.cantidad * m.costo)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {sub === 'kits' && (
                <div className="bg-slate-900 p-20 rounded-[80px] shadow-2xl relative overflow-hidden text-white animate-slide-up">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-45 scale-150"><Layers size={300}/></div>
                    <div className="max-w-2xl relative z-10">
                        <h3 className="text-5xl font-black italic uppercase tracking-tighter text-blue-400 mb-6 underline decoration-white decoration-8 underline-offset-8 leading-tight">Armado de Kits Dinámicos</h3>
                        <p className="text-slate-400 font-bold mb-12 text-lg italic">Genera combos automáticos sincronizando el stock técnico.</p>
                        <form className="space-y-6">
                            <input className="w-full p-8 bg-slate-800 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-500 transition-all text-xl" placeholder="Nombre del Kit"/>
                            <div className="p-10 bg-slate-800/50 rounded-[45px] border border-slate-700">
                                <p className="text-[11px] font-black text-slate-500 uppercase mb-6 tracking-widest leading-none">Vincular Ítems de Bodega</p>
                                <select className="w-full bg-transparent font-black text-2xl text-blue-400 outline-none border-b border-slate-700 pb-4">
                                    <option>-- Buscar Producto --</option>
                                    {materias.map(m=><option key={m.id}>{m.nombre}</option>)}
                                </select>
                            </div>
                            <button className="px-16 py-8 bg-blue-600 rounded-[40px] font-black shadow-xl uppercase text-sm tracking-widest transition-all hover:bg-white hover:text-blue-600">+ Generar Nuevo SKU de Kit</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: INVENTARIO (BODEGAS Y EXCEL)
// ==========================================
function InventarioIndustrial({ user }) {
    const [tab, setTab] = useState('list');
    const [productos, setProductos] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [form, setForm] = useState({ nombre: '', sku: '', precio: '', stock: '', bodega_id: '' });

    const load = () => {
        axios.get(`/productos?company_id=${user.company_id}`).then(res => setProductos(res.data));
        axios.get(`/bodegas?company_id=${user.company_id}`).then(res => setBodegas(res.data));
    };
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        await axios.post('/api/productos', { ...form, company_id: user.company_id });
        setForm({nombre:'', sku:'', precio:'', stock:'', bodega_id:''}); setTab('list'); load();
        window.alert("¡Producto Sincronizado!");
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const wb = XLSX.read(evt.target.result, { type: 'binary' });
            const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            await axios.post('/api/productos/importar', { productos: data, company_id: user.company_id });
            load(); window.alert("Importación Masiva Exitosa.");
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm overflow-x-auto">
                <button onClick={()=>setTab('list')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>CONSULTAR STOCK</button>
                <button onClick={()=>setTab('new')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='new'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>+ CREACIÓN MANUAL</button>
                <button onClick={()=>setTab('bodegas')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='bodegas'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>BODEGAS</button>
                <label className="bg-green-600 text-white px-10 py-3 rounded-2xl font-black text-[10px] cursor-pointer flex items-center gap-2 hover:bg-green-700 shadow-xl transition-all">
                    <Upload size={14}/> CARGAR EXCEL <input type="file" className="hidden" onChange={handleImportExcel} accept=".xlsx, .xls"/>
                </label>
            </div>

            {tab === 'new' && (
                <div className="bg-white p-16 rounded-[70px] shadow-sm border max-w-4xl animate-slide-up">
                    <h3 className="text-3xl font-black italic mb-10 uppercase tracking-tighter text-slate-800 underline decoration-blue-500 decoration-8 underline-offset-8 leading-none">Ficha Técnica de Nuevo Item</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-2 gap-8">
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest leading-none">Nombre Comercial</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest leading-none">Batch / SKU</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest leading-none">Precio de Venta</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" type="number" value={form.precio} onChange={e=>setForm({...form, precio:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest leading-none">Cant. Inicial</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} required/></div>
                        <select className="col-span-2 p-6 bg-slate-50 rounded-3xl font-black outline-none focus:ring-4 ring-blue-50 text-sm leading-none" onChange={e=>setForm({...form, bodega_id: e.target.value})} required>
                            <option value="">-- Seleccionar Bodega de Destino --</option>
                            {bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                        <button className="col-span-2 py-8 bg-blue-600 text-white font-black rounded-[30px] shadow-xl uppercase tracking-widest active:scale-95 transition-all text-xs">Sincronizar al Almacén</button>
                    </form>
                </div>
            )}

            {tab === 'bodegas' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white p-12 rounded-[60px] shadow-sm border h-fit">
                        <h3 className="font-black text-2xl mb-8 uppercase italic tracking-tighter text-slate-800 underline decoration-blue-500 decoration-4 underline-offset-8">Crear Zona Logística</h3>
                        <div className="flex gap-4">
                            <input className="flex-1 p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50" placeholder="Nombre Zona" id="nbn_bodega"/>
                            <button onClick={async ()=>{ const n=document.getElementById('nbn_bodega').value; await axios.post('/api/bodegas', {nombre: n, company_id: user.company_id}); load(); }} className="bg-blue-600 text-white px-10 rounded-3xl font-black shadow-xl hover:bg-black transition-all">AÑADIR</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-[50px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest leading-none"><tr><th className="p-10">Zona Registrada</th><th className="text-right p-10">Opción</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b hover:bg-slate-50 transition-colors"><td className="p-10 font-black uppercase italic tracking-tighter text-xl text-slate-800 leading-none">{b.nombre}</td><td className="text-right p-10 text-red-500 font-bold cursor-pointer text-[10px] tracking-[2px] leading-none uppercase">Eliminar</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'list' && (
                <div className="bg-white rounded-[60px] shadow-sm border overflow-hidden pr-2">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase border-b text-slate-400 tracking-[5px] leading-none"><tr><th className="p-12">Descripción del Item</th><th>Batch ID</th><th>Existencias</th><th>Estado Alerta</th><th className="text-center p-12">Operación</th></tr></thead>
                        <tbody>{productos.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition-colors">
                                <td className="p-12 font-black text-slate-800 text-2xl tracking-tighter uppercase italic leading-none">{p.nombre}</td>
                                <td className="font-bold text-blue-500 text-sm tracking-[2px] leading-none">{p.sku}</td>
                                <td className="font-black text-5xl leading-none scale-x-90 origin-left tracking-tighter">{p.stock}</td>
                                <td className="leading-none"><span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${p.stock <= 10 ? 'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>{p.stock <= 10 ? 'Stock Crítico' : 'Disponible'}</span></td>
                                <td className="text-center p-12"><button className="p-5 bg-slate-50 text-slate-400 rounded-[25px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={24}/></button></td>
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
        const pass = window.prompt("ACCESO RESTRINGIDO: Introduce la CLAVE MAESTRA corporativa (admin123):");
        if (!pass) return;
        try {
            const resV = await axios.post('/api/turnos/verificar-maestra', { company_id: user.company_id, password: pass });
            if (resV.data.success) {
                const base = window.prompt("Ingresa dinero base inicial en efectivo:", "0");
                await axios.post('/api/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id });
                onUpdate();
            } else { window.alert("❌ Error: Clave administrativa incorrecta. Intento denegado."); }
        } catch (e) { window.alert("Error de validación corporativa."); }
    };

    return (
        <div className="bg-white p-24 rounded-[90px] shadow-2xl text-center max-w-2xl mx-auto border-t-[30px] border-blue-600 animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 left-0 p-10 opacity-5 -rotate-12"><Wallet size={150}/></div>
            <div className={`w-32 h-32 mx-auto mb-10 rounded-[45px] flex items-center justify-center shadow-inner ${turnoActivo ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                <Lock size={64} className="group-hover:rotate-12 transition-transform"/>
            </div>
            <h3 className="text-6xl font-black mb-8 uppercase italic tracking-tighter text-slate-800 leading-none tracking-tighter">{turnoActivo ? "CAJA ACTIVA" : "CAJA BLOQUEADA"}</h3>
            {turnoActivo ? (
                <div className="space-y-12 animate-fade-in">
                    <div className="p-16 bg-slate-50 rounded-[60px] border-2 border-dashed border-slate-200 shadow-inner">
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[8px] mb-6 leading-none">Ventas Acumuladas Hoy</p>
                        <h2 className="text-9xl font-black text-green-600 tracking-tighter leading-none scale-x-90 origin-center">{fmt(turnoActivo.total_vendido)}</h2>
                    </div>
                    <button onClick={async ()=>{ if(window.confirm("¿Realizar arqueo y cerrar turno definitivamente?")){ await axios.put('/api/turnos/finalizar', { turno_id: turnoActivo.id }); onUpdate(); } }} className="w-full py-10 bg-red-500 text-white font-black rounded-[45px] shadow-xl hover:bg-red-600 transition-all uppercase text-sm tracking-[5px] active:scale-95 shadow-red-900/30">Realizar Cierre de Turno</button>
                </div>
            ) : (
                <div className="space-y-10 animate-fade-in">
                    <p className="text-slate-400 font-bold px-20 text-xl italic tracking-tight opacity-60 uppercase leading-relaxed">Este módulo requiere autorización de un nivel jerárquico superior para iniciar operaciones de flujo de efectivo corporativo.</p>
                    <button onClick={handleApertura} className="w-full py-10 bg-blue-600 text-white font-black rounded-[45px] shadow-2xl animate-bounce uppercase text-xs tracking-[5px] hover:bg-black transition-all shadow-blue-900/40">Aperturar con Clave Maestra</button>
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: ADMINISTRACIÓN (CRUD FULL)
// ==========================================
function AdminUsuariosView({ user }) {
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' });

    const load = () => axios.get(`/api/admin/usuarios?company_id=${user.company_id}`).then(res => setUsuarios(res.data));
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (form.id) await axios.put(`/api/admin/usuarios/${form.id}`, form);
        else await axios.post('/api/admin/usuarios', { ...form, company_id: user.company_id });
        setForm({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' }); load();
        window.alert("¡Cambios Guardados!");
    };

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="bg-white p-16 rounded-[80px] shadow-sm border border-slate-100 relative">
                <h3 className="font-black text-3xl mb-12 italic uppercase tracking-tighter text-slate-800 underline decoration-blue-500 decoration-8 underline-offset-8 leading-none">{form.id ? 'Modificar Acceso' : 'Nuevo Colaborador'}</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest leading-none">Nombre</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest leading-none">Email</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest leading-none">Password</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required={!form.id}/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest leading-none">Cargo</label><select className="w-full p-6 bg-slate-50 rounded-[35px] font-black text-slate-700 outline-none focus:ring-4 ring-blue-50 text-sm leading-none" value={form.cargo} onChange={e=>setForm({...form, cargo: e.target.value})}>
                        <option value="Admin">Administrador</option><option value="Vendedor">Vendedor</option><option value="Bodeguero">Bodeguero</option>
                        <option value="Prealistador">Prealistador</option><option value="Produccion">Produccion</option><option value="Logistica">Logistica</option>
                    </select></div>
                    <div className="flex items-end"><button className="w-full py-7 bg-blue-600 text-white font-black rounded-[35px] shadow-2xl hover:bg-black transition-all transform active:scale-95 uppercase text-xs tracking-widest leading-none italic">Guardar Acceso</button></div>
                </form>
            </div>
            <div className="bg-white rounded-[70px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-[4px] text-slate-400 leading-none"><tr><th className="p-12">Colaborador</th><th>Email</th><th>Rol Corporativo</th><th className="text-center p-12">Operaciones</th></tr></thead>
                    <tbody>{usuarios.map(u => (
                        <tr key={u.id} className="border-b hover:bg-slate-50 transition-all">
                            <td className="p-12 font-black text-slate-800 text-2xl tracking-tighter italic uppercase leading-none">{u.nombre}</td>
                            <td className="font-bold text-slate-400 leading-none">{u.email}</td>
                            <td className="leading-none"><span className="bg-blue-50 text-blue-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{u.cargo}</span></td>
                            <td className="p-12 text-center flex justify-center gap-6 leading-none">
                                <button onClick={()=> {setForm(u); window.scrollTo({top:0, behavior:'smooth'})}} className="p-5 bg-blue-50 text-blue-600 rounded-[25px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={24}/></button>
                                <button onClick={async ()=>{if(window.confirm("¿Borrar acceso?")){ await axios.delete(`/api/admin/usuarios/${u.id}`); load(); }}} className="p-5 bg-red-50 text-red-500 rounded-[25px] hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={24}/></button>
                            </td>
                        </tr>
                    ))}</tbody>
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
  const chartData = [{ name: 'Lun', v: 400 }, { name: 'Mar', v: 300 }, { name: 'Mie', v: 600 }, { name: 'Jue', v: 800 }, { name: 'Vie', v: 500 }, { name: 'Sab', v: 900 }, { name: 'Dom', v: 200 }];

  useEffect(() => { 
      axios.get(`/api/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); 
  }, [user]);

  return (
    <div className="space-y-12 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <CardStat title="Balance Total" value={fmt(data.cajaMayor)} color="blue" icon={<TrendingUp size={32}/>}/>
            <CardStat title="Efectivo TPV" value={fmt(0)} color="green" icon={<Wallet size={32}/>}/>
            <CardStat title="Bodega Valorada" value={fmt(data.valorInventario)} color="purple" icon={<Box size={32}/>}/>
            <CardStat title="Stock Crítico" value={data.lowStock} color="red" icon={<AlertTriangle size={32}/>}/>
        </div>
        <div className="bg-white p-20 rounded-[80px] shadow-sm border h-[600px] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-5"><TrendingUp size={300}/></div>
             <h3 className="font-black text-4xl mb-16 uppercase italic text-slate-800 tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-8">Desempeño Corporativo</h3>
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

// --- HELPERS ---
function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50 shadow-green-200", blue: "text-blue-600 bg-blue-50 shadow-blue-200", purple: "text-purple-600 bg-purple-50 shadow-purple-200", red: "text-red-600 bg-red-50 shadow-red-200" };
    return (
        <div className="bg-white p-16 rounded-[70px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-5 transition-all duration-1000 group">
            <div className={`w-24 h-24 rounded-[40px] flex items-center justify-center mb-12 shadow-2xl group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[6px] mb-4 leading-none italic">{title}</p>
            <h3 className="text-5xl font-black text-slate-800 tracking-tighter leading-none italic">{value}</h3>
        </div>
    ); 
}

function PSEPage({ onBack }) { return <div className="h-screen bg-slate-900 text-white flex items-center justify-center text-8xl font-black uppercase italic tracking-widest text-center px-20 animate-pulse leading-none">Pasarela Bancaria PSE<br/>$600.000 COP</div>; }

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post('/api/login', { email, password });
        if (res.data.success) onLogin(res.data.user);
        else window.alert('Credenciales de acceso corporativo no válidas.');
    } catch (e) { window.alert('Backend sincronizando... espera 10 seg.'); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20 blur-3xl"></div>
      <div className="bg-white p-20 rounded-[90px] shadow-2xl w-full max-w-lg border-t-[15px] border-slate-900 animate-slide-up relative z-10">
        <h1 className="text-6xl font-black text-center text-slate-800 mb-4 italic tracking-tighter uppercase leading-none">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[8px] mb-16 italic opacity-60 leading-none tracking-widest">Enterprise Resource Planning</p>
        <form onSubmit={handleAuth} className="space-y-8">
          <input className="w-full p-7 bg-slate-100 rounded-[40px] font-black outline-none focus:ring-8 ring-blue-50 transition-all text-lg tracking-tighter" placeholder="Email Corporativo" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" class="w-full p-7 bg-slate-100 rounded-[40px] font-black outline-none focus:ring-8 ring-blue-50 transition-all text-lg tracking-tighter" placeholder="Contraseña Maestra" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button className="w-full bg-slate-900 text-white font-black py-8 rounded-[40px] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase text-sm tracking-[5px] mt-8 shadow-blue-900/30">Acceder al Sistema</button>
        </form>
      </div>
    </div>
  );
}

function ContabilidadView({ user }) {
    const [datos, setDatos] = useState([]);
    useEffect(() => { axios.get(`/api/contabilidad/ventas?company_id=${user.company_id}`).then(res => setDatos(Array.isArray(res.data) ? res.data : [])); }, []);
    return <div className="bg-white p-16 rounded-[80px] shadow-sm border border-slate-100 overflow-hidden animate-fade-in"><h3 className="font-black text-3xl mb-12 italic text-blue-600 uppercase tracking-tighter flex items-center gap-5 underline decoration-blue-100 decoration-8 underline-offset-8"><Receipt size={40}/> Libro de Ventas TPV</h3><div className="overflow-x-auto"><table className="w-full text-left min-w-[900px]"><thead className="bg-slate-50 text-[11px] font-black uppercase border-b tracking-[5px] text-slate-400 leading-none"><tr><th className="p-10">Fecha / Hora</th><th>Responsable</th><th>Detalle</th><th className="text-right p-10">Monto Bruto</th></tr></thead><tbody>{datos.map(d=>(<tr key={d.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-10 text-sm font-bold text-slate-500 leading-none">{new Date(d.fecha).toLocaleString()}</td><td className="font-black text-blue-600 uppercase text-[11px] leading-none tracking-widest">{d.responsable}</td><td className="font-black text-slate-800 text-lg tracking-tight italic leading-none">Venta Directa TPV #{d.id}</td><td className="p-10 text-right font-black text-slate-900 text-4xl tracking-tighter leading-none">{fmt(d.total)}</td></tr>))}</tbody></table></div></div>;
}