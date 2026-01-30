/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, RefreshCcw, Menu, TrendingUp, Factory, Truck, CreditCard, Settings, ChevronRight, History, Trash2, Edit, Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ==========================================
//      CONFIGURACIÓN DE RED SEGURA
// ==========================================
axios.defaults.baseURL = window.location.origin + '/api';
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('erp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error));

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
    const savedToken = localStorage.getItem('erp_token');
    if (savedUser && savedToken) {
        try { setUser(JSON.parse(savedUser)); } catch (e) { localStorage.clear(); }
    }
    setLoadingSession(false);
  }, []);

  const handleLogin = (authData) => {
    setUser(authData.user);
    localStorage.setItem('erp_user', JSON.stringify(authData.user));
    localStorage.setItem('erp_token', authData.token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.clear();
  };

  if (loadingSession) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-2xl">INICIANDO ACCUCLOUD PRO...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? <LoginScreen onLogin={handleLogin} onBuy={() => setShowPSE(true)} /> : <Dashboard user={user} onLogout={handleLogout} />}
    </div>
  );
}

// --- PANTALLA LOGIN ---
function LoginScreen({ onLogin, onBuy }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/login', { email, password });
      if (res.data.success) onLogin(res.data);
      else window.alert('Credenciales Incorrectas');
    } catch (e) { window.alert('Error de conexión con el servidor.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4">
      <div className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md text-center">
        <h1 className="text-4xl font-black text-slate-800 mb-2 italic tracking-tighter">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase mb-10 tracking-widest italic">Haz parte del mejor sistema para tu negocio</p>
        <form onSubmit={handleAuth} className="space-y-4 text-left">
          <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Corporativo" required />
          <input type="password" class="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Contraseña" required />
          <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all">ENTRAR</button>
        </form>
        <button onClick={onBuy} className="w-full mt-10 p-4 bg-green-50 text-green-600 border-2 border-green-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-100 transition-all">Comprar Licencia ($600.000 COP) con PSE</button>
      </div>
    </div>
  );
}

// --- DASHBOARD LAYOUT ---
function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [turnoActivo, setTurnoActivo] = useState(null);

  const recargarTurno = useCallback(() => {
    axios.get('/turnos/activo/' + user.id).then(res => setTurnoActivo(res.data)).catch(e => setTurnoActivo(null));
  }, [user.id]);

  useEffect(() => { recargarTurno(); }, [recargarTurno]);

  const canSee = (roles) => roles.includes(user?.cargo);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-72 bg-white border-r px-6 flex flex-col hidden md:flex">
        <div className="h-28 flex items-center font-black text-2xl text-slate-800 italic uppercase">ACCUCLOUD <span className="text-blue-600">.</span></div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {canSee(['Admin', 'Contador']) && <MenuButton icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />}
          {canSee(['Admin', 'Vendedor']) && <MenuButton icon={<ShoppingCart size={20}/>} label="Ventas TPV" active={activeTab==='ventas'} onClick={()=>setActiveTab('ventas')} />}
          {canSee(['Admin', 'Bodeguero', 'Prealistador']) && <MenuButton icon={<Package size={20}/>} label="Inventario" active={activeTab==='inventario'} onClick={()=>setActiveTab('inventario')} />}
          {canSee(['Admin', 'Prealistador', 'Produccion', 'Logistica']) && <MenuButton icon={<Factory size={20}/>} label="Producción PRO" active={activeTab==='produccion'} onClick={()=>setActiveTab('produccion')} />}
          {canSee(['Admin', 'Nomina']) && <MenuButton icon={<Users size={20}/>} label="Nómina" active={activeTab==='nomina'} onClick={()=>setActiveTab('nomina')} />}
          {canSee(['Admin', 'Vendedor']) && <MenuButton icon={<Wallet size={20}/>} label="Caja" active={activeTab==='caja'} onClick={()=>setActiveTab('caja')} />}
          {user.cargo === 'Admin' && <MenuButton icon={<ShieldCheck size={20}/>} label="Usuarios Admin" active={activeTab==='admin'} onClick={()=>setActiveTab('admin')} />}
        </nav>
        <div className="py-8 border-t">
            <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none">{user.cargo}</p>
                <p className="text-sm font-black text-slate-800">{user.nombre}</p>
            </div>
            <button onClick={onLogout} className="w-full text-red-500 font-black text-xs hover:underline">CERRAR SESIÓN</button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-10 bg-slate-50">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{activeTab}</h2>
            {turnoActivo ? <div className="px-6 py-2 bg-green-100 text-green-700 rounded-2xl text-[10px] font-black border border-green-200">CAJA ABIERTA: {fmt(turnoActivo.total_vendido)}</div> : <div className="px-6 py-2 bg-red-100 text-red-700 rounded-2xl text-[10px] font-black border border-red-200 uppercase">Cerrado</div>}
        </header>

        <div className="animate-fade-in">
          {activeTab==='dashboard' && <ResumenView />}
          {activeTab==='ventas' && <VentasView user={user} turnoActivo={turnoActivo}/>}
          {activeTab==='inventario' && <InventarioView user={user}/>}
          {activeTab==='produccion' && <ProduccionView user={user}/>}
          {activeTab==='nomina' && <NominaView user={user}/>}
          {activeTab==='caja' && <CajaView user={user} turnoActivo={turnoActivo} onUpdate={recargarTurno}/>}
          {activeTab==='admin' && <AdminView user={user}/>}
        </div>
      </main>
    </div>
  );
}

// ==========================================
//           VISTA: DASHBOARD
// ==========================================
function ResumenView() {
  const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0, recentSales: [] });
  useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);

  return (
    <div className="space-y-10">
        <div className="grid grid-cols-4 gap-6">
            <CardStat title="Ventas Totales" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
            <CardStat title="Valor Inventario" value={fmt(data.valorInventario)} icon={<Package/>} color="purple" />
            <CardStat title="Alertas de Stock" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
            <CardStat title="Estado Licencia" value="Premium 2026" icon={<ShieldCheck/>} color="green" />
        </div>
        <div className="grid grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border h-80">
                <h3 className="font-black mb-6 text-slate-400 text-[10px] uppercase">Rendimiento Semanal</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{n:'L', v:400},{n:'M', v:700},{n:'M', v:500},{n:'J', v:900},{n:'V', v:1200},{n:'S', v:1500},{n:'D', v:800}]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <Bar dataKey="v" fill="#2563eb" radius={[10, 10, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white p-10 rounded-[40px] shadow-sm border h-80 overflow-auto">
                <h3 className="font-black mb-6 text-slate-400 text-[10px] uppercase">Últimos Movimientos</h3>
                {data.recentSales.map((s, i) => (
                    <div key={i} className="flex justify-between border-b py-3 font-bold text-sm">
                        <span>{s.nombre_producto}</span>
                        <span className="text-blue-600">{fmt(s.total)}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}

// ==========================================
//           VISTA: CAJA
// ==========================================
function CajaView({ user, turnoActivo, onUpdate }) {
  const [base, setBase] = useState("");
  
  const handleAbrir = async () => {
    const pass = window.prompt("Introduce la Clave Maestra de la Empresa:");
    try {
        const resV = await axios.post('/turnos/verificar-maestra', { password: pass });
        if (resV.data.success) {
            await axios.post('/turnos/iniciar', { base_caja: base });
            onUpdate();
        } else { alert("Clave Maestra Incorrecta"); }
    } catch (e) { alert("Error de servidor"); }
  };

  return (
    <div className="max-w-xl mx-auto mt-20">
      <div className="bg-white p-16 rounded-[60px] shadow-2xl border text-center">
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[35px] flex items-center justify-center mx-auto mb-10"><Wallet size={48}/></div>
        {turnoActivo ? (
            <div className="space-y-6">
                <h3 className="text-3xl font-black italic">Turno de {user.nombre}</h3>
                <div className="bg-slate-50 p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Recaudado</p>
                    <p className="text-4xl font-black text-blue-600">{fmt(turnoActivo.total_vendido)}</p>
                </div>
                <button onClick={async () => { if(confirm("¿Cerrar Turno?")){ await axios.put('/turnos/finalizar', { turno_id: turnoActivo.id }); onUpdate(); } }} className="w-full py-6 bg-red-500 text-white font-black rounded-3xl shadow-xl">REALIZAR CIERRE</button>
            </div>
        ) : (
            <div className="space-y-6">
                <h3 className="text-3xl font-black italic">Apertura de Caja</h3>
                <input type="number" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-2xl text-center border-2" placeholder="$ Base Inicial" value={base} onChange={e=>setBase(e.target.value)} />
                <button onClick={handleAbrir} className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl">ABRIR TURNO AHORA</button>
            </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
//           VISTA: VENTAS
// ==========================================
function VentasView({ user, turnoActivo }) {
    const [productos, setProductos] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => { axios.get('/productos').then(res => setProductos(res.data)); }, []);

    const addToCart = (p) => {
        const item = cart.find(i => i.id === p.id);
        if (item) setCart(cart.map(i => i.id === p.id ? {...i, cantidad: i.cantidad + 1} : i));
        else setCart([...cart, {...p, cantidad: 1}]);
        setSearch("");
    };

    const procesar = async () => {
        if (!turnoActivo) return alert("Debes abrir caja");
        await axios.post('/ventas', { productos: cart, turno_id: turnoActivo.id });
        alert("Venta Exitosa"); setCart([]);
    };

    if (!turnoActivo) return <div className="h-96 flex items-center justify-center font-black text-slate-300 text-3xl uppercase border-4 border-dashed rounded-[50px]">Caja Cerrada</div>;

    return (
        <div className="grid grid-cols-3 gap-10">
            <div className="col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-[30px] border shadow-sm">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                        <ScanBarcode className="text-slate-400"/>
                        <input className="bg-transparent w-full font-bold outline-none" placeholder="Escanear o buscar producto..." value={search} onChange={e=>setSearch(e.target.value)} />
                    </div>
                    {search && (
                        <div className="mt-4 border rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                            {productos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search)).map(p => (
                                <div key={p.id} onClick={()=>addToCart(p)} className="p-4 hover:bg-blue-50 cursor-pointer border-b font-bold flex justify-between">
                                    <span>{p.nombre}</span>
                                    <span className="text-blue-600">{fmt(p.precio)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-white p-10 rounded-[40px] border min-h-[450px] shadow-sm">
                    <table className="w-full text-left">
                        <thead className="text-[10px] font-black uppercase text-slate-400 border-b"><tr className="text-left"><th className="pb-6">Item</th><th>Cant</th><th className="text-right pb-6">Subtotal</th></tr></thead>
                        <tbody>
                            {cart.map(i => (
                                <tr key={i.id} className="border-b">
                                    <td className="py-5 font-bold">{i.nombre}</td>
                                    <td><input type="number" className="w-12 text-center bg-slate-50 rounded font-bold" value={i.cantidad} onChange={e=>setCart(cart.map(c=>c.id===i.id?{...c, cantidad: parseInt(e.target.value)||1}:c))} /></td>
                                    <td className="text-right font-black">{fmt(i.precio * i.cantidad)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border-t-[20px] border-blue-600 h-fit">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Compra</p>
                <h2 className="text-6xl font-black text-slate-800 tracking-tighter mb-10">{fmt(cart.reduce((s,i)=>s+(i.precio*i.cantidad),0))}</h2>
                <button onClick={procesar} className="w-full py-7 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:scale-105 transition-all text-xl">PAGAR AHORA</button>
                <button onClick={()=>setCart([])} className="w-full mt-6 text-red-400 font-bold text-xs uppercase underline">Vaciar Carrito</button>
            </div>
        </div>
    );
}

// ==========================================
//           VISTA: INVENTARIO
// ==========================================
function InventarioView({ user }) {
  const [mode, setMode] = useState('list');
  const [prods, setProds] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [form, setForm] = useState({ nombre: '', sku: '', precio: '', stock: '', bodega_id: '' });

  const load = useCallback(() => {
    axios.get('/productos').then(res => setProds(res.data));
    axios.get('/bodegas').then(res => setBodegas(res.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    await axios.post('/productos', form);
    alert("Producto Registrado"); setForm({ nombre: '', sku: '', precio: '', stock: '', bodega_id: '' }); setMode('list'); load();
  };

  return (
    <div className="space-y-6">
        <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border shadow-sm">
            <button onClick={()=>setMode('list')} className={`px-8 py-2 rounded-xl font-black text-xs ${mode==='list'?'bg-blue-600 text-white':'text-slate-400'}`}>LISTADO</button>
            <button onClick={()=>setMode('new')} className={`px-8 py-2 rounded-xl font-black text-xs ${mode==='new'?'bg-blue-600 text-white':'text-slate-400'}`}>NUEVO ITEM</button>
            <button onClick={()=>setMode('bodegas')} className={`px-8 py-2 rounded-xl font-black text-xs ${mode==='bodegas'?'bg-blue-600 text-white':'text-slate-400'}`}>BODEGAS</button>
        </div>

        {mode === 'new' && (
            <div className="bg-white p-10 rounded-[40px] border max-w-2xl shadow-sm">
                <form onSubmit={save} className="grid grid-cols-2 gap-6">
                    <input className="col-span-2 p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Nombre Producto" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold" placeholder="SKU" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required/>
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Precio" type="number" value={form.precio} onChange={e=>setForm({...form, precio:e.target.value})} required/>
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Stock" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} required/>
                    <select className="p-4 bg-slate-50 rounded-2xl font-bold" value={form.bodega_id} onChange={e=>setForm({...form, bodega_id:e.target.value})}>
                        <option value="">Seleccionar Bodega...</option>
                        {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                    <button className="col-span-2 py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl">GUARDAR EN SISTEMA</button>
                </form>
            </div>
        )}

        {mode === 'list' && (
            <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest"><tr className="border-b"><th className="p-8">Detalle</th><th>SKU</th><th>Stock</th><th>Bodega</th></tr></thead>
                    <tbody>
                        {prods.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition-all">
                                <td className="p-8 font-black">{p.nombre}</td>
                                <td className="font-bold text-slate-400">{p.sku}</td>
                                <td className="font-black text-blue-600">{p.stock}</td>
                                <td className="text-xs font-bold uppercase">{p.bodega_nombre || 'S/B'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {mode === 'bodegas' && (
            <div className="grid grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[40px] border shadow-sm">
                    <h3 className="font-black mb-6 italic">Crear Bodega</h3>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold mb-4" placeholder="Nombre Bodega" id="nbodega"/>
                    <button onClick={async ()=>{ await axios.post('/bodegas', {nombre: document.getElementById('nbodega').value}); load(); }} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl">GUARDAR</button>
                </div>
                <div className="col-span-2 bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr className="border-b"><th className="p-6">Nombre</th><th>Empresa ID</th></tr></thead>
                        <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b"><td className="p-6 font-bold">{b.nombre}</td><td>{b.company_id}</td></tr>))}</tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
}

// ==========================================
//           VISTA: PRODUCCIÓN PRO
// ==========================================
function ProduccionView({ user }) {
  const [sub, setSub] = useState('materias');
  const [materias, setMaterias] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  
  const load = useCallback(() => {
    axios.get('/produccion/materia').then(res => setMaterias(res.data));
    axios.get('/produccion/recetas').then(res => setRecetas(res.data));
    axios.get('/produccion/ordenes').then(res => setOrdenes(res.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-8">
        <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border shadow-sm">
            <button onClick={()=>setSub('materias')} className={`px-6 py-2 rounded-xl font-black text-xs ${sub==='materias'?'bg-blue-600 text-white':'text-slate-400'}`}>INSUMOS</button>
            <button onClick={()=>setSub('recetas')} className={`px-6 py-2 rounded-xl font-black text-xs ${sub==='recetas'?'bg-blue-600 text-white':'text-slate-400'}`}>RECETAS</button>
            <button onClick={()=>setSub('ordenes')} className={`px-6 py-2 rounded-xl font-black text-xs ${sub==='ordenes'?'bg-blue-600 text-white':'text-slate-400'}`}>ÓRDENES</button>
        </div>

        {sub === 'materias' && (
            <div className="grid grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[40px] border shadow-sm h-fit">
                    <h3 className="font-black mb-6 italic">Nuevo Insumo</h3>
                    <form onSubmit={async (e)=>{
                        e.preventDefault();
                        const d = { nombre: e.target.n.value, unidad_medida: e.target.u.value, cantidad: e.target.c.value, costo: e.target.co.value };
                        await axios.post('/produccion/materia', d); load(); e.target.reset();
                    }} className="space-y-4">
                        <input name="n" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Nombre" required/>
                        <select name="u" className="w-full p-4 bg-slate-50 rounded-2xl font-bold">
                            <option value="mg">mg</option><option value="ml">ml</option><option value="g">g</option><option value="unidades">unidades</option>
                        </select>
                        <input name="c" type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Cantidad" required/>
                        <input name="co" type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Costo Unitario" required/>
                        <button className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl">GUARDAR</button>
                    </form>
                </div>
                <div className="col-span-2 bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest"><tr className="border-b"><th className="p-6">Nombre</th><th>Stock</th><th>Unidad</th><th>Costo</th></tr></thead>
                        <tbody>
                            {materias.map(m => (
                                <tr key={m.id} className="border-b"><td className="p-6 font-bold">{m.nombre}</td><td className="font-black text-blue-600">{m.cantidad}</td><td>{m.unidad_medida}</td><td>{fmt(m.costo)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {sub === 'ordenes' && (
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-[40px] border shadow-sm flex gap-6 items-end">
                    <div className="flex-1">
                        <p className="text-[10px] font-black mb-2 uppercase text-slate-400">Seleccionar Receta</p>
                        <select id="selReceta" className="w-full p-4 bg-slate-50 rounded-2xl font-bold">
                            {recetas.map(r => <option key={r.id} value={r.id}>{r.nombre_producto_final}</option>)}
                        </select>
                    </div>
                    <div className="w-32">
                        <p className="text-[10px] font-black mb-2 uppercase text-slate-400">Cantidad</p>
                        <input id="cantProd" type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" defaultValue="1"/>
                    </div>
                    <button onClick={async ()=>{
                        const d = { receta_id: document.getElementById('selReceta').value, cantidad_a_producir: document.getElementById('cantProd').value };
                        await axios.post('/produccion/ordenes', d); load();
                    }} className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl">LANZAR ÓRDEN</button>
                </div>
                <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest"><tr className="border-b"><th className="p-8">Orden #</th><th>Producto</th><th>Cant</th><th>Estado</th><th>Acción</th></tr></thead>
                        <tbody>
                            {ordenes.map(o => (
                                <tr key={o.id} className="border-b">
                                    <td className="p-8 font-black">{o.numero_orden}</td>
                                    <td className="font-bold">{o.nombre_producto_final}</td>
                                    <td className="font-black">{o.cantidad_a_producir}</td>
                                    <td><span className="px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-black uppercase">{o.estado}</span></td>
                                    <td className="p-8">
                                        <button onClick={async ()=>{
                                            let next = 'Produccion';
                                            if(o.estado === 'Produccion') next = 'Logistica';
                                            if(o.estado === 'Logistica') next = 'Cerrada';
                                            await axios.put(`/produccion/ordenes/${o.id}/estado`, {nuevo_estado: next}); load();
                                        }} className="text-blue-600 font-black text-xs underline">AVANZAR FASE</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
}

// ==========================================
//           VISTA: NÓMINA
// ==========================================
function NominaView({ user }) {
  const [emps, setEmps] = useState([]);
  const load = useCallback(() => axios.get('/empleados').then(res => setEmps(res.data)), []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="grid grid-cols-3 gap-8">
        {emps.map(e => (
            <div key={e.id} className="bg-white p-8 rounded-[40px] border shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl font-black">{e?.nombre?.charAt(0)}</div>
                <div>
                    <p className="font-black text-slate-800 text-xl leading-none">{e.nombre}</p>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase">{e.cargo}</p>
                    <p className="text-2xl font-black text-green-600 mt-3">{fmt(e.salario)}</p>
                </div>
            </div>
        ))}
        <div className="bg-blue-600 p-8 rounded-[40px] shadow-xl text-white flex flex-col justify-center items-center cursor-pointer hover:scale-105 transition-all">
            <Plus size={32} className="mb-2"/>
            <p className="font-black text-sm uppercase">Vincular Empleado</p>
        </div>
    </div>
  );
}

// ==========================================
//           VISTA: ADMIN USUARIOS
// ==========================================
function AdminView() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' });

  const load = useCallback(() => axios.get('/admin/usuarios').then(res => setUsers(res.data)), []);
  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    if(form.id) await axios.put(`/admin/usuarios/${form.id}`, form);
    else await axios.post('/admin/usuarios', form);
    alert("Usuario Procesado"); setForm({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' }); load();
  };

  return (
    <div className="space-y-10">
        <div className="bg-white p-10 rounded-[40px] border shadow-sm max-w-4xl">
            <h3 className="font-black text-xl mb-8 italic">{form.id ? 'Editar Usuario' : 'Crear Nuevo Acceso'}</h3>
            <form onSubmit={save} className="grid grid-cols-4 gap-4">
                <input className="p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                <input className="p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/>
                <input className="p-4 bg-slate-50 rounded-2xl font-bold" type="password" placeholder="Pass" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required={!form.id}/>
                <select className="p-4 bg-slate-50 rounded-2xl font-bold" value={form.cargo} onChange={e=>setForm({...form, cargo:e.target.value})}>
                    <option value="Vendedor">Vendedor</option><option value="Bodeguero">Bodeguero</option><option value="Contador">Contador</option><option value="Admin">Admin</option>
                </select>
                <button className="col-span-4 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl">GUARDAR USUARIO</button>
            </form>
        </div>
        <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest"><tr className="border-b"><th className="p-8">Nombre</th><th>Email</th><th>Rol</th><th>Acciones</th></tr></thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} className="border-b">
                            <td className="p-8 font-black">{u.nombre}</td>
                            <td className="font-bold text-slate-400">{u.email}</td>
                            <td><span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase">{u.cargo}</span></td>
                            <td className="p-8">
                                <button onClick={()=>setForm(u)} className="text-blue-600 font-bold text-xs uppercase underline mr-4">Editar</button>
                                <button onClick={async ()=>{ if(confirm("¿Eliminar?")){ await axios.delete(`/admin/usuarios/${u.id}`); load(); } }} className="text-red-500 font-bold text-xs uppercase underline">Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}

// ==========================================
//           PÁGINA PSE
// ==========================================
function PSEPage({ onBack }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-16 rounded-[60px] shadow-2xl max-w-lg border-t-[20px] border-blue-600">
        <h1 className="text-4xl font-black mb-10 italic">AccuCloud PRO</h1>
        <div className="bg-blue-50 p-12 rounded-[40px] mb-10">
            <h2 className="text-7xl font-black text-blue-600 tracking-tighter">$600.000</h2>
            <p className="text-[10px] font-bold uppercase mt-4 text-blue-400">Mensualidad por Empresa</p>
        </div>
        <p className="text-sm text-slate-400 mb-10 font-bold">Acceso total a Inventarios, Ventas TPV, Nómina y Producción de Medicamentos con seguridad cifrada.</p>
        <button onClick={()=>alert("Redirigiendo a Pasarela Segura PSE...")} className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-xl flex items-center justify-center gap-3"><CreditCard/> PAGAR CON PSE</button>
        <button onClick={onBack} className="mt-8 text-slate-400 font-bold text-xs uppercase underline">Regresar al Login</button>
      </div>
    </div>
  );
}

// ==========================================
//           HELPERS UI
// ==========================================
function MenuButton({ icon, label, active, onClick }) { 
  return <button onClick={onClick} className={`w-full flex items-center px-6 py-4 rounded-[22px] mb-2 transition-all ${active ? 'bg-blue-600 text-white shadow-xl -translate-y-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}><span className="mr-4">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; 
}

function CardStat({ title, value, icon, color }) { 
  const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
  return <div className="bg-white p-8 rounded-[40px] border shadow-sm">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${c[color]}`}>{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{title}</p>
      <h3 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{value}</h3>
  </div>; 
}