/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, UserCircle, Menu, TrendingUp, Factory, Truck, History, Settings, ChevronRight, CreditCard, Edit3, Trash2, Play, CheckCircle, MapPin, Box, Database, Receipt, Layers, Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

axios.defaults.baseURL = window.location.origin;
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

// ==========================================
//           COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPSE, setShowPSE] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved && saved !== "undefined") {
        try { const u = JSON.parse(saved); if(u.id) setUser(u); } catch (e) { localStorage.removeItem('erp_user'); }
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-lg italic">Iniciando AccuCloud Pro...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? (
        <LoginScreen onLogin={(u)=>{setUser(u); localStorage.setItem('erp_user', JSON.stringify(u));}} onBuy={()=>setShowPSE(true)} />
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={()=>{setUser(null); localStorage.removeItem('erp_user');}} />
          <main className="flex-1 overflow-auto p-10 bg-slate-50">
             <header className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">{activeTab}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px]">AccuCloud Enterprise v2.6</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl border shadow-sm font-black text-[9px] uppercase text-blue-600 flex items-center gap-2">
                    <UserCircle size={16}/> {user.nombre} ({user.cargo})
                </div>
             </header>

             <div className="animate-fade-in">
                {activeTab === 'dashboard' && <ResumenView user={user}/>}
                {activeTab === 'ventas' && <VentasTPV user={user}/>}
                {activeTab === 'inventario' && <InventarioIndustrial user={user}/>}
                {activeTab === 'produccion' && <ProduccionIndustrial user={user}/>}
                {activeTab === 'nomina' && <NominaPRO user={user}/>}
                {activeTab === 'admin' && <AdminUsuariosView user={user}/>}
                {activeTab === 'caja' && <CajaSimpleView user={user}/>}
             </div>
          </main>
        </div>
      )}
    </div>
  );
}

// ==========================================
//      MÓDULO: NÓMINA PRO (COLABORADORES)
// ==========================================
function NominaPRO({ user }) {
    const [tab, setTab] = useState('list');
    const [empleados, setEmpleados] = useState([]);
    const [form, setForm] = useState({ nombre: '', email: '', salario: '', eps: '', arl: '', pension: '' });
    const [preview, setPreview] = useState(null);

    const load = () => axios.get(`/api/empleados?company_id=${user.company_id}`).then(res => setEmpleados(res.data || []));
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        await axios.post('/api/empleados', { ...form, company_id: user.company_id });
        window.alert("¡Colaborador vinculado!"); setForm({nombre:'', email:'', salario:'', eps:'', arl:'', pension:''}); setTab('list'); load();
    };

    const liquidar = (emp) => {
        const sal = parseFloat(emp.salario);
        const neto = (sal + (sal <= 3501810 ? 249095 : 0)) - (sal * 0.08);
        setPreview({ ...emp, neto });
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-white border rounded-2xl w-fit shadow-sm">
                <button onClick={()=>setTab('list')} className={`px-6 py-2 rounded-xl font-black text-[9px] ${tab==='list'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>LISTADO</button>
                <button onClick={()=>setTab('add')} className={`px-6 py-2 rounded-xl font-black text-[9px] ${tab==='add'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>+ AGREGAR</button>
            </div>
            {tab === 'add' ? (
                <div className="bg-white p-10 rounded-[40px] shadow-sm border max-w-2xl animate-slide-up">
                    <h3 className="text-xl font-black mb-8 uppercase text-slate-800 italic">Vincular Colaborador</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
                        <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                        <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/>
                        <input className="col-span-2 p-4 bg-slate-50 rounded-2xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" type="number" placeholder="Salario" value={form.salario} onChange={e=>setForm({...form, salario:e.target.value})} required/>
                        <div className="grid grid-cols-3 gap-3 col-span-2">
                            <input className="p-3 bg-slate-100 rounded-xl font-black text-[10px]" placeholder="EPS" value={form.eps} onChange={e=>setForm({...form, eps:e.target.value})}/>
                            <input className="p-3 bg-slate-100 rounded-xl font-black text-[10px]" placeholder="ARL" value={form.arl} onChange={e=>setForm({...form, arl:e.target.value})}/>
                            <input className="p-3 bg-slate-100 rounded-xl font-black text-[10px]" placeholder="PENSIÓN" value={form.pension} onChange={e=>setForm({...form, pension:e.target.value})}/>
                        </div>
                        <button className="col-span-2 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-[9px]">Registrar</button>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[32px] shadow-sm border overflow-hidden h-fit">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-black uppercase text-slate-400 border-b"><tr><th className="p-6">Nombre</th><th>Salario</th><th className="text-center">Acción</th></tr></thead>
                            <tbody>{empleados.map(e=>(<tr key={e.id} className="border-b hover:bg-slate-50"><td className="p-6 font-black text-slate-800 uppercase italic">{e.nombre}</td><td className="font-bold text-slate-500">{fmt(e.salario)}</td><td className="text-center"><button onClick={()=>liquidar(e)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Calculator size={18}/></button></td></tr>))}</tbody>
                        </table>
                    </div>
                    {preview && (
                        <div className="bg-white p-10 rounded-[40px] shadow-2xl border-l-[15px] border-blue-600 animate-slide-up h-fit">
                            <h4 className="text-xl font-black text-slate-800 uppercase text-center mb-6">{preview.nombre}</h4>
                            <div className="bg-blue-600 p-8 rounded-[30px] text-center text-4xl font-black text-white shadow-xl mb-8 italic">{fmt(preview.neto)}</div>
                            <button onClick={()=>window.alert("Comprobante enviado")} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl uppercase text-[9px] flex items-center justify-center gap-2"><Mail size={16}/> Enviar Desprendible</button>
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
        const resM = await axios.get(`/api/produccion/materia?company_id=${user.company_id}`);
        const resO = await axios.get(`/api/produccion/ordenes?company_id=${user.company_id}`);
        const resN = await axios.get(`/api/produccion/siguiente-numero?company_id=${user.company_id}`);
        setMaterias(resM.data || []); setOrdenes(resO.data || []); setNumOrden(resN.data.numero || '0001');
    };
    useEffect(() => { load(); }, [sub]);

    return (
        <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-white border rounded-2xl w-fit shadow-sm overflow-x-auto">
                {['materia', 'kits', 'ordenes'].map(t => (
                    <button key={t} onClick={()=>setSub(t)} className={`px-5 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${sub===t?'bg-blue-600 text-white shadow-md':'text-slate-400 hover:bg-slate-50'}`}>{t}</button>
                ))}
            </div>

            {sub === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    <div className="bg-white p-8 rounded-[35px] shadow-sm border h-fit">
                        <h3 className="font-black text-xs mb-6 uppercase italic flex items-center gap-2 text-slate-800 tracking-tighter"><Database size={16} className="text-blue-600"/> Nuevo Insumo</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/api/produccion/materia', {...formM, company_id:user.company_id}); load(); setFormM({nombre:'', unidad_medida:'mg', cantidad:0, costo:0});}} className="space-y-4">
                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" placeholder="Nombre" value={formM.nombre} onChange={e=>setFormM({...formM, nombre: e.target.value})} required/>
                            <div className="grid grid-cols-2 gap-3">
                                <select className="p-3 bg-slate-50 rounded-xl font-black text-[10px] outline-none" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida: e.target.value})}><option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option></select>
                                <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs" type="number" placeholder="Stock" value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad: e.target.value})} required/>
                            </div>
                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs" type="number" placeholder="Costo" value={formM.costo} onChange={e=>setFormM({...formM, costo: e.target.value})} required/>
                            <button className="w-full py-3 bg-slate-900 text-white font-black rounded-xl shadow-lg uppercase text-[9px]">Guardar</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border overflow-hidden pr-2">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-black uppercase text-slate-400 border-b"><tr><th className="p-6">Material</th><th>Disponible</th><th className="p-6 text-right">Valorizado</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b last:border-none hover:bg-slate-50 transition"><td className="p-6 font-black text-slate-800 uppercase italic">{m.nombre}</td><td className="font-bold text-blue-600">{m.cantidad} {m.unidad_medida}</td><td className="p-6 text-right font-black">{fmt(m.cantidad * m.costo)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {sub === 'kits' && (
                <div className="bg-slate-900 p-12 rounded-[40px] shadow-2xl relative overflow-hidden text-white animate-slide-up h-[350px] flex items-center">
                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Layers size={300}/></div>
                    <div className="max-w-md relative z-10">
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-blue-400 mb-4 leading-none">Constructor de Kits</h3>
                        <p className="text-slate-400 text-xs font-bold mb-8 leading-relaxed italic">Genera combos corporativos seleccionando productos del almacén técnico.</p>
                        <button className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-[9px] tracking-widest hover:scale-105 transition-all">+ Empezar Nuevo Kit</button>
                    </div>
                </div>
            )}

            {sub === 'ordenes' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white p-6 rounded-[28px] border border-slate-100 flex justify-between items-center shadow-sm">
                        <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Próxima OP</p><h4 className="text-lg font-black text-blue-600 tracking-tighter italic leading-none">OP-{numOrden}</h4></div>
                        <button onClick={async ()=>{ const n=window.prompt("Producto:"); if(n){ await axios.post('/api/produccion/ordenes', {numero_orden: numOrden, nombre_producto: n, cantidad: 10, company_id: user.company_id}); load(); } }} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-[9px] shadow-xl hover:scale-105 uppercase tracking-widest transition-all">+ Lanzar OP</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ordenes.filter(o=>o.estado!=='Cerrado').map(o => (
                            <div key={o.id} className="bg-white p-6 rounded-[30px] shadow-sm border border-l-8 border-blue-500 flex justify-between items-center transition-all hover:shadow-md">
                                <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">ID: {o.numero_orden}</p><h4 className="text-sm font-black text-slate-800 uppercase italic mt-1">{o.nombre_producto}</h4></div>
                                <div className="flex gap-2">
                                    {o.estado === 'Prealistamiento' && <button onClick={async()=> {await axios.put(`/api/produccion/ordenes/${o.id}`, {estado:'Produccion'}); load();}} className="p-2 bg-slate-900 text-white rounded-lg"><Play size={14}/></button>}
                                    {o.estado === 'Produccion' && <button onClick={async()=> {await axios.put(`/api/produccion/ordenes/${o.id}`, {estado:'Logistica'}); load();}} className="p-2 bg-green-600 text-white rounded-lg"><CheckCircle size={14}/></button>}
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
        axios.get(`/api/productos?company_id=${user.company_id}`).then(res => setProductos(res.data || []));
        axios.get(`/api/bodegas?company_id=${user.company_id}`).then(res => setBodegas(res.data || []));
    };
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        await axios.post('/api/productos', { ...form, company_id: user.company_id });
        setForm({nombre:'', sku:'', precio:'', stock:'', bodega_id:''}); setTab('list'); load();
        window.alert("¡Producto Registrado!");
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-white border rounded-2xl w-fit shadow-sm">
                <button onClick={()=>setTab('list')} className={`px-5 py-2 rounded-xl font-black text-[9px] ${tab==='list'?'bg-blue-600 text-white':'text-slate-400'}`}>STOCK</button>
                <button onClick={()=>setTab('new')} className={`px-5 py-2 rounded-xl font-black text-[9px] ${tab==='new'?'bg-blue-600 text-white':'text-slate-400'}`}>+ CREAR</button>
                <button onClick={()=>setTab('bodegas')} className={`px-5 py-2 rounded-xl font-black text-[9px] ${tab==='bodegas'?'bg-blue-600 text-white':'text-slate-400'}`}>BODEGAS</button>
                <label className="bg-green-600 text-white px-5 py-2 rounded-xl font-black text-[9px] cursor-pointer flex items-center gap-2">
                   <Upload size={12}/> Excel <input type="file" className="hidden" onChange={async (e)=>{
                       const wb = XLSX.read(await e.target.files[0].arrayBuffer(), { type: 'binary' });
                       await axios.post('/api/productos/importar', { productos: XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]), company_id: user.company_id });
                       load(); window.alert("Importado");
                   }} accept=".xlsx, .xls"/>
                </label>
            </div>

            {tab === 'new' && (
                <div className="bg-white p-10 rounded-[35px] shadow-sm border border-slate-100 max-w-xl mx-auto animate-slide-up">
                    <h3 className="font-black text-sm mb-6 uppercase text-slate-800 italic">Nuevo Producto</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                        <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" placeholder="Lote / SKU" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required/>
                        <div className="grid grid-cols-2 gap-3">
                            <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" type="number" placeholder="Precio" value={form.precio} onChange={e=>setForm({...form, precio:e.target.value})} required/>
                            <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" type="number" placeholder="Stock" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} required/>
                        </div>
                        <select className="w-full p-3 bg-slate-50 rounded-xl font-black text-xs outline-none border-none" onChange={e=>setForm({...form, bodega_id: e.target.value})} required>
                            <option value="">-- Seleccionar Bodega --</option>
                            {bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                        <button className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg uppercase text-[9px]">Sincronizar</button>
                    </form>
                </div>
            )}

            {tab === 'list' && (
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 font-black uppercase text-slate-400 border-b"><tr><th className="p-5">Descripción</th><th>Batch</th><th>Existencia</th><th className="p-5 text-center">Estado</th></tr></thead>
                        <tbody>{productos.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition last:border-none">
                                <td className="p-5 font-black text-slate-800 uppercase italic leading-none">{p.nombre}</td>
                                <td className="font-bold text-blue-500 leading-none">{p.sku}</td>
                                <td className="font-black text-lg leading-none italic">{p.stock} uds</td>
                                <td className="text-center"><span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase ${p.stock <= 10 ? 'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>{p.stock <= 10 ? 'Bajo' : 'Ok'}</span></td>
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

    const load = () => axios.get(`/api/admin/usuarios?company_id=${user.company_id}`).then(res => setUsuarios(res.data || []));
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (form.id) await axios.put(`/api/admin/usuarios/${form.id}`, form);
        else await axios.post('/api/admin/usuarios', { ...form, company_id: user.company_id });
        setForm({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' }); load();
        window.alert("¡Hecho!");
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100 max-w-4xl mx-auto">
                <h3 className="font-black text-sm mb-6 uppercase text-slate-800 italic">Gestionar Accesos</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/>
                    <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/>
                    <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" type="password" placeholder="Pass" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required={!form.id}/>
                    <select className="p-3 bg-slate-50 rounded-xl font-black text-slate-700 text-xs outline-none" value={form.cargo} onChange={e=>setForm({...form, cargo: e.target.value})}>
                        <option value="Admin">Admin</option><option value="Vendedor">Vendedor</option><option value="Bodeguero">Bodeguero</option>
                        <option value="Prealistador">Prealistador</option><option value="Produccion">Producción</option><option value="Logistica">Logística</option>
                    </select>
                    <button className="bg-blue-600 text-white font-black rounded-xl shadow-lg uppercase text-[9px] tracking-widest transition-all hover:bg-black">Guardar</button>
                </form>
            </div>
            <div className="bg-white rounded-[32px] shadow-sm border overflow-hidden pr-2">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-black uppercase text-slate-400 border-b tracking-widest"><tr><th className="p-6">Usuario</th><th>Cargo</th><th className="text-center p-6">Control</th></tr></thead>
                    <tbody>{usuarios.map(u => (
                        <tr key={u.id} className="border-b last:border-none transition">
                            <td className="p-6 font-black text-slate-800 uppercase italic leading-none">{u.nombre} <br/><span className="text-[8px] font-bold text-slate-400 lowercase">{u.email}</span></td>
                            <td><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">{u.cargo}</span></td>
                            <td className="p-6 text-center flex justify-center gap-3">
                                <button onClick={()=> {setForm(u); window.scrollTo({top:0, behavior:'smooth'})}} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={16}/></button>
                                <button onClick={async ()=>{if(window.confirm("Borrar?")){ await axios.delete(`/api/admin/usuarios/${u.id}`); load(); }}} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: CAJA SIMPLE (SIN CLAVE)
// ==========================================
function CajaMasterView({ user }) {
    const [turno, setTurno] = useState(null);
    const recargar = () => axios.get('/api/turnos/activo/' + user.id).then(res => setTurno(res.data));
    useEffect(() => { recargar(); }, []);

    return (
        <div className="bg-white p-12 rounded-[50px] shadow-xl text-center max-w-lg mx-auto border-t-[15px] border-blue-600 animate-slide-up h-fit">
            <h3 className="text-3xl font-black mb-6 uppercase italic text-slate-800">{turno ? "CAJA ABIERTA" : "CAJA CERRADA"}</h3>
            {turno ? (
                <div className="space-y-6">
                    <div className="p-8 bg-slate-50 rounded-[35px] border-2 border-dashed border-slate-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ventas del Turno</p>
                        <h2 className="text-5xl font-black text-green-600 tracking-tighter">{fmt(turno.total_vendido)}</h2>
                    </div>
                    <button onClick={async ()=>{ await axios.put('/api/turnos/finalizar', { turno_id: turno.id }); recargar(); }} className="w-full py-5 bg-red-500 text-white font-black rounded-3xl shadow-xl uppercase text-[9px] tracking-widest active:scale-95">Realizar Cierre</button>
                </div>
            ) : (
                <button onClick={async ()=>{ 
                    const base = window.prompt("¿Base inicial?", "0");
                    await axios.post('/api/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id });
                    recargar();
                }} className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl animate-bounce uppercase text-[9px] tracking-widest">Abrir Turno</button>
            )}
        </div>
    );
}

// ==========================================
//               GRÁFICAS Y HELPERS
// ==========================================
function ResumenView({ user }) {
  const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
  const chartData = [{ name: 'L', v: 400 }, { name: 'M', v: 300 }, { name: 'M', v: 600 }, { name: 'J', v: 800 }, { name: 'V', v: 500 }, { name: 'S', v: 900 }, { name: 'D', v: 200 }];
  useEffect(() => { axios.get(`/api/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); }, [user]);
  return <div className="space-y-10"><div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <CardStat title="Balance" value={fmt(data.cajaMayor)} color="blue" icon={<TrendingUp size={24}/>}/>
          <CardStat title="Stock" value={fmt(data.valorInventario)} color="purple" icon={<Box size={24}/>}/>
          <CardStat title="Criticos" value={data.lowStock} color="red" icon={<AlertTriangle size={24}/>}/>
      </div><div className="bg-white p-12 rounded-[60px] shadow-sm border h-[400px] relative overflow-hidden group"><div className="absolute top-0 right-0 p-10 opacity-5 transition-transform duration-1000 group-hover:scale-110"><TrendingUp size={200}/></div><h3 className="font-black text-2xl mb-12 uppercase italic text-slate-800 tracking-tighter">Analítica Corporativa</h3><ResponsiveContainer width="100%" height="80%"><BarChart data={chartData}><CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 14, fontWeight: '900', fill: '#cbd5e1', fontFamily: 'Inter'}}/><Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '30px', border: 'none', boxShadow: '0 35px 60px -15px rgb(0 0 0 / 0.3)'}}/><Bar dataKey="v" radius={[15, 15, 0, 0]} fill="#2563eb"><Cell fill="#2563eb"/></Bar></BarChart></ResponsiveContainer></div></div>;
}

function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
    const menuItems = [
        { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard size={20}/>, roles: ['Admin', 'Contador'] },
        { id: 'ventas', label: 'Ventas', icon: <ShoppingCart size={20}/>, roles: ['Admin', 'Vendedor'] },
        { id: 'inventario', label: 'Inventario', icon: <Package size={20}/>, roles: ['Admin', 'Bodeguero'] },
        { id: 'produccion', label: 'Producción', icon: <Factory size={20}/>, roles: ['Admin', 'Prealistador', 'Produccion', 'Logistica'] },
        { id: 'nomina', label: 'Nómina', icon: <Users size={20}/>, roles: ['Admin', 'Nomina'] },
        { id: 'admin', label: 'Configuración', icon: <ShieldCheck size={20}/>, roles: ['Admin'] },
    ];
    return <aside className="w-64 bg-slate-900 text-white flex flex-col p-6 shadow-2xl relative z-40 border-r border-white/5"><h1 className="text-xl font-black italic mb-10 text-blue-400 italic">AccuCloud.</h1><nav className="flex-1 space-y-1 overflow-y-auto pr-2">{menuItems.filter(m => m.roles.includes(user?.cargo)).map(m => (<button key={m.id} onClick={()=>setActiveTab(m.id)} className={`w-full flex items-center px-6 py-4 rounded-2xl transition-all duration-300 ${activeTab===m.id?'bg-blue-600 text-white shadow-xl scale-105':'text-slate-500 hover:bg-white/5 hover:text-white'}`}><span className="mr-3">{m.icon}</span> <span className="font-bold text-[10px] tracking-widest uppercase italic">{m.label}</span></button>))}</nav><button onClick={onLogout} className="text-red-500 font-black text-[9px] uppercase tracking-[4px] p-5 hover:text-white transition-colors text-center border border-red-500/20 rounded-2xl mt-10 italic shadow-lg leading-none">Cerrar Sesión</button></aside>;
}

function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50 shadow-green-100", blue: "text-blue-600 bg-blue-50 shadow-blue-100", purple: "text-purple-600 bg-purple-50 shadow-purple-100", red: "text-red-600 bg-red-50 shadow-red-100" };
    return <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-4 transition-all duration-1000 group"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[6px] mb-2 leading-none italic opacity-60">{"// " + title}</p><h3 className="text-2xl font-black text-slate-800 tracking-tighter italic scale-x-95 origin-left leading-none">{value}</h3></div>; 
}

function PSEPage({ onBack }) { return <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center text-[10vw] font-black uppercase italic tracking-widest text-center px-20 leading-none animate-pulse">PASARELA<br/>BANCARIA<br/>$600.000<button onClick={onBack} className="text-xl mt-20 text-blue-500 underline uppercase tracking-[10px] italic font-black">Cerrar</button></div>; }

function LoginScreen({ onLogin, onBuy }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post('/api/login', { email, password });
        if (res.data.success) onLogin(res.data.user);
        else window.alert('Credenciales no válidas.');
    } catch (e) { window.alert('Backend sincronizando... espera 10 seg.'); }
  };
  return <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative"><div className="bg-white p-20 rounded-[90px] shadow-2xl w-full max-w-lg border-t-[15px] border-slate-900 animate-slide-up relative z-10"><h1 className="text-6xl font-black text-center text-slate-800 mb-4 italic tracking-tighter uppercase leading-none">AccuCloud<span className="text-blue-600">.</span></h1><p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[8px] mb-16 italic opacity-60">Intelligence Enterprise System</p><form onSubmit={handleAuth} className="space-y-8"><input className="w-full p-7 bg-slate-100 rounded-[40px] font-black outline-none focus:ring-8 ring-blue-50 transition-all text-lg tracking-tighter italic" placeholder="Email Corporativo" value={email} onChange={e=>setEmail(e.target.value)} required /><input type="password" class="w-full p-7 bg-slate-100 rounded-[40px] font-black outline-none focus:ring-8 ring-blue-50 transition-all text-lg tracking-tighter italic" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required /><button className="w-full bg-slate-900 text-white font-black py-8 rounded-[40px] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase text-sm mt-8 shadow-blue-900/30">Acceder al Sistema</button></form></div></div>;
}

function ContabilidadView({ user }) { return <div className="p-32 bg-white rounded-[70px] text-center font-black uppercase text-3xl italic opacity-10">Libro Diario y Balance General</div>; }
function VentasTPV({ user }) { return <div className="p-32 bg-white rounded-[70px] text-center font-black uppercase text-3xl italic opacity-10">Terminal de Punto de Venta Corporativa</div>; }