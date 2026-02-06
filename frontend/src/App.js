/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Factory, ShieldCheck, Plus, X, 
  Truck, CheckCircle2, CreditCard, ClipboardList, TrendingUp,
  ArrowUpRight, ArrowDownRight, Calendar, Search, Layers, Box
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// CONFIGURACIÓN DE RED
axios.defaults.baseURL = window.location.origin + '/api';
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('erp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const fmt = (number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(number || 0);

// ==========================================
//           COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('erp_user');
    if (savedUser) setUser(JSON.parse(savedUser));
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
    window.location.reload();
  };

  if (loadingSession) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-2xl uppercase italic">Cargando AccuCloud Pro...</div>;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

// --- LOGIN ---
function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/login', form);
      if (res.data.success) onLogin(res.data);
      else window.alert('Credenciales inválidas');
    } catch (e) { window.alert('Fallo de conexión con el servidor.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4">
      <div className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md text-center">
        <h1 className="text-4xl font-black text-slate-800 mb-2 italic tracking-tighter">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase mb-10 tracking-widest italic">Haz parte del mejor sistema para tu negocio</p>
        <form onSubmit={handleAuth} className="space-y-4 text-left">
          <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" placeholder="Email Corporativo" onChange={e=>setForm({...form, email:e.target.value})} required />
          <input type="password" class="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" placeholder="Contraseña" onChange={e=>setForm({...form, password:e.target.value})} required />
          <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all">INGRESAR AL ERP</button>
        </form>
        <div className="mt-10 pt-6 border-t">
            <p className="text-xs text-slate-400 font-bold mb-4">¿No tienes cuenta?</p>
            <button className="w-full p-4 bg-green-50 text-green-600 border-2 border-green-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-100 transition-all">Comprar Licencia Pro ($600.000 COP) PSE</button>
        </div>
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
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r px-6 flex flex-col hidden md:flex">
        <div className="h-28 flex items-center font-black text-2xl text-slate-800 italic uppercase">ACCUCLOUD <span className="text-blue-600">.</span></div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {canSee(['Admin', 'Contador']) && <MenuButton icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />}
          {canSee(['Admin', 'Bodeguero']) && <MenuButton icon={<Package size={20}/>} label="Inventario PRO" active={activeTab==='inventario'} onClick={()=>setActiveTab('inventario')} />}
          {canSee(['Admin', 'Prealistador', 'Produccion', 'Bodeguero']) && <MenuButton icon={<Factory size={20}/>} label="Producción PRO" active={activeTab==='produccion'} onClick={()=>setActiveTab('produccion')} />}
          {canSee(['Admin', 'Nomina']) && <MenuButton icon={<Users size={20}/>} label="Nómina Cloud" active={activeTab==='nomina'} onClick={()=>setActiveTab('nomina')} />}
          {canSee(['Admin', 'Vendedor']) && <MenuButton icon={<Wallet size={20}/>} label="Cajas Mayor/Menor" active={activeTab==='caja'} onClick={()=>setActiveTab('caja')} />}
          {canSee(['Admin', 'Contador']) && <MenuButton icon={<CreditCard size={20}/>} label="Pagos y Gastos" active={activeTab==='pagos'} onClick={()=>setActiveTab('pagos')} />}
          {user.cargo === 'Admin' && <MenuButton icon={<ShieldCheck size={20}/>} label="Usuarios Admin" active={activeTab==='admin'} onClick={()=>setActiveTab('admin')} />}
        </nav>
        <div className="py-8 border-t flex flex-col">
            <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{user.cargo}</p>
                <p className="text-sm font-black text-slate-800 truncate">{user.nombre}</p>
            </div>
            <button onClick={onLogout} className="text-red-500 font-black text-[10px] uppercase text-left hover:underline">Cerrar Sesión</button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-auto p-10 bg-slate-50">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{activeTab}</h2>
            {turnoActivo ? (
                <div className="px-6 py-2 bg-green-100 text-green-700 rounded-xl font-black text-[10px] border border-green-200">SISTEMA ACTIVO | VENTAS TURNO: {fmt(turnoActivo.total_vendido)}</div>
            ) : (
                <div className="px-6 py-2 bg-red-100 text-red-700 rounded-xl font-black text-[10px] border border-red-200 uppercase">Caja Cerrada</div>
            )}
        </header>

        <div className="animate-fade-in">
          {activeTab==='dashboard' && <DashboardView />}
          {activeTab==='inventario' && <InventarioView />}
          {activeTab==='produccion' && <ProduccionView user={user} />}
          {activeTab==='nomina' && <NominaView />}
          {activeTab==='caja' && <CajaView user={user} turnoActivo={turnoActivo} onUpdate={recargarTurno}/>}
          {activeTab==='pagos' && <PagosView />}
          {activeTab==='admin' && <AdminView />}
        </div>
      </main>
    </div>
  );
}

// ==========================================
//           1. DASHBOARD VIEW
// ==========================================
function DashboardView() {
    const [data, setData] = useState({ cajaMayor: 0, topProducts: [], lowStock: 0 });
    useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-3 gap-8">
                <CardStat title="Caja Mayor (Ventas + Base)" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
                <CardStat title="Alertas Stock Mínimo" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
                <CardStat title="Estado Licencia" value="Premium 2026" icon={<ShieldCheck/>} color="green" />
            </div>
            
            <div className="grid grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[40px] shadow-sm border h-fit">
                    <h3 className="font-black mb-8 uppercase text-slate-400 text-[10px] tracking-widest flex items-center gap-2">
                        <TrendingUp size={16}/> Top 5 Productos Más Vendidos
                    </h3>
                    <div className="space-y-4">
                        {(data.topProducts || []).map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                <span className="font-black text-slate-700">{p.nombre_producto}</span>
                                <span className="bg-blue-600 text-white px-4 py-1 rounded-full font-black text-xs">{p.total} Uds</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[40px] shadow-sm border flex flex-col justify-center items-center text-center">
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mb-6"><CheckCircle2 size={40}/></div>
                    <h3 className="text-2xl font-black mb-2">Sistema al Día</h3>
                    <p className="text-sm text-slate-400 font-bold px-10">Todas las órdenes de producción y pagos están sincronizados con la nube.</p>
                </div>
            </div>
        </div>
    );
}

// ==========================================
//           2. INVENTARIO VIEW (CON UTILIDAD)
// ==========================================
function InventarioView() {
    const [sub, setSub] = useState('productos');
    const [items, setItems] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [form, setForm] = useState({ sku:'', nombre:'', fecha_vencimiento:'', costo_compra:0, costo_venta:0, stock:0, min_stock:5, bodega_id:'' });

    const load = useCallback(() => {
        axios.get('/productos').then(res => setItems(res.data));
        axios.get('/bodegas').then(res => setBodegas(res.data));
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSave = async (e) => {
        e.preventDefault();
        await axios.post('/productos', form);
        alert("Producto Guardado"); load(); setSub('productos');
    };

    return (
        <div className="space-y-8">
            <div className="flex gap-4 p-2 bg-white rounded-3xl w-fit border shadow-sm">
                <button onClick={()=>setSub('productos')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='productos'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Listado de Productos</button>
                <button onClick={()=>setSub('nuevo')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='nuevo'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Nuevo Ingreso</button>
                <button onClick={()=>setSub('bodegas')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='bodegas'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Detalle Bodegas</button>
            </div>

            {sub === 'productos' && (
                <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b">
                            <tr><th className="p-8">Código</th><th>Nombre</th><th>Vencimiento</th><th>Costo Compra</th><th>Costo Venta</th><th>Stock Min</th><th>Utilidad</th></tr>
                        </thead>
                        <tbody>{items.map(p => {
                            const util = (((p.costo_venta - p.costo_compra) / p.costo_venta) * 100).toFixed(1);
                            return (
                                <tr key={p.id} className="border-b hover:bg-slate-50 transition-all">
                                    <td className="p-8 font-bold text-slate-400">#{p.sku}</td>
                                    <td className="font-black text-slate-800">{p.nombre}</td>
                                    <td className="text-red-500 font-bold">{p.fecha_vencimiento}</td>
                                    <td>{fmt(p.costo_compra)}</td>
                                    <td className="text-blue-600 font-black">{fmt(p.costo_venta)}</td>
                                    <td className={`font-black ${p.stock <= p.min_stock ? 'text-red-500' : ''}`}>{p.stock} Uds</td>
                                    <td><span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-black">{util}%</span></td>
                                </tr>
                            )
                        })}</tbody>
                    </table>
                </div>
            )}

            {sub === 'nuevo' && (
                <form onSubmit={handleSave} className="bg-white p-12 rounded-[50px] border max-w-3xl shadow-sm mx-auto grid grid-cols-2 gap-6">
                    <h3 className="col-span-2 text-2xl font-black italic mb-4">Registro Técnico de Producto</h3>
                    <input className="col-span-2 p-5 bg-slate-50 rounded-3xl font-bold outline-none border-2 border-transparent focus:border-blue-500" placeholder="Nombre Comercial" onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                    <input className="p-5 bg-slate-50 rounded-3xl font-bold border-2 border-transparent focus:border-blue-500" placeholder="SKU / Código" onChange={e=>setForm({...form, sku:e.target.value})} required/>
                    <input className="p-5 bg-slate-50 rounded-3xl font-bold border-2 border-transparent focus:border-blue-500" type="date" title="Fecha Vencimiento" onChange={e=>setForm({...form, fecha_vencimiento:e.target.value})} required/>
                    <input className="p-5 bg-slate-50 rounded-3xl font-bold border-2 border-transparent focus:border-blue-500" placeholder="Costo Compra" type="number" onChange={e=>setForm({...form, costo_compra:e.target.value})} required/>
                    <input className="p-5 bg-slate-50 rounded-3xl font-bold border-2 border-transparent focus:border-blue-500" placeholder="Costo Venta" type="number" onChange={e=>setForm({...form, costo_venta:e.target.value})} required/>
                    <input className="p-5 bg-slate-50 rounded-3xl font-bold border-2 border-transparent focus:border-blue-500" placeholder="Stock Inicial" type="number" onChange={e=>setForm({...form, stock:e.target.value})} required/>
                    <select className="p-5 bg-slate-50 rounded-3xl font-bold" onChange={e=>setForm({...form, bodega_id:e.target.value})}>
                        <option value="">-- Bodega Destino --</option>
                        {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                    <button type="submit" className="col-span-2 py-6 bg-blue-600 text-white font-black rounded-[30px] shadow-xl uppercase tracking-widest text-xs">Registrar en Inventario</button>
                </form>
            )}

            {sub === 'bodegas' && (
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-[40px] border shadow-sm space-y-6">
                        <h3 className="font-black italic text-xl">Nueva Bodega</h3>
                        <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold outline-none" id="bn" placeholder="Nombre" />
                        <textarea className="w-full p-5 bg-slate-50 rounded-3xl font-bold outline-none" id="bd" placeholder="Detalles de la bodega (Ubicación, capacidad, etc)" />
                        <button onClick={async()=>{ await axios.post('/bodegas', {nombre: document.getElementById('bn').value, detalles: document.getElementById('bd').value}); load(); alert("Bodega Creada"); }} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-xs">Crear Bodega</button>
                    </div>
                    <div className="bg-white rounded-[40px] border overflow-hidden h-fit">
                         <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr><th className="p-8">Nombre Bodega</th><th className="p-8">Detalles</th></tr></thead>
                            <tbody>{bodegas.map(b => (
                                <tr key={b.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 font-black text-slate-700">{b.nombre}</td><td className="p-8 text-xs font-bold text-slate-400">{b.detalles}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
//           3. PRODUCCIÓN VIEW (4 ETAPAS)
// ==========================================
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
        await axios.put(`/produccion/ordenes/${id}/avanzar`, { estado, cantidad_salida: out, observaciones: obs });
        load();
        alert(`La orden ha sido marcada como ${estado}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-2 bg-white rounded-3xl w-fit border shadow-sm">
                <button onClick={()=>setSub('recetas')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='recetas'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Configurar Kits</button>
                <button onClick={()=>setSub('ordenes')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='ordenes'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Órdenes de Trabajo</button>
            </div>

            {sub === 'recetas' ? (
                <div className="bg-white p-12 rounded-[50px] border shadow-sm">
                    <h3 className="font-black mb-10 italic text-2xl">Kits de Producción</h3>
                    <div className="grid grid-cols-2 gap-10">
                        {recetas.map(r => (
                            <div key={r.id} className="p-8 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col justify-between">
                                <div>
                                    <p className="font-black text-2xl text-blue-600 mb-6 uppercase tracking-tight">{r.nombre_kit}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Componentes del Kit</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-white p-3 rounded-2xl text-xs font-bold shadow-sm"><span>Materia Prima A</span><span>500mg</span></div>
                                        <div className="flex justify-between items-center bg-white p-3 rounded-2xl text-xs font-bold shadow-sm"><span>Materia Prima B</span><span>200ml</span></div>
                                    </div>
                                </div>
                                <button className="mt-8 py-3 bg-white text-slate-400 border rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-blue-600 transition-all">+ Editar Componentes</button>
                            </div>
                        ))}
                        <button onClick={async()=>{ const n = prompt("Nombre del Kit?"); await axios.post('/api/produccion/recetas', {nombre_kit: n}); load(); }} className="p-8 border-4 border-dotted rounded-[40px] flex flex-col items-center justify-center text-slate-300 font-black uppercase hover:bg-slate-50 transition-all">
                           <Plus size={48} className="mb-4"/> Crear Nuevo Kit Maestro
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[50px] border shadow-xl flex gap-8 items-end flex-wrap md:flex-nowrap border-t-[15px] border-blue-600">
                        <div className="flex-1 min-w-[200px]"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Producto a Fabricar</label><select id="ok" className="w-full p-5 bg-slate-50 rounded-3xl font-black border-none outline-none">{recetas.map(r=><option key={r.id} value={r.id}>{r.nombre_kit}</option>)}</select></div>
                        <div className="w-40"><label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Cantidad</label><input id="oc" type="number" className="w-full p-5 bg-slate-50 rounded-3xl font-black text-center text-xl outline-none" defaultValue="1" /></div>
                        <button onClick={async()=>{ await axios.post('/produccion/ordenes', {receta_id: document.getElementById('ok').value, cantidad: document.getElementById('oc').value}); load(); alert("Orden Montada con Éxito"); }} className="px-12 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-[10px]">Montar Orden de Producción</button>
                    </div>

                    <div className="space-y-4">
                        {ordenes.map(o => (
                            <div key={o.id} className="bg-white p-8 rounded-[40px] border shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Orden de Producción: {o.numero_orden}</p>
                                    <h4 className="text-2xl font-black text-slate-800 italic uppercase">{o.nombre_kit}</h4>
                                    <div className="flex gap-4 mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <span className="bg-slate-50 px-3 py-1 rounded-full border">Montó: {o.usuario_monta}</span>
                                        {o.usuario_bodeguero_alista && <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100 italic">Bodeguero (Alista): {o.usuario_bodeguero_alista}</span>}
                                        {o.usuario_produccion && <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 italic">Producción (Procesa): {o.usuario_produccion}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-center bg-slate-50 p-4 rounded-3xl border">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Requerido vs Salida</p>
                                        <p className="font-black text-2xl">{o.cantidad_requerida} / <span className="text-blue-600">{o.cantidad_salida}</span></p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className={`px-6 py-2 rounded-2xl font-black text-[10px] text-center uppercase ${o.estado === 'Terminada' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>{o.estado}</span>
                                        
                                        {/* FLUJO DINAMICO SEGUN ROLES */}
                                        {o.estado === 'Montada' && <button onClick={()=>avanzar(o.id, 'Alistada')} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[9px] uppercase hover:bg-black shadow-lg">Confirmar Alistamiento (BODEGA)</button>}
                                        {o.estado === 'Alistada' && <button onClick={()=>{ const out = prompt("Cantidad producida real?"); const obs = prompt("Observaciones de calidad?"); avanzar(o.id, 'Procesada', out, obs); }} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[9px] uppercase hover:bg-blue-700 shadow-lg">Confirmar Producción (PLANTA)</button>}
                                        {o.estado === 'Procesada' && <button onClick={()=>avanzar(o.id, 'Terminada')} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black text-[9px] uppercase hover:bg-green-700 shadow-lg">Recibir Producto Terminado (BODEGA)</button>}
                                        {o.estado === 'Terminada' && <div className="flex items-center gap-2 text-green-600 font-black text-[10px] justify-center uppercase"><CheckCircle2 size={16}/> Lote Completo</div>}
                                    </div>
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
//           4. NOMINA CLOUD VIEW
// ==========================================
function NominaView() {
    const [emps, setEmps] = useState([]);
    const load = () => axios.get('/empleados').then(res => setEmps(res.data));
    useEffect(() => { load(); }, []);

    const saveEmpleado = async (e) => {
        e.preventDefault();
        const d = { 
            nombre: e.target.n.value, documento: e.target.d.value, valor_dia: e.target.v.value, 
            hire_date: e.target.h.value, eps: e.target.eps.value, arl: e.target.arl.value, pension: e.target.pen.value, cargo: e.target.c.value 
        };
        await axios.post('/empleados', d); alert("Funcionario Vinculado"); load(); e.target.reset();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <form onSubmit={saveEmpleado} className="bg-white p-12 rounded-[50px] border shadow-sm space-y-6 h-fit">
                <h3 className="font-black italic text-xl">Vincular Funcionario</h3>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nombre Completo</label><input name="n" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border outline-none" required/></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Cédula</label><input name="d" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border outline-none" required/></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Valor Día</label><input name="v" type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border outline-none" required/></div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Fecha Inicio</label><input name="h" type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border outline-none" required/></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <input name="eps" className="p-3 bg-slate-50 rounded-xl border text-[9px] font-black uppercase" placeholder="EPS" required/>
                    <input name="arl" className="p-3 bg-slate-50 rounded-xl border text-[9px] font-black uppercase" placeholder="ARL" required/>
                    <input name="pen" className="p-3 bg-slate-50 rounded-xl border text-[9px] font-black uppercase" placeholder="F. Pension" required/>
                </div>
                <select name="c" className="w-full p-4 bg-slate-50 rounded-2xl font-black border outline-none"><option value="Operario">Operario Producción</option><option value="Vendedor">Vendedor TPV</option><option value="Admin">Admin Sistema</option></select>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase text-[10px] tracking-widest">Vincular Ahora</button>
            </form>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-fit">
                {emps.map(e => (
                    <div key={e.id} className="bg-white p-10 rounded-[45px] border shadow-sm flex flex-col gap-6 hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-center border-b pb-6">
                            <div>
                                <p className="font-black text-2xl text-slate-800 leading-none mb-2">{e.nombre}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ingresó: {e.hire_date} | DOC: {e.documento}</p>
                            </div>
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl font-black">{e.nombre?.charAt(0)}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">EPS</p><p className="text-[10px] font-bold text-blue-600">{e.eps}</p></div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">ARL</p><p className="text-[10px] font-bold text-blue-600">{e.arl}</p></div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">Pension</p><p className="text-[10px] font-bold text-blue-600">{e.pension}</p></div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Valor por Jornada</p><p className="text-3xl font-black text-green-600">{fmt(e.valor_dia)}</p></div>
                            <button onClick={()=>alert(`Calculando nómina legal para ${e.nombre}...`)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg">Liquidar Mes</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==========================================
//           5. CAJA MAYOR Y MENOR VIEW
// ==========================================
function CajaView({ user, turnoActivo, onUpdate }) {
    const [sub, setSub] = useState('mayor');
    const [menor, setMenor] = useState([]);
    const load = () => axios.get('/caja-menor').then(res => setMenor(res.data));
    useEffect(() => { load(); }, []);

    const saveMovimiento = async (e) => {
        e.preventDefault();
        const d = { tipo: e.target.t.value, monto: e.target.m.value, descripcion: e.target.d.value, tarjeta: e.target.tj.value };
        await axios.post('/caja-menor', d); alert("Movimiento Registrado"); load(); e.target.reset();
    };

    return (
        <div className="space-y-8">
            <div className="flex gap-4 p-2 bg-white rounded-3xl w-fit border shadow-sm">
                <button onClick={()=>setSub('mayor')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='mayor'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Caja Mayor (Central)</button>
                <button onClick={()=>setSub('menor')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='menor'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Caja Menor / Gastos</button>
            </div>

            {sub === 'mayor' ? (
                <div className="max-w-xl mx-auto mt-10">
                    <div className="bg-white p-20 rounded-[60px] border shadow-2xl text-center border-t-[20px] border-blue-600">
                        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-inner"><Wallet size={54}/></div>
                        {turnoActivo ? (
                            <div className="space-y-8">
                                <h3 className="text-3xl font-black italic text-slate-800">Caja de {user.nombre}</h3>
                                <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 text-left">
                                    <div className="flex justify-between items-center mb-4 pb-4 border-b">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Base Apertura</p>
                                        <p className="font-black text-slate-600">{fmt(turnoActivo.base_caja)}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Total Ventas Hoy</p>
                                        <p className="text-4xl font-black text-blue-600">{fmt(turnoActivo.total_vendido)}</p>
                                    </div>
                                </div>
                                <button onClick={async() => { if(confirm("¿Cerrar Turno Hoy?")){ await axios.put('/turnos/finalizar', {turno_id: turnoActivo.id}); onUpdate(); }}} className="w-full py-6 bg-red-500 text-white font-black rounded-[30px] shadow-xl uppercase tracking-widest text-xs hover:bg-red-600 transition-all">Realizar Cierre de Caja Mayor</button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <h3 className="text-3xl font-black italic text-slate-800 leading-tight">Apertura de Turno<br/>Hoy en Nube</h3>
                                <input id="baseC" type="number" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-4xl text-center border-2 border-transparent focus:border-blue-500 outline-none transition-all" placeholder="$ 0" />
                                <button onClick={async() => { await axios.post('/turnos/iniciar', {base_caja: document.getElementById('baseC').value}); onUpdate(); }} className="w-full py-6 bg-blue-600 text-white font-black rounded-[30px] shadow-xl uppercase tracking-widest text-xs">Abrir Caja Central</button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <form onSubmit={saveMovimiento} className="bg-white p-12 rounded-[50px] border shadow-sm space-y-6 h-fit">
                        <h3 className="font-black italic text-xl">Registrar Caja Menor</h3>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Medio de Pago</label>
                            <select name="t" className="w-full p-4 bg-slate-50 rounded-2xl font-black border-none outline-none">
                                <option value="Efectivo">Efectivo</option>
                                <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Banco / Tarjeta (Si aplica)</label>
                            <input name="tj" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" placeholder="Ej: Visa Bancolombia" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Valor del Movimiento</label>
                            <input name="m" type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Descripción / Motivo</label>
                            <textarea name="d" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" rows="3" required />
                        </div>
                        <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl uppercase text-[10px]">Guardar Movimiento</button>
                    </form>
                    <div className="lg:col-span-2 bg-white rounded-[50px] border shadow-sm overflow-hidden h-fit">
                         <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr><th className="p-8">Fecha</th><th>Tipo</th><th>Monto</th><th>Detalle</th><th>Descripción</th></tr></thead>
                            <tbody>{menor.map(m => (
                                <tr key={m.id} className="border-b hover:bg-slate-50 transition-all">
                                    <td className="p-8 text-[9px] font-black text-slate-400">{new Date(m.fecha).toLocaleString()}</td>
                                    <td className="font-bold text-slate-700">{m.tipo}</td>
                                    <td className="font-black text-blue-600">{fmt(m.monto)}</td>
                                    <td className="text-xs italic">{m.detalle_tarjeta || '---'}</td>
                                    <td className="text-xs font-bold text-slate-500">{m.descripcion}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
//           6. PAGOS Y GASTOS VIEW
// ==========================================
function PagosView() {
    const [pagos, setPagos] = useState([]);
    const load = () => axios.get('/api/pagos').then(res => setPagos(res.data)).catch(()=>setPagos([]));
    useEffect(() => { load(); }, []);

    const savePago = async (e) => {
        e.preventDefault();
        const d = { beneficiario: e.target.b.value, monto: e.target.m.value, descripcion: e.target.d.value, categoria: e.target.c.value };
        await axios.post('/pagos', d); alert("Pago Registrado"); load(); e.target.reset();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <form onSubmit={savePago} className="bg-white p-12 rounded-[50px] border shadow-sm space-y-6 h-fit">
                <h3 className="font-black italic text-xl">Registrar Egreso</h3>
                <select name="c" className="w-full p-4 bg-slate-50 rounded-2xl font-black border-none outline-none"><option value="Proveedor">Pago a Proveedor</option><option value="Gasto">Gasto Operativo</option></select>
                <input name="b" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" placeholder="Nombre Beneficiario" required />
                <input name="m" type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" placeholder="Monto $" required />
                <textarea name="d" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" placeholder="Descripción detallada del pago..." rows="4" required />
                <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase text-[10px]">Confirmar Egreso</button>
            </form>
            <div className="lg:col-span-2 bg-white rounded-[50px] border shadow-sm overflow-hidden h-fit">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr><th className="p-8">Fecha / Hora</th><th>Categoría</th><th>Beneficiario</th><th>Valor</th><th>Descripción</th></tr></thead>
                    <tbody>{pagos.map(p => (
                        <tr key={p.id} className="border-b hover:bg-slate-50 transition-all">
                            <td className="p-8 text-[9px] font-black text-slate-400">{new Date(p.fecha).toLocaleString()}</td>
                            <td><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${p.categoria === 'Proveedor' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>{p.categoria}</span></td>
                            <td className="font-black text-slate-700">{p.beneficiario}</td>
                            <td className="font-black text-red-500">{fmt(p.monto)}</td>
                            <td className="p-6 text-[10px] font-bold text-slate-500 max-w-[200px] truncate">{p.descripcion}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
//           7. ADMIN VIEW
// ==========================================
function AdminView() {
    const [users, setUsers] = useState([]);
    const load = () => axios.get('/admin/usuarios').then(res => setUsers(res.data));
    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-10">
            <div className="bg-white p-12 rounded-[50px] border shadow-sm max-w-4xl mx-auto flex gap-8 items-center border-l-[20px] border-blue-600">
                <div className="flex-1">
                    <h3 className="text-3xl font-black italic mb-2">Seguridad Corporativa</h3>
                    <p className="text-slate-400 text-sm font-bold">Desde este panel controlas los accesos a los módulos de tu empresa.</p>
                </div>
                <button onClick={async()=>{ const n = prompt("Nombre?"); const e = prompt("Email?"); const p = prompt("Pass?"); const c = prompt("Cargo?"); await axios.post('/admin/usuarios', {nombre:n, email:e, password:p, cargo:c}); load(); }} className="px-12 py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl uppercase text-[10px] tracking-widest">Añadir Nuevo Funcionario</button>
            </div>
            <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr><th className="p-8">Nombre del Funcionario</th><th>Email Corporativo</th><th>Rol / Cargo</th><th>Estado Acceso</th></tr></thead>
                    <tbody>{users.map(u => (
                        <tr key={u.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 font-black text-slate-700">{u.nombre}</td><td>{u.email}</td><td><span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase">{u.cargo}</span></td><td className="text-green-500 font-bold text-xs">ACTIVO</td></tr>
                    ))}</tbody>
                </table>
            </div>
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
    return (
        <div className="bg-white p-10 rounded-[45px] border border-slate-100 shadow-sm group hover:shadow-xl transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{title}</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{value}</h3>
        </div>
    ); 
}