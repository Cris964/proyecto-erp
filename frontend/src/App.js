/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, RefreshCcw, Menu, TrendingUp, Factory, Truck, History, Settings, ChevronRight, CreditCard, Edit3, Trash2, Save, Play, CheckCircle, MapPin, Box, Database, Receipt, Layers, Plus, Search, Trash
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// CONFIGURACIÓN DE RED
axios.defaults.baseURL = window.location.origin;
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
          <main className="flex-1 overflow-auto p-6 md:p-10 relative">
             <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter capitalize italic leading-none">{activeTab}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px] mt-1">SISTEMA EMPRESARIAL V2.6</p>
                </div>
                <div className="bg-white px-5 py-2 rounded-2xl border shadow-sm font-black text-[10px] uppercase text-blue-600 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> {user.nombre} ({user.cargo})
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
                {activeTab === 'caja' && <CajaMasterView user={user}/>}
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
    const [pago, setPago] = useState({ recibido: '', metodo: 'Efectivo' });
    const [turno, setTurno] = useState(null);

    const load = async () => {
        const resP = await axios.get(`/api/productos?company_id=${user.company_id}`);
        const resT = await axios.get(`/api/turnos/activo/${user.id}`);
        setProds(resP.data || []);
        setTurno(resT.data);
    };
    useEffect(() => { load(); }, []);

    if(!turno) return <div className="p-20 bg-white rounded-[40px] text-center shadow-sm border border-dashed border-slate-200 animate-fade-in"><ShoppingCart size={48} className="mx-auto mb-4 text-slate-300"/><h3 className="text-xl font-black uppercase text-slate-400">Caja Cerrada</h3><p className="text-xs font-bold text-slate-400 mt-2">Abre un turno en el módulo de Caja para vender.</p></div>;

    const total = cart.reduce((acc, x) => acc + (x.precio * x.cant), 0);
    const cambio = pago.recibido ? parseFloat(pago.recibido) - total : 0;

    const addToCart = (p) => {
        const ex = cart.find(x => x.id === p.id);
        if(ex) setCart(cart.map(x => x.id === p.id ? {...x, cant: x.cant + 1} : x));
        else setCart([...cart, {...p, cant: 1}]);
    };

    const handleVenta = async () => {
        if(cart.length === 0) return alert("Carrito vacío");
        await axios.post('/api/ventas', { productos: cart, responsable: user.nombre, company_id: user.company_id, turno_id: turno.id });
        setCart([]); setPago({recibido:'', metodo:'Efectivo'}); load();
        alert("¡Venta Exitosa!");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[750px] animate-fade-in">
            <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 flex flex-col">
                <div className="flex items-center bg-slate-50 p-4 rounded-2xl focus-within:ring-2 ring-blue-500/20 transition-all border border-slate-100">
                    <Search className="mr-4 text-slate-400" size={24}/>
                    <input className="bg-transparent border-none outline-none font-bold text-lg w-full" placeholder="Buscar producto corporativo..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus/>
                </div>
                <div className="flex-1 mt-6 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 pr-2">
                    {prods.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase())).map(p=>(
                        <div key={p.id} onClick={()=>addToCart(p)} className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all flex flex-col justify-between h-[120px]">
                            <p className="font-black text-slate-800 uppercase text-[10px] leading-tight">{p.nombre}</p>
                            <p className="font-black text-blue-600 text-lg tracking-tighter leading-none italic">{fmt(p.precio)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-[#0f172a] rounded-[32px] shadow-xl p-8 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10 flex-1 overflow-y-auto pr-2">
                    <h3 className="text-xl font-black italic uppercase text-blue-400 mb-6 underline decoration-white/20 underline-offset-8">Ticket TPV</h3>
                    <div className="space-y-4">
                        {cart.map((x,i)=>(
                            <div key={i} className="flex justify-between items-center font-bold border-b border-white/5 pb-3">
                                <div className="flex flex-col"><span className="text-xs uppercase italic leading-none">{x.nombre.substring(0,14)}</span><span className="text-blue-400 text-[8px] font-black uppercase mt-1">Cant: {x.cant}</span></div>
                                <div className="flex items-center gap-3"><span>{fmt(x.precio * x.cant)}</span><button onClick={()=>setCart(cart.filter((_,idx)=>idx!==i))} className="text-red-400"><X size={14}/></button></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative z-10 mt-6 border-t border-white/10 pt-6">
                    <div className="flex justify-between font-black text-xl mb-4"><span>TOTAL:</span><span className="text-green-400">{fmt(total)}</span></div>
                    <div className="space-y-2 mb-6">
                        <label className="text-[9px] font-black uppercase text-slate-500">Monto Recibido</label>
                        <input className="w-full p-3 bg-white/5 rounded-xl font-black text-xl text-green-400 outline-none border border-white/10 text-center" type="number" value={pago.recibido} onChange={e=>setPago({...pago, recibido:e.target.value})}/>
                    </div>
                    {pago.recibido > 0 && <div className="flex justify-between font-black text-lg text-orange-400 mb-6"><span>CAMBIO:</span><span>{fmt(cambio)}</span></div>}
                    <button onClick={handleVenta} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg uppercase text-[10px] tracking-widest active:scale-95 transition-all">FINALIZAR COBRO</button>
                </div>
            </div>
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

    const handleAvanzar = async (id, estado) => {
        await axios.put(`/api/produccion/ordenes/${id}`, { estado, datos_logistica: {} });
        load();
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-1.5 bg-white border rounded-[22px] w-fit shadow-sm">
                <button onClick={()=>setSub('materia')} className={`px-8 py-2.5 rounded-xl font-black text-[9px] uppercase transition-all ${sub==='materia'?'bg-blue-600 text-white shadow-md':'text-slate-400 hover:bg-slate-50'}`}>1. INSUMOS</button>
                <button onClick={()=>setSub('kits')} className={`px-8 py-2.5 rounded-xl font-black text-[9px] uppercase transition-all ${sub==='kits'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>2. KITS / RECETAS</button>
                <button onClick={()=>setSub('ordenes')} className={`px-8 py-2.5 rounded-xl font-black text-[9px] uppercase transition-all ${sub==='ordenes'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>3. ÓRDENES OP-{numOrden}</button>
            </div>

            {sub === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 h-fit">
                        <h3 className="font-black text-sm mb-6 uppercase italic text-slate-800 flex items-center gap-3 tracking-tighter"><Database className="text-blue-600" size={18}/> Nuevo Químico</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/api/produccion/materia', {...formM, company_id:user.company_id}); load(); setFormM({nombre:'', unidad_medida:'mg', cantidad:0, costo:0});}} className="space-y-4">
                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-400" placeholder="Nombre de Insumo" value={formM.nombre} onChange={e=>setFormM({...formM, nombre:e.target.value})} required/>
                            <div className="grid grid-cols-2 gap-3">
                                <select className="p-3 bg-slate-50 rounded-xl font-black text-[10px] outline-none" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida: e.target.value})}><option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option></select>
                                <input className="p-3 bg-slate-50 rounded-xl font-bold border-none text-xs" type="number" placeholder="Stock" value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad:e.target.value})} required/>
                            </div>
                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none text-xs" type="number" placeholder="Costo Unitario" value={formM.costo} onChange={e=>setFormM({...formM, costo:e.target.value})} required/>
                            <button className="w-full py-4 bg-slate-900 text-white font-black rounded-xl shadow-lg uppercase text-[9px] tracking-widest hover:bg-black transition-all">Guardar en Almacén Técnico</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 font-black uppercase text-slate-400 border-b"><tr><th className="p-6">Material Técnico</th><th>Stock Disponible</th><th>Costo unit.</th><th className="p-6 text-right">Valorizado</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b last:border-none hover:bg-slate-50 transition"><td className="p-6 font-black text-slate-800 uppercase italic tracking-tighter text-sm">{m.nombre}</td><td className="font-bold text-blue-600">{m.cantidad} {m.unidad_medida}</td><td>{fmt(m.costo)}</td><td className="p-6 text-right font-black text-slate-900">{fmt(m.cantidad * m.costo)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {sub === 'kits' && (
                <div className="bg-slate-900 p-16 rounded-[60px] shadow-2xl relative overflow-hidden text-white h-[450px] flex items-center">
                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 transition-transform duration-[3s] hover:rotate-45"><Layers size={400}/></div>
                    <div className="max-w-md relative z-10">
                        <h3 className="text-4xl font-black italic uppercase tracking-tighter text-blue-400 mb-6 leading-none">Creador de Kits Dinámicos</h3>
                        <p className="text-slate-400 text-[11px] font-bold mb-10 leading-relaxed uppercase tracking-[3px]">Selecciona insumos del almacén técnico para generar fórmulas automáticas de producción masiva.</p>
                        <button onClick={()=>window.alert("Diseño de Receta habilitado en Versión 2.7")} className="px-12 py-5 bg-blue-600 text-white font-black rounded-[25px] shadow-xl uppercase text-[10px] tracking-widest hover:bg-white hover:text-blue-600 transition-all">+ Empezar Nueva Fórmula</button>
                    </div>
                </div>
            )}

            {sub === 'ordenes' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white p-8 rounded-[35px] border border-slate-100 flex flex-col md:flex-row justify-between items-center shadow-sm">
                        <div className="mb-4 md:mb-0 text-center md:text-left"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Pipeline de Fabricación</p><h4 className="text-2xl font-black text-blue-600 tracking-tighter italic leading-none uppercase tracking-tighter">Siguiente: OP-{numOrden}</h4></div>
                        <button onClick={async ()=>{ const n=window.prompt("Nombre del producto a fabricar:"); if(n){ await axios.post('/api/produccion/ordenes', {numero_orden: numOrden, nombre_producto: n, cantidad: 10, company_id: user.company_id}); load(); } }} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] shadow-xl hover:scale-105 transition-all uppercase tracking-widest">+ LANZAR ÓRDEN DE TRABAJO</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {ordenes.filter(o=>o.estado!=='Cerrado').map(o => (
                            <div key={o.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 border-l-[12px] border-blue-500 flex justify-between items-center transition-all hover:shadow-lg">
                                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none italic mb-2">ID INTERNO: {o.numero_orden}</p><h4 className="text-lg font-black text-slate-800 uppercase italic leading-none tracking-tighter">{o.nombre_producto}</h4><div className="mt-3"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">{o.estado}</span></div></div>
                                <div className="flex gap-3">
                                    {o.estado === 'Prealistamiento' && <button onClick={()=>handleAvanzar(o.id, 'Produccion')} className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg hover:scale-110 transition"><Play size={16}/></button>}
                                    {o.estado === 'Produccion' && <button onClick={()=>handleAvanzar(o.id, 'Logistica')} className="p-3 bg-green-600 text-white rounded-2xl shadow-lg hover:scale-110 transition"><CheckCircle size={16}/></button>}
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
    const neto = (sal + (sal <= 3501810 ? 249095 : 0)) - (sal * 0.08);
    setPreview({ ...e, neto });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex gap-2 p-1.5 bg-white border rounded-2xl w-fit shadow-sm">
          <button onClick={()=>setTab('list')} className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase ${tab==='list'?'bg-blue-600 text-white shadow-md':'text-slate-400 hover:bg-slate-50'}`}>Personal Vinculado</button>
          <button onClick={()=>setTab('add')} className={`px-6 py-2 rounded-xl font-black text-[9px] uppercase ${tab==='add'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>+ Nuevo Contrato</button>
      </div>

      {tab === 'add' ? (
          <div className="bg-white p-12 rounded-[50px] shadow-sm border border-slate-100 max-w-xl mx-auto animate-slide-up">
              <h3 className="font-black text-sm mb-8 uppercase text-slate-800 italic text-center tracking-[4px]">Nueva Vinculación</h3>
              <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/api/empleados', {...form, company_id: user.company_id}); setForm({nombre:'', email:'', salario:'', eps:'', arl:'', pension:''}); setTab('list'); load();}} className="space-y-4">
                  <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" placeholder="Nombre Completo" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" placeholder="Email Corporativo" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/>
                  <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none text-xs outline-none focus:ring-1 ring-blue-500" type="number" placeholder="Salario Mensual Pactado" value={form.salario} onChange={e=>setForm({...form, salario: e.target.value})} required/>
                  <div className="grid grid-cols-3 gap-3">
                    <input className="p-3 bg-slate-100 rounded-xl font-black text-[8px] uppercase outline-none focus:ring-1 ring-blue-200" placeholder="EPS" onChange={e=>setForm({...form, eps:e.target.value})}/>
                    <input className="p-3 bg-slate-100 rounded-xl font-black text-[8px] uppercase outline-none focus:ring-1 ring-blue-200" placeholder="ARL" onChange={e=>setForm({...form, arl:e.target.value})}/>
                    <input className="p-3 bg-slate-100 rounded-xl font-black text-[8px] uppercase outline-none focus:ring-1 ring-blue-200" placeholder="AFP" onChange={e=>setForm({...form, pension:e.target.value})}/>
                  </div>
                  <button className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-[9px] tracking-widest active:scale-95 transition-all">Firmar Contrato Digital</button>
              </form>
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                  <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 font-black uppercase text-slate-400 border-b"><tr><th className="p-6">Funcionario</th><th className="text-right p-6">Salario</th><th className="p-6 text-center">Liquidar</th></tr></thead>
                      <tbody>{empleados.map(e=>(<tr key={e.id} className="border-b hover:bg-slate-50 transition last:border-none">
                                <td className="p-6 font-black text-slate-800 uppercase italic leading-none">{e.nombre}</td>
                                <td className="font-bold text-slate-400 text-right">{fmt(e.salario)}</td>
                                <td className="text-center p-6"><button onClick={()=>liquidar(e)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Calculator size={20}/></button></td>
                            </tr>))}</tbody>
                  </table>
                  {empleados.length === 0 && <div className="p-20 text-center opacity-10 font-black uppercase italic text-xl">Sin personal contratado</div>}
              </div>
              {preview && (
                  <div className="bg-white p-12 rounded-[50px] shadow-2xl border-l-[15px] border-blue-600 animate-slide-up h-fit relative">
                      <div className="absolute top-0 right-0 p-8 opacity-5"><Receipt size={120}/></div>
                      <h4 className="text-2xl font-black text-slate-800 uppercase text-center mb-8 italic tracking-tighter underline decoration-blue-500 decoration-4 underline-offset-8">{preview.nombre}</h4>
                      <div className="bg-[#0f172a] p-10 rounded-[40px] text-center text-5xl font-black text-white shadow-xl shadow-blue-900/40 mb-10 tracking-tighter leading-none italic">{fmt(preview.neto)}</div>
                      <div className="space-y-3 border-y border-slate-100 py-8 font-bold text-slate-400 uppercase text-[9px] tracking-widest leading-none">
                            <div className="flex justify-between"><span>Sueldo Bruto:</span><span>{fmt(preview.sal)}</span></div>
                            <div className="flex justify-between text-green-600"><span>(+) Auxilio de Transporte 2026:</span><span>{fmt(preview.aux)}</span></div>
                            <div className="flex justify-between text-red-500"><span>(-) Deducciones Legales (8%):</span><span>-{fmt(preview.sal * 0.08)}</span></div>
                      </div>
                      <button onClick={()=>window.alert("Comprobante enviado al email corporativo")} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-[9px] flex items-center justify-center gap-3 mt-10 active:scale-95 transition-all"><Mail size={16}/> ENVIAR DESPRENDIBLE</button>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}

// ==========================================
//      MÓDULO: ADMINISTRACIÓN (EDICIÓN FULL)
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
        window.alert("¡Base de datos de colaboradores actualizada!");
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="bg-white p-12 rounded-[60px] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5"><Users size={120}/></div>
                <h3 className="font-black text-2xl mb-10 italic uppercase tracking-tighter text-slate-800 underline decoration-blue-500 decoration-8 underline-offset-8 leading-none tracking-tighter italic">{form.id ? 'Modificar Acceso' : 'Vincular Colaborador al Sistema'}</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-300 ml-4 tracking-widest">Identidad</label><input className="w-full p-4 bg-slate-50 rounded-[22px] font-bold border-none outline-none focus:ring-1 ring-blue-500 transition-all text-xs" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-300 ml-4 tracking-widest">Email Corporativo</label><input className="w-full p-4 bg-slate-50 rounded-[22px] font-bold border-none outline-none focus:ring-1 ring-blue-500 transition-all text-xs" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-300 ml-4 tracking-widest">Clave de Acceso</label><input className="w-full p-4 bg-slate-50 rounded-[22px] font-bold border-none outline-none focus:ring-1 ring-blue-500 transition-all text-xs" type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required={!form.id}/></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-300 ml-4 tracking-widest">Cargo ERP</label><select className="w-full p-4 bg-slate-50 rounded-[22px] font-black text-slate-700 text-xs outline-none" value={form.cargo} onChange={e=>setForm({...form, cargo: e.target.value})}>
                        <option value="Admin">Administrador</option><option value="Vendedor">Vendedor / TPV</option><option value="Bodeguero">Almacén / Lotes</option>
                        <option value="Prealistador">Prealistador</option><option value="Produccion">Técnico Fabricación</option><option value="Logistica">Logística</option>
                    </select></div>
                    <div className="flex items-end"><button className="w-full py-5 bg-blue-600 text-white font-black rounded-[22px] shadow-xl hover:bg-black transition-all transform active:scale-95 uppercase text-[10px] tracking-widest leading-none italic">Guardar</button></div>
                </form>
            </div>
            <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[9px] font-black uppercase border-b tracking-[5px] text-slate-400"><tr><th className="p-10">Colaborador Vinculado</th><th>Rol Corporativo</th><th className="text-center p-10">Control Administrativo</th></tr></thead>
                    <tbody>{usuarios.map(u => (
                        <tr key={u.id} className="border-b hover:bg-slate-50 transition-all last:border-none">
                            <td className="p-10 font-black text-slate-800 text-xl tracking-tighter uppercase italic leading-none">{u.nombre} <br/><span className="text-[10px] font-bold text-slate-300 lowercase italic tracking-tight leading-none">{u.email}</span></td>
                            <td><span className="bg-blue-50 text-blue-600 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest italic">{u.cargo}</span></td>
                            <td className="p-10 text-center flex justify-center gap-6 leading-none">
                                <button onClick={()=> {setForm(u); window.scrollTo({top:0, behavior:'smooth'})}} className="p-5 bg-blue-50 text-blue-600 rounded-[25px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={24}/></button>
                                <button onClick={async ()=>{if(window.confirm("¿Dar de baja permanente?")){ await axios.delete(`/api/admin/usuarios/${u.id}`); load(); }}} className="p-5 bg-red-50 text-red-500 rounded-[25px] hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={24}/></button>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: DASHBOARD (GRÁFICAS PREMIUM)
// ==========================================
function ResumenView({ user }) {
  const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
  const chartData = [{ name: 'Lunes', v: 400 }, { name: 'Martes', v: 300 }, { name: 'Miércoles', v: 600 }, { name: 'Jueves', v: 800 }, { name: 'Viernes', v: 500 }, { name: 'Sábado', v: 900 }, { name: 'Domingo', v: 200 }];
  
  useEffect(() => { axios.get(`/api/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); }, [user]);

  return (
    <div className="space-y-12 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <CardStat title="Balance General" value={fmt(data.cajaMayor)} color="blue" icon={<TrendingUp size={32}/>}/>
            <CardStat title="Efectivo TPV" value={fmt(0)} color="green" icon={<Wallet size={32}/>}/>
            <CardStat title="Bodega Valorada" value={fmt(data.valorInventario)} color="purple" icon={<Box size={32}/>}/>
            <CardStat title="Stock Crítico" value={data.lowStock} color="red" icon={<AlertTriangle size={32}/>}/>
        </div>
        <div className="bg-white p-16 rounded-[80px] shadow-sm border border-slate-100 h-[600px] relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-5 transition-transform duration-1000 group-hover:scale-110"><TrendingUp size={300}/></div>
             <h3 className="font-black text-4xl mb-16 uppercase italic text-slate-800 tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-[15px] leading-none italic tracking-tighter italic">Análisis Estratégico Corporativo</h3>
             <ResponsiveContainer width="100%" height="80%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 14, fontWeight: '900', fill: '#cbd5e1', fontFamily: 'Inter'}} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '40px', border: 'none', boxShadow: '0 40px 80px -20px rgb(0 0 0 / 0.4)'}} />
                    <Bar dataKey="v" radius={[25, 25, 0, 0]} fill="#2563eb" barSize={70}>
                         {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 5 ? '#2563eb' : '#f1f5f9'} stroke={index===5?'#2563eb':'#e2e8f0'} strokeWidth={3}/>))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
        </div>
    </div>
  );
}

// ==========================================
//      MÓDULO: CAJA MAESTRA (ULTRA LUX)
// ==========================================
function CajaMasterView({ user }) {
    const [turno, setTurno] = useState(null);
    const recargar = () => axios.get('/api/turnos/activo/' + user.id).then(res => setTurno(res.data));
    useEffect(() => { recargar(); }, []);

    const handleApertura = async () => {
        const pass = window.prompt("Introduce la CLAVE MAESTRA corporativa (admin123):");
        if (pass === 'admin123') {
            const base = window.prompt("Monto inicial efectivo:", "0");
            await axios.post('/api/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id });
            recargar();
        } else { window.alert("❌ Acceso Denegado."); }
    };

    return (
        <div className="bg-[#0f172a] p-24 rounded-[90px] shadow-2xl text-center max-w-2xl mx-auto border-t-[30px] border-blue-600 animate-slide-up relative overflow-hidden group border-b-[20px] border-white/5">
            <div className="absolute top-0 left-0 p-10 opacity-5 -rotate-12 transition-transform group-hover:rotate-12 duration-1000"><Wallet size={250} className="text-white"/></div>
            <div className={`w-32 h-32 mx-auto mb-10 rounded-[50px] flex items-center justify-center shadow-inner ${turno ? 'bg-green-500 text-white animate-pulse' : 'bg-red-500 text-white'}`}>
                <Lock size={64} className="group-hover:rotate-12 transition-transform duration-500"/>
            </div>
            <h3 className="text-6xl font-black mb-10 uppercase italic tracking-tighter text-white leading-none tracking-tighter italic">Caja Corporativa</h3>
            {turno ? (
                <div className="space-y-12 animate-fade-in relative z-10">
                    <div className="p-16 bg-white/5 backdrop-blur-md rounded-[65px] border border-white/10 shadow-inner">
                        <p className="text-[12px] font-black text-blue-400 uppercase tracking-[10px] mb-8 leading-none italic opacity-60">Fondo Líquido Actual</p>
                        <h2 className="text-9xl font-black text-white tracking-tighter leading-none scale-x-95 origin-center italic">{fmt(turno.total_vendido)}</h2>
                    </div>
                    <button onClick={async ()=>{ if(window.confirm("¿Cerrar turno?")){ await axios.put('/api/turnos/finalizar', { turno_id: turno.id }); recargar(); } }} className="w-full py-10 bg-red-600 text-white font-black rounded-[45px] shadow-xl hover:bg-red-700 transition-all uppercase text-sm tracking-[5px] active:scale-95 shadow-red-900/30 italic">Realizar Cierre de Turno</button>
                </div>
            ) : (
                <div className="space-y-10 animate-fade-in relative z-10">
                    <p className="text-slate-400 font-bold px-20 text-xl italic tracking-tight opacity-60 uppercase leading-relaxed tracking-tighter italic">Habilitación Administrativa Requerida</p>
                    <button onClick={handleApertura} className="w-full py-10 bg-blue-600 text-white font-black rounded-[45px] shadow-2xl animate-bounce uppercase text-xs tracking-[8px] hover:bg-white hover:text-blue-600 transition-all shadow-blue-900/40 italic">Aperturar con Clave Maestra</button>
                </div>
            )}
        </div>
    );
}

// ==========================================
//      HELPERS (SIDEBAR, LOGIN, CARDS)
// ==========================================
function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
    const menuItems = [
        { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard size={22}/>, roles: ['Admin', 'Contador'] },
        { id: 'ventas', label: 'Ventas (TPV)', icon: <ShoppingCart size={22}/>, roles: ['Admin', 'Vendedor'] },
        { id: 'inventario', label: 'Bodegas e Inv.', icon: <Package size={22}/>, roles: ['Admin', 'Bodeguero'] },
        { id: 'produccion', label: 'Producción Ind.', icon: <Factory size={22}/>, roles: ['Admin', 'Prealistador', 'Produccion', 'Logistica'] },
        { id: 'nomina', label: 'Nómina PRO', icon: <Users size={22}/>, roles: ['Admin', 'Nomina'] },
        { id: 'conta', label: 'Contabilidad', icon: <Calculator size={22}/>, roles: ['Admin', 'Contador'] },
        { id: 'caja', label: 'Caja y Turno', icon: <Wallet size={22}/>, roles: ['Admin', 'Vendedor'] },
        { id: 'admin', label: 'Configuración', icon: <ShieldCheck size={22}/>, roles: ['Admin'] },
    ];
    return (
        <aside className="w-80 bg-[#0f172a] text-white flex flex-col p-8 shadow-2xl relative z-40 border-r border-white/5">
            <h1 className="text-3xl font-black italic mb-20 text-blue-400 uppercase tracking-tighter leading-none italic tracking-tighter">AccuCloud<span className="text-white">.</span></h1>
            <nav className="flex-1 space-y-3.5 overflow-y-auto pr-2">
                {menuItems.filter(m => m.roles.includes(user?.cargo)).map(m => (
                    <button key={m.id} onClick={()=>setActiveTab(m.id)} className={`w-full flex items-center px-8 py-5 rounded-[28px] transition-all duration-500 ${activeTab===m.id?'bg-blue-600 text-white shadow-[0_20px_50px_rgba(37,99,235,0.3)] scale-105':'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
                        <span className="mr-5 scale-125">{m.icon}</span> <span className="font-black text-sm tracking-widest uppercase italic tracking-tighter italic leading-none">{m.label}</span>
                    </button>
                ))}
            </nav>
            <button onClick={onLogout} className="text-red-500 font-black text-[12px] uppercase tracking-[5px] p-6 hover:text-white transition-colors text-center border border-red-500/20 rounded-[35px] mt-10 italic shadow-lg">Cerrar Sesión Segura</button>
        </aside>
    );
}

function LoginScreen({ onLogin, onBuy }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post('/api/login', { email, password });
        if (res.data.success) onLogin(res.data.user);
        else window.alert('Acceso Denegado: Credenciales corporativas no válidas.');
    } catch (e) { window.alert('Estableciendo conexión segura... espera 10 seg.'); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[1000px] h-[1000px] bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[200px]"></div>
      <div className="bg-white p-24 rounded-[110px] shadow-2xl w-full max-w-2xl border-t-[25px] border-slate-900 animate-slide-up relative z-10 border-b-[20px] border-slate-100">
        <h1 className="text-8xl font-black text-center text-slate-800 mb-4 italic tracking-tighter uppercase leading-none italic tracking-tighter italic">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-center text-[11px] font-black text-slate-400 uppercase tracking-[12px] mb-24 italic opacity-60 leading-none tracking-widest uppercase italic">Intelligence Enterprise System</p>
        <form onSubmit={handleAuth} className="space-y-12">
          <input className="w-full p-9 bg-slate-100 rounded-[55px] font-black outline-none focus:ring-[20px] ring-blue-50 transition-all text-3xl tracking-tighter text-center italic" placeholder="Email Corporativo" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" class="w-full p-9 bg-slate-100 rounded-[55px] font-black outline-none focus:ring-[20px] ring-blue-50 transition-all text-3xl tracking-tighter text-center" placeholder="********" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button className="w-full bg-slate-900 text-white font-black py-12 rounded-[55px] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase text-sm tracking-[12px] mt-16 shadow-blue-900/30 italic">Entrar al Ecosistema</button>
        </form>
        <div className="mt-16 p-10 bg-green-50 border-2 border-green-200 rounded-[50px] text-center cursor-pointer group hover:bg-green-100 transition-all" onClick={onBuy}>
            <button className="w-full py-5 bg-green-600 text-white font-black rounded-[25px] text-[11px] shadow-lg group-hover:scale-105 transition-all uppercase tracking-widest flex items-center justify-center gap-4 italic shadow-green-900/20 tracking-[4px]"><CreditCard size={20}/> Adquirir Plan Pro 2026</button>
        </div>
      </div>
    </div>
  );
}

function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50 shadow-green-200/50", blue: "text-blue-600 bg-blue-50 shadow-blue-200/50", purple: "text-purple-600 bg-purple-50 shadow-purple-200/50", red: "text-red-600 bg-red-50 shadow-red-200/50" };
    return <div className="bg-white p-16 rounded-[80px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-8 transition-all duration-1000 group cursor-default border-b-[15px] border-slate-100 leading-none"><div className={`w-28 h-28 rounded-[40px] flex items-center justify-center mb-16 shadow-2xl group-hover:scale-110 transition-transform duration-500 ${c[color]}`}>{icon}</div><p className="text-[14px] font-black text-slate-400 uppercase tracking-[10px] mb-4 opacity-60 italic tracking-tighter">{"// " + title}</p><h3 className="text-7xl font-black text-slate-800 tracking-tighter italic scale-x-90 origin-left tracking-tighter italic">{value}</h3></div>; 
}

function ContabilidadView({ user }) { return <div className="p-32 bg-white rounded-[70px] text-center font-black uppercase text-3xl italic opacity-10">Balance General y Libros Corporativos</div>; }
function PSEPage({ onBack }) { return <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center text-[10vw] font-black uppercase italic tracking-widest text-center px-20 leading-none animate-pulse">PASARELA<br/>BANCARIA<br/>$600.000<button onClick={onBack} className="text-xl mt-20 text-blue-500 underline uppercase tracking-[10px] italic font-black">Cerrar</button></div>; }