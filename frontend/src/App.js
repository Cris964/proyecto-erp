/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Factory, ShieldCheck, Plus, X, Truck, 
  CheckCircle2, CreditCard, Clock, Calculator, ArrowRight, Settings, 
  User, Moon, Sun, LifeBuoy, Camera, Search, TrendingUp, ChevronRight, Box, ClipboardList
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

axios.defaults.baseURL = window.location.origin + '/api';
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('erp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

// ==========================================
//           APP MASTER COMPONENT
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [loading, setLoading] = useState(true);
  const [showPSE, setShowPSE] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode; setDarkMode(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-blue-600">CARGANDO ACCUCLOUD PRO...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;
  if (!user) return <Login onLogin={(d) => { setUser(d.user); localStorage.setItem('erp_user', JSON.stringify(d.user)); localStorage.setItem('erp_token', d.token); }} onBuy={()=>setShowPSE(true)} />;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden transition-all duration-300">
        
        {/* SIDEBAR DESIGN PREMIUM */}
        <aside className="w-80 bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col p-8 shadow-2xl z-20">
          <div className="mb-10 flex justify-between items-center">
            <h1 className="text-3xl font-black italic text-slate-900 dark:text-white">ACCUCLOUD<span className="text-blue-600">.</span></h1>
            <button onClick={toggleTheme} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">{darkMode ? <Sun size={18} className="text-yellow-500"/> : <Moon size={18}/>}</button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              <MenuBtn icon={<LayoutDashboard/>} label="Dashboard" active={tab==='dashboard'} onClick={()=>setTab('dashboard')} />
              <MenuBtn icon={<ShoppingCart/>} label="Ventas TPV" active={tab==='ventas'} onClick={()=>setTab('ventas')} />
              <MenuBtn icon={<Package/>} label="Inventario PRO" active={tab==='inventario'} onClick={()=>setTab('inventario')} />
              <MenuBtn icon={<Factory/>} label="Producción PRO" active={tab==='produccion'} onClick={()=>setTab('produccion')} />
              <MenuBtn icon={<Users/>} label="Nómina Cloud" active={tab==='nomina'} onClick={()=>setTab('nomina')} />
              <MenuBtn icon={<Wallet/>} label="Cajas" active={tab==='caja'} onClick={()=>setTab('caja')} />
              <MenuBtn icon={<Settings/>} label="Configuración" active={tab==='config'} onClick={()=>setTab('config')} />
          </nav>

          <div className="pt-6 border-t dark:border-slate-800 mt-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black overflow-hidden shadow-inner">
                      {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover rounded-xl" /> : user.nombre.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                      <p className="text-sm font-black text-slate-800 dark:text-white truncate">{user.nombre}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{user.cargo}</p>
                  </div>
              </div>
              <button onClick={()=>{localStorage.clear(); window.location.reload();}} className="text-red-500 font-bold text-xs uppercase p-4 rounded-2xl w-full hover:bg-red-50 dark:hover:bg-red-900/20 transition">Cerrar Sesión</button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-12">
            <div className="animate-fade-in pb-10">
                {tab==='dashboard' && <DashboardView />}
                {tab==='ventas' && <VentasView user={user} />}
                {tab==='inventario' && <InventarioView />}
                {tab==='produccion' && <ProduccionView user={user} />}
                {tab==='nomina' && <NominaView />}
                {tab==='caja' && <CajaView user={user} />}
                {tab==='config' && <ConfigView user={user} setUser={setUser} />}
            </div>
        </main>
      </div>
    </div>
  );
}

// ==========================================
//           VISTAS (CONTENIDO REAL)
// ==========================================

function DashboardView() {
    const [data, setData] = useState({ cajaMayor: 0, topProducts: [], lowStock: 0 });
    useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-3 gap-8 text-white">
                <CardStat title="Caja Mayor (Ventas + Base)" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
                <CardStat title="Alertas Inventario" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
                <CardStat title="Licencia Premium" value="Activa 2026" icon={<ShieldCheck/>} color="green" />
            </div>

            <div className="grid grid-cols-2 gap-10">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[50px] shadow-sm border dark:border-slate-800">
                    <h3 className="font-black text-xl mb-10 flex items-center gap-3 text-slate-400 uppercase text-[10px] tracking-widest"><TrendingUp className="text-blue-600"/> Rendimiento Semanal</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{n:'L',v:400},{n:'M',v:700},{n:'M',v:500},{n:'J',v:900},{n:'V',v:1200},{n:'S',v:1500}]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1}/>
                                <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight:'bold'}}/>
                                <Bar dataKey="v" fill="#2563eb" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[50px] shadow-sm border dark:border-slate-800 h-[450px] overflow-auto">
                    <h3 className="font-black text-xl mb-8 text-slate-400 uppercase text-[10px]">Top 5 Productos Vendidos</h3>
                    <div className="space-y-4">
                        {data.topProducts.map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800 rounded-[30px] mb-3 border dark:border-slate-700">
                                <span className="font-black text-slate-800 dark:text-white">{p.nombre_producto}</span>
                                <span className="bg-blue-600 text-white px-5 py-1 rounded-full font-black text-[10px] uppercase">{p.total} Uds</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function VentasView({ user }) {
    const [prods, setProds] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState("");
    const [turno, setTurno] = useState(null);

    const load = useCallback(() => {
        axios.get('/productos').then(res => setProds(res.data));
        axios.get('/turnos/activo/'+user.id).then(res => setTurno(res.data));
    }, [user.id]);

    useEffect(() => { load(); }, [load]);

    const addToCart = (p) => {
        const exist = cart.find(i => i.id === p.id);
        if(exist) setCart(cart.map(i => i.id === p.id ? {...i, cantidad: i.cantidad + 1} : i));
        else setCart([...cart, {...p, cantidad: 1}]);
    };

    if(!turno) return <div className="p-20 bg-white dark:bg-slate-900 rounded-[60px] border-4 border-dashed text-center font-black text-slate-300 dark:text-slate-700 text-4xl uppercase">Debe abrir caja para facturar</div>;

    return (
        <div className="grid grid-cols-3 gap-10 h-full">
            <div className="col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <Search className="text-slate-400"/>
                    <input className="w-full bg-transparent font-bold outline-none dark:text-white text-lg" placeholder="Buscar por nombre..." onChange={e=>setSearch(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-6 overflow-auto max-h-[600px] pr-2">
                    {prods.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase())).map(p => (
                        <div key={p.id} onClick={()=>addToCart(p)} className="bg-white dark:bg-slate-900 p-6 rounded-[40px] border dark:border-slate-800 shadow-sm hover:border-blue-600 cursor-pointer transition-all hover:scale-[1.03]">
                            <div className="h-20 w-full bg-slate-50 dark:bg-slate-800 rounded-[30px] mb-4 flex items-center justify-center text-slate-300"><Box size={32}/></div>
                            <p className="font-black dark:text-white truncate mb-1">{p.nombre}</p>
                            <p className="text-xl font-black text-blue-600">{fmt(p.costo_venta)}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-2">STOCK: {p.stock}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[60px] shadow-2xl border-t-[20px] border-blue-600 h-fit sticky top-0 border dark:border-slate-800">
                <h3 className="text-[10px] font-black uppercase text-slate-400 mb-8 text-center tracking-widest">Carrito de Ventas</h3>
                <div className="space-y-4 mb-10 max-h-60 overflow-auto px-2">
                    {cart.map((c, i) => (
                        <div key={i} className="flex justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl">
                            <div className="flex flex-col"><span className="font-bold text-xs dark:text-white">{c.nombre}</span><span className="text-[10px] font-black text-blue-600">{c.cantidad} unidades</span></div>
                            <span className="font-black text-sm dark:text-white">{fmt(c.costo_venta * c.cantidad)}</span>
                        </div>
                    ))}
                </div>
                <div className="text-center mb-10 border-t dark:border-slate-800 pt-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Total a Recaudar</p>
                    <h2 className="text-6xl font-black text-slate-800 dark:text-white tracking-tighter">{fmt(cart.reduce((s,i)=>s+(i.costo_venta*i.cantidad),0))}</h2>
                </div>
                <button onClick={async()=>{ await axios.post('/api/ventas', {productos:cart, turno_id:turno.id}); alert("Venta Exitosa"); setCart([]); load(); }} className="w-full py-7 bg-blue-600 text-white font-black rounded-[30px] shadow-xl uppercase transition hover:scale-[1.03]">Cobrar Factura</button>
            </div>
        </div>
    );
}

function InventarioView() {
    const [sub, setSub] = useState('list');
    const [items, setItems] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [fP, setFP] = useState({ sku:'', nombre:'', fecha_vencimiento:'', costo_compra:0, costo_venta:0, stock:0, min_stock:5, bodega_id:'' });

    const load = useCallback(() => {
        axios.get('/productos').then(res => setItems(res.data));
        axios.get('/bodegas').then(res => setBodegas(res.data));
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleSave = async (e) => {
        e.preventDefault();
        await axios.post('/api/productos', fP);
        alert("Producto Sincronizado"); load(); setSub('list');
    };

    return (
        <div className="space-y-10">
            <div className="flex gap-4 p-2 bg-white dark:bg-slate-900 rounded-[28px] w-fit shadow-lg border dark:border-slate-800">
                <button onClick={()=>setSub('list')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>LISTADO</button>
                <button onClick={()=>setSub('new')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='new'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>AGREGAR</button>
                <button onClick={()=>setSub('bod')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='bod'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>BODEGAS</button>
            </div>

            {sub==='list' && (
                <div className="bg-white dark:bg-slate-900 rounded-[50px] border dark:border-slate-800 shadow-2xl overflow-hidden text-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest border-b dark:border-slate-700">
                            <tr><th className="p-8">Cod</th><th>Producto</th><th>Vencimiento</th><th>Compra</th><th>Venta</th><th>Stock</th><th>Margen</th></tr>
                        </thead>
                        <tbody>{items.map(p => (
                            <tr key={p.id} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                <td className="p-8 font-bold text-slate-400">#{p.sku}</td>
                                <td className="font-black dark:text-white">{p.nombre}</td>
                                <td className="text-red-500 font-bold">{p.fecha_vencimiento}</td>
                                <td>{fmt(p.costo_compra)}</td>
                                <td className="font-black text-blue-600">{fmt(p.costo_venta)}</td>
                                <td className={`font-black ${p.stock <= p.min_stock ? 'text-red-500 animate-pulse' : 'dark:text-white'}`}>{p.stock}</td>
                                <td><span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-xl font-black">{(((p.costo_venta-p.costo_compra)/p.costo_venta)*100).toFixed(0)}%</span></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}

            {sub==='new' && (
                <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-12 rounded-[60px] border dark:border-slate-800 shadow-2xl max-w-2xl mx-auto space-y-6">
                    <h3 className="text-2xl font-black italic dark:text-white text-center">Nuevo Ingreso de Producto</h3>
                    <input className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold border-none dark:text-white" placeholder="Nombre Comercial" onChange={e=>setFP({...fP, nombre:e.target.value})} required/>
                    <input className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold border-none dark:text-white" placeholder="Código SKU" onChange={e=>setFP({...fP, sku:e.target.value})} required/>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Costo de Compra</label><input className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold border-none dark:text-white" type="number" onChange={e=>setFP({...fP, costo_compra:e.target.value})} required/></div>
                        <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Precio de Venta</label><input className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold border-none dark:text-white" type="number" onChange={e=>setFP({...fP, costo_venta:e.target.value})} required/></div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Stock Inicial</label><input className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold border-none dark:text-white" type="number" onChange={e=>setFP({...fP, stock:e.target.value})} required/></div>
                        <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Vencimiento</label><input className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold border-none dark:text-white" type="date" onChange={e=>setFP({...fP, fecha_vencimiento:e.target.value})} required/></div>
                    </div>
                    <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase transition hover:scale-[1.02]">Guardar en Nube</button>
                </form>
            )}

            {sub==='bod' && (
                <div className="grid grid-cols-2 gap-12 h-fit">
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-[50px] border dark:border-slate-800 shadow-2xl space-y-6 h-fit text-center">
                        <h3 className="text-2xl font-black italic dark:text-white">Registrar Dependencia</h3>
                        <input className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border-none mb-4 dark:text-white" id="bN" placeholder="Nombre Bodega" />
                        <textarea className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border-none mb-6 dark:text-white" id="bD" placeholder="Detalles de ubicación" />
                        <button onClick={async()=>{ await axios.post('/api/bodegas', {nombre:document.getElementById('bN').value, detalles:document.getElementById('bD').value}); alert("Creada"); load(); }} className="w-full py-6 bg-slate-900 dark:bg-blue-600 text-white font-black rounded-3xl">CREAR BODEGA</button>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-[50px] border dark:border-slate-800 shadow-sm overflow-hidden h-fit">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest border-b dark:border-slate-700"><tr><th className="p-8">Nombre</th><th>Detalles</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b dark:border-slate-800"><td className="p-8 font-black dark:text-white">{b.nombre}</td><td className="p-8 text-xs text-slate-400">{b.detalles}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- VISTA PRODUCCIÓN PRO ---
function ProduccionView({ user }) {
    const [sub, setSub] = useState('ordenes');
    const [ordenes, setOrdenes] = useState([]);
    const [recetas, setRecetas] = useState([]);
    const load = useCallback(() => {
        axios.get('/produccion/ordenes').then(res => setOrdenes(res.data));
        axios.get('/produccion/recetas').then(res => setRecetas(res.data));
    }, []);
    useEffect(() => { load(); }, [load]);

    const avanzar = async (id, estado, out = 0, obs = "") => {
        await axios.put(`/api/produccion/ordenes/${id}/avanzar`, { estado, out, obs });
        load();
        alert(`Etapa ${estado} Registrada`);
    };

    return (
        <div className="space-y-8">
            <div className="flex gap-4 p-2 bg-white dark:bg-slate-900 rounded-[28px] w-fit shadow-lg border dark:border-slate-800">
                <button onClick={()=>setSub('recetas')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='recetas'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>KITS</button>
                <button onClick={()=>setSub('ordenes')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='ordenes'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>ÓRDENES</button>
            </div>

            {sub==='recetas' && (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-[50px] border dark:border-slate-800 shadow-2xl">
                    <h3 className="text-2xl font-black italic mb-10 text-slate-800 dark:text-white text-center">Configurar Receta Maestra</h3>
                    <div className="grid grid-cols-2 gap-10">
                        {recetas.map(r => (
                            <div key={r.id} className="p-10 bg-slate-50 dark:bg-slate-800 rounded-[45px] border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <p className="font-black text-2xl text-blue-600 mb-6 uppercase">{r.nombre_kit}</p>
                                <div className="text-xs font-bold text-slate-500 italic">Lista de insumos vinculados</div>
                            </div>
                        ))}
                        <button onClick={async()=>{ const n = prompt("Nombre?"); await axios.post('/api/produccion/recetas', {nombre:n, descripcion:'...'}); load(); }} className="p-10 border-4 border-dotted rounded-[45px] flex items-center justify-center text-slate-300 font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase">+ Nueva Receta</button>
                    </div>
                </div>
            )}

            {sub==='ordenes' && (
                <div className="space-y-10">
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[50px] border dark:border-slate-800 shadow-2xl flex gap-8 items-end border-t-[15px] border-blue-600">
                        <div className="flex-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Medicamento</label><select id="rI" className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black border-none dark:text-white">{recetas.map(r=><option key={r.id} value={r.id}>{r.nombre_kit}</option>)}</select></div>
                        <div className="w-32"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Lote</label><input id="rC" type="number" className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black text-center dark:text-white" defaultValue="1" /></div>
                        <button onClick={async()=>{ await axios.post('/api/produccion/ordenes', {receta_id:document.getElementById('rI').value, cantidad:document.getElementById('rC').value}); load(); alert("Orden Montada"); }} className="bg-blue-600 text-white px-12 py-5 rounded-3xl font-black shadow-xl uppercase">Lanzar Órden</button>
                    </div>
                    {ordenes.map(o => (
                        <div key={o.id} className="bg-white dark:bg-slate-900 p-10 rounded-[45px] border dark:border-slate-800 shadow-sm flex justify-between items-center group hover:border-blue-500 transition-all">
                            <div><h4 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase">{o.numero_orden} - {o.nombre_kit}</h4><p className="text-[10px] font-bold text-slate-400 uppercase mt-3"><span>Montó: {o.usuario_monta}</span></p></div>
                            <div className="flex items-center gap-8">
                                <div className="text-right"><p className="text-[10px] font-black uppercase text-slate-400 mb-1 uppercase">Requerido</p><p className="font-black text-2xl dark:text-white">{o.cantidad_requerida}</p></div>
                                <span className={`px-6 py-2 rounded-2xl font-black text-[10px] uppercase border ${o.estado==='Terminada'?'bg-green-100 text-green-700 border-green-200':'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>{o.estado}</span>
                                {o.estado==='Montada' && <button onClick={()=>avanzar(o.id, 'Alistada')} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl">Alistar Materia</button>}
                                {o.estado==='Alistada' && <button onClick={()=>{ const out = prompt("Salida?"); avanzar(o.id, 'Procesada', out, '...'); }} className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase">Procesar Orden</button>}
                                {o.estado==='Procesada' && <button onClick={()=>avanzar(o.id, 'Terminada')} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase">Recibir Terminado</button>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function NominaView() {
    const [emps, setEmps] = useState([]);
    const [fN, setFN] = useState({ nombre:'', documento:'', valor_dia:0, hire_date:'', eps:'', arl:'', pension:'', cargo:'Operario' });
    const load = () => axios.get('/api/empleados').then(res => setEmps(res.data));
    useEffect(() => { load(); }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 h-fit">
            <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/api/empleados', fN); alert("Vinculado"); load();}} className="bg-white dark:bg-slate-900 p-12 rounded-[50px] border dark:border-slate-800 shadow-2xl space-y-6 h-fit">
                <h3 className="text-2xl font-black italic dark:text-white">Vincular Funcionario</h3>
                <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none dark:text-white" placeholder="Nombre" onChange={e=>setFN({...fN, nombre:e.target.value})}/>
                <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none dark:text-white" placeholder="Doc" onChange={e=>setFN({...fN, documento:e.target.value})}/>
                <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Valor Día</label><input className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none dark:text-white" type="number" onChange={e=>setFN({...fN, valor_dia:e.target.value})}/></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-4">Fecha Inicio</label><input className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none dark:text-white" type="date" onChange={e=>setFN({...fN, hire_date:e.target.value})}/></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <input className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-[9px] font-black dark:text-white uppercase" placeholder="EPS" onChange={e=>setFN({...fN, eps:e.target.value})}/>
                    <input className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-[9px] font-black dark:text-white uppercase" placeholder="ARL" onChange={e=>setFN({...fN, arl:e.target.value})}/>
                    <input className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-[9px] font-black dark:text-white uppercase" placeholder="Pen" onChange={e=>setFN({...fN, pension:e.target.value})}/>
                </div>
                <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase">Vincular Ahora</button>
            </form>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 h-fit">
                {emps.map(e => (
                    <div key={e.id} className="bg-white dark:bg-slate-900 p-10 rounded-[45px] border dark:border-slate-800 shadow-sm group hover:border-blue-600 transition-all flex flex-col gap-6">
                        <div className="flex justify-between items-center border-b dark:border-slate-800 pb-6">
                            <div><p className="font-black text-2xl dark:text-white leading-none">{e.nombre}</p><p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">DOC: {e.documento}</p></div>
                            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 text-blue-600 rounded-3xl flex items-center justify-center font-black text-3xl">{e.nombre?.charAt(0)}</div>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-6 rounded-[30px]">
                            <div><p className="text-[9px] font-black text-slate-400 uppercase">Jornada</p><p className="text-3xl font-black text-green-600">{fmt(e.valor_dia)}</p></div>
                            <button onClick={()=>alert(`Liquidando a ${e.nombre}... Total Mes (30d): ${fmt(e.valor_dia * 30 + 162000)}`)} className="bg-slate-900 dark:bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg">LIQUIDAR</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ConfigView({ user, setUser }) {
    const [f, setF] = useState({ nombre:user.nombre, telefono:user.telefono||'', direccion:user.direccion||'', avatar_url:user.avatar_url||'' });
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in h-fit">
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[60px] border dark:border-slate-800 shadow-2xl space-y-10">
                <div className="flex items-center gap-8 border-b dark:border-slate-800 pb-10">
                    <div className="relative group">
                        <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-[45px] flex items-center justify-center text-slate-300 overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl">
                           {f.avatar_url ? <img src={f.avatar_url} className="w-full h-full object-cover" /> : <User size={48}/>}
                        </div>
                        <div className="absolute bottom-0 right-0 p-3 bg-blue-600 text-white rounded-2xl shadow-xl cursor-pointer hover:scale-110 transition-transform"><Camera size={16}/></div>
                    </div>
                    <div><h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">Mi Perfil</h3><p className="text-slate-400 font-bold uppercase text-xs">SaaS Cloud Premium 2026</p></div>
                </div>
                <form onSubmit={async(e)=>{e.preventDefault(); await axios.put('/api/perfil', f); alert("Perfil Actualizado"); setUser({...user, ...f}); localStorage.setItem('erp_user', JSON.stringify({...user, ...f}));}} className="space-y-6">
                    <input className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold border-none dark:text-white outline-none" value={f.nombre} placeholder="Nombre Público" onChange={e=>setF({...f, nombre:e.target.value})} />
                    <input className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold border-none dark:text-white outline-none" value={f.avatar_url} placeholder="URL Foto Perfil" onChange={e=>setF({...f, avatar_url:e.target.value})} />
                    <div className="grid grid-cols-2 gap-6">
                        <input className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold border-none dark:text-white outline-none" value={f.telefono} placeholder="Teléfono" onChange={e=>setF({...f, telefono:e.target.value})} />
                        <input className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold border-none dark:text-white outline-none" value={f.direccion} placeholder="Dirección" onChange={e=>setF({...f, direccion:e.target.value})} />
                    </div>
                    <button type="submit" className="w-full py-6 bg-slate-900 dark:bg-blue-600 text-white font-black rounded-[30px] shadow-xl uppercase">Guardar Ajustes</button>
                </form>
            </div>
            <div className="bg-blue-600 p-12 rounded-[60px] text-white shadow-2xl h-fit">
                <h3 className="text-2xl font-black italic mb-4">Soporte Técnico 24/7</h3>
                <p className="text-blue-100 font-bold text-sm leading-relaxed mb-10">Nuestro equipo está disponible para ayudarte con cualquier duda técnica.</p>
                <button onClick={()=>window.open('https://wa.me/573158022191')} className="bg-white text-blue-600 px-8 py-4 rounded-3xl font-black uppercase text-xs">WhatsApp Soporte</button>
            </div>
        </div>
    );
}

function CajaView({ user }) {
    const [base, setBase] = useState("");
    const [activo, setActivo] = useState(null);
    const load = useCallback(() => {
        axios.get('/api/turnos/activo/'+user.id).then(res => setActivo(res.data)).catch(()=>setActivo(null));
    }, [user.id]);
    useEffect(() => { load(); }, [load]);

    return (
        <div className="max-w-2xl mx-auto mt-10 text-center">
            <div className="bg-white dark:bg-slate-900 p-20 rounded-[60px] border dark:border-slate-800 shadow-2xl border-t-[20px] border-blue-600">
                <div className="w-24 h-24 bg-blue-50 dark:bg-slate-800 text-blue-600 rounded-[40px] flex items-center justify-center mx-auto mb-10"><Wallet size={54}/></div>
                {activo ? (
                    <div className="space-y-8 animate-fade-in text-left">
                        <h3 className="text-3xl font-black italic dark:text-white text-center">Turno Activo</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[40px] text-left"><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Base inicial</p><p className="text-3xl font-black text-slate-600 dark:text-white">{fmt(activo.base_caja)}</p></div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-[40px] text-left border border-blue-100 dark:border-blue-900"><p className="text-[10px] font-black text-blue-400 uppercase mb-2">Vendido</p><p className="text-3xl font-black text-blue-600">{fmt(activo.total_vendido)}</p></div>
                        </div>
                        <button onClick={async()=>{ if(confirm("¿Cerrar?")){ await axios.put('/api/turnos/finalizar', {turno_id: activo.id}); load(); }}} className="w-full py-7 bg-red-500 text-white font-black rounded-3xl shadow-xl uppercase">Cerrar Turno Mayor</button>
                    </div>
                ) : (
                    <div className="space-y-8 animate-fade-in text-center">
                        <h3 className="text-3xl font-black italic dark:text-white">Apertura de Turno</h3>
                        <input id="bC" type="number" className="w-full p-8 bg-slate-50 dark:bg-slate-800 rounded-[35px] font-black text-5xl text-center border-4 border-transparent focus:border-blue-600 dark:text-white outline-none" placeholder="$0" />
                        <button onClick={async()=>{ await axios.post('/api/turnos/iniciar', {base_caja: document.getElementById('bC').value}); load(); }} className="w-full py-7 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase">Abrir Turno Cloud</button>
                    </div>
                )}
            </div>
        </div>
    );
}

// HELPERS UI
function MenuBtn({ icon, label, active, onClick }) { 
    return <button onClick={onClick} className={`w-full flex items-center px-8 py-5 rounded-[28px] mb-3 transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-2xl shadow-blue-100 -translate-y-1' : 'text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:text-slate-800 dark:hover:text-white'}`}><span className="mr-5">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; 
}
function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50 dark:bg-green-900/20", blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20", purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/20", red: "text-red-600 bg-red-50 dark:bg-red-900/20" };
    return <div className="bg-white dark:bg-slate-900 p-12 rounded-[50px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p><h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{value}</h3></div>; 
}
function PagosView() { return <div className="p-20 bg-white dark:bg-slate-900 rounded-[60px] border-4 border-dashed text-center font-black text-slate-300 dark:text-slate-700 text-3xl uppercase">Módulo Pagos Activo</div>; }

function Login({ onLogin, onBuy }) {
    const handle = async (e) => {
        e.preventDefault();
        const res = await axios.post('/api/login', { email: e.target.e.value, password: e.target.p.value });
        if (res.data.success) onLogin(res.data); else alert("Acceso Incorrecto");
    };
    return (
        <div className="h-screen flex items-center justify-center bg-blue-600 p-4">
            <form onSubmit={handle} className="bg-white p-12 rounded-[60px] shadow-2xl w-full max-w-md text-center">
                <h1 className="text-4xl font-black mb-2 italic tracking-tighter">AccuCloud<span className="text-blue-600">.</span></h1>
                <p className="text-slate-400 font-bold text-[10px] uppercase mb-10 tracking-widest">SaaS ERP Pro 2026</p>
                <input name="e" className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none mb-4" placeholder="Email" />
                <input name="p" className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none mb-10" type="password" placeholder="Contraseña" />
                <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl shadow-xl uppercase">Entrar</button>
                <button onClick={onBuy} className="w-full mt-6 text-blue-600 font-bold text-xs uppercase underline">Comprar Sistema</button>
            </form>
        </div>
    );
}

function PSEPage({ onBack }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-16 rounded-[60px] shadow-2xl max-w-2xl w-full border-t-[25px] border-blue-600">
                <h1 className="text-5xl font-black mb-4 italic text-slate-800">AccuCloud PRO 2026</h1>
                <p className="text-slate-400 font-bold text-sm mb-12 px-10 leading-relaxed">Suscripción SaaS mensual con soporte total incluido.</p>
                <div className="bg-blue-50 p-12 rounded-[40px] mb-10 border border-blue-100">
                    <h2 className="text-7xl font-black text-blue-600 tracking-tighter leading-none mb-2">$600.000</h2>
                    <p className="text-xs text-blue-400 mt-4 font-bold uppercase tracking-widest">IVA INCLUIDO | PAGO PSE</p>
                </div>
                <button onClick={()=>window.alert("Redirigiendo a pasarela PSE Segura...")} className="w-full py-8 bg-slate-900 text-white font-black rounded-[35px] shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all text-sm uppercase tracking-widest">
                    <CreditCard size={20}/> PROCEDER AL PAGO CON PSE
                </button>
                <button onClick={onBack} className="mt-8 text-slate-400 font-bold text-xs uppercase underline hover:text-slate-800 transition">Regresar al Inicio de Sesión</button>
            </div>
        </div>
    );
}