/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, RefreshCcw, Menu, TrendingUp, Factory, Truck, CreditCard, Settings, ChevronRight, History
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ==========================================
//      CONFIGURACIÓN DE RED SEGURA (SaaS)
// ==========================================
axios.defaults.baseURL = window.location.origin + '/api';

// Este interceptor adjunta el Token de Seguridad automáticamente
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

  if (loadingSession) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse">CARGANDO ACCUCLOUD...</div>;
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

// --- PANTALLA DE LOGIN ---
function LoginScreen({ onLogin, onBuy }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/login', { email, password });
      if (res.data.success) onLogin(res.data);
      else window.alert('Usuario o contraseña inválidos');
    } catch (e) { window.alert('Error de conexión con el servidor SaaS.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4">
      <div className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md text-center">
        <h1 className="text-4xl font-black text-slate-800 mb-2 italic tracking-tighter">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase mb-10 tracking-widest">Inicia sesión en tu empresa</p>
        <form onSubmit={handleAuth} className="space-y-4 text-left">
          <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
          <input type="password" class="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required />
          <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all">ENTRAR AL SISTEMA</button>
        </form>
        <button onClick={onBuy} className="w-full mt-10 p-4 bg-green-50 text-green-600 border-2 border-green-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-100 transition-all">Activar Licencia 2026 ($600.000)</button>
      </div>
    </div>
  );
}

// --- DASHBOARD PRINCIPAL ---
function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [turnoActivo, setTurnoActivo] = useState(null);

  const recargarTurno = useCallback(() => {
    axios.get('/turnos/activo/' + user.id).then(res => setTurnoActivo(res.data));
  }, [user.id]);

  useEffect(() => { recargarTurno(); }, [recargarTurno]);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-72 bg-white border-r px-6 flex flex-col hidden md:flex">
        <div className="h-28 flex items-center font-black text-2xl text-slate-800 italic uppercase">ACCUCLOUD <span className="text-blue-600">.</span></div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          <MenuButton icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />
          <MenuButton icon={<ShoppingCart size={20}/>} label="Ventas TPV" active={activeTab==='ventas'} onClick={()=>setActiveTab('ventas')} />
          <MenuButton icon={<Package size={20}/>} label="Inventario" active={activeTab==='inventario'} onClick={()=>setActiveTab('inventario')} />
          <MenuButton icon={<Calculator size={20}/>} label="Nómina" active={activeTab==='nomina'} onClick={()=>setActiveTab('nomina')} />
          <MenuButton icon={<Wallet size={20}/>} label="Caja y Turnos" active={activeTab==='caja'} onClick={()=>setActiveTab('caja')} />
          {user.cargo === 'Admin' && <MenuButton icon={<ShieldCheck size={20}/>} label="Usuarios" active={activeTab==='admin'} onClick={()=>setActiveTab('admin')} />}
        </nav>
        <div className="py-8 border-t flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">{user.nombre.charAt(0)}</div>
                <div>
                    <p className="text-sm font-black text-slate-800 leading-none">{user.nombre}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{user.cargo}</p>
                </div>
            </div>
            <button onClick={onLogout} className="text-red-400 hover:text-red-600 p-2"><X/></button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-10 bg-slate-50">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{activeTab}</h2>
            {turnoActivo ? (
                <div className="px-6 py-2 bg-green-100 text-green-700 rounded-2xl text-[10px] font-black border border-green-200">
                    SISTEMA ACTIVO | VENTAS: {fmt(turnoActivo.total_vendido)}
                </div>
            ) : (
                <div className="px-6 py-2 bg-red-100 text-red-700 rounded-2xl text-[10px] font-black border border-red-200 uppercase">
                    Caja Cerrada
                </div>
            )}
        </header>

        <div className="pb-10">
          {activeTab==='dashboard' && <ResumenView />}
          {activeTab==='ventas' && <VentasView user={user} turnoActivo={turnoActivo}/>}
          {activeTab==='inventario' && <InventarioView />}
          {activeTab==='nomina' && <NominaView user={user} />}
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
  const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
  useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);

  return (
    <div className="space-y-10 animate-fade-in">
        <div className="grid grid-cols-4 gap-6">
            <CardStat title="Ventas Totales" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
            <CardStat title="Patrimonio Stock" value={fmt(data.valorInventario)} icon={<Package/>} color="purple" />
            <CardStat title="Faltantes Stock" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
            <CardStat title="Estado SaaS" value="Premium" icon={<ShieldCheck/>} color="green" />
        </div>
        <div className="bg-white p-10 rounded-[40px] shadow-sm border h-80">
            <h3 className="font-black mb-6 uppercase text-xs tracking-widest text-slate-400 text-center">Rendimiento Semanal</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{n:'L', v:400},{n:'M', v:700},{n:'M', v:500},{n:'J', v:900},{n:'V', v:1200},{n:'S', v:1500},{n:'D', v:800}]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <Bar dataKey="v" fill="#2563eb" radius={[10, 10, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
}

// ==========================================
//           VISTA: VENTAS (TPV)
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

    const total = cart.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);

    const finalizarVenta = async () => {
        if (!turnoActivo) return alert("Debes abrir caja primero");
        if (cart.length === 0) return alert("Carrito vacío");
        try {
            await axios.post('/ventas', { productos: cart, responsable: user.nombre, turno_id: turnoActivo.id });
            alert("Venta procesada con éxito.");
            setCart([]);
        } catch (e) { alert("Error al procesar."); }
    };

    if (!turnoActivo) return <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[40px] border-2 border-dashed"><Lock size={48} className="text-slate-200 mb-4"/><p className="font-black text-slate-300 uppercase">Caja Cerrada - Abre turno en el módulo de Caja</p></div>;

    return (
        <div className="grid grid-cols-3 gap-10 animate-fade-in">
            <div className="col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-[30px] shadow-sm border relative">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                        <ScanBarcode className="text-slate-400"/>
                        <input className="bg-transparent w-full font-bold outline-none" placeholder="Buscar por nombre o SKU..." value={search} onChange={e=>setSearch(e.target.value)} />
                    </div>
                    {search && (
                        <div className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-2xl mt-2 z-50 border max-h-60 overflow-auto">
                            {productos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase())).map(p => (
                                <div key={p.id} onClick={()=>addToCart(p)} className="p-4 hover:bg-blue-50 cursor-pointer font-bold border-b flex justify-between items-center">
                                    <span>{p.nombre}</span>
                                    <span className="text-blue-600">{fmt(p.precio)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border min-h-[450px]">
                    <table className="w-full">
                        <thead className="text-[10px] font-black uppercase text-slate-400 border-b"><tr className="text-left"><th className="pb-4">Item</th><th>Cant</th><th className="text-right pb-4">Subtotal</th><th></th></tr></thead>
                        <tbody>
                            {cart.map(i => (
                                <tr key={i.id} className="border-b">
                                    <td className="py-4 font-bold text-slate-700">{i.nombre}</td>
                                    <td className="py-4">
                                        <input type="number" className="w-12 text-center bg-slate-50 rounded-lg font-bold" value={i.cantidad} onChange={e => setCart(cart.map(c => c.id === i.id ? {...c, cantidad: parseInt(e.target.value) || 1} : c))} />
                                    </td>
                                    <td className="py-4 text-right font-black">{fmt(i.precio * i.cantidad)}</td>
                                    <td className="text-right"><button onClick={()=>setCart(cart.filter(c => c.id !== i.id))} className="text-red-400 p-2"><X size={16}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="space-y-6">
                <div className="bg-white p-10 rounded-[40px] shadow-2xl border-t-[12px] border-blue-600">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total a cobrar</p>
                    <h2 className="text-5xl font-black text-slate-800 tracking-tighter mb-10">{fmt(total)}</h2>
                    <button onClick={finalizarVenta} className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all text-lg">FINALIZAR VENTA</button>
                    <button onClick={()=>setCart([])} className="w-full mt-4 text-[10px] font-black text-red-400 uppercase hover:underline">Vaciar Carrito</button>
                </div>
                <div className="bg-slate-900 p-8 rounded-[40px] text-white">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-4">Metodo de Pago</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button className="p-3 bg-white/10 rounded-xl font-bold text-xs border border-white/20">EFECTIVO</button>
                        <button className="p-3 bg-white/5 rounded-xl font-bold text-xs border border-transparent">TRANSF.</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
//           VISTA: INVENTARIO
// ==========================================
function InventarioView() {
    const [productos, setProductos] = useState([]);
    const [form, setForm] = useState({ nombre: '', sku: '', precio: '', stock: '' });

    const load = () => axios.get('/productos').then(res => setProductos(res.data));
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        await axios.post('/productos', form);
        alert("Producto creado");
        setForm({ nombre: '', sku: '', precio: '', stock: '' });
        load();
    };

    return (
        <div className="grid grid-cols-3 gap-10 animate-fade-in">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border h-fit">
                <h3 className="font-black text-xl mb-8 italic">Nuevo Item</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Nombre del Producto" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Código SKU" value={form.sku} onChange={e=>setForm({...form, sku: e.target.value})} required/>
                    <div className="grid grid-cols-2 gap-4">
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Precio" type="number" value={form.precio} onChange={e=>setForm({...form, precio: e.target.value})} required/>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Stock" type="number" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} required/>
                    </div>
                    <button className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl mt-4">REGISTRAR EN NUBE</button>
                </form>
            </div>
            <div className="col-span-2 bg-white rounded-[40px] shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest">
                        <tr className="border-b">
                            <th className="p-8">Detalle Producto</th>
                            <th>SKU</th>
                            <th>Precio</th>
                            <th className="p-8">Existencias</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition-all">
                                <td className="p-8 font-black text-slate-800">{p.nombre}</td>
                                <td className="font-bold text-slate-400">{p.sku}</td>
                                <td className="font-black text-blue-600">{fmt(p.precio)}</td>
                                <td className="p-8">
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black ${p.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {p.stock} UNIDADES
                                    </span>
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
//           VISTA: CAJA Y TURNOS
// ==========================================
function CajaView({ user, turnoActivo, onUpdate }) {
    const [base, setBase] = useState("");

    const handleAbrir = async () => {
        if (!base) return alert("Ingresa la base de caja");
        await axios.post('/turnos/iniciar', { nombre_usuario: user.nombre, base_caja: base });
        onUpdate();
    };

    const handleCerrar = async () => {
        if (window.confirm("¿Estás seguro de cerrar la caja?")) {
            await axios.put('/turnos/finalizar', { turno_id: turnoActivo.id });
            onUpdate();
        }
    };

    return (
        <div className="flex items-center justify-center p-20 animate-fade-in">
            <div className="bg-white p-16 rounded-[60px] shadow-2xl border text-center max-w-lg w-full">
                <div className={`w-24 h-24 mx-auto rounded-[32px] flex items-center justify-center mb-8 ${turnoActivo ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {turnoActivo ? <RefreshCcw size={40} className="animate-spin-slow"/> : <Lock size={40}/>}
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-2 italic">Control de Turno</h3>
                <p className="text-slate-400 text-sm mb-10 font-bold uppercase tracking-widest">Estado: {turnoActivo ? 'Abierto' : 'Cerrado'}</p>

                {turnoActivo ? (
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-3xl border text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total en Ventas</p>
                            <p className="text-4xl font-black text-green-600">{fmt(turnoActivo.total_vendido)}</p>
                        </div>
                        <button onClick={handleCerrar} className="w-full py-6 bg-red-500 text-white font-black rounded-3xl shadow-xl hover:bg-red-600 transition-all">REALIZAR CIERRE DE CAJA</button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <input type="number" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-center text-2xl border-2 border-transparent focus:border-blue-600 outline-none" placeholder="$ Base Inicial" value={base} onChange={e=>setBase(e.target.value)} />
                        <button onClick={handleAbrir} className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:bg-blue-700 transition-all">INICIAR TURNO HOY</button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
//           VISTA: NÓMINA CLOUD
// ==========================================
function NominaView() {
    const [empleados, setEmpleados] = useState([]);
    
    useEffect(() => { 
        axios.get('/empleados')
            .then(res => {
                // Forzamos que siempre sea un array para evitar pantalla blanca
                setEmpleados(Array.isArray(res.data) ? res.data : []);
            })
            .catch(err => {
                console.error("Error cargando nomina", err);
                setEmpleados([]);
            });
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {empleados.length > 0 ? empleados.map(e => (
                    <div key={e.id} className="bg-white p-8 rounded-[40px] shadow-sm border flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl">
                            {e?.nombre?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <p className="font-black text-slate-800 text-lg leading-none">{e?.nombre || 'Sin Nombre'}</p>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase">{e?.eps || 'EPS'} | {e?.arl || 'ARL'}</p>
                            <p className="text-xl font-black text-green-600 mt-2">{fmt(e?.salario)}</p>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full p-20 text-center bg-white rounded-[40px] border-2 border-dashed text-slate-300 font-black uppercase">
                        No hay empleados registrados
                    </div>
                )}
                <div className="bg-blue-600 p-8 rounded-[40px] shadow-xl text-white flex flex-col justify-center items-center cursor-pointer hover:scale-105 transition-all">
                    <Users size={32} className="mb-2"/>
                    <p className="font-black text-sm uppercase">Agregar Empleado</p>
                </div>
            </div>
        </div>
    );
}

// ==========================================
//           VISTA: ADMIN USUARIOS
// ==========================================
function AdminView() {
    const [usuarios, setUsuarios] = useState([]);
    useEffect(() => { axios.get('/admin/usuarios').then(res => setUsuarios(res.data)); }, []);

    return (
        <div className="bg-white rounded-[40px] shadow-sm border overflow-hidden animate-fade-in">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest"><tr className="border-b"><th className="p-8">Nombre</th><th>Email</th><th>Rol / Cargo</th><th className="p-8">Acciones</th></tr></thead>
                <tbody>
                    {usuarios.map(u => (
                        <tr key={u.id} className="border-b">
                            <td className="p-8 font-black">{u.nombre}</td>
                            <td className="font-bold text-slate-400">{u.email}</td>
                            <td><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">{u.cargo}</span></td>
                            <td className="p-8"><button className="text-blue-600 font-bold text-xs uppercase hover:underline">Editar</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ==========================================
//           HELPERS Y COMPONENTES UI
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
    return <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3>
    </div>; 
}

function PSEPage({ onBack }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-16 rounded-[60px] shadow-2xl max-w-2xl w-full text-center border-t-[24px] border-blue-600">
                <h1 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter uppercase italic">AccuCloud PRO 2026</h1>
                <div className="bg-blue-50 p-12 rounded-[40px] mb-10 border border-blue-100">
                    <h2 className="text-7xl font-black text-blue-600 tracking-tighter">$600.000</h2>
                    <p className="text-xs text-blue-400 mt-4 font-bold uppercase tracking-widest">Suscripción Mensual SaaS</p>
                </div>
                <button onClick={()=>window.alert("Redirigiendo a Pasarela...")} className="w-full py-6 bg-slate-900 text-white font-black rounded-[30px] shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all text-sm uppercase tracking-widest"><CreditCard /> Pagar con PSE</button>
                <button onClick={onBack} className="mt-8 text-slate-400 font-bold text-xs uppercase tracking-widest underline">Regresar</button>
            </div>
        </div>
    );
}