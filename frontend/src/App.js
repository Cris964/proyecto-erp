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

axios.defaults.baseURL = window.location.origin;
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPSE, setShowPSE] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved) {
        try { const u = JSON.parse(saved); if(u.id) setUser(u); } catch (e) { localStorage.removeItem('erp_user'); }
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-lg uppercase italic">ACCUCLOUD PRO 2026...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? (
        <LoginScreen onLogin={(u)=>{setUser(u); localStorage.setItem('erp_user', JSON.stringify(u));}} onBuy={()=>setShowPSE(true)} />
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={()=>{setUser(null); localStorage.removeItem('erp_user');}} />
          <main className="flex-1 overflow-auto p-8 relative">
             <header className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter capitalize italic leading-none">{activeTab}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise Intelligence v2.6</p>
                </div>
                <div className="bg-white px-5 py-2 rounded-2xl border shadow-sm font-black text-[10px] uppercase text-blue-600 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> {user.nombre} ({user.cargo})
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
//      MÓDULO: VENTAS TPV (DISEÑO SaaS)
// ==========================================
function VentasTPV({ user }) {
    const [cart, setCart] = useState([]);
    const [prods, setProds] = useState([]);
    const [search, setSearch] = useState('');
    const [turno, setTurno] = useState(null);
    const [pago, setPago] = useState({ recibido: '' });

    const load = async () => {
        const resP = await axios.get(`/api/productos?company_id=${user.company_id}`);
        const resT = await axios.get(`/api/turnos/activo/${user.id}`);
        setProds(resP.data || []);
        setTurno(resT.data);
    };
    useEffect(() => { load(); }, []);

    if(!turno) return <div className="p-20 bg-white rounded-3xl text-center shadow-sm border border-dashed italic">Abre turno en Caja para vender.</div>;

    const total = cart.reduce((acc, x) => acc + (x.precio * x.cant), 0);
    const cambio = pago.recibido ? parseFloat(pago.recibido) - total : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
            <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 flex flex-col">
                <div className="flex items-center bg-slate-100 p-4 rounded-2xl mb-6">
                    <Search className="mr-3 text-slate-400" size={20}/>
                    <input className="bg-transparent border-none outline-none font-bold w-full" placeholder="Buscar producto..." value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4">
                    {prods.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase())).map(p=>(
                        <div key={p.id} onClick={()=>{const ex=cart.find(x=>x.id===p.id); if(ex)setCart(cart.map(x=>x.id===p.id?{...x,cant:x.cant+1}:x)); else setCart([...cart,{...p,cant:1}])}} className="p-4 bg-white rounded-2xl border hover:border-blue-500 transition-all flex flex-col justify-between h-[120px]">
                            <p className="font-black text-slate-800 uppercase text-[10px] leading-tight italic">{p.nombre}</p>
                            <p className="font-black text-blue-600 text-lg tracking-tighter">{fmt(p.precio)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-[#0f172a] rounded-[32px] shadow-xl p-8 text-white flex flex-col justify-between">
                <div className="flex-1 overflow-y-auto pr-2">
                    <h3 className="text-xl font-black italic uppercase text-blue-400 mb-6">Ticket</h3>
                    <div className="space-y-4">
                        {cart.map((x,i)=>(
                            <div key={i} className="flex justify-between border-b border-white/5 pb-3">
                                <div className="flex flex-col"><span className="text-[11px] uppercase italic leading-none">{x.nombre.substring(0,18)}</span><span className="text-blue-400 text-[8px] font-black uppercase mt-1">Cant: {x.cant}</span></div>
                                <span className="text-sm font-bold">{fmt(x.precio * x.cant)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-6 border-t border-white/10 pt-6">
                    <div className="flex justify-between font-black text-xl mb-4"><span>TOTAL:</span><span className="text-green-400">{fmt(total)}</span></div>
                    <div className="space-y-2 mb-6"><label className="text-[9px] font-black uppercase text-slate-500">¿Con cuánto paga?</label><input className="w-full p-3 bg-white/5 rounded-xl font-black text-xl text-green-400 outline-none border border-white/10 text-center" type="number" value={pago.recibido} onChange={e=>setPago({recibido:e.target.value})}/></div>
                    {pago.recibido > 0 && <div className="flex justify-between font-black text-lg text-orange-400 mb-6"><span>CAMBIO:</span><span>{fmt(cambio)}</span></div>}
                    <button onClick={async ()=>{ await axios.post('/api/ventas', {productos: cart, responsable: user.nombre, turno_id: turno.id, company_id: user.company_id}); setCart([]); setPago({recibido:''}); load(); }} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg uppercase text-[10px] tracking-widest active:scale-95 transition-all">COBRAR</button>
                </div>
            </div>
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

    const load = () => axios.get(`/api/empleados?company_id=${user.company_id}`).then(res => setEmpleados(Array.isArray(res.data) ? res.data : []));
    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-2 p-1 bg-white border rounded-2xl w-fit shadow-sm">
                <button onClick={()=>setTab('list')} className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${tab==='list'?'bg-blue-600 text-white shadow-md':'text-slate-400 hover:bg-slate-50'}`}>LISTADO</button>
                <button onClick={()=>setTab('add')} className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${tab==='add'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>+ VINCULAR</button>
            </div>
            {tab === 'add' ? (
                <div className="bg-white p-10 rounded-[40px] shadow-sm border max-w-2xl mx-auto">
                    <h3 className="text-xl font-black mb-6 uppercase italic text-slate-800 tracking-tighter">Nueva Vinculación</h3>
                    <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/api/empleados', {...form, company_id: user.company_id}); setForm({nombre:'', email:'', salario:'', eps:'', arl:'', pension:''}); setTab('list'); load();}} className="grid grid-cols-2 gap-4">
                        <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                        <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/>
                        <input className="col-span-2 p-4 bg-slate-50 rounded-2xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-50" type="number" placeholder="Salario" value={form.salario} onChange={e=>setForm({...form, salario:e.target.value})} required/>
                        <div className="grid grid-cols-3 gap-3 col-span-2">
                            <input className="p-3 bg-slate-100 rounded-xl font-black text-[10px]" placeholder="EPS" onChange={e=>setForm({...form, eps:e.target.value})}/>
                            <input className="p-3 bg-slate-100 rounded-xl font-black text-[10px]" placeholder="ARL" onChange={e=>setForm({...form, arl:e.target.value})}/>
                            <input className="p-3 bg-slate-100 rounded-xl font-black text-[10px]" placeholder="PENSIÓN" onChange={e=>setForm({...form, pension:e.target.value})}/>
                        </div>
                        <button className="col-span-2 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-[10px]">Registrar en Nómina</button>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white rounded-[35px] shadow-sm border overflow-hidden h-fit">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b"><tr><th className="p-6">Nombre</th><th>Salario Base</th><th className="text-center">Acción</th></tr></thead>
                            <tbody>{empleados.map(e=>(
                                <tr key={e.id} className="border-b hover:bg-slate-50 transition"><td className="p-6 font-black text-slate-800 uppercase italic">{e.nombre}</td><td className="font-bold text-slate-500">{fmt(e.salario)}</td><td className="text-center"><button onClick={()=>{const sal=parseFloat(e.salario); setPreview({...e, neto:(sal + (sal<=3501810?249095:0)) - (sal*0.08)});}} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Calculator size={16}/></button></td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                    {preview && (
                        <div className="bg-white p-12 rounded-[50px] shadow-2xl border-l-[25px] border-blue-600 animate-slide-up h-fit text-center">
                            <h4 className="text-4xl font-black text-slate-800 uppercase mb-8">{preview.nombre}</h4>
                            <div className="bg-blue-600 p-12 rounded-[45px] text-6xl font-black text-white shadow-xl shadow-blue-200 mb-10 italic">{fmt(preview.neto)}</div>
                            <button onClick={()=>window.alert("Enviado.")} className="w-full py-8 bg-slate-900 text-white font-black rounded-[35px] shadow-xl uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"><Mail size={20}/> ENVIAR COMPROBANTE</button>
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
                <button onClick={()=>setSub('materia')} className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${sub==='materia'?'bg-blue-600 text-white shadow-md':'text-slate-400 hover:bg-slate-50'}`}>Insumos</button>
                <button onClick={()=>setSub('kits')} className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${sub==='kits'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>Fórmulas</button>
                <button onClick={()=>setSub('ordenes')} className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${sub==='ordenes'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>Órdenes OP-{numOrden}</button>
            </div>

            {sub === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    <div className="bg-white p-8 rounded-[35px] shadow-sm border h-fit">
                        <h3 className="font-black text-xs mb-6 uppercase italic flex items-center gap-2 text-slate-800"><Database size={16} className="text-blue-600"/> Nuevo Insumo</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/api/produccion/materia', {...formM, company_id:user.company_id}); load(); setFormM({nombre:'', unidad_medida:'mg', cantidad:0, costo:0});}} className="space-y-4">
                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" placeholder="Nombre" value={formM.nombre} onChange={e=>setFormM({...formM, nombre: e.target.value})} required/>
                            <div className="grid grid-cols-2 gap-3">
                                <select className="p-3 bg-slate-50 rounded-xl font-black text-[10px] outline-none" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida: e.target.value})}><option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option></select>
                                <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs" type="number" placeholder="Stock" value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad: e.target.value})} required/>
                            </div>
                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs" type="number" placeholder="Costo Unit." value={formM.costo} onChange={e=>setFormM({...formM, costo: e.target.value})} required/>
                            <button className="w-full py-4 bg-slate-900 text-white font-black rounded-xl shadow-lg uppercase text-[9px]">Guardar</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border overflow-hidden pr-2 h-fit">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-black uppercase text-slate-400 border-b"><tr><th className="p-6 tracking-widest">Material</th><th>Disponible</th><th className="p-6 text-right">Valorizado</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b last:border-none hover:bg-slate-50 transition"><td className="p-6 font-black text-slate-800 uppercase italic">{m.nombre}</td><td className="font-bold text-blue-600 leading-none">{m.cantidad} {m.unidad_medida}</td><td className="p-6 text-right font-black leading-none italic">{fmt(m.cantidad * m.costo)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
            {sub === 'kits' && <div className="p-20 bg-slate-900 rounded-[40px] text-center text-blue-400 font-black uppercase text-xl animate-pulse italic underline decoration-blue-500">Módulo de Kits Dinámicos v2.6</div>}
            {sub === 'ordenes' && <div className="p-20 bg-white rounded-[40px] text-center text-slate-300 font-black uppercase text-xl border-4 border-dashed italic">Siguiente Consecutivo: OP-{numOrden}</div>}
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
        axios.get(`/api/productos?company_id=${user.company_id}`).then(res => setProductos(Array.isArray(res.data) ? res.data : []));
        axios.get(`/api/bodegas?company_id=${user.company_id}`).then(res => setBodegas(Array.isArray(res.data) ? res.data : []));
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
            <div className="flex gap-2 p-1 bg-white border rounded-2xl w-fit shadow-sm overflow-x-auto">
                <button onClick={()=>setTab('list')} className={`px-5 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${tab==='list'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>STOCK</button>
                <button onClick={()=>setTab('new')} className={`px-5 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${tab==='new'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>+ CREAR</button>
                <button onClick={()=>setTab('bodegas')} className={`px-5 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${tab==='bodegas'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>BODEGAS</button>
                <label className="bg-green-600 text-white px-5 py-2 rounded-xl font-black text-[9px] cursor-pointer flex items-center gap-2 shadow-md uppercase">
                   <Upload size={12}/> Excel <input type="file" className="hidden" onChange={async (e)=>{
                       const wb = XLSX.read(await e.target.files[0].arrayBuffer(), { type: 'binary' });
                       await axios.post('/api/productos/importar', { productos: XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]), company_id: user.company_id });
                       load(); window.alert("Importado");
                   }} accept=".xlsx, .xls"/>
                </label>
            </div>

            {tab === 'new' && (
                <div className="bg-white p-10 rounded-[35px] shadow-sm border border-slate-100 max-w-xl mx-auto animate-slide-up">
                    <h3 className="font-black text-sm mb-8 uppercase text-slate-800 italic underline decoration-blue-500 decoration-2 underline-offset-4">Ficha de Nuevo Producto</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                        <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" placeholder="Lote / SKU" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required/>
                        <div className="grid grid-cols-2 gap-4">
                            <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" type="number" placeholder="Precio Venta" value={form.precio} onChange={e=>setForm({...form, precio:e.target.value})} required/>
                            <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" type="number" placeholder="Stock" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} required/>
                        </div>
                        <select className="w-full p-3 bg-slate-50 rounded-xl font-black text-xs outline-none border-none" onChange={e=>setForm({...form, bodega_id: e.target.value})} required>
                            <option value="">-- Bodega de Destino --</option>
                            {bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                        <button className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg uppercase text-[9px]">Sincronizar</button>
                    </form>
                </div>
            )}

            {tab === 'bodegas' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in h-fit">
                    <div className="bg-white p-10 rounded-[35px] shadow-sm border border-slate-100 h-fit">
                        <h3 className="font-black text-sm mb-8 uppercase italic tracking-tighter">Nueva Zona</h3>
                        <div className="flex gap-3">
                            <input className="flex-1 p-4 bg-slate-50 rounded-xl font-bold border-none outline-none text-xs" placeholder="Nombre Zona" id="nb_bodega"/>
                            <button onClick={async ()=>{ const n=document.getElementById('nb_bodega').value; await axios.post('/api/bodegas', {nombre: n, company_id: user.company_id}); load(); document.getElementById('nb_bodega').value='';}} className="bg-blue-600 text-white px-8 rounded-xl font-black shadow-lg uppercase text-[9px]">Añadir</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-[32px] shadow-sm border overflow-hidden h-fit">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#0f172a] text-white font-black uppercase"><tr><th className="p-5">Zonas Registradas</th><th className="text-right p-5">Opción</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b last:border-none"><td className="p-5 font-black uppercase italic leading-none">{b.nombre}</td><td className="text-right p-5"><button onClick={async()=> {if(window.confirm("¿Eliminar zona?")){await axios.delete(`/api/bodegas/${b.id}`); load();}}} className="text-red-500 font-bold uppercase text-[9px]">Borrar</button></td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'list' && (
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden pr-2 animate-fade-in h-fit">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 font-black uppercase text-slate-400 border-b tracking-widest"><tr><th className="p-6">Descripción</th><th>Batch</th><th>Bodega</th><th>Existencia</th><th className="p-6 text-center">Estado</th></tr></thead>
                        <tbody>{productos.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition last:border-none">
                                <td className="p-6 font-black text-slate-800 uppercase italic leading-none">{p.nombre}</td>
                                <td className="font-bold text-blue-500 leading-none">{p.sku}</td>
                                <td className="text-[10px] font-black uppercase italic leading-none">{bodegas.find(b=>b.id === p.bodega_id)?.nombre || 'Gral'}</td>
                                <td className="font-black text-base leading-none italic">{p.stock} uds</td>
                                <td className="text-center p-5"><span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${p.stock <= 10 ? 'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>{p.stock <= 10 ? 'Bajo' : 'Ok'}</span></td>
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
        if (form.id) await axios.put(`/api/admin/usuarios/${form.id}`, form);
        else await axios.post('/api/admin/usuarios', { ...form, company_id: user.company_id });
        setForm({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' }); load();
        window.alert("¡Hecho!");
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100 max-w-4xl mx-auto h-fit">
                <h3 className="font-black text-sm mb-6 uppercase text-slate-800 italic underline decoration-blue-500 underline-offset-4">Control de Accesos</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/>
                    <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/>
                    <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" type="password" placeholder="Pass" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required={!form.id}/>
                    <select className="p-3 bg-slate-50 rounded-xl font-black text-slate-700 text-xs outline-none" value={form.cargo} onChange={e=>setForm({...form, cargo: e.target.value})}>
                        <option value="Admin">Admin</option><option value="Vendedor">Vendedor</option><option value="Bodeguero">Bodeguero</option>
                        <option value="Prealistador">Prealistador</option><option value="Produccion">Producción</option><option value="Logistica">Logística</option>
                    </select>
                    <button className="bg-blue-600 text-white font-black rounded-xl shadow-lg uppercase text-[9px] tracking-widest transition-all hover:bg-black">Guardar</button>
                </form>
            </div>
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden pr-2 h-fit">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-black uppercase text-slate-400 border-b tracking-widest"><tr><th className="p-10 text-xs">Colaborador</th><th>Cargo Corporativo</th><th className="text-center p-6">Control</th></tr></thead>
                    <tbody>{usuarios.map(u => (
                        <tr key={u.id} className="border-b last:border-none transition">
                            <td className="p-10 font-black text-slate-800 text-base tracking-tighter uppercase italic leading-none">{u.nombre} <br/><span className="text-[8px] font-bold text-slate-400 lowercase">{u.email}</span></td>
                            <td><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic">{u.cargo}</span></td>
                            <td className="p-6 text-center flex justify-center gap-3">
                                <button onClick={()=> {setForm(u); window.scrollTo({top:0, behavior:'smooth'})}} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={18}/></button>
                                <button onClick={async ()=>{if(window.confirm("Borrar acceso?")){ await axios.delete(`/api/admin/usuarios/${u.id}`); load(); }}} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={18}/></button>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
//      SIDEBAR, DASHBOARD, LOGIN Y HELPERS
// ==========================================
function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
    const menuItems = [
        { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard size={18}/>, roles: ['Admin', 'Contador'] },
        { id: 'ventas', label: 'Ventas (TPV)', icon: <ShoppingCart size={18}/>, roles: ['Admin', 'Vendedor'] },
        { id: 'inventario', label: 'Bodegas e Inv.', icon: <Package size={18}/>, roles: ['Admin', 'Bodeguero'] },
        { id: 'produccion', label: 'Producción Ind.', icon: <Factory size={18}/>, roles: ['Admin', 'Prealistador', 'Produccion', 'Logistica'] },
        { id: 'nomina', label: 'Nómina PRO', icon: <Users size={18}/>, roles: ['Admin', 'Nomina'] },
        { id: 'caja', label: 'Caja y Turno', icon: <Wallet size={18}/>, roles: ['Admin', 'Vendedor'] },
        { id: 'admin', label: 'Configuración', icon: <ShieldCheck size={18}/>, roles: ['Admin'] },
    ];
    return <aside className="w-64 bg-[#0f172a] text-white flex flex-col p-6 shadow-2xl relative z-40 border-r border-white/5"><h1 className="text-xl font-black italic mb-10 text-blue-400 italic">AccuCloud.</h1><nav className="flex-1 space-y-1.5 overflow-y-auto pr-2">{menuItems.filter(m => m.roles.includes(user?.cargo)).map(m => (<button key={m.id} onClick={()=>setActiveTab(m.id)} className={`w-full flex items-center px-6 py-4 rounded-2xl transition-all duration-300 ${activeTab===m.id?'bg-blue-600 text-white shadow-[0_15px_40px_rgba(37,99,235,0.3)] scale-105':'text-slate-500 hover:bg-white/5 hover:text-white'}`}><span className="mr-3">{m.icon}</span> <span className="font-bold text-[10px] tracking-widest uppercase italic leading-none">{m.label}</span></button>))}</nav><button onClick={onLogout} className="text-red-500 font-black text-[9px] uppercase tracking-[4px] p-5 hover:text-white transition-colors text-center border border-red-500/20 rounded-2xl mt-6 italic shadow-lg leading-none">Salir</button></aside>;
}

function ResumenView({ user }) {
  const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
  const chartData = [{ name: 'L', v: 400 }, { name: 'M', v: 300 }, { name: 'M', v: 600 }, { name: 'J', v: 800 }, { name: 'V', v: 500 }, { name: 'S', v: 900 }, { name: 'D', v: 200 }];
  useEffect(() => { axios.get(`/api/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); }, [user]);
  return <div className="space-y-10 animate-fade-in"><div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <CardStat title="Balance" value={fmt(data.cajaMayor)} color="blue" icon={<TrendingUp size={24}/>}/>
          <CardStat title="Valoración" value={fmt(data.valorInventario)} color="purple" icon={<Box size={24}/>}/>
          <CardStat title="Stock Bajo" value={data.lowStock} color="red" icon={<AlertTriangle size={24}/>}/>
      </div><div className="bg-white p-12 rounded-[60px] shadow-sm border border-slate-100 h-[450px] relative group overflow-hidden"><div className="absolute top-0 right-0 p-10 opacity-5 transition-transform duration-1000 group-hover:scale-110"><TrendingUp size={300}/></div><h3 className="font-black text-xl mb-12 uppercase italic text-slate-800 tracking-tighter underline decoration-blue-500 decoration-4 underline-offset-8 leading-none italic">Analítica Corporativa</h3><ResponsiveContainer width="100%" height="80%"><BarChart data={chartData}><CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: '900', fill: '#cbd5e1', fontFamily: 'Inter'}}/><Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '35px', border: 'none', boxShadow: '0 35px 60px -15px rgb(0 0 0 / 0.3)'}}/><Bar dataKey="v" radius={[15, 15, 0, 0]} fill="#2563eb" barSize={40}>{chartData.map((e,i)=>(<Cell key={i} fill={i===5?'#2563eb':'#f1f5f9'} stroke={i===5?'#2563eb':'#e2e8f0'} strokeWidth={2}/>))}</Bar></BarChart></ResponsiveContainer></div></div>;
}

function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50 shadow-green-200/50", blue: "text-blue-600 bg-blue-50 shadow-blue-200/50", purple: "text-purple-600 bg-purple-50 shadow-purple-200/50", red: "text-red-600 bg-red-50 shadow-red-200/50" };
    return <div className="bg-white p-10 rounded-[60px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-4 transition-all duration-1000 group cursor-default border-b-[8px] border-slate-100 leading-none h-full"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-10 shadow-xl group-hover:scale-110 transition-transform duration-500 ${c[color]}`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[6px] mb-2 leading-none italic opacity-60 leading-none italic">{"// " + title}</p><h3 className="text-xl font-black text-slate-800 tracking-tighter italic scale-x-95 origin-left leading-none tracking-tighter italic leading-none italic">{value}</h3></div>; 
}

function CajaSimpleView({ user }) {
    const [turno, setTurno] = useState(null);
    const recargar = () => axios.get('/api/turnos/activo/' + user.id).then(res => setTurno(res.data));
    useEffect(() => { recargar(); }, []);
    return <div className="bg-[#0f172a] p-16 rounded-[60px] shadow-2xl text-center max-w-xl mx-auto border-t-[20px] border-blue-600 animate-slide-up h-fit relative overflow-hidden group"><div className="absolute top-0 left-0 p-10 opacity-5 -rotate-12 group-hover:rotate-12 transition-all duration-1000"><Wallet size={200} className="text-white"/></div><div className={`w-20 h-20 mx-auto mb-8 rounded-[25px] flex items-center justify-center shadow-xl ${turno ? 'bg-green-500 text-white animate-pulse' : 'bg-red-500 text-white'}`}><Lock size={32}/></div><h3 className="text-4xl font-black mb-6 uppercase italic tracking-tighter text-white leading-none italic">{turno ? "CAJA OPERATIVA" : "CAJA CERRADA"}</h3>{turno ? (<div className="space-y-10 animate-fade-in relative z-10"><div className="p-10 bg-white/5 backdrop-blur-md rounded-[45px] border border-white/10 shadow-inner"><p className="text-[10px] font-black text-blue-400 uppercase tracking-[8px] mb-4 leading-none italic">Ventas Acumuladas</p><h2 className="text-7xl font-black text-white tracking-tighter leading-none italic scale-x-95 origin-center italic">{fmt(turno.total_vendido)}</h2></div><button onClick={async ()=>{ await axios.put('/api/turnos/finalizar', { turno_id: turno.id }); recargar(); }} className="w-full py-6 bg-red-600 text-white font-black rounded-[30px] shadow-xl hover:bg-red-700 transition-all uppercase text-[10px] tracking-widest active:scale-95 shadow-red-900/40 italic">Realizar Cierre de Turno</button></div>) : (<div className="space-y-8 animate-fade-in relative z-10"><p className="text-slate-400 font-bold px-12 text-xs italic tracking-tight opacity-60 uppercase leading-relaxed tracking-[2px] italic">Se requiere apertura para operar el flujo de efectivo</p><button onClick={async ()=>{ const base = window.prompt("¿Base inicial efectivo?", "0"); if(base !== null) { await axios.post('/api/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id }); recargar(); } }} className="w-full py-8 bg-blue-600 text-white font-black rounded-[35px] shadow-2xl animate-bounce uppercase text-[10px] tracking-[4px] hover:bg-white hover:text-blue-600 transition-all shadow-blue-900/40 italic">Aperturar Turno de Ventas</button></div>)}</div>;
}

function LoginScreen({ onLogin, onBuy }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post('/api/login', form);
        if (res.data.success) onLogin(res.data.user);
        else window.alert('Acceso Denegado.');
    } catch (e) { window.alert('Backend sincronizando... espera 10 seg.'); }
  };
  return <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden"><div className="bg-white p-16 rounded-[80px] shadow-2xl w-full max-w-md border-t-[12px] border-slate-900 animate-slide-up relative z-10 border-b-[20px] border-slate-100"><h1 className="text-6xl font-black text-center text-slate-800 mb-4 italic tracking-tighter uppercase leading-none italic tracking-tighter italic">AccuCloud<span className="text-blue-600">.</span></h1><p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[10px] mb-12 italic opacity-60 leading-none">Enterprise Intelligence System</p><form onSubmit={handleAuth} className="space-y-6 mt-12"><input className="w-full p-6 bg-slate-100 rounded-[35px] font-black outline-none focus:ring-8 ring-blue-50 transition-all text-sm tracking-tighter italic" placeholder="Email Corp." onChange={e=>setForm({...form, email: e.target.value})} required /><input type="password" class="w-full p-6 bg-slate-100 rounded-[35px] font-black outline-none focus:ring-8 ring-blue-50 transition-all text-sm tracking-tighter italic" placeholder="Password" onChange={e=>setForm({...form, password: e.target.value})} required /><button className="w-full bg-slate-900 text-white font-black py-6 rounded-[35px] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase text-[10px] mt-8 shadow-blue-900/30 tracking-widest italic font-black">Acceder</button></form><div className="mt-12 p-8 bg-green-50 border-2 border-green-200 rounded-[45px] text-center cursor-pointer group hover:bg-green-100 transition-all" onClick={onBuy}><p className="text-[11px] font-black text-green-700 uppercase mb-4 tracking-tighter leading-tight italic tracking-[2px]">¡Haz parte de AccuCloud Pro Hoy!</p><button className="w-full py-4 bg-green-600 text-white font-black rounded-[20px] text-[9px] shadow-lg group-hover:scale-105 transition-all uppercase tracking-widest flex items-center justify-center gap-4 italic shadow-green-900/20 tracking-[4px] leading-none tracking-tighter italic"><CreditCard size={18}/> Plan Pro 2026</button></div></div></div>;
}

function PSEPage({ onBack }) { return <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center text-[10vw] font-black uppercase italic tracking-widest text-center px-20 leading-none animate-pulse">PASARELA<br/>BANCARIA<br/>$600.000<button onClick={onBack} className="text-xl mt-20 text-blue-500 underline uppercase tracking-[10px] italic font-black">Cerrar</button></div>; }