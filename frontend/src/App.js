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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-2xl uppercase italic">AccuCloud Pro 2026...</div>;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? (
        <LoginScreen onLogin={(u) => { setUser(u); localStorage.setItem('erp_user', JSON.stringify(u)); }} />
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={()=>{setUser(null); localStorage.removeItem('erp_user');}} />
          <main className="flex-1 overflow-auto p-10 bg-slate-50">
             <header className="flex justify-between items-center mb-10">
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">{activeTab}</h2>
                <div className="bg-white px-6 py-3 rounded-2xl border shadow-sm font-black text-[10px] uppercase text-blue-600 flex items-center gap-2">
                    <UserCircle size={18}/> {user.nombre} ({user.cargo})
                </div>
             </header>

             <div className="animate-fade-in">
                {activeTab === 'dashboard' && <ResumenView user={user}/>}
                {activeTab === 'ventas' && <VentasTPV user={user}/>}
                {activeTab === 'inventario' && <InventarioIndustrial user={user}/>}
                {activeTab === 'produccion' && <ProduccionIndustrial user={user}/>}
                {activeTab === 'nomina' && <NominaPRO user={user}/>}
                {activeTab === 'admin' && <AdminUsuariosView user={user}/>}
                {activeTab === 'caja' && <CajaMasterView user={user}/>}
             </div>
          </main>
        </div>
      )}
    </div>
  );
}

// ==========================================
//      MÓDULO: NÓMINA PRO (COMPLETO)
// ==========================================
function NominaPRO({ user }) {
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
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm">
                <button onClick={()=>setTab('list')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>LISTADO PERSONAL</button>
                <button onClick={()=>setTab('add')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='add'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>+ VINCULAR COLABORADOR</button>
            </div>

            {tab === 'add' && (
                <div className="bg-white p-12 rounded-[60px] shadow-sm border max-w-4xl animate-slide-up">
                    <h3 className="text-3xl font-black italic mb-10 uppercase text-slate-800 tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-8">Vinculación de Personal</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-2 gap-8">
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nombre Completo</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Email Corporativo</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Salario Base Mensual</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50" type="number" value={form.salario} onChange={e=>setForm({...form, salario:e.target.value})} required/></div>
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="space-y-1"><label className="text-[9px] font-black ml-4 uppercase text-slate-400">EPS</label><input className="p-4 bg-slate-100 rounded-2xl font-black text-xs w-full" placeholder="..." value={form.eps} onChange={e=>setForm({...form, eps:e.target.value})}/></div>
                            <div className="space-y-1"><label className="text-[9px] font-black ml-4 uppercase text-slate-400">ARL</label><input className="p-4 bg-slate-100 rounded-2xl font-black text-xs w-full" placeholder="..." value={form.arl} onChange={e=>setForm({...form, arl:e.target.value})}/></div>
                            <div className="space-y-1"><label className="text-[9px] font-black ml-4 uppercase text-slate-400">PENSIÓN</label><input className="p-4 bg-slate-100 rounded-2xl font-black text-xs w-full" placeholder="..." value={form.pension} onChange={e=>setForm({...form, pension:e.target.value})}/></div>
                        </div>
                        <button className="col-span-2 py-8 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase tracking-widest active:scale-95 transition-all mt-6">REGISTRAR EN NÓMINA EMPRESARIAL</button>
                    </form>
                </div>
            )}

            {tab === 'list' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white rounded-[50px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b tracking-widest"><tr><th className="p-10">Funcionario</th><th>Salario Base</th><th className="text-center">Acción</th></tr></thead>
                            <tbody>{empleados.map(e=>(
                                <tr key={e.id} className="border-b hover:bg-slate-50 transition">
                                    <td className="p-10 font-black text-slate-800 uppercase italic leading-tight">{e.nombre} <br/><span className="text-[10px] text-blue-500 font-bold lowercase tracking-tighter">{e.email}</span></td>
                                    <td className="font-black text-slate-600">{fmt(e.salario)}</td>
                                    <td className="text-center"><button onClick={()=>liquidar(e)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Calculator size={22}/></button></td>
                                </tr>
                            ))}</tbody>
                        </table>
                        {empleados.length === 0 && <div className="p-20 text-center opacity-30 font-black uppercase italic">No hay personal vinculado</div>}
                    </div>
                    {preview && (
                        <div className="bg-white p-12 rounded-[70px] shadow-2xl border-l-[25px] border-blue-600 animate-slide-up">
                            <div className="text-center mb-10"><h4 className="text-4xl font-black text-slate-800 uppercase tracking-tighter underline decoration-blue-200 decoration-8">{preview.nombre}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mt-2">Liquidación de Periodo</p></div>
                            <div className="space-y-4 border-y py-10 font-bold text-slate-500 uppercase text-[11px] tracking-widest leading-none">
                                <div className="flex justify-between"><span>Sueldo Bruto Devengado:</span><span>{fmt(preview.sal)}</span></div>
                                <div className="flex justify-between text-green-600 italic"><span>(+) Auxilio Transporte 2026:</span><span>{fmt(preview.aux)}</span></div>
                                <div className="flex justify-between text-red-500"><span>(-) Salud y Pensión (8%):</span><span>-{fmt(preview.sal * 0.08)}</span></div>
                            </div>
                            <div className="bg-blue-600 p-12 rounded-[55px] text-center text-7xl font-black text-white shadow-xl shadow-blue-200 mt-10 tracking-tighter leading-none scale-x-90 origin-center italic">
                                {fmt(preview.neto)}
                            </div>
                            <button onClick={()=>window.alert("Comprobante enviado al email corporativo.")} className="w-full py-8 bg-slate-900 text-white font-black rounded-[40px] shadow-xl mt-12 uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-black"><Mail size={20}/> ENVIAR COMPROBANTE AL EMAIL</button>
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

    const handleAvanzar = async (id, estado) => {
        await axios.put(`/api/produccion/ordenes/${id}`, { estado, datos_logistica: {} });
        load();
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm overflow-x-auto">
                <button onClick={()=>setSub('materia')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='materia'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>1. STOCK INSUMOS</button>
                <button onClick={()=>setSub('kits')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='kits'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>2. CREACIÓN DE KITS</button>
                <button onClick={()=>setSub('ordenes')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='ordenes'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>3. ÓRDENES OP-{numOrden}</button>
            </div>

            {sub === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="bg-white p-12 rounded-[60px] shadow-sm border h-fit relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><Database size={60}/></div>
                        <h3 className="font-black text-2xl mb-8 uppercase italic flex items-center gap-4 text-slate-800 tracking-tighter"><Database className="text-blue-600" size={32}/> Insumos Químicos</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/api/produccion/materia', {...formM, company_id: user.company_id}); setFormM({nombre:'', unidad_medida:'mg', cantidad:0, costo:0}); load();}} className="space-y-6">
                            <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm" placeholder="Nombre (Ej: Alcohol Etílico)" value={formM.nombre} onChange={e=>setFormM({...formM, nombre:e.target.value})} required/>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="p-5 bg-slate-50 rounded-3xl font-black text-slate-600 outline-none" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida: e.target.value})}>
                                    <option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option><option value="unidades">uds</option>
                                </select>
                                <input className="p-5 bg-slate-50 rounded-3xl font-bold outline-none" type="number" placeholder="Cantidad" value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad: e.target.value})} required/>
                            </div>
                            <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold outline-none" placeholder="Costo por unidad" type="number" value={formM.costo} onChange={e=>setFormM({...formM, costo: e.target.value})} required/>
                            <button className="w-full py-7 bg-slate-900 text-white font-black rounded-[35px] shadow-2xl hover:bg-black transition-all uppercase text-[10px] tracking-[3px]">Cargar a Almacén Técnico</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[60px] shadow-sm border overflow-hidden pr-2">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-[4px] text-slate-400"><tr><th className="p-10">Materia Prima</th><th>Stock Disponible</th><th>Costo unit.</th><th className="p-10 text-right">Valorizado</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-10 font-black text-slate-800 uppercase italic tracking-tighter text-xl">{m.nombre}</td><td className="font-bold text-blue-600 text-lg">{m.cantidad} {m.unidad_medida}</td><td className="font-medium text-slate-500">{fmt(m.costo)}</td><td className="p-10 text-right font-black text-slate-900 text-xl">{fmt(m.cantidad * m.costo)}</td></tr>))}</tbody>
                        </table>
                        {materias.length === 0 && <div className="p-32 text-center text-slate-200 font-black uppercase text-4xl italic opacity-50">Stock Técnico Vacío</div>}
                    </div>
                </div>
            )}

            {sub === 'kits' && (
                <div className="bg-slate-900 p-20 rounded-[80px] shadow-2xl relative overflow-hidden text-white animate-slide-up">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-45 scale-150"><Layers size={300}/></div>
                    <div className="max-w-2xl relative z-10">
                        <h3 className="text-5xl font-black italic uppercase tracking-tighter text-blue-400 mb-6 underline decoration-white decoration-8 underline-offset-8 leading-tight">Módulo de Kits Industriales</h3>
                        <p className="text-slate-400 font-bold mb-12 text-lg italic leading-relaxed">Selecciona múltiples productos para generar un combo con SKU especial sincronizado con el inventario corporativo.</p>
                        <form className="space-y-6">
                            <input className="w-full p-8 bg-slate-800 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-500 transition-all text-xl" placeholder="Nombre Comercial del Kit Permanente"/>
                            <div className="p-10 bg-slate-800/50 rounded-[45px] border border-slate-700">
                                <p className="text-[11px] font-black text-slate-500 uppercase mb-6 tracking-widest leading-none opacity-60">Insumos/Productos Vinculados al Kit</p>
                                <select className="w-full bg-transparent font-black text-2xl text-blue-400 outline-none border-b border-slate-700 pb-4">
                                    <option>-- Buscar en el Almacén --</option>
                                    {materias.map(m=><option key={m.id}>{m.nombre}</option>)}
                                </select>
                            </div>
                            <button className="px-16 py-8 bg-blue-600 rounded-[40px] font-black shadow-xl uppercase text-sm tracking-widest active:scale-95 transition-all">+ Generar Nuevo SKU Corporativo de Kit</button>
                        </form>
                    </div>
                </div>
            )}

            {sub === 'ordenes' && (
                <div className="space-y-10">
                    <div className="bg-blue-600 p-16 rounded-[80px] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 p-10 opacity-10 rotate-45 scale-150"><Factory size={300}/></div>
                        <div className="relative z-10 text-center md:text-left">
                            <p className="text-[12px] font-black uppercase tracking-[6px] mb-4 opacity-70 tracking-widest leading-none">Pipeline de Fabricación</p>
                            <h3 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-4 tracking-tighter">Siguiente: OP-{numOrden}</h3>
                            <p className="font-bold text-xl italic opacity-90 leading-none">Control de lotes en tiempo real</p>
                        </div>
                        <button onClick={async ()=>{ 
                            const n = window.prompt("¿Qué producto vamos a fabricar hoy?"); 
                            if(n){ await axios.post('/api/produccion/ordenes', {numero_orden: numOrden, nombre_producto: n, cantidad: 10, company_id: user.company_id}); load(); } 
                        }} className="relative z-10 px-16 py-7 bg-white text-blue-600 font-black rounded-[40px] shadow-2xl hover:scale-110 transition-all uppercase text-sm tracking-widest active:scale-95 shadow-blue-900/40">+ Lanzar Nueva Orden</button>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                        {ordenes.filter(o => ['Prealistamiento', 'Produccion'].includes(o.estado)).map(o => (
                            <div key={o.id} className="bg-white p-12 rounded-[70px] shadow-md border-l-[30px] border-blue-500 flex flex-col lg:flex-row justify-between items-center transition-all hover:shadow-2xl group">
                                <div className="text-center lg:text-left">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[5px] mb-3 leading-none tracking-widest">BATCH ID: {o.numero_orden}</p>
                                    <h4 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic mb-4 leading-none group-hover:text-blue-600 transition-colors">{o.nombre_producto}</h4>
                                    <div className="flex items-center gap-4 justify-center lg:justify-start"><span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${o.estado==='Produccion'?'bg-orange-100 text-orange-600':'bg-blue-100 text-blue-600'}`}>{o.estado}</span><p className="text-[10px] font-bold text-slate-400">Iniciado: {new Date(o.fecha_creacion).toLocaleDateString()}</p></div>
                                </div>
                                <div className="flex gap-6 mt-10 lg:mt-0">
                                    {o.estado === 'Prealistamiento' && (
                                        <button onClick={()=>handleAvanzar(o.id, 'Produccion')} className="flex items-center gap-4 px-12 py-6 bg-slate-900 text-white font-black rounded-[35px] shadow-2xl hover:bg-black transition-all uppercase text-xs tracking-widest active:scale-95"><Play size={24}/> Iniciar Mezcla</button>
                                    )}
                                    {o.estado === 'Produccion' && (
                                        <button onClick={()=>handleAvanzar(o.id, 'Logistica')} className="flex items-center gap-4 px-12 py-6 bg-green-600 text-white font-black rounded-[35px] shadow-2xl hover:bg-green-700 transition-all uppercase text-xs tracking-widest active:scale-95"><CheckCircle size={24}/> Sellar Batch</button>
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
            window.alert("¡Producto vinculado exitosamente!");
        } catch (e) { window.alert("Ocurrió un error al registrar el item."); }
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            await axios.post('/api/productos/importar', { productos: data, company_id: user.company_id });
            load(); window.alert("Importación de Excel finalizada con éxito.");
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm overflow-x-auto">
                <button onClick={()=>setTab('list')} className={`px-10 py-3 rounded-2xl font-black text-[10px] transition-all uppercase ${tab==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>CONSULTAR EXISTENCIAS</button>
                <button onClick={()=>setTab('new')} className={`px-10 py-3 rounded-2xl font-black text-[10px] transition-all uppercase ${tab==='new'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>+ CREACIÓN MANUAL</button>
                <button onClick={()=>setTab('bodegas')} className={`px-10 py-3 rounded-2xl font-black text-[10px] transition-all uppercase ${tab==='bodegas'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>GESTIONAR BODEGAS</button>
                <label className="bg-green-600 text-white px-10 py-3 rounded-2xl font-black text-[10px] cursor-pointer flex items-center gap-2 hover:bg-green-700 shadow-xl transition-all">
                    <Upload size={14}/> CARGAR EXCEL <input type="file" className="hidden" onChange={handleImportExcel} accept=".xlsx, .xls"/>
                </label>
            </div>

            {tab === 'new' && (
                <div className="bg-white p-16 rounded-[75px] shadow-sm border max-w-4xl animate-slide-up relative">
                    <div className="absolute top-0 right-0 p-10 opacity-5"><Package size={100}/></div>
                    <h3 className="text-3xl font-black italic mb-10 uppercase tracking-tighter text-slate-800 underline decoration-blue-500 decoration-8 underline-offset-8">Ficha Técnica de Nuevo Item</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-2 gap-10">
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest leading-none">Nombre Comercial</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest leading-none">Batch / SKU / Lote</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest leading-none">Precio de Venta Público</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" type="number" value={form.precio} onChange={e=>setForm({...form, precio:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest leading-none">Cantidad de Apertura</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} required/></div>
                        <select className="col-span-2 p-6 bg-slate-50 rounded-3xl font-black outline-none focus:ring-4 ring-blue-50 text-sm leading-none tracking-tighter" onChange={e=>setForm({...form, bodega_id: e.target.value})} required>
                            <option value="">-- Seleccionar Bodega de Destino --</option>
                            {bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                        <button className="col-span-2 py-8 bg-blue-600 text-white font-black rounded-[35px] shadow-xl uppercase tracking-widest active:scale-95 transition-all text-xs tracking-[3px]">Sincronizar al Almacén Corporativo</button>
                    </form>
                </div>
            )}

            {tab === 'bodegas' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white p-12 rounded-[60px] shadow-sm border border-slate-100 h-fit">
                        <h3 className="font-black text-2xl mb-8 uppercase italic tracking-tighter text-slate-800 underline decoration-blue-500 decoration-4 underline-offset-8">Crear Zona Logística</h3>
                        <div className="flex gap-4">
                            <input className="flex-1 p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-lg" placeholder="Nombre (Bodega Alimentos...)" id="nbn_bodega_form"/>
                            <button onClick={async ()=>{ const n=document.getElementById('nbn_bodega_form').value; await axios.post('/api/bodegas', {nombre: n, company_id: user.company_id}); load(); }} className="bg-blue-600 text-white px-10 rounded-3xl font-black shadow-xl hover:bg-black transition-all">AÑADIR</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[3px] leading-none"><tr><th className="p-10">Zona Registrada</th><th className="text-right p-10">Control</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b hover:bg-slate-50 transition-colors"><td className="p-10 font-black uppercase italic tracking-tighter text-xl text-slate-800 leading-none">{b.nombre}</td><td className="text-right p-10 text-red-500 font-bold cursor-pointer text-[10px] tracking-[2px] leading-none uppercase hover:underline decoration-red-500 underline-offset-4">Eliminar</td></tr>))}</tbody>
                        </table>
                        {bodegas.length === 0 && <div className="p-20 text-center opacity-30 font-black uppercase italic">Sin zonas registradas</div>}
                    </div>
                </div>
            )}

            {tab === 'list' && (
                <div className="bg-white rounded-[65px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase border-b text-slate-400 tracking-[5px] leading-none"><tr><th className="p-12">Descripción del Item</th><th>Batch / SKU</th><th>Existencias</th><th>Estado Alerta</th><th className="text-center p-12">Control</th></tr></thead>
                        <tbody>{productos.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition-colors">
                                <td className="p-12 font-black text-slate-800 text-2xl tracking-tighter uppercase italic leading-none">{p.nombre}</td>
                                <td className="font-bold text-blue-500 text-sm tracking-[2px] leading-none uppercase">{p.sku}</td>
                                <td className="font-black text-5xl leading-none scale-x-90 origin-left tracking-tighter text-slate-700">{p.stock}</td>
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
            window.alert("¡Acceso de Colaborador Guardado!");
        } catch (e) { window.alert("Error al procesar el usuario."); }
    };

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="bg-white p-16 rounded-[80px] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5"><Users size={100}/></div>
                <h3 className="font-black text-3xl mb-12 italic uppercase tracking-tighter text-slate-800 underline decoration-blue-500 decoration-8 underline-offset-8 leading-none tracking-tighter">{form.id ? 'Modificar Acceso' : 'Vincular Colaborador'}</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest leading-none">Nombre Completo</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest leading-none">Email Corp.</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest leading-none">Pass Corp.</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all text-sm leading-none" type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required={!form.id}/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest leading-none">Cargo en Sistema</label><select className="w-full p-6 bg-slate-50 rounded-[35px] font-black text-slate-700 outline-none focus:ring-4 ring-blue-50 text-sm leading-none" value={form.cargo} onChange={e=>setForm({...form, cargo: e.target.value})}>
                        <option value="Admin">Administrador</option><option value="Vendedor">Vendedor / TPV</option><option value="Bodeguero">Almacén / Lotes</option>
                        <option value="Prealistador">Prealistador (Producción)</option><option value="Produccion">Técnico Fabricación</option><option value="Logistica">Logística y Despacho</option>
                    </select></div>
                    <div className="flex items-end"><button className="w-full py-7 bg-blue-600 text-white font-black rounded-[35px] shadow-2xl hover:bg-black transition-all transform active:scale-95 uppercase text-xs tracking-widest leading-none italic">Guardar Acceso</button></div>
                </form>
            </div>
            <div className="bg-white rounded-[75px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-[4px] text-slate-400 leading-none"><tr><th className="p-12">Colaborador Vinculado</th><th>Email Corporativo</th><th>Rol Administrativo</th><th className="text-center p-12">Control de Usuario</th></tr></thead>
                    <tbody>{usuarios.map(u => (
                        <tr key={u.id} className="border-b hover:bg-slate-50 transition-all">
                            <td className="p-12 font-black text-slate-800 text-2xl tracking-tighter uppercase italic leading-none">{u.nombre}</td>
                            <td className="font-bold text-slate-400 leading-none">{u.email}</td>
                            <td className="leading-none"><span className="bg-blue-50 text-blue-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{u.cargo}</span></td>
                            <td className="p-12 text-center flex justify-center gap-6 leading-none">
                                <button onClick={()=> {setForm(u); window.scrollTo({top:0, behavior:'smooth'})}} className="p-5 bg-blue-50 text-blue-600 rounded-[25px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={24}/></button>
                                <button onClick={async ()=>{if(window.confirm("¿Dar de baja permanente a este acceso?")){ await axios.delete(`/api/admin/usuarios/${u.id}`); load(); }}} className="p-5 bg-red-50 text-red-500 rounded-[25px] hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={24}/></button>
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
        const pass = window.prompt("ACCESO CORPORATIVO: Introduce la CLAVE MAESTRA (admin123) para autorizar:");
        if (!pass) return;
        try {
            const resV = await axios.post('/api/turnos/verificar-maestra', { company_id: user.company_id, password: pass });
            if (resV.data.success) {
                const base = window.prompt("Ingresa dinero base de apertura en efectivo:", "0");
                await axios.post('/api/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id });
                onUpdate();
            } else { window.alert("❌ Acceso Denegado: Clave administrativa incorrecta."); }
        } catch (e) { window.alert("Error de validación corporativa."); }
    };

    return (
        <div className="bg-white p-24 rounded-[90px] shadow-2xl text-center max-w-2xl mx-auto border-t-[30px] border-blue-600 animate-slide-up relative overflow-hidden group">
            <div className="absolute top-0 left-0 p-10 opacity-5 -rotate-12 transition-transform group-hover:rotate-12 duration-1000"><Wallet size={150}/></div>
            <div className={`w-36 h-36 mx-auto mb-10 rounded-[50px] flex items-center justify-center shadow-inner ${turnoActivo ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                <Lock size={64} className="group-hover:rotate-12 transition-transform duration-500"/>
            </div>
            <h3 className="text-6xl font-black mb-10 uppercase italic tracking-tighter text-slate-800 leading-none">{turnoActivo ? "CAJA OPERATIVA" : "SISTEMA CERRADO"}</h3>
            {turnoActivo ? (
                <div className="space-y-12 animate-fade-in">
                    <div className="p-16 bg-slate-50 rounded-[65px] border-2 border-dashed border-slate-200 shadow-inner">
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[10px] mb-6 leading-none">Monto Neto en Caja</p>
                        <h2 className="text-9xl font-black text-green-600 tracking-tighter leading-none scale-x-90 origin-center italic">{fmt(turnoActivo.total_vendido)}</h2>
                    </div>
                    <button onClick={async ()=>{ if(window.confirm("¿Deseas realizar arqueo de caja y cierre de operaciones?")){ await axios.put('/api/turnos/finalizar', { turno_id: turnoActivo.id }); onUpdate(); } }} className="w-full py-10 bg-red-500 text-white font-black rounded-[45px] shadow-xl hover:bg-red-600 transition-all uppercase text-sm tracking-widest active:scale-95 shadow-red-900/30 tracking-[4px]">Realizar Cierre de Turno</button>
                </div>
            ) : (
                <div className="space-y-10 animate-fade-in">
                    <p className="text-slate-400 font-bold px-20 text-xl italic tracking-tight opacity-60 uppercase leading-relaxed tracking-tighter">Módulo blindado: Se requiere llave maestra administrativa para habilitar el flujo de efectivo corporativo.</p>
                    <button onClick={handleApertura} className="w-full py-10 bg-blue-600 text-white font-black rounded-[45px] shadow-2xl animate-bounce uppercase text-xs tracking-[5px] hover:bg-black transition-all shadow-blue-900/40 tracking-[3px]">Habilitar Caja con Clave Maestra</button>
                </div>
            )}
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

  useEffect(() => { 
      axios.get(`/api/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); 
  }, [user]);

  return (
    <div className="space-y-12 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <CardStat title="Balance General" value={fmt(data.cajaMayor)} color="blue" icon={<TrendingUp size={32}/>}/>
            <CardStat title="Efectivo TPV" value={fmt(0)} color="green" icon={<Wallet size={32}/>}/>
            <CardStat title="Valoración Stock" value={fmt(data.valorInventario)} color="purple" icon={<Box size={32}/>}/>
            <CardStat title="Stock Crítico" value={data.lowStock} color="red" icon={<AlertTriangle size={32}/>}/>
        </div>
        <div className="bg-white p-20 rounded-[85px] shadow-sm border border-slate-100 h-[650px] relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-5 transition-transform duration-1000 group-hover:scale-110"><TrendingUp size={350}/></div>
             <h3 className="font-black text-4xl mb-16 uppercase italic text-slate-800 tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-[15px]">Desempeño Analítico Semanal</h3>
             <ResponsiveContainer width="100%" height="80%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 18, fontWeight: '900', fill: '#cbd5e1', fontFamily: 'Inter'}} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '40px', border: 'none', boxShadow: '0 40px 80px -20px rgb(0 0 0 / 0.4)'}} />
                    <Bar dataKey="v" radius={[30, 30, 0, 0]} fill="#2563eb" barSize={70}>
                         {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 5 ? '#2563eb' : '#f1f5f9'} stroke={index===5?'#2563eb':'#e2e8f0'} strokeWidth={3}/>))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
        </div>
    </div>
  );
}

// ==========================================
//      MÓDULO: VENTAS TPV (TPV DE LUJO)
// ==========================================
function VentasTPV({ user, turnoActivo }) {
    const [cart, setCart] = useState([]);
    const [prods, setProds] = useState([]);
    const [search, setSearch] = useState('');

    const load = () => axios.get(`/api/productos?company_id=${user.company_id}`).then(res => setProds(Array.isArray(res.data) ? res.data : []));
    useEffect(() => { load(); }, []);

    if(!turnoActivo) return (
        <div className="h-[650px] flex flex-col items-center justify-center bg-white rounded-[95px] border-8 border-dashed border-slate-50 opacity-20 animate-pulse">
            <ShoppingCart size={180} className="mb-8"/>
            <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-4">Caja Inactiva</h2>
            <p className="text-2xl font-bold italic tracking-tighter uppercase tracking-[5px]">Abre un turno administrativo para habilitar facturación</p>
        </div>
    );

    const total = cart.reduce((acc, x) => acc + (x.precio * x.cant), 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 h-[800px] animate-fade-in">
            <div className="lg:col-span-2 bg-white rounded-[80px] shadow-sm border border-slate-100 p-16 flex flex-col shadow-inner">
                <div className="flex items-center bg-slate-100 p-12 rounded-[60px] focus-within:ring-[12px] ring-blue-50 transition-all shadow-inner border border-slate-200">
                    <ScanBarcode className="mr-8 text-slate-400" size={50}/>
                    <input className="bg-transparent border-none outline-none font-black text-4xl w-full text-slate-800 placeholder:text-slate-300 italic tracking-tighter" placeholder="ESCANEA O BUSCA PRODUCTO..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus/>
                </div>
                <div className="flex-1 mt-16 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-8 pr-4">
                    {prods.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase())).map(p=>(
                        <div key={p.id} onClick={()=>{const ex=cart.find(x=>x.id===p.id); if(ex)setCart(cart.map(x=>x.id===p.id?{...x,cant:x.cant+1}:x)); else setCart([...cart,{...p,cant:1}])}} className="p-10 bg-slate-50 rounded-[50px] border border-slate-100 hover:border-blue-500 hover:scale-105 cursor-pointer transition-all flex flex-col justify-between group shadow-sm active:scale-95">
                            <p className="font-black text-slate-800 uppercase text-lg group-hover:text-blue-600 transition-colors leading-tight italic">{p.nombre}</p>
                            <p className="font-black text-blue-600 text-4xl tracking-tighter mt-6 italic">{fmt(p.precio)}</p>
                        </div>
                    ))}
                    {prods.length === 0 && <div className="col-span-full text-center p-20 opacity-10 font-black text-4xl uppercase tracking-tighter italic">Cargando inventario para venta...</div>}
                </div>
            </div>
            <div className="bg-slate-900 rounded-[80px] shadow-2xl p-16 text-white flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-45 scale-150 group-hover:scale-[2] transition-transform duration-[2000ms]"><DollarSign size={250}/></div>
                <div className="relative z-10 flex-1 overflow-y-auto pr-4">
                    <h3 className="text-5xl font-black italic uppercase text-blue-400 mb-16 underline decoration-white decoration-8 underline-offset-[12px] tracking-tighter">Ticket TPV</h3>
                    <div className="space-y-8">
                        {cart.map(x=>(
                            <div key={x.id} className="flex justify-between items-center font-bold border-b border-slate-800 pb-8 animate-slide-up">
                                <div className="flex flex-col"><span className="text-2xl uppercase italic leading-none mb-3 tracking-tighter">{x.nombre.substring(0,16)}</span><span className="text-blue-400 text-xs font-black uppercase tracking-[3px] border border-blue-400/30 rounded-full px-4 py-1 w-fit">Cant: {x.cant}</span></div>
                                <div className="flex items-center gap-6"><span className="text-3xl font-black tracking-tighter">{fmt(x.precio * x.cant)}</span><button onClick={()=>setCart(cart.filter(it=>it.id!==x.id))} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><X size={24}/></button></div>
                            </div>
                        ))}
                        {cart.length === 0 && <div className="p-32 text-center opacity-10 font-black italic text-4xl uppercase tracking-widest leading-none">Listo para facturar</div>}
                    </div>
                </div>
                <div className="relative z-10 mt-16">
                    <p className="text-[12px] font-black uppercase tracking-[10px] text-slate-500 mb-4 leading-none">Monto Final a Cobrar</p>
                    <div className="text-9xl font-black tracking-tighter mb-16 text-white leading-none scale-x-90 origin-left italic">{fmt(total)}</div>
                    <button onClick={async ()=>{ await axios.post('/api/ventas', {productos: cart, responsable: user.nombre, turno_id: turnoActivo.id, company_id: user.company_id}); setCart([]); window.alert("¡Venta finalizada y stock actualizado!"); load(); }} className="w-full py-12 bg-blue-600 text-white font-black rounded-[50px] shadow-2xl uppercase active:scale-95 transition-all text-sm tracking-[8px] hover:bg-white hover:text-blue-600 shadow-blue-900/50 italic">CERRAR FACTURA</button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: LOGIN (DISEÑO CORPORATIVO)
// ==========================================
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post('/api/login', { email, password });
        if (res.data.success) onLogin(res.data.user);
        else window.alert('Acceso Denegado: Credenciales no válidas.');
    } catch (e) { window.alert('Sincronizando con el servidor de la nube... espera unos segundos.'); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[1000px] h-[1000px] bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[150px]"></div>
      <div className="bg-white p-24 rounded-[100px] shadow-2xl w-full max-w-xl border-t-[20px] border-slate-900 animate-slide-up relative z-10">
        <h1 className="text-7xl font-black text-center text-slate-800 mb-4 italic tracking-tighter uppercase leading-none">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[10px] mb-20 italic opacity-60 leading-none">Intelligence Enterprise System</p>
        <form onSubmit={handleAuth} className="space-y-10">
          <input className="w-full p-8 bg-slate-100 rounded-[50px] font-black outline-none focus:ring-[15px] ring-blue-50 transition-all text-2xl tracking-tighter" placeholder="Email Corporativo" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" class="w-full p-8 bg-slate-100 rounded-[50px] font-black outline-none focus:ring-[15px] ring-blue-50 transition-all text-2xl tracking-tighter" placeholder="Password Maestra" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button className="w-full bg-slate-900 text-white font-black py-10 rounded-[50px] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase text-sm tracking-[10px] mt-12 shadow-blue-900/30 italic">Entrar al Ecosistema</button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
//               HELPERS FINALES
// ==========================================
function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50 shadow-green-200/50", blue: "text-blue-600 bg-blue-50 shadow-blue-200/50", purple: "text-purple-600 bg-purple-50 shadow-purple-200/50", red: "text-red-600 bg-red-50 shadow-red-200/50" };
    return (
        <div className="bg-white p-16 rounded-[80px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-6 transition-all duration-1000 group">
            <div className={`w-28 h-28 rounded-[45px] flex items-center justify-center mb-16 shadow-2xl group-hover:scale-110 transition-transform duration-500 ${c[color]}`}>{icon}</div>
            <p className="text-[14px] font-black text-slate-400 uppercase tracking-[8px] mb-4 leading-none italic opacity-60">{title}</p>
            <h3 className="text-7xl font-black text-slate-800 tracking-tighter leading-none italic scale-x-90 origin-left">{value}</h3>
        </div>
    ); 
}
function PSEPage({ onBack }) { return <div className="h-screen bg-slate-900 text-white flex items-center justify-center text-[10vw] font-black uppercase italic tracking-widest text-center px-20 leading-none animate-pulse">PASARELA<br/>BANCARIA<br/>$600.000</div>; }