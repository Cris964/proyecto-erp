/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, 
  RefreshCcw, Menu, TrendingUp, Factory, Truck, CreditCard, 
  Settings, ChevronRight, History, Trash2, Edit, Plus, CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ==========================================
//      CONFIGURACIÓN DE RED SaaS
// ==========================================
axios.defaults.baseURL = window.location.origin + '/api';

// Interceptor para seguridad JWT
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

  if (loadingSession) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-2xl">ACCUCLOUD PRO 2026...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? (
        <LoginScreen onLogin={handleLogin} onBuy={() => setShowPSE(true)} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

// ==========================================
//           PANTALLA DE LOGIN
// ==========================================
function LoginScreen({ onLogin, onBuy }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/login', { email, password });
      if (res.data.success) onLogin(res.data);
      else window.alert('Credenciales inválidas para este SaaS');
    } catch (e) { window.alert('Error de conexión con el servidor.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4">
      <div className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md text-center">
        <h1 className="text-4xl font-black text-slate-800 mb-2 italic tracking-tighter">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase mb-10 tracking-widest italic">El mejor sistema para tu negocio</p>
        <form onSubmit={handleAuth} className="space-y-4 text-left">
          <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Corporativo" required />
          <input type="password" class="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required />
          <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-widest">Entrar al Sistema</button>
        </form>
        <button onClick={onBuy} className="w-full mt-10 p-4 bg-green-50 text-green-600 border-2 border-green-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-100 transition-all">Activar Licencia ($600.000 COP) PSE</button>
      </div>
    </div>
  );
}

// ==========================================
//           DASHBOARD PRINCIPAL
// ==========================================
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
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r px-6 flex flex-col hidden md:flex">
        <div className="h-28 flex items-center font-black text-2xl text-slate-800 italic uppercase">ACCUCLOUD <span className="text-blue-600">.</span></div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {canSee(['Admin', 'Contador']) && <MenuButton icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />}
          {canSee(['Admin', 'Vendedor']) && <MenuButton icon={<ShoppingCart size={20}/>} label="Ventas TPV" active={activeTab==='ventas'} onClick={()=>setActiveTab('ventas')} />}
          {canSee(['Admin', 'Bodeguero', 'Prealistador']) && <MenuButton icon={<Package size={20}/>} label="Inventario" active={activeTab==='inventario'} onClick={()=>setActiveTab('inventario')} />}
          {canSee(['Admin', 'Prealistador', 'Produccion', 'Logistica']) && <MenuButton icon={<Factory size={20}/>} label="Producción PRO" active={activeTab==='produccion'} onClick={()=>setActiveTab('produccion')} />}
          {canSee(['Admin', 'Nomina']) && <MenuButton icon={<Users size={20}/>} label="Nómina Cloud" active={activeTab==='nomina'} onClick={()=>setActiveTab('nomina')} />}
          {canSee(['Admin', 'Vendedor']) && <MenuButton icon={<Wallet size={20}/>} label="Caja y Turnos" active={activeTab==='caja'} onClick={()=>setActiveTab('caja')} />}
          {user.cargo === 'Admin' && <MenuButton icon={<ShieldCheck size={20}/>} label="Usuarios Admin" active={activeTab==='admin'} onClick={()=>setActiveTab('admin')} />}
        </nav>
        <div className="py-8 border-t">
            <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{user.cargo}</p>
                <p className="text-sm font-black text-slate-800 truncate">{user.nombre}</p>
            </div>
            <button onClick={onLogout} className="w-full py-2 text-red-500 font-black text-[10px] uppercase hover:bg-red-50 rounded-xl transition">Cerrar Sesión</button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 overflow-auto p-10 bg-slate-50">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{activeTab}</h2>
            {turnoActivo ? (
                <div className="px-6 py-2 bg-green-100 text-green-700 rounded-2xl text-[10px] font-black border border-green-200 flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> CAJA ABIERTA: {fmt(turnoActivo.total_vendido)}
                </div>
            ) : (
                <div className="px-6 py-2 bg-red-100 text-red-700 rounded-2xl text-[10px] font-black border border-red-200 uppercase">Caja Cerrada</div>
            )}
        </header>

        <div className="animate-fade-in pb-10">
          {activeTab==='dashboard' && <ResumenView />}
          {activeTab==='ventas' && <VentasView user={user} turnoActivo={turnoActivo}/>}
          {activeTab==='inventario' && <InventarioView />}
          {activeTab==='produccion' && <ProduccionView user={user}/>}
          {activeTab==='nomina' && <NominaView />}
          {activeTab==='caja' && <CajaView user={user} turnoActivo={turnoActivo} onUpdate={recargarTurno}/>}
          {activeTab==='admin' && <AdminView />}
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
            <CardStat title="Valor de Stock" value={fmt(data.valorInventario)} icon={<Package/>} color="purple" />
            <CardStat title="Alertas de Stock" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
            <CardStat title="Licencia SaaS" value="Premium 2026" icon={<ShieldCheck/>} color="green" />
        </div>
        <div className="grid grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border h-96">
                <h3 className="font-black mb-8 text-slate-400 text-[10px] uppercase tracking-widest text-center">Flujo de Caja Semanal</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{n:'L', v:400},{n:'M', v:700},{n:'M', v:500},{n:'J', v:900},{n:'V', v:1200},{n:'S', v:1500},{n:'D', v:800}]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <Bar dataKey="v" fill="#2563eb" radius={[10, 10, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white p-10 rounded-[40px] shadow-sm border h-96 overflow-auto">
                <h3 className="font-black mb-6 text-slate-400 text-[10px] uppercase tracking-widest text-center">Ventas en Tiempo Real</h3>
                {(data.recentSales || []).map((s, i) => (
                    <div key={i} className="flex justify-between items-center border-b py-4 hover:bg-slate-50 transition px-2">
                        <div className="flex flex-col">
                            <span className="font-black text-slate-700 text-sm">{s.nombre_producto}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold">Responsable: {s.responsable}</span>
                        </div>
                        <span className="text-blue-600 font-black">{fmt(s.total)}</span>
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
    const pass = window.prompt("CLAVE MAESTRA DE EMPRESA:");
    if(!pass) return;
    try {
        const resV = await axios.post('/turnos/verificar-maestra', { password: pass });
        if (resV.data.success) {
            await axios.post('/turnos/iniciar', { base_caja: base });
            onUpdate();
        } else { alert("Error: Clave Maestra Incorrecta"); }
    } catch (e) { alert("Error de servidor"); }
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="bg-white p-16 rounded-[60px] shadow-2xl border text-center">
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[35px] flex items-center justify-center mx-auto mb-10"><Wallet size={48}/></div>
        {turnoActivo ? (
            <div className="space-y-6">
                <h3 className="text-3xl font-black italic text-slate-800">Turno: {user.nombre}</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl text-left border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Base Inicial</p>
                        <p className="text-xl font-black text-slate-700">{fmt(turnoActivo.base_caja)}</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-3xl text-left border border-blue-100">
                        <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Vendido</p>
                        <p className="text-xl font-black text-blue-600">{fmt(turnoActivo.total_vendido)}</p>
                    </div>
                </div>
                <button onClick={async () => { if(confirm("¿Estás seguro de cerrar caja?")){ await axios.put('/turnos/finalizar', { turno_id: turnoActivo.id }); onUpdate(); } }} className="w-full py-6 bg-red-500 text-white font-black rounded-3xl shadow-xl hover:bg-red-600 transition-all uppercase tracking-widest text-xs">Finalizar Jornada</button>
            </div>
        ) : (
            <div className="space-y-6">
                <h3 className="text-3xl font-black italic text-slate-800">Apertura de Turno</h3>
                <p className="text-slate-400 text-xs font-bold px-10">Ingresa el dinero en efectivo disponible para dar cambio al iniciar el turno.</p>
                <input type="number" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-3xl text-center border-2 focus:border-blue-500 outline-none transition-all" placeholder="$0" value={base} onChange={e=>setBase(e.target.value)} />
                <button onClick={handleAbrir} className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs">Abrir Caja en Nube</button>
            </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
//           VISTA: VENTAS TPV
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

    const total = cart.reduce((s,i)=>s+(i.precio*i.cantidad),0);

    const finalizarVenta = async () => {
        if (!turnoActivo) return alert("Error: La caja está cerrada.");
        if (cart.length === 0) return alert("Error: El carrito está vacío.");
        try {
            await axios.post('/ventas', { productos: cart, turno_id: turnoActivo.id });
            alert("Venta realizada con éxito");
            setCart([]);
        } catch (e) { alert("Error: Stock insuficiente o fallo de red."); }
    };

    if (!turnoActivo) return <div className="h-[500px] flex items-center justify-center font-black text-slate-300 text-3xl uppercase border-4 border-dashed rounded-[50px]">Módulo de Ventas Desactivado: Caja Cerrada</div>;

    return (
        <div className="grid grid-cols-3 gap-10">
            <div className="col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-[30px] border shadow-sm flex items-center gap-4 focus-within:ring-2 ring-blue-500 transition-all">
                    <ScanBarcode className="text-slate-400"/>
                    <div className="relative flex-1">
                        <input className="bg-transparent w-full font-bold outline-none text-lg" placeholder="Escanea código de barras o escribe nombre..." value={search} onChange={e=>setSearch(e.target.value)} />
                        {search && (
                            <div className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-2xl mt-4 z-50 border border-slate-100 max-h-60 overflow-y-auto">
                                {productos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search)).map(p => (
                                    <div key={p.id} onClick={()=>addToCart(p)} className="p-4 hover:bg-blue-50 cursor-pointer border-b font-bold flex justify-between items-center transition-all">
                                        <div className="flex flex-col">
                                            <span>{p.nombre}</span>
                                            <span className="text-[10px] text-slate-400 uppercase font-bold">SKU: {p.sku} | Stock: {p.stock}</span>
                                        </div>
                                        <span className="text-blue-600 font-black">{fmt(p.precio)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[40px] border min-h-[480px] shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="text-[10px] font-black uppercase text-slate-400 border-b"><tr className="text-left"><th className="pb-6">Producto</th><th className="text-center">Cant</th><th className="text-right pb-6">Subtotal</th><th></th></tr></thead>
                        <tbody>
                            {cart.map(i => (
                                <tr key={i.id} className="border-b hover:bg-slate-50 transition-all">
                                    <td className="py-5 font-black text-slate-700">{i.nombre}</td>
                                    <td className="text-center">
                                        <input type="number" className="w-16 text-center bg-slate-50 p-2 rounded-xl font-black outline-none border focus:border-blue-300" value={i.cantidad} onChange={e=>setCart(cart.map(c=>c.id===i.id?{...c, cantidad: Math.max(1, parseInt(e.target.value)||1)}:c))} />
                                    </td>
                                    <td className="text-right font-black text-slate-800">{fmt(i.precio * i.cantidad)}</td>
                                    <td className="text-right"><button onClick={()=>setCart(cart.filter(c=>c.id!==i.id))} className="text-red-400 p-2 hover:bg-red-50 rounded-lg transition-all"><X size={16}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {cart.length === 0 && <div className="flex flex-col items-center justify-center h-80 opacity-20"><ShoppingCart size={64} className="mb-4"/><p className="font-black uppercase text-sm">Carrito Vacío</p></div>}
                </div>
            </div>
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border-t-[20px] border-blue-600 h-fit flex flex-col justify-between sticky top-10">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Resumen de Venta</p>
                    <div className="text-center mb-10">
                        <h2 className="text-6xl font-black text-slate-800 tracking-tighter leading-none">{fmt(total)}</h2>
                    </div>
                    <div className="space-y-4 mb-10">
                        <div className="flex justify-between text-xs font-bold border-b pb-2"><span>Subtotal</span><span>{fmt(total)}</span></div>
                        <div className="flex justify-between text-xs font-bold border-b pb-2"><span>IVA (0%)</span><span>$0</span></div>
                    </div>
                </div>
                <button onClick={finalizarVenta} className="w-full py-8 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all text-xl uppercase tracking-tighter">Confirmar Venta</button>
                <button onClick={()=>setCart([])} className="w-full mt-6 text-red-400 font-bold text-[10px] uppercase underline text-center">Cancelar Transacción</button>
            </div>
        </div>
    );
}

// ==========================================
//           VISTA: INVENTARIO
// ==========================================
function InventarioView() {
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
    alert("Producto Registrado en Base de Datos"); setForm({ nombre: '', sku: '', precio: '', stock: '', bodega_id: '' }); setMode('list'); load();
  };

  return (
    <div className="space-y-6">
        <div className="flex gap-4 p-2 bg-white rounded-3xl w-fit border shadow-sm overflow-x-auto">
            <button onClick={()=>setMode('list')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${mode==='list'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Listado General</button>
            <button onClick={()=>setMode('new')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${mode==='new'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Nuevo Item</button>
            <button onClick={()=>setMode('bodegas')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${mode==='bodegas'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Gestionar Bodegas</button>
        </div>

        {mode === 'new' && (
            <div className="bg-white p-12 rounded-[50px] border max-w-3xl shadow-sm mx-auto">
                <h3 className="text-2xl font-black mb-8 italic text-slate-800">Registrar Producto Farmacéutico</h3>
                <form onSubmit={save} className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1">Nombre Completo</label>
                        <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" placeholder="Ej: Acetaminofén 500mg" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1">SKU / Código</label>
                        <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" placeholder="COD-001" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1">Precio de Venta</label>
                        <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" placeholder="0.00" type="number" value={form.precio} onChange={e=>setForm({...form, precio:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1">Stock Inicial</label>
                        <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" placeholder="0" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1">Bodega Asignada</label>
                        <select className="w-full p-5 bg-slate-50 rounded-3xl font-black outline-none border-2 border-transparent focus:border-blue-500" value={form.bodega_id} onChange={e=>setForm({...form, bodega_id:e.target.value})}>
                            <option value="">Seleccionar...</option>
                            {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                    </div>
                    <button className="col-span-2 py-6 bg-slate-900 text-white font-black rounded-[30px] shadow-xl hover:scale-[1.02] transition-all uppercase tracking-widest text-xs mt-6">Dar de alta en Inventario</button>
                </form>
            </div>
        )}

        {mode === 'list' && (
            <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Detalle de Producto</th><th>SKU</th><th>Precio</th><th className="text-center">Existencias</th><th>Bodega</th></tr></thead>
                    <tbody>
                        {prods.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition-all">
                                <td className="p-8 font-black text-slate-700">{p.nombre}</td>
                                <td className="font-bold text-slate-400 uppercase text-xs">{p.sku}</td>
                                <td className="font-black text-slate-800">{fmt(p.precio)}</td>
                                <td className="text-center"><span className={`px-4 py-1 rounded-full text-[10px] font-black ${p.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{p.stock} UDS</span></td>
                                <td className="text-[10px] font-black uppercase text-blue-600">{p.bodega_nombre || 'S/B'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {mode === 'bodegas' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[40px] border shadow-sm h-fit">
                    <h3 className="font-black mb-8 italic text-slate-800 text-xl">Crear Bodega</h3>
                    <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold mb-6 border-2 focus:border-blue-500 outline-none" placeholder="Nombre de Bodega" id="nbodega"/>
                    <button onClick={async ()=>{ const n = document.getElementById('nbodega').value; if(!n) return; await axios.post('/bodegas', {nombre: n}); load(); alert("Bodega creada"); }} className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-lg uppercase text-[10px] tracking-widest">Registrar Bodega</button>
                </div>
                <div className="md:col-span-2 bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr className="border-b"><th className="p-8">Nombre de la Dependencia</th><th className="text-right p-8">Empresa ID</th></tr></thead>
                        <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b hover:bg-slate-50"><td className="p-8 font-black text-slate-700">{b.nombre}</td><td className="p-8 text-right font-bold text-slate-300"># {b.company_id}</td></tr>))}</tbody>
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
  const [selectedOrden, setSelectedOrden] = useState(null);
  
  const load = useCallback(() => {
    axios.get('/produccion/materia').then(res => setMaterias(res.data));
    axios.get('/produccion/recetas').then(res => setRecetas(res.data));
    axios.get('/produccion/ordenes').then(res => setOrdenes(res.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  const avanzarFase = async (orden) => {
      let next = 'Produccion';
      if(orden.estado === 'Produccion') next = 'Logistica';
      if(orden.estado === 'Logistica') next = 'Cerrada';
      try {
          await axios.put(`/produccion/ordenes/${orden.id}/estado`, {nuevo_estado: next});
          load();
          alert("Fase actualizada con éxito");
          if(next === 'Cerrada') setSelectedOrden(null);
      } catch(e) { alert("Error: No hay suficientes insumos en stock."); }
  };

  return (
    <div className="space-y-8">
        <div className="flex gap-4 p-2 bg-white rounded-3xl w-fit border shadow-sm overflow-x-auto">
            <button onClick={()=>setSub('materias')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='materias'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Materia Prima</button>
            <button onClick={()=>setSub('recetas')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='recetas'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Kits / Recetas</button>
            <button onClick={()=>setSub('ordenes')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='ordenes'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Órdenes Activas</button>
        </div>

        {sub === 'materias' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[40px] border shadow-sm h-fit">
                    <h3 className="font-black mb-8 italic text-slate-800 text-xl">Nuevo Insumo</h3>
                    <form onSubmit={async (e)=>{
                        e.preventDefault();
                        const d = { nombre: e.target.n.value, unidad_medida: e.target.u.value, cantidad: e.target.c.value, costo: e.target.co.value };
                        await axios.post('/produccion/materia', d); load(); e.target.reset(); alert("Insumo Guardado");
                    }} className="space-y-4">
                        <input name="n" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 focus:border-blue-500 outline-none" placeholder="Nombre Insumo" required/>
                        <select name="u" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 focus:border-blue-500">
                            <option value="mg">Miligramos (mg)</option><option value="ml">Mililitros (ml)</option><option value="g">Gramos (g)</option><option value="unidades">Unidades</option>
                        </select>
                        <input name="c" type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 focus:border-blue-500 outline-none" placeholder="Cantidad Disponible" required/>
                        <input name="co" type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 focus:border-blue-500 outline-none" placeholder="Costo por Unidad" required/>
                        <button className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl uppercase text-[10px] tracking-widest">Registrar Materia</button>
                    </form>
                </div>
                <div className="md:col-span-2 bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Materia Prima</th><th>Existencias</th><th>Unidad</th><th>Costo</th></tr></thead>
                        <tbody>
                            {materias.map(m => (
                                <tr key={m.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 font-black text-slate-700">{m.nombre}</td><td className="font-black text-blue-600">{m.cantidad}</td><td className="text-xs font-bold text-slate-400 uppercase">{m.unidad_medida}</td><td className="font-black text-slate-800">{fmt(m.costo)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {sub === 'recetas' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[40px] border shadow-sm h-fit">
                    <h3 className="font-black mb-8 italic text-slate-800 text-xl">Crear Receta Farmacéutica</h3>
                    <p className="text-slate-400 text-xs mb-8">Define los ingredientes y cantidades para fabricar un producto final.</p>
                    <form onSubmit={async (e)=>{
                        e.preventDefault();
                        const data = { nombre_producto_final: e.target.n.value, descripcion: e.target.d.value, ingredientes: [] };
                        await axios.post('/produccion/recetas', data); load(); e.target.reset(); alert("Receta Maestra Guardada");
                    }} className="space-y-4">
                        <input name="n" className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-2 focus:border-blue-500 outline-none" placeholder="Nombre del Kit / Medicamento" required/>
                        <textarea name="d" className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-2 focus:border-blue-500 outline-none" placeholder="Descripción de preparación..." rows="4"></textarea>
                        <button className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase text-[10px] tracking-widest">Generar Receta</button>
                    </form>
                </div>
                <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr className="border-b"><th className="p-8">Kit Final</th><th className="p-8">Descripción</th></tr></thead>
                        <tbody>{recetas.map(r=>(<tr key={r.id} className="border-b hover:bg-slate-50"><td className="p-8 font-black text-slate-700">{r.nombre_producto_final}</td><td className="p-8 text-xs font-bold text-slate-400">{r.descripcion}</td></tr>))}</tbody>
                    </table>
                </div>
             </div>
        )}

        {sub === 'ordenes' && (
            <div className="space-y-10">
                <div className="bg-white p-10 rounded-[50px] border shadow-xl border-t-[12px] border-blue-600 flex gap-8 items-end flex-wrap md:flex-nowrap">
                    <div className="flex-1 min-w-[200px]">
                        <p className="text-[9px] font-black mb-2 uppercase text-slate-400 ml-4">Medicamento a Producir</p>
                        <select id="selReceta" className="w-full p-5 bg-slate-50 rounded-3xl font-black outline-none border-2 focus:border-blue-500">
                            <option value="">-- Seleccionar Receta --</option>
                            {recetas.map(r => <option key={r.id} value={r.id}>{r.nombre_producto_final}</option>)}
                        </select>
                    </div>
                    <div className="w-40">
                        <p className="text-[9px] font-black mb-2 uppercase text-slate-400 ml-4">Lote / Cantidad</p>
                        <input id="cantProd" type="number" className="w-full p-5 bg-slate-50 rounded-3xl font-black text-center text-xl outline-none border-2 focus:border-blue-500" defaultValue="1"/>
                    </div>
                    <button onClick={async ()=>{
                        const rid = document.getElementById('selReceta').value;
                        const c = document.getElementById('cantProd').value;
                        if(!rid || !c) return alert("Completa los datos");
                        await axios.post('/produccion/ordenes', { receta_id: rid, cantidad_a_producir: c }); 
                        load(); alert("Orden de Producción Lanzada");
                    }} className="px-10 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest">Generar Orden #</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm h-fit">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Orden #</th><th>Producto</th><th>Cant.</th><th>Estado</th><th></th></tr></thead>
                            <tbody>
                                {ordenes.map(o => (
                                    <tr key={o.id} className={`border-b hover:bg-blue-50 transition-all cursor-pointer ${selectedOrden?.id === o.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''}`} onClick={()=>setSelectedOrden(o)}>
                                        <td className="p-8 font-black text-slate-700">{o.numero_orden}</td>
                                        <td className="font-bold text-slate-500">{o.nombre_producto_final}</td>
                                        <td className="font-black text-slate-800">{o.cantidad_a_producir}</td>
                                        <td><span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${o.estado==='Prealistamiento'?'bg-yellow-100 text-yellow-600':o.estado==='Produccion'?'bg-blue-100 text-blue-600':o.estado==='Logistica'?'bg-purple-100 text-purple-600':'bg-green-100 text-green-600'}`}>{o.estado}</span></td>
                                        <td className="p-8 text-right"><ChevronRight size={16} className="text-slate-300"/></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {selectedOrden ? (
                        <div className="bg-white p-12 rounded-[50px] shadow-2xl border-l-[15px] border-blue-600 animate-slide-up">
                            <h3 className="text-3xl font-black italic mb-2">Orden #{selectedOrden.numero_orden}</h3>
                            <p className="font-black text-blue-600 mb-8 uppercase text-xs tracking-widest">{selectedOrden.nombre_producto_final}</p>
                            
                            <div className="space-y-6 mb-12">
                                <div className="flex justify-between border-b pb-4">
                                    <span className="font-bold text-slate-400 text-xs uppercase">Estado Actual</span>
                                    <span className="font-black text-slate-800">{selectedOrden.estado}</span>
                                </div>
                                <div className="flex justify-between border-b pb-4">
                                    <span className="font-bold text-slate-400 text-xs uppercase">Cantidad a Fabricar</span>
                                    <span className="font-black text-slate-800">{selectedOrden.cantidad_a_producir} Unidades</span>
                                </div>
                                {selectedOrden.estado === 'Logistica' && (
                                    <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100 space-y-4">
                                        <p className="font-black text-purple-600 text-[10px] uppercase">Datos de Despacho Requeridos</p>
                                        <input className="w-full p-3 bg-white rounded-xl border font-bold text-xs" placeholder="Ciudad de Destino" id="lciudad"/>
                                        <input className="w-full p-3 bg-white rounded-xl border font-bold text-xs" placeholder="Transportadora (Servientrega/Envia)" id="ltrans"/>
                                        <input className="w-full p-3 bg-white rounded-xl border font-bold text-xs" placeholder="Número de Guía" id="lguia"/>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => avanzarFase(selectedOrden)} className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                                <CheckCircle2 size={20}/>
                                AVANZAR A LA SIGUIENTE FASE
                            </button>
                            <p className="text-[9px] font-bold text-slate-400 mt-6 text-center uppercase tracking-widest italic">Responsable Actual: {user.cargo} - {user.nombre}</p>
                        </div>
                    ) : (
                        <div className="bg-white p-20 rounded-[50px] border border-dashed flex flex-col items-center justify-center text-slate-300">
                            <Factory size={64} className="mb-6 opacity-20"/>
                            <p className="font-black uppercase tracking-widest text-xs">Selecciona una orden para gestionar</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}

// ==========================================
//           VISTA: NÓMINA CLOUD
// ==========================================
function NominaView() {
  const [emps, setEmps] = useState([]);
  const load = useCallback(() => axios.get('/empleados').then(res => setEmps(res.data)), []);
  useEffect(() => { load(); }, [load]);

  const liquidar = (e) => {
      const dias = window.prompt("Días Trabajados (Max 30):", "30");
      if(!dias) return;
      const extras = window.prompt("Horas Extras Diurnas:", "0");
      const base = (e.salario / 30) * dias;
      const total = base + (parseInt(extras) * (e.salario / 240 * 1.25));
      alert(`Liquidación para ${e.nombre}:\nNeto a pagar: ${fmt(total)}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {emps.map(e => (
            <div key={e.id} className="bg-white p-8 rounded-[40px] border shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all cursor-pointer" onClick={()=>liquidar(e)}>
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[28px] flex items-center justify-center text-4xl font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {e?.nombre?.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="font-black text-slate-800 text-xl leading-none truncate mb-2">{e.nombre}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{e.cargo}</p>
                    <p className="text-2xl font-black text-green-600">{fmt(e.salario)}</p>
                </div>
            </div>
        ))}
        <div className="bg-blue-600 p-8 rounded-[40px] shadow-2xl text-white flex flex-col justify-center items-center cursor-pointer hover:scale-105 transition-all group">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4"><Plus size={32}/></div>
            <p className="font-black text-sm uppercase tracking-widest">Vincular Nuevo Empleado</p>
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
    alert("Usuario Procesado en Base de Datos"); setForm({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' }); load();
  };

  return (
    <div className="space-y-12">
        <div className="bg-white p-12 rounded-[50px] border shadow-sm max-w-4xl mx-auto">
            <h3 className="font-black text-2xl mb-10 italic text-slate-800">{form.id ? 'Editar Acceso' : 'Crear Acceso de Usuario'}</h3>
            <form onSubmit={save} className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="col-span-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1">Nombre Completo</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 focus:border-blue-500 outline-none" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                </div>
                <div className="col-span-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1">Correo Corporativo</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 focus:border-blue-500 outline-none" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/>
                </div>
                <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1">Contraseña</label>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 focus:border-blue-500 outline-none" type="password" placeholder="Pass" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required={!form.id}/>
                </div>
                <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1">Rol / Cargo</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-black outline-none border-2 focus:border-blue-500" value={form.cargo} onChange={e=>setForm({...form, cargo:e.target.value})}>
                        <option value="Admin">Admin (Full)</option>
                        <option value="Vendedor">Vendedor (TPV)</option>
                        <option value="Bodeguero">Bodeguero</option>
                        <option value="Contador">Contador</option>
                        <option value="Prealistador">Prealistador</option>
                        <option value="Produccion">Producción</option>
                        <option value="Logistica">Logística</option>
                    </select>
                </div>
                <button className="col-span-2 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:scale-[1.02] transition-all uppercase text-[10px] tracking-widest mt-4">Actualizar Permisos</button>
            </form>
        </div>
        <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Nombre del Funcionario</th><th>Email</th><th>Rol Asignado</th><th className="p-8 text-right">Acciones</th></tr></thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} className="border-b hover:bg-slate-50 transition-all">
                            <td className="p-8 font-black text-slate-700">{u.nombre}</td>
                            <td className="font-bold text-slate-400 text-sm">{u.email}</td>
                            <td><span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase">{u.cargo}</span></td>
                            <td className="p-8 text-right space-x-4">
                                <button onClick={()=>setForm(u)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-xl transition-all"><Edit size={16}/></button>
                                <button onClick={async ()=>{ if(confirm("¿Eliminar usuario definitivamente?")){ await axios.delete(`/admin/usuarios/${u.id}`); load(); } }} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
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
//           PÁGINA PSE (MARKETING)
// ==========================================
function PSEPage({ onBack }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-16 rounded-[60px] shadow-2xl max-w-2xl border-t-[25px] border-blue-600">
        <h1 className="text-5xl font-black mb-4 italic text-slate-800">AccuCloud PRO <span className="text-blue-600">2026</span></h1>
        <p className="text-slate-400 font-bold text-sm mb-12 px-10">Gestiona tu farmacéutica o negocio de producción con el ERP más avanzado del mercado.</p>
        
        <div className="bg-blue-50 p-12 rounded-[40px] mb-12 border border-blue-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 bg-blue-600 text-white font-black text-[9px] uppercase rounded-bl-3xl">Plan SaaS Mensual</div>
            <h2 className="text-7xl font-black text-blue-600 tracking-tighter leading-none mb-2">$600.000</h2>
            <p className="text-[11px] font-bold uppercase text-blue-400 tracking-widest">IVA Incluido | Soporte 24/7</p>
        </div>

        <ul className="text-left space-y-4 mb-12 px-10">
            <li className="flex items-center gap-3 text-sm font-bold text-slate-600"><CheckCircle2 className="text-green-500" size={18}/> Módulo de Producción Farmacéutica</li>
            <li className="flex items-center gap-3 text-sm font-bold text-slate-600"><CheckCircle2 className="text-green-500" size={18}/> Inventario Multibodega y Lotes</li>
            <li className="flex items-center gap-3 text-sm font-bold text-slate-600"><CheckCircle2 className="text-green-500" size={18}/> Facturación Electrónica TPV</li>
            <li className="flex items-center gap-3 text-sm font-bold text-slate-600"><CheckCircle2 className="text-green-500" size={18}/> Gestión de Nómina y RRHH</li>
        </ul>

        <button onClick={()=>alert("Redirigiendo a Pasarela de Pagos PSE Segura...")} className="w-full py-8 bg-slate-900 text-white font-black rounded-[35px] shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all text-sm uppercase tracking-widest">
            <CreditCard size={20}/> 
            Proceder al Pago con PSE
        </button>
        <button onClick={onBack} className="mt-8 text-slate-400 font-bold text-xs uppercase underline hover:text-slate-800 transition">Volver al Portal de Ingreso</button>
      </div>
    </div>
  );
}

// ==========================================
//           HELPERS UI
// ==========================================
function MenuButton({ icon, label, active, onClick }) { 
  return (
    <button onClick={onClick} className={`w-full flex items-center px-6 py-4 rounded-[22px] mb-2 transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 -translate-y-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}>
        <span className="mr-4">{icon}</span>
        <span className="text-sm font-black tracking-tight">{label}</span>
    </button>
  ); 
}

function CardStat({ title, value, icon, color }) { 
  const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
  return (
    <div className="bg-white p-10 rounded-[45px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{value}</h3>
    </div>
  ); 
}