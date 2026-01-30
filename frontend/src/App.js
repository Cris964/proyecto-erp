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
    const savedUser = localStorage.getItem('erp_user');
    if (savedUser && savedUser !== "undefined") {
        try { 
            const parsed = JSON.parse(savedUser);
            if(parsed && parsed.id) setUser(parsed);
        } catch (e) { localStorage.removeItem('erp_user'); }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('erp_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('erp_user');
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-lg italic">AccuCloud Pro 2026...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? (
        <LoginScreen onLogin={handleLogin} onBuy={() => setShowPSE(true)} />
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
          <main className="flex-1 overflow-auto p-6 md:p-10 relative bg-slate-50">
             <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter capitalize italic leading-none">{activeTab}</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[3px] mt-1">BI Enterprise v2.6</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl border shadow-sm font-black text-[9px] uppercase text-blue-600 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> {user.nombre} ({user.cargo})
                </div>
             </header>

             <div className="animate-fade-in pb-20">
                {activeTab === 'dashboard' && <ResumenView user={user}/>}
                {activeTab === 'ventas' && <VentasTPV user={user}/>}
                {activeTab === 'inventario' && <InventarioIndustrial user={user}/>}
                {activeTab === 'produccion' && <ProduccionIndustrial user={user}/>}
                {activeTab === 'nomina' && <NominaPRO user={user}/>}
                {activeTab === 'conta' && <ContabilidadView user={user}/>}
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
//      MÓDULO: VENTAS TPV (REAL-TIME)
// ==========================================
function VentasTPV({ user }) {
    const [cart, setCart] = useState([]);
    const [prods, setProds] = useState([]);
    const [search, setSearch] = useState('');
    const [turno, setTurno] = useState(null);

    const load = async () => {
        const resP = await axios.get(`/api/productos?company_id=${user.company_id}`);
        const resT = await axios.get(`/api/turnos/activo/${user.id}`);
        setProds(resP.data || []);
        setTurno(resT.data);
    };
    useEffect(() => { load(); }, []);

    if(!turno) return <div className="p-20 bg-white rounded-[40px] text-center shadow-sm border border-dashed border-slate-200"><ShoppingCart size={48} className="mx-auto mb-4 text-slate-300"/><h3 className="text-xl font-black uppercase text-slate-400 italic">Caja Cerrada</h3><p className="text-xs font-bold text-slate-400 mt-2">Abre un turno en el módulo de Caja para vender.</p></div>;

    const total = cart.reduce((acc, x) => acc + (x.precio * x.cant), 0);

    const addToCart = (p) => {
        const ex = cart.find(x => x.id === p.id);
        if(ex) setCart(cart.map(x => x.id === p.id ? {...x, cant: x.cant + 1} : x));
        else setCart([...cart, {...p, cant: 1}]);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[650px] animate-fade-in">
            <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 flex flex-col">
                <div className="flex items-center bg-slate-50 p-4 rounded-2xl focus-within:ring-2 ring-blue-500/20 transition-all border border-slate-100">
                    <Search className="mr-4 text-slate-400" size={20}/>
                    <input className="bg-transparent border-none outline-none font-bold text-base w-full" placeholder="Buscar producto o escanear..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus/>
                </div>
                <div className="flex-1 mt-6 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 pr-2">
                    {prods.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase())).map(p=>(
                        <div key={p.id} onClick={()=>addToCart(p)} className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all flex flex-col justify-between h-[110px]">
                            <p className="font-black text-slate-800 uppercase text-[10px] leading-tight italic">{p.nombre}</p>
                            <p className="font-black text-blue-600 text-base tracking-tighter leading-none">{fmt(p.precio)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-[#0f172a] rounded-[32px] shadow-xl p-8 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10 flex-1 overflow-y-auto pr-2">
                    <h3 className="text-lg font-black italic uppercase text-blue-400 mb-6 underline decoration-white/10 underline-offset-8">Venta Actual</h3>
                    <div className="space-y-4">
                        {cart.map(x=>(
                            <div key={x.id} className="flex justify-between items-center font-bold border-b border-white/5 pb-3">
                                <div className="flex flex-col"><span className="text-[11px] uppercase italic leading-none">{x.nombre.substring(0,18)}</span><span className="text-blue-400 text-[8px] font-black uppercase mt-1">Cant: {x.cant}</span></div>
                                <div className="flex items-center gap-3"><span className="text-sm">{fmt(x.precio * x.cant)}</span><button onClick={()=>setCart(cart.filter(it=>it.id!==x.id))} className="text-red-400"><X size={14}/></button></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative z-10 mt-6 border-t border-white/10 pt-6">
                    <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Monto Total</div>
                    <div className="text-5xl font-black tracking-tighter mb-6 text-white leading-none italic">{fmt(total)}</div>
                    <button onClick={async ()=>{ await axios.post('/api/ventas', {productos: cart, responsable: user.nombre, turno_id: turno.id, company_id: user.company_id}); setCart([]); window.alert("Venta registrada."); load(); }} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg uppercase text-[10px] tracking-widest active:scale-95 transition-all">REALIZAR COBRO</button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: PRODUCCIÓN (CON KITS)
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
        setMaterias(Array.isArray(resM.data) ? resM.data : []);
        setOrdenes(Array.isArray(resO.data) ? resO.data : []);
        setNumOrden(resN.data.numero || '0001');
    };
    useEffect(() => { load(); }, [sub]);

    return (
        <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-white border rounded-2xl w-fit shadow-sm overflow-x-auto">
                {['materia', 'kits', 'ordenes'].map(t => (
                    <button key={t} onClick={()=>setSub(t)} className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${sub===t?'bg-blue-600 text-white shadow-md':'text-slate-400 hover:bg-slate-50'}`}>{t}</button>
                ))}
            </div>

            {sub === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    <div className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100 h-fit">
                        <h3 className="font-black text-xs mb-6 uppercase italic flex items-center gap-2 text-slate-800"><Database size={16} className="text-blue-600"/> Nuevo Insumo</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/api/produccion/materia', {...formM, company_id:user.company_id}); load(); setFormM({nombre:'', unidad_medida:'mg', cantidad:0, costo:0});}} className="space-y-4">
                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" placeholder="Nombre" value={formM.nombre} onChange={e=>setFormM({...formM, nombre: e.target.value})} required/>
                            <div className="grid grid-cols-2 gap-3">
                                <select className="p-3 bg-slate-50 rounded-xl font-black text-[10px] outline-none" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida: e.target.value})}><option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option></select>
                                <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs" type="number" placeholder="Stock" value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad: e.target.value})} required/>
                            </div>
                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs" type="number" placeholder="Costo Unit." value={formM.costo} onChange={e=>setFormM({...formM, costo: e.target.value})} required/>
                            <button className="w-full py-3 bg-slate-900 text-white font-black rounded-xl shadow-lg uppercase text-[9px] tracking-widest transition-all hover:bg-black">Guardar</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden pr-2 h-fit">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-black uppercase text-slate-400 border-b"><tr><th className="p-5 tracking-widest">Insumo</th><th>Stock</th><th className="p-5 text-right">Valorizado</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b last:border-none hover:bg-slate-50 transition"><td className="p-5 font-black text-slate-800 uppercase italic leading-none">{m.nombre}</td><td className="font-bold text-blue-600 leading-none">{m.cantidad} {m.unidad_medida}</td><td className="p-5 text-right font-black leading-none italic">{fmt(m.cantidad * m.costo)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {sub === 'kits' && (
                <div className="bg-[#0f172a] p-10 rounded-[40px] shadow-2xl relative overflow-hidden text-white animate-slide-up h-[320px] flex items-center">
                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Layers size={250}/></div>
                    <div className="max-w-md relative z-10">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-blue-400 mb-4 leading-none">Constructor de Kits</h3>
                        <p className="text-slate-400 text-[10px] font-bold mb-8 leading-relaxed uppercase tracking-widest">Genera combos corporativos seleccionando productos del almacén técnico.</p>
                        <button onClick={()=>window.alert("Funcionalidad en desarrollo")} className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-[9px] tracking-widest hover:scale-105 transition-all">+ Empezar Nuevo Kit</button>
                    </div>
                </div>
            )}

            {sub === 'ordenes' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white p-5 rounded-[22px] border border-slate-100 flex justify-between items-center shadow-sm">
                        <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Próxima OP</p><h4 className="text-base font-black text-blue-600 tracking-tighter italic leading-none uppercase">OP-{numOrden}</h4></div>
                        <button onClick={async ()=>{ const n=window.prompt("Producto:"); if(n){ await axios.post('/api/produccion/ordenes', {numero_orden: numOrden, nombre_producto: n, cantidad: 10, company_id: user.company_id}); load(); } }} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-[9px] shadow-md hover:scale-105 uppercase transition-all">+ Lanzar</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ordenes.filter(o=>o.estado!=='Cerrado').map(o => (
                            <div key={o.id} className="bg-white p-5 rounded-[25px] shadow-sm border border-l-8 border-blue-500 flex justify-between items-center transition-all hover:shadow-md">
                                <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none italic mb-1.5">BATCH ID: {o.numero_orden}</p><h4 className="text-sm font-black text-slate-800 uppercase italic leading-none">{o.nombre_producto}</h4></div>
                                <div className="flex gap-2">
                                    {o.estado === 'Prealistamiento' && <button onClick={async()=> {await axios.put(`/api/produccion/ordenes/${o.id}`, {estado:'Produccion', datos_logistica:{}}); load();}} className="p-2 bg-slate-900 text-white rounded-lg"><Play size={12}/></button>}
                                    {o.estado === 'Produccion' && <button onClick={async()=> {await axios.put(`/api/produccion/ordenes/${o.id}`, {estado:'Logistica', datos_logistica:{}}); load();}} className="p-2 bg-green-600 text-white rounded-lg"><CheckCircle size={12}/></button>}
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
//      MÓDULO: NÓMINA PRO (COLABORADORES)
// ==========================================
function NominaPRO({ user }) {
  const [tab, setTab] = useState('list');
  const [empleados, setEmpleados] = useState([]);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', salario: '', eps: '', arl: '', pension: '' });

  const load = () => axios.get(`/api/empleados?company_id=${user.company_id}`).then(res => setEmpleados(Array.isArray(res.data) ? res.data : []));
  useEffect(() => { load(); }, []);

  const liquidar = (e) => {
    const sal = parseFloat(e.salario);
    const aux = (sal <= 3501810) ? 249095 : 0; 
    const neto = (sal + aux) - (sal * 0.08);
    setPreview({ ...e, neto, aux, sal });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-2 p-1 bg-white border rounded-2xl w-fit shadow-sm">
          <button onClick={()=>setTab('list')} className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${tab==='list'?'bg-blue-600 text-white shadow-md':'text-slate-400 hover:bg-slate-50'}`}>Personal</button>
          <button onClick={()=>setTab('add')} className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${tab==='add'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>+ Nuevo</button>
      </div>

      {tab === 'add' ? (
          <div className="bg-white p-10 rounded-[35px] shadow-sm border border-slate-100 max-w-xl mx-auto animate-slide-up">
              <h3 className="font-black text-sm mb-6 uppercase text-slate-800 italic tracking-tighter underline decoration-blue-500 decoration-2 underline-offset-4">Vinculación de Personal</h3>
              <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/api/empleados', {...form, company_id: user.company_id}); setForm({nombre:'', email:'', salario:'', eps:'', arl:'', pension:''}); setTab('list'); load();}} className="space-y-4">
                  <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" placeholder="Nombre Completo" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/>
                  <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" placeholder="Email Corp." value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/>
                  <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" type="number" placeholder="Salario Mensual" value={form.salario} onChange={e=>setForm({...form, salario: e.target.value})} required/>
                  <div className="grid grid-cols-3 gap-3">
                    <input className="p-3 bg-slate-100 rounded-xl font-black text-[8px] uppercase" placeholder="EPS" onChange={e=>setForm({...form, eps:e.target.value})}/>
                    <input className="p-3 bg-slate-100 rounded-xl font-black text-[8px] uppercase" placeholder="ARL" onChange={e=>setForm({...form, arl:e.target.value})}/>
                    <input className="p-3 bg-slate-100 rounded-xl font-black text-[8px] uppercase" placeholder="PENSION" onChange={e=>setForm({...form, pension:e.target.value})}/>
                  </div>
                  <button className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg uppercase text-[9px] tracking-widest active:scale-95 transition-all">Finalizar Registro</button>
              </form>
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden h-fit pr-2">
                  <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 font-black uppercase text-slate-400 border-b"><tr><th className="p-5">Nombre</th><th>Salario Base</th><th className="p-5 text-center">Simular</th></tr></thead>
                      <tbody>{empleados.map(e=>(<tr key={e.id} className="border-b hover:bg-slate-50 transition last:border-none">
                                <td className="p-5 font-black text-slate-800 uppercase italic leading-none">{e.nombre}</td>
                                <td className="font-bold text-slate-500 italic leading-none">{fmt(e.salario)}</td>
                                <td className="text-center p-5"><button onClick={()=>liquidar(e)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Calculator size={16}/></button></td>
                            </tr>))}</tbody>
                  </table>
                  {empleados.length === 0 && <div className="p-10 text-center opacity-20 font-black uppercase text-xs">Sin personal vinculado</div>}
              </div>
              {preview && (
                  <div className="bg-white p-10 rounded-[40px] shadow-2xl border-l-[15px] border-blue-600 animate-slide-up h-fit relative">
                      <div className="absolute top-0 right-0 p-6 opacity-5"><Receipt size={100}/></div>
                      <h4 className="text-xl font-black text-slate-800 uppercase text-center mb-8 italic">{preview.nombre}</h4>
                      <div className="bg-blue-600 p-8 rounded-[35px] text-center text-4xl font-black text-white shadow-xl shadow-blue-100 mb-8 italic tracking-tighter leading-none">{fmt(preview.neto)}</div>
                      <div className="space-y-2 border-y py-6 font-bold text-slate-400 uppercase text-[9px] tracking-widest">
                            <div className="flex justify-between"><span>Sueldo Bruto:</span><span>{fmt(preview.sal)}</span></div>
                            <div className="flex justify-between text-green-600"><span>(+) Auxilio Transporte:</span><span>{fmt(preview.aux)}</span></div>
                            <div className="flex justify-between text-red-500"><span>(-) Salud/Pens (8%):</span><span>-{fmt(preview.sal * 0.08)}</span></div>
                      </div>
                      <button onClick={()=>window.alert("Comprobante enviado al email corporativo")} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl uppercase text-[9px] flex items-center justify-center gap-2 mt-8 active:scale-95 transition-all"><Mail size={16}/> Enviar Desprendible</button>
                  </div>
              )}
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
        axios.get(`/api/productos?company_id=${user.company_id}`).then(res => setProductos(Array.isArray(res.data) ? res.data : []));
        axios.get(`/api/bodegas?company_id=${user.company_id}`).then(res => setBodegas(Array.isArray(res.data) ? res.data : []));
    };
    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-6">
            <div className="flex gap-2 p-1.5 bg-white border rounded-2xl w-fit shadow-sm overflow-x-auto">
                <button onClick={()=>setTab('list')} className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${tab==='list'?'bg-blue-600 text-white shadow-md':'text-slate-400 hover:bg-slate-50'}`}>STOCK</button>
                <button onClick={()=>setTab('new')} className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${tab==='new'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>+ CREAR</button>
                <button onClick={()=>setTab('bodegas')} className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${tab==='bodegas'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>BODEGAS</button>
                <label className="bg-green-600 text-white px-6 py-2 rounded-xl font-black text-[9px] cursor-pointer flex items-center gap-2 shadow-md uppercase">
                   <Upload size={14}/> Excel <input type="file" className="hidden" onChange={async (e)=>{
                       const wb = XLSX.read(await e.target.files[0].arrayBuffer(), { type: 'binary' });
                       await axios.post('/api/productos/importar', { productos: XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]), company_id: user.company_id });
                       load(); window.alert("Importado");
                   }} accept=".xlsx, .xls"/>
                </label>
            </div>

            {tab === 'new' && (
                <div className="bg-white p-10 rounded-[35px] shadow-sm border border-slate-100 max-w-xl mx-auto animate-slide-up">
                    <h3 className="font-black text-sm mb-8 uppercase text-slate-800 italic underline decoration-blue-500 decoration-2 underline-offset-4">Ficha Técnica de Producto</h3>
                    <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/api/productos', {...form, company_id: user.company_id}); setTab('list'); load();}} className="space-y-5">
                        <input className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" placeholder="Nombre Comercial" onChange={e=>setForm({...form, nombre: e.target.value})} required/>
                        <input className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" placeholder="Lote / SKU" onChange={e=>setForm({...form, sku: e.target.value})} required/>
                        <div className="grid grid-cols-2 gap-4">
                            <input className="p-4 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" type="number" placeholder="Precio Venta" onChange={e=>setForm({...form, precio: e.target.value})} required/>
                            <input className="p-4 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none" type="number" placeholder="Stock" onChange={e=>setForm({...form, stock: e.target.value})} required/>
                        </div>
                        <select className="w-full p-4 bg-slate-50 rounded-xl font-black text-xs outline-none border-none" onChange={e=>setForm({...form, bodega_id: e.target.value})} required>
                            <option value="">-- Bodega de Destino --</option>
                            {bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                        <button className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg uppercase text-[9px] tracking-widest active:scale-95 transition-all">Sincronizar al Almacén</button>
                    </form>
                </div>
            )}

            {tab === 'bodegas' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in h-fit">
                    <div className="bg-white p-10 rounded-[35px] shadow-sm border border-slate-100 h-fit">
                        <h3 className="font-black text-sm mb-8 uppercase italic tracking-tighter">Nueva Zona Logística</h3>
                        <div className="flex gap-3">
                            <input className="flex-1 p-4 bg-slate-50 rounded-xl font-bold border-none outline-none text-xs" placeholder="Nombre Zona" id="nbn_b"/>
                            <button onClick={async ()=>{ const n=document.getElementById('nbn_b').value; await axios.post('/api/bodegas', {nombre: n, company_id: user.company_id}); load(); document.getElementById('nbn_b').value='';}} className="bg-blue-600 text-white px-8 rounded-xl font-black shadow-lg uppercase text-[9px]">Añadir</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-[32px] shadow-sm border overflow-hidden h-fit">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#0f172a] text-white font-black uppercase"><tr><th className="p-5">Zonas Registradas</th><th className="text-right p-5">Opción</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b last:border-none"><td className="p-5 font-black uppercase italic">{b.nombre}</td><td className="text-right p-5"><button onClick={async()=> {if(window.confirm("¿Eliminar zona?")){await axios.delete(`/api/bodegas/${b.id}`); load();}}} className="text-red-500 font-bold uppercase text-[9px]">Borrar</button></td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'list' && (
                <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden pr-2 animate-fade-in h-fit">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 font-black uppercase text-slate-400 border-b"><tr><th className="p-5 tracking-widest">Descripción</th><th>Batch</th><th>Bodega</th><th>Existencia</th><th className="p-5 text-center">Estado</th></tr></thead>
                        <tbody>{productos.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition last:border-none">
                                <td className="p-6 font-black text-slate-800 uppercase italic leading-none">{p.nombre}</td>
                                <td className="font-bold text-blue-500 leading-none">{p.sku}</td>
                                <td className="text-[10px] font-black uppercase italic leading-none">{bodegas.find(b=>b.id === p.bodega_id)?.nombre || 'Gral'}</td>
                                <td className="font-black text-base leading-none italic">{p.stock} uds</td>
                                <td className="text-center p-5"><span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${p.stock <= 10 ? 'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>{p.stock <= 10 ? 'Bajo' : 'Óptimo'}</span></td>
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
                    <button className="bg-blue-600 text-white font-black rounded-xl shadow-lg uppercase text-[8px] tracking-widest transition-all hover:bg-black">Guardar Acceso</button>
                </form>
            </div>
            <div className="bg-white rounded-[32px] shadow-sm border overflow-hidden pr-2 h-fit">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-black uppercase text-slate-400 border-b tracking-widest"><tr><th className="p-6">Colaborador</th><th>Cargo Corporativo</th><th className="text-center p-6">Control</th></tr></thead>
                    <tbody>{usuarios.map(u => (
                        <tr key={u.id} className="border-b last:border-none transition">
                            <td className="p-6 font-black text-slate-800 text-base tracking-tighter uppercase italic leading-none">{u.nombre} <br/><span className="text-[8px] font-bold text-slate-400 lowercase">{u.email}</span></td>
                            <td><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic">{u.cargo}</span></td>
                            <td className="p-6 text-center flex justify-center gap-3">
                                <button onClick={()=> {setForm(u); window.scrollTo({top:0, behavior:'smooth'})}} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={18}/></button>
                                <button onClick={async ()=>{if(window.confirm("Borrar acceso?")){ await axios.delete(`/api/admin/usuarios/${u.id}`); load(); }}} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={18}/></button>
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
function CajaSimpleView({ user }) {
    const [turno, setTurno] = useState(null);
    const recargar = () => axios.get('/api/turnos/activo/' + user.id).then(res => setTurno(res.data));
    useEffect(() => { recargar(); }, []);

    return (
        <div className="bg-[#0f172a] p-16 rounded-[60px] shadow-2xl text-center max-w-xl mx-auto border-t-[20px] border-blue-600 animate-slide-up h-fit relative overflow-hidden group">
            <div className="absolute top-0 left-0 p-10 opacity-5 -rotate-12 group-hover:rotate-12 transition-all duration-1000"><Wallet size={200} className="text-white"/></div>
            <div className={`w-20 h-20 mx-auto mb-8 rounded-[25px] flex items-center justify-center shadow-xl ${turno ? 'bg-green-500 text-white animate-pulse' : 'bg-red-500 text-white'}`}>
                <Lock size={32}/>
            </div>
            <h3 className="text-4xl font-black mb-6 uppercase italic tracking-tighter text-white leading-none">{turno ? "CAJA OPERATIVA" : "CAJA CERRADA"}</h3>
            {turno ? (
                <div className="space-y-10 animate-fade-in relative z-10">
                    <div className="p-10 bg-white/5 backdrop-blur-md rounded-[45px] border border-white/10 shadow-inner">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[8px] mb-4 leading-none">Neto en Caja</p>
                        <h2 className="text-7xl font-black text-white tracking-tighter leading-none italic scale-x-95 origin-center">{fmt(turno.total_vendido)}</h2>
                    </div>
                    <button onClick={async ()=>{ if(window.confirm("¿Realizar cierre?")){ await axios.put('/api/turnos/finalizar', { turno_id: turno.id }); recargar(); } }} className="w-full py-6 bg-red-600 text-white font-black rounded-[30px] shadow-xl hover:bg-red-700 transition-all uppercase text-[10px] tracking-widest active:scale-95 shadow-red-900/40 italic">Cerrar Turno Corporativo</button>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in relative z-10">
                    <p className="text-slate-400 font-bold px-12 text-xs italic tracking-tight opacity-60 uppercase leading-relaxed tracking-[2px]">El sistema requiere apertura administrativa para operar el flujo de efectivo</p>
                    <button onClick={async ()=>{ 
                        const base = window.prompt("¿Base inicial efectivo?", "0");
                        if(base !== null) { await axios.post('/api/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id }); recargar(); }
                    }} className="w-full py-8 bg-blue-600 text-white font-black rounded-[35px] shadow-2xl animate-bounce uppercase text-[10px] tracking-[4px] hover:bg-white hover:text-blue-600 transition-all shadow-blue-900/40 italic">Aperturar Turno de Ventas</button>
                </div>
            )}
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
        <div className="bg-white p-12 rounded-[60px] shadow-sm border border-slate-100 overflow-hidden animate-fade-in relative h-fit">
            <div className="absolute top-0 right-0 p-10 opacity-5"><Receipt size={180}/></div>
            <h3 className="font-black text-3xl mb-12 italic text-blue-600 uppercase tracking-tighter flex items-center gap-4 underline decoration-blue-50 decoration-8 underline-offset-8 relative z-10 leading-none italic"><Receipt size={40}/> Libro de Ventas TPV</h3>
            <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-[5px] text-slate-400"><tr><th className="p-8">Fecha / Hora</th><th>Responsable</th><th>Detalle</th><th className="text-right p-8">Total Bruto</th></tr></thead>
                    <tbody>{datos.map(d=>(<tr key={d.id} className="border-b hover:bg-slate-50 transition-all last:border-none">
                        <td className="p-8 text-xs font-bold text-slate-500 leading-none">{new Date(d.fecha).toLocaleString()}</td>
                        <td className="font-black text-blue-600 uppercase text-[9px] leading-none tracking-[2px] italic">{d.responsable}</td>
                        <td className="font-black text-slate-800 text-base tracking-tighter italic leading-none uppercase">Comprobante de Ingreso TPV #{d.id.toString().padStart(6, '0')}</td>
                        <td className="p-8 text-right font-black text-slate-900 text-3xl tracking-tighter leading-none italic scale-x-95 origin-right">{fmt(d.total)}</td>
                    </tr>))}</tbody>
                </table>
                {datos.length === 0 && <div className="p-32 text-center text-slate-200 font-black uppercase text-2xl italic opacity-50 tracking-tighter italic">Sin movimientos contables hoy</div>}
            </div>
        </div>
    );
}

// ==========================================
//      DASHBOARD: ANALÍTICA (RECHARTS)
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
            <CardStat title="Balance General" value={fmt(data.cajaMayor)} color="blue" icon={<TrendingUp size={30}/>}/>
            <CardStat title="Efectivo Hoy" value={fmt(0)} color="green" icon={<Wallet size={30}/>}/>
            <CardStat title="Valoración Almacén" value={fmt(data.valorInventario)} color="purple" icon={<Box size={30}/>}/>
            <CardStat title="Stock Bajo" value={data.lowStock} color="red" icon={<AlertTriangle size={30}/>}/>
        </div>
        <div className="bg-white p-16 rounded-[70px] shadow-sm border h-[550px] relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-5 transition-transform duration-1000 group-hover:scale-110"><TrendingUp size={300}/></div>
             <h3 className="font-black text-3xl mb-12 uppercase italic text-slate-800 tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-[10px] italic tracking-tighter leading-none italic">Análisis Operativo Semanal</h3>
             <ResponsiveContainer width="100%" height="80%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 14, fontWeight: '900', fill: '#cbd5e1', fontFamily: 'Inter'}} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '30px', border: 'none', boxShadow: '0 40px 80px -20px rgb(0 0 0 / 0.4)'}} />
                    <Bar dataKey="v" radius={[20, 20, 0, 0]} fill="#2563eb" barSize={55}>
                         {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 5 ? '#2563eb' : '#f1f5f9'} stroke={index===5?'#2563eb':'#e2e8f0'} strokeWidth={3}/>))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
        </div>
    </div>
  );
}

// ==========================================
//               HELPERS VISUALES
// ==========================================
function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
    const menuItems = [
        { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard size={20}/>, roles: ['Admin', 'Contador'] },
        { id: 'ventas', label: 'Ventas (TPV)', icon: <ShoppingCart size={20}/>, roles: ['Admin', 'Vendedor'] },
        { id: 'inventario', label: 'Bodegas e Inv.', icon: <Package size={20}/>, roles: ['Admin', 'Bodeguero'] },
        { id: 'produccion', label: 'Producción Ind.', icon: <Factory size={20}/>, roles: ['Admin', 'Prealistador', 'Produccion', 'Logistica'] },
        { id: 'nomina', label: 'Nómina PRO', icon: <Users size={20}/>, roles: ['Admin', 'Nomina'] },
        { id: 'conta', label: 'Contabilidad', icon: <Calculator size={20}/>, roles: ['Admin', 'Contador'] },
        { id: 'caja', label: 'Caja y Turno', icon: <Wallet size={20}/>, roles: ['Admin', 'Vendedor'] },
        { id: 'admin', label: 'Configuración', icon: <ShieldCheck size={20}/>, roles: ['Admin'] },
    ];
    return (
        <aside className="w-80 bg-[#0f172a] text-white flex flex-col p-8 shadow-2xl relative z-40 border-r border-white/5">
            <h1 className="text-3xl font-black italic mb-16 text-blue-400 uppercase tracking-tighter leading-none italic tracking-tighter italic">AccuCloud<span className="text-white">.</span></h1>
            <nav className="flex-1 space-y-3 overflow-y-auto pr-2">
                {menuItems.filter(m => m.roles.includes(user?.cargo)).map(m => (
                    <button key={m.id} onClick={()=>setActiveTab(m.id)} className={`w-full flex items-center px-8 py-5 rounded-[28px] transition-all duration-500 ${activeTab===m.id?'bg-blue-600 text-white shadow-2xl scale-105':'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
                        <span className="mr-5 scale-125">{m.icon}</span> <span className="font-black text-[12px] tracking-widest uppercase italic tracking-tighter italic leading-none">{m.label}</span>
                    </button>
                ))}
            </nav>
            <button onClick={onLogout} className="text-red-500 font-black text-[10px] uppercase tracking-[5px] p-5 hover:text-white transition-colors text-center border border-red-500/20 rounded-[25px] mt-10 shadow-lg leading-none italic">Cerrar Sesión Segura</button>
        </aside>
    );
}

function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50 shadow-green-200/50", blue: "text-blue-600 bg-blue-50 shadow-blue-200/50", purple: "text-purple-600 bg-purple-50 shadow-purple-200/50", red: "text-red-600 bg-red-50 shadow-red-200/50" };
    return (
        <div className="bg-white p-12 rounded-[60px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-5 transition-all duration-1000 group border-b-[10px] border-slate-100 cursor-default">
            <div className={`w-20 h-20 rounded-[35px] flex items-center justify-center mb-12 shadow-2xl group-hover:scale-110 transition-transform duration-500 ${c[color]}`}>{icon}</div>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[6px] mb-3 leading-none italic opacity-60 leading-none italic tracking-tighter leading-none italic">{"// " + title}</p>
            <h3 className="text-5xl font-black text-slate-800 tracking-tighter leading-none italic scale-x-90 origin-left tracking-tighter leading-none italic tracking-tighter italic leading-none italic">{value}</h3>
        </div>
    ); 
}

function PSEPage({ onBack }) { return <div className="h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center text-[10vw] font-black uppercase italic tracking-widest text-center px-20 leading-none animate-pulse">PASARELA<br/>BANCARIA<br/>$600.000<button onClick={onBack} className="text-xl mt-20 text-blue-500 underline uppercase tracking-[10px] italic font-black">Cerrar</button></div>; }