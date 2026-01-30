/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, RefreshCcw, Menu, TrendingUp, Factory, Truck, History, Settings, ChevronRight, CreditCard, Edit3, Trash2, Save, Play, CheckCircle, MapPin, Box, Database, Receipt, Layers, Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

axios.defaults.baseURL = window.location.origin + '/api';
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

// ==========================================
//           COMPONENTE PRINCIPAL (APP)
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPSE, setShowPSE] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved && saved !== "undefined") {
        try { const u = JSON.parse(saved); if(u.id) setUser(u); } catch(e) { localStorage.removeItem('erp_user'); }
    }
    setLoading(false);
  }, []);

  const handleLogin = (u) => { setUser(u); localStorage.setItem('erp_user', JSON.stringify(u)); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('erp_user'); };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-xl uppercase italic">AccuCloud Pro 2026...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;
  if (!user) return <LoginScreen onLogin={handleLogin} onBuy={()=>setShowPSE(true)} />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto p-10 bg-slate-50">
         <header className="flex justify-between items-center mb-10">
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">{activeTab}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px]">Business SaaS Cloud v2.6</p>
            </div>
            <div className="bg-white px-5 py-2 rounded-2xl border shadow-sm font-black text-[10px] uppercase text-blue-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> {user.nombre}
            </div>
         </header>

         <div className="animate-fade-in pb-20">
            {activeTab === 'dashboard' && <ResumenView user={user}/>}
            {activeTab === 'ventas' && <VentasTPV user={user}/>}
            {activeTab === 'inventario' && <InventarioIndustrial user={user}/>}
            {activeTab === 'produccion' && <ProduccionIndustrial user={user}/>}
            {activeTab === 'nomina' && <NominaIndustrial user={user}/>}
            {activeTab === 'admin' && <AdminUsuariosView user={user}/>}
            {activeTab === 'caja' && <CajaMasterView user={user}/>}
            {activeTab === 'conta' && <ContabilidadView user={user}/>}
         </div>
      </main>
    </div>
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

    const load = () => axios.get(`/empleados?company_id=${user.company_id}`).then(res => setEmpleados(Array.isArray(res.data) ? res.data : []));
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        await axios.post('/api/empleados', { ...form, company_id: user.company_id });
        window.alert("Colaborador agregado."); setForm({nombre:'', email:'', salario:'', eps:'', arl:'', pension:''}); setTab('list'); load();
    };

    const liquidar = (e) => {
        const sal = parseFloat(e.salario);
        const aux = (sal <= 3501810) ? 249095 : 0; 
        const neto = (sal + aux) - (sal * 0.08);
        setPreview({ ...e, neto, aux, sal });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-2xl w-fit shadow-sm">
                <button onClick={()=>setTab('list')} className={`px-6 py-2 rounded-xl font-black text-[10px] ${tab==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>LISTADO PERSONAL</button>
                <button onClick={()=>setTab('add')} className={`px-6 py-2 rounded-xl font-black text-[10px] ${tab==='add'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>+ AGREGAR</button>
            </div>
            {tab === 'add' ? (
                <div className="bg-white p-10 rounded-[40px] shadow-sm border max-w-2xl">
                    <h3 className="text-xl font-black italic mb-8 uppercase text-slate-800 tracking-tighter underline decoration-blue-500 decoration-4">Vinculación de Personal</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
                        <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-blue-50 transition-all text-sm" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                        <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-blue-50 transition-all text-sm" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/>
                        <input className="col-span-2 p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-blue-50 transition-all text-sm" type="number" placeholder="Salario" value={form.salario} onChange={e=>setForm({...form, salario:e.target.value})} required/>
                        <div className="grid grid-cols-3 gap-3 col-span-2">
                            <input className="p-3 bg-slate-100 rounded-xl font-black text-[10px]" placeholder="EPS" value={form.eps} onChange={e=>setForm({...form, eps:e.target.value})}/>
                            <input className="p-3 bg-slate-100 rounded-xl font-black text-[10px]" placeholder="ARL" value={form.arl} onChange={e=>setForm({...form, arl:e.target.value})}/>
                            <input className="p-3 bg-slate-100 rounded-xl font-black text-[10px]" placeholder="PENSIÓN" value={form.pension} onChange={e=>setForm({...form, pension:e.target.value})}/>
                        </div>
                        <button className="col-span-2 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px]">Registrar en Nómina</button>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white rounded-[35px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b"><tr><th className="p-8">Colaborador</th><th>Salario Base</th><th className="text-center">Acción</th></tr></thead>
                            <tbody>{empleados.map(e=>(
                                <tr key={e.id} className="border-b hover:bg-slate-50 transition"><td className="p-8 font-black text-slate-800 uppercase italic leading-none">{e.nombre}</td><td className="font-black text-slate-700 leading-none">{fmt(e.salario)}</td><td className="text-center"><button onClick={()=>liquidar(e)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Calculator size={18}/></button></td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                    {preview && (
                        <div className="bg-white p-10 rounded-[40px] shadow-2xl border-l-[20px] border-blue-600 animate-slide-up">
                            <h4 className="text-3xl font-black text-slate-800 uppercase mb-8">{preview.nombre}</h4>
                            <div className="space-y-4 border-y py-10 font-bold text-slate-500 uppercase text-xs tracking-widest leading-none">
                                <div className="flex justify-between"><span>Sueldo Bruto:</span><span>{fmt(preview.sal)}</span></div>
                                <div className="flex justify-between text-green-600 italic"><span>(+) Auxilio Transporte:</span><span>{fmt(preview.aux)}</span></div>
                                <div className="flex justify-between text-red-500"><span>(-) Deducciones (8%):</span><span>-{fmt(preview.sal * 0.08)}</span></div>
                            </div>
                            <div className="bg-blue-600 p-10 rounded-[45px] text-center text-6xl font-black text-white shadow-xl mt-10">{fmt(preview.neto)}</div>
                            <button onClick={()=>window.alert("Comprobante enviado.")} className="w-full py-6 bg-slate-900 text-white font-black rounded-[30px] shadow-xl mt-12 uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"><Mail size={20}/> ENVIAR POR EMAIL</button>
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
    const [formM, setFormM] = useState({ nombre: '', unidad_medida: 'mg', cantidad: 0, costo: 0 });

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
                    <div className="bg-white p-12 rounded-[60px] shadow-sm border h-fit relative">
                        <h3 className="font-black text-2xl mb-8 uppercase italic flex items-center gap-4 text-slate-800 tracking-tighter"><Database className="text-blue-600" size={32}/> Insumos Técnicos</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/api/produccion/materia', {...formM, company_id: user.company_id}); setFormM({nombre:'', unidad_medida:'mg', cantidad:0, costo:0}); load();}} className="space-y-6">
                            <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm" placeholder="Nombre Químico" value={formM.nombre} onChange={e=>setFormM({...formM, nombre:e.target.value})} required/>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="p-5 bg-slate-50 rounded-3xl font-black text-slate-600 outline-none" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida: e.target.value})}><option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option></select>
                                <input className="p-5 bg-slate-50 rounded-3xl font-bold outline-none" type="number" placeholder="Stock" value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad: e.target.value})} required/>
                            </div>
                            <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold outline-none" placeholder="Costo unitario" type="number" value={formM.costo} onChange={e=>setFormM({...formM, costo: e.target.value})} required/>
                            <button className="w-full py-7 bg-slate-900 text-white font-black rounded-[35px] shadow-2xl hover:bg-black transition-all uppercase text-[10px] tracking-[3px]">Cargar Insumo</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[60px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-widest text-slate-400"><tr><th className="p-10">Material</th><th>Existencia</th><th>Costo unit.</th><th className="p-10 text-right">Valorizado</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b hover:bg-slate-50 transition"><td className="p-10 font-black text-slate-800 uppercase italic tracking-tighter text-xl">{m.nombre}</td><td className="font-bold text-blue-600 text-lg">{m.cantidad} {m.unidad_medida}</td><td>{fmt(m.costo)}</td><td className="p-10 text-right font-black text-slate-900 text-xl">{fmt(m.cantidad * m.costo)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {sub === 'kits' && (
                <div className="bg-slate-900 p-20 rounded-[80px] shadow-2xl relative overflow-hidden text-white animate-slide-up">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-45 scale-150"><Layers size={300}/></div>
                    <div className="max-w-2xl relative z-10">
                        <h3 className="text-5xl font-black italic uppercase tracking-tighter text-blue-400 mb-6 underline decoration-white decoration-8 underline-offset-8">Armado de Kits</h3>
                        <p className="text-slate-400 font-bold mb-12 text-lg italic">Genera combos automáticos sincronizando el stock técnico.</p>
                        <form className="space-y-6">
                            <input className="w-full p-8 bg-slate-800 rounded-[35px] font-black border-none outline-none focus:ring-4 ring-blue-500 transition-all text-xl" placeholder="Nombre del Combo Permanente"/>
                            <div className="p-10 bg-slate-800/50 rounded-[45px] border border-slate-700">
                                <p className="text-[11px] font-black text-slate-500 uppercase mb-6 tracking-widest leading-none">Vincular Ítems de Bodega</p>
                                <select className="w-full bg-transparent font-black text-2xl text-blue-400 outline-none border-b border-slate-700 pb-4">
                                    <option>-- Buscar Producto --</option>
                                    {materias.map(m=><option key={m.id}>{m.nombre}</option>)}
                                </select>
                            </div>
                            <button className="px-16 py-8 bg-blue-600 rounded-[40px] font-black shadow-xl uppercase text-sm tracking-widest transition-all">+ Generar Nuevo Kit</button>
                        </form>
                    </div>
                </div>
            )}

            {sub === 'ordenes' && (
                <div className="space-y-10">
                    <div className="bg-blue-600 p-16 rounded-[80px] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 p-10 opacity-10 rotate-45 scale-150"><Factory size={300}/></div>
                        <div className="relative z-10 text-center md:text-left">
                            <h3 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-4 tracking-tighter">OP-{numOrden}</h3>
                            <p className="font-bold text-xl italic opacity-90 leading-none">Control de Lotes Industriales</p>
                        </div>
                        <button onClick={async ()=>{ 
                            const n = window.prompt("Nombre del producto:"); 
                            if(n){ await axios.post('/api/produccion/ordenes', {numero_orden: numOrden, nombre_producto: n, cantidad: 10, company_id: user.company_id}); load(); } 
                        }} className="relative z-10 px-16 py-7 bg-white text-blue-600 font-black rounded-[40px] shadow-xl hover:scale-110 transition-all uppercase text-sm active:scale-95">+ Lanzar Nueva Orden</button>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                        {ordenes.map(o => (
                            <div key={o.id} className="bg-white p-12 rounded-[70px] shadow-md border-l-[30px] border-blue-500 flex flex-col lg:flex-row justify-between items-center group transition-all hover:shadow-2xl">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">BATCH ID: {o.numero_orden}</p>
                                    <h4 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic mb-4 leading-none">{o.nombre_producto}</h4>
                                    <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${o.estado==='Produccion'?'bg-orange-100 text-orange-600':'bg-blue-100 text-blue-600'}`}>{o.estado}</span>
                                </div>
                                <div className="flex gap-6 mt-10 lg:mt-0">
                                    {o.estado === 'Prealistamiento' && <button onClick={async ()=>{ await axios.put(`/api/produccion/ordenes/${o.id}`, {estado: 'Produccion'}); load(); }} className="flex items-center gap-4 px-12 py-6 bg-slate-900 text-white font-black rounded-[35px] shadow-2xl hover:bg-black transition-all uppercase text-xs active:scale-95"><Play size={24}/> Iniciar</button>}
                                    {o.estado === 'Produccion' && <button onClick={async ()=>{ await axios.put(`/api/produccion/ordenes/${o.id}`, {estado: 'Logistica'}); load(); }} className="flex items-center gap-4 px-12 py-6 bg-green-600 text-white font-black rounded-[35px] shadow-2xl uppercase text-xs active:scale-95"><CheckCircle size={24}/> Finalizar</button>}
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
        await axios.post('/api/productos', { ...form, company_id: user.company_id });
        setForm({nombre:'', sku:'', precio:'', stock:'', bodega_id:''}); setTab('list'); load();
        window.alert("¡Producto Sincronizado!");
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
                <button onClick={()=>setTab('list')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>EXISTENCIAS</button>
                <button onClick={()=>setTab('new')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='new'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>+ CREACIÓN MANUAL</button>
                <button onClick={()=>setTab('bodegas')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='bodegas'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>BODEGAS</button>
                <label className="bg-green-600 text-white px-10 py-3 rounded-2xl font-black text-[10px] cursor-pointer flex items-center gap-2 hover:bg-green-700 shadow-xl transition-all">
                    <Upload size={14}/> CARGAR EXCEL <input type="file" className="hidden" onChange={handleImportExcel} accept=".xlsx, .xls"/>
                </label>
            </div>

            {tab === 'new' && (
                <div className="bg-white p-16 rounded-[75px] shadow-sm border border-slate-100 max-w-4xl animate-slide-up relative">
                    <h3 className="text-3xl font-black italic mb-10 uppercase tracking-tighter text-slate-800 underline decoration-blue-500 decoration-8 underline-offset-8 leading-none">Ficha de Producto</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-2 gap-10">
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest leading-none">Nombre</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest leading-none">SKU / Lote</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest leading-none">Precio</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" type="number" value={form.precio} onChange={e=>setForm({...form, precio:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest leading-none">Stock</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} required/></div>
                        <select className="col-span-2 p-6 bg-slate-50 rounded-3xl font-black outline-none focus:ring-4 ring-blue-50 text-sm leading-none tracking-tighter" onChange={e=>setForm({...form, bodega_id: e.target.value})} required>
                            <option value="">-- Seleccionar Bodega --</option>
                            {bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                        <button className="col-span-2 py-8 bg-blue-600 text-white font-black rounded-[35px] shadow-xl uppercase tracking-widest active:scale-95 transition-all text-xs tracking-[3px]">Sincronizar al Inventario</button>
                    </form>
                </div>
            )}

            {tab === 'bodegas' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white p-12 rounded-[60px] shadow-sm border border-slate-100 h-fit">
                        <h3 className="font-black text-2xl mb-8 uppercase italic tracking-tighter text-slate-800 underline decoration-blue-500 decoration-4 underline-offset-8 leading-none">Crear Zona</h3>
                        <div className="flex gap-4">
                            <input className="flex-1 p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-lg" placeholder="Nombre Zona" id="nbn_bodega_form"/>
                            <button onClick={async ()=>{ const n=document.getElementById('nbn_bodega_form').value; await axios.post('/api/bodegas', {nombre: n, company_id: user.company_id}); load(); }} className="bg-blue-600 text-white px-10 rounded-3xl font-black shadow-xl hover:bg-black transition-all">AÑADIR</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-[50px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest leading-none"><tr><th className="p-10">Zona Registrada</th><th className="text-right p-10">Opción</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b hover:bg-slate-50 transition-colors"><td className="p-10 font-black uppercase italic tracking-tighter text-xl text-slate-800 leading-none">{b.nombre}</td><td className="text-right p-10 text-red-500 font-bold cursor-pointer text-[10px] uppercase hover:underline leading-none">Eliminar</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'list' && (
                <div className="bg-white rounded-[60px] shadow-sm border overflow-hidden pr-2">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase border-b text-slate-400 tracking-[5px] leading-none"><tr><th className="p-12">Item</th><th>Batch ID</th><th>Stock</th><th>Alerta</th><th className="text-center p-12">Control</th></tr></thead>
                        <tbody>{productos.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition-colors">
                                <td className="p-12 font-black text-slate-800 text-2xl tracking-tighter uppercase italic leading-none">{p.nombre}</td>
                                <td className="font-bold text-blue-500 text-sm tracking-[2px] leading-none uppercase">{p.sku}</td>
                                <td className="font-black text-5xl leading-none scale-x-90 origin-left tracking-tighter text-slate-700">{p.stock}</td>
                                <td className="leading-none"><span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${p.stock <= 10 ? 'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>{p.stock <= 10 ? 'Crítico' : 'Disponible'}</span></td>
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
//      MÓDULO: ADMINISTRACIÓN (CRUD FULL)
// ==========================================
function AdminUsuariosView({ user }) {
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' });

    const load = () => axios.get(`/api/admin/usuarios?company_id=${user.company_id}`).then(res => setUsuarios(Array.isArray(res.data) ? res.data : []));
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (form.id) await axios.put(`/api/admin/usuarios/${form.id}`, form);
            else await axios.post('/api/admin/usuarios', { ...form, company_id: user.company_id });
            setForm({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' }); load();
            window.alert("¡Acceso Guardado!");
        } catch (e) { window.alert("Error de procesamiento."); }
    };

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="bg-white p-16 rounded-[80px] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 transition-transform hover:rotate-12 duration-1000"><Users size={100}/></div>
                <h3 className="font-black text-3xl mb-12 italic uppercase tracking-tighter text-slate-800 underline decoration-blue-500 decoration-8 underline-offset-8 leading-none tracking-tighter">{form.id ? 'Modificar Acceso' : 'Nuevo Colaborador'}</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest leading-none">Nombre</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest leading-none">Email Corp.</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest leading-none">Password</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required={!form.id}/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest leading-none">Cargo</label><select className="w-full p-6 bg-slate-50 rounded-[35px] font-black text-slate-700 outline-none focus:ring-4 ring-blue-50 text-sm leading-none" value={form.cargo} onChange={e=>setForm({...form, cargo: e.target.value})}>
                        <option value="Admin">Administrador</option><option value="Vendedor">Vendedor / TPV</option><option value="Bodeguero">Almacén / Lotes</option>
                        <option value="Prealistador">Prealistador</option><option value="Produccion">Produccion</option><option value="Logistica">Logistica</option>
                    </select></div>
                    <div className="flex items-end"><button className="w-full py-7 bg-blue-600 text-white font-black rounded-[35px] shadow-2xl hover:bg-black transition-all transform active:scale-95 uppercase text-xs tracking-widest leading-none italic">Guardar Acceso</button></div>
                </form>
            </div>
            <div className="bg-white rounded-[75px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-[4px] text-slate-400 leading-none"><tr><th className="p-12">Colaborador Vinculado</th><th>Email Corporativo</th><th>Rol Administrativo</th><th className="text-center p-12">Control</th></tr></thead>
                    <tbody>{usuarios.map(u => (
                        <tr key={u.id} className="border-b hover:bg-slate-50 transition-all">
                            <td className="p-12 font-black text-slate-800 text-2xl tracking-tighter uppercase italic leading-none">{u.nombre}</td>
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
//      MÓDULO: CAJA CON CLAVE MAESTRA
// ==========================================
function CajaMasterView({ user, turnoActivo, onUpdate }) {
    const handleApertura = async () => {
        const pass = window.prompt("ACCESO CORPORATIVO: Introduce la CLAVE MAESTRA (admin123):");
        if (!pass) return;
        try {
            const resV = await axios.post('/api/turnos/verificar-maestra', { company_id: user.company_id, password: pass });
            if (resV.data.success) {
                const base = window.prompt("Ingresa dinero base de apertura en efectivo:", "0");
                await axios.post('/api/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id });
                onUpdate();
            } else { window.alert("❌ Clave administrativa incorrecta."); }
        } catch (e) { window.alert("Error de validación corporativa."); }
    };

    return (
        <div className="bg-white p-24 rounded-[90px] shadow-2xl text-center max-w-2xl mx-auto border-t-[30px] border-blue-600 animate-slide-up relative overflow-hidden group">
            <div className={`w-32 h-32 mx-auto mb-10 rounded-[45px] flex items-center justify-center shadow-inner ${turnoActivo ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                <Lock size={64} className="group-hover:rotate-12 transition-transform duration-500"/>
            </div>
            <h3 className="text-6xl font-black mb-8 uppercase italic tracking-tighter text-slate-800 leading-none">{turnoActivo ? "CAJA OPERATIVA" : "CAJA BLOQUEADA"}</h3>
            {turnoActivo ? (
                <div className="space-y-12 animate-fade-in">
                    <div className="p-16 bg-slate-50 rounded-[60px] border-2 border-dashed border-slate-200 shadow-inner">
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[8px] mb-4">Ventas Acumuladas Hoy</p>
                        <h2 className="text-9xl font-black text-green-600 tracking-tighter leading-none scale-x-90 origin-center italic">{fmt(turnoActivo.total_vendido)}</h2>
                    </div>
                    <button onClick={async ()=>{ if(window.confirm("¿Realizar arqueo de caja y cerrar turno?")){ await axios.put('/api/turnos/finalizar', { turno_id: turnoActivo.id }); onUpdate(); } }} className="w-full py-10 bg-red-500 text-white font-black rounded-[45px] shadow-xl hover:bg-red-600 transition-all uppercase text-sm active:scale-95 shadow-red-900/30">Realizar Cierre de Turno</button>
                </div>
            ) : (
                <div className="space-y-10 animate-fade-in">
                    <p className="text-slate-400 font-bold px-20 text-xl italic tracking-tight opacity-60 uppercase leading-relaxed tracking-tighter">Módulo administrativo para operaciones de flujo de efectivo corporativo.</p>
                    <button onClick={handleApertura} className="w-full py-10 bg-blue-600 text-white font-black rounded-[45px] shadow-2xl animate-bounce uppercase text-xs tracking-[5px] hover:bg-black transition-all shadow-blue-900/40">Aperturar con Clave Maestra</button>
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: VENTAS TPV (REAL-TIME)
// ==========================================
function VentasTPV({ user, turnoActivo }) {
    const [cart, setCart] = useState([]);
    const [prods, setProds] = useState([]);
    const [search, setSearch] = useState('');

    const load = () => axios.get(`/api/productos?company_id=${user.company_id}`).then(res => setProds(Array.isArray(res.data) ? res.data : []));
    useEffect(() => { load(); }, []);

    if(!turnoActivo) return <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-[90px] border-8 border-dashed border-slate-100 opacity-20 italic">Caja Bloqueada</div>;

    const total = cart.reduce((acc, x) => acc + (x.precio * x.cant), 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 h-[750px] animate-fade-in">
            <div className="lg:col-span-2 bg-white rounded-[70px] shadow-sm border border-slate-100 p-12 flex flex-col">
                <div className="flex items-center bg-slate-100 p-10 rounded-[50px] focus-within:ring-8 ring-blue-50 transition-all shadow-inner">
                    <ScanBarcode className="mr-8 text-slate-400" size={40}/>
                    <input className="bg-transparent border-none outline-none font-black text-3xl w-full text-slate-800 italic" placeholder="BUSCAR O ESCANEAR..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus/>
                </div>
                <div className="flex-1 mt-12 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-6">
                    {prods.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase())).map(p=>(
                        <div key={p.id} onClick={()=>{const ex=cart.find(x=>x.id===p.id); if(ex)setCart(cart.map(x=>x.id===p.id?{...x,cant:x.cant+1}:x)); else setCart([...cart,{...p,cant:1}])}} className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 hover:border-blue-500 hover:scale-105 cursor-pointer transition-all flex flex-col justify-between group shadow-sm active:scale-95">
                            <p className="font-black text-slate-800 uppercase italic group-hover:text-blue-600 leading-tight">{p.nombre}</p>
                            <p className="font-black text-blue-600 text-3xl tracking-tighter mt-4 italic">{fmt(p.precio)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-slate-900 rounded-[70px] shadow-2xl p-12 text-white flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-45 scale-150 transition-transform duration-1000 group-hover:scale-[1.8]"><DollarSign size={300}/></div>
                <div className="relative z-10 flex-1 overflow-y-auto pr-2">
                    <h3 className="text-4xl font-black italic uppercase text-blue-400 mb-12 underline decoration-white decoration-4 underline-offset-8 tracking-tighter">Ticket TPV</h3>
                    <div className="space-y-6">
                        {cart.map(x=>(
                            <div key={x.id} className="flex justify-between items-center font-bold border-b border-slate-800 pb-8 animate-slide-up">
                                <div className="flex flex-col"><span className="text-xl uppercase italic leading-none mb-3 tracking-tighter">{x.nombre.substring(0,14)}</span><span className="text-blue-400 text-[10px] font-black uppercase mt-2 tracking-widest border border-blue-400/30 px-3 py-1 rounded-full w-fit">Cant: {x.cant}</span></div>
                                <div className="flex items-center gap-6"><span className="text-3xl font-black tracking-tighter">{fmt(x.precio * x.cant)}</span><button onClick={()=>setCart(cart.filter(it=>it.id!==x.id))} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><X size={18}/></button></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative z-10 mt-16">
                    <p className="text-[12px] font-black uppercase text-slate-500 mb-2 leading-none italic tracking-widest">Monto Final</p>
                    <div className="text-8xl font-black tracking-tighter mb-16 text-white scale-x-90 origin-left italic">{fmt(total)}</div>
                    <button onClick={async ()=>{ await axios.post('/api/ventas', {productos: cart, responsable: user.nombre, turno_id: turnoActivo.id, company_id: user.company_id}); setCart([]); window.alert("Venta registrada."); load(); }} className="w-full py-12 bg-blue-600 text-white font-black rounded-[50px] shadow-2xl uppercase active:scale-95 transition-all text-xs tracking-[8px] shadow-blue-900/40 italic">Cobrar Ticket</button>
                </div>
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
  useEffect(() => { axios.get(`/api/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); }, [user]);
  return <div className="space-y-12 animate-fade-in"><div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <CardStat title="Balance Total" value={fmt(data.cajaMayor)} color="blue" icon={<TrendingUp size={32}/>}/>
          <CardStat title="Efectivo TPV" value={fmt(0)} color="green" icon={<Wallet size={32}/>}/>
          <CardStat title="Valoración Stock" value={fmt(data.valorInventario)} color="purple" icon={<Box size={32}/>}/>
          <CardStat title="Items Críticos" value={data.lowStock} color="red" icon={<AlertTriangle size={32}/>}/>
      </div><div className="bg-white p-20 rounded-[80px] shadow-sm border h-[600px] relative overflow-hidden group"><div className="absolute top-0 right-0 p-12 opacity-5"><TrendingUp size={300}/></div><h3 className="font-black text-4xl mb-16 uppercase italic text-slate-800 tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-8">Desempeño Corporativo</h3><ResponsiveContainer width="100%" height="80%"><BarChart data={chartData}><CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 16, fontWeight: '900', fill: '#94a3b8'}}/><Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '35px', border: 'none', boxShadow: '0 35px 60px -15px rgb(0 0 0 / 0.3)'}}/><Bar dataKey="v" radius={[25, 25, 0, 0]} fill="#2563eb"><Cell fill="#2563eb"/></Bar></BarChart></ResponsiveContainer></div></div>;
}

// --- OTROS COMPONENTES ---
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
        <aside className="w-80 bg-slate-900 text-white flex flex-col p-8 shadow-2xl relative z-40 border-r border-white/5">
            <h1 className="text-3xl font-black italic mb-16 text-blue-400 uppercase tracking-tighter leading-none italic">AccuCloud<span className="text-white">.</span></h1>
            <nav className="flex-1 space-y-3 overflow-y-auto">
                {menuItems.filter(m => m.roles.includes(user?.cargo)).map(m => (
                    <button key={m.id} onClick={()=>setActiveTab(m.id)} className={`w-full flex items-center px-8 py-5 rounded-[28px] transition-all duration-500 ${activeTab===m.id?'bg-blue-600 text-white shadow-2xl scale-105':'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
                        <span className="mr-5 scale-125">{m.icon}</span> <span className="font-black text-sm tracking-widest uppercase italic">{m.label}</span>
                    </button>
                ))}
            </nav>
            <button onClick={onLogout} className="text-red-500 font-black text-[12px] uppercase tracking-[5px] p-6 hover:text-white transition-colors text-center border border-red-500/20 rounded-[30px] mt-10 italic">Cerrar Sesión</button>
        </aside>
    );
}

function ContabilidadView({ user }) {
    const [datos, setDatos] = useState([]);
    useEffect(() => { axios.get(`/api/contabilidad/ventas?company_id=${user.company_id}`).then(res => setDatos(Array.isArray(res.data) ? res.data : [])); }, []);
    return <div className="bg-white p-16 rounded-[80px] shadow-sm border border-slate-100 overflow-hidden animate-fade-in"><h3 className="font-black text-3xl mb-12 italic text-blue-600 uppercase tracking-tighter flex items-center gap-5 underline decoration-blue-100 decoration-8 underline-offset-8"><Receipt size={40}/> Libro de Ventas</h3><div className="overflow-x-auto"><table className="w-full text-left min-w-[900px]"><thead className="bg-slate-50 text-[11px] font-black uppercase border-b tracking-[5px] text-slate-400"><tr><th className="p-10">Fecha</th><th>Responsable</th><th>Detalle</th><th className="text-right p-10">Total</th></tr></thead><tbody>{datos.map(d=>(<tr key={d.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-10 text-sm font-bold text-slate-500">{new Date(d.fecha).toLocaleString()}</td><td className="font-black text-blue-600 uppercase text-[11px] tracking-widest">{d.responsable}</td><td className="font-black text-slate-800 text-lg tracking-tight italic">Comprobante #{d.id}</td><td className="p-10 text-right font-black text-slate-900 text-4xl tracking-tighter">{fmt(d.total)}</td></tr>))}</tbody></table></div></div>;
}

function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50 shadow-green-200/50", blue: "text-blue-600 bg-blue-50 shadow-blue-200/50", purple: "text-purple-600 bg-purple-50 shadow-purple-200/50", red: "text-red-600 bg-red-50 shadow-red-200/50" };
    return <div className="bg-white p-16 rounded-[70px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-8 transition-all duration-1000 group border-b-[15px] border-slate-100"><div className={`w-32 h-32 rounded-[50px] flex items-center justify-center mb-20 shadow-2xl group-hover:scale-110 transition-transform duration-500 ${c[color]}`}>{icon}</div><p className="text-[16px] font-black text-slate-400 uppercase tracking-[10px] mb-6 leading-none italic opacity-60">{"// " + title}</p><h3 className="text-8xl font-black text-slate-800 tracking-tighter leading-none italic scale-x-90 origin-left tracking-tighter leading-none">{value}</h3></div>; 
}

function PSEPage({ onBack }) { return <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center text-[10vw] font-black uppercase italic tracking-widest text-center px-20 leading-none animate-pulse">PASARELA<br/>BANCARIA<br/>$600.000<button onClick={onBack} className="text-xl mt-20 text-blue-500 underline uppercase tracking-[10px]">Cerrar</button></div>; }

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post('/api/login', { email, password });
        if (res.data.success) onLogin(res.data.user);
        else window.alert('Credenciales no válidas.');
    } catch (e) { window.alert('Backend sincronizando...'); }
  };
  return <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4 relative"><div className="bg-white p-20 rounded-[90px] shadow-2xl w-full max-w-lg border-t-[15px] border-slate-900 animate-slide-up"><h1 className="text-6xl font-black text-center text-slate-800 mb-4 italic tracking-tighter uppercase leading-none">AccuCloud<span className="text-blue-600">.</span></h1><p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[8px] mb-16 italic">Enterprise Management System</p><form onSubmit={handleAuth} className="space-y-8"><input className="w-full p-7 bg-slate-100 rounded-[40px] font-black outline-none focus:ring-8 ring-blue-50 transition-all text-lg" placeholder="Email Corp." value={email} onChange={e=>setEmail(e.target.value)} required /><input type="password" class="w-full p-7 bg-slate-100 rounded-[40px] font-black outline-none focus:ring-8 ring-blue-50 transition-all text-lg" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required /><button className="w-full bg-slate-900 text-white font-black py-8 rounded-[40px] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase text-sm mt-8 shadow-blue-900/30">Acceder al Sistema</button></form></div></div>;
}