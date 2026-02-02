/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, 
  RefreshCcw, Menu, TrendingUp, Factory, Truck, CreditCard, 
  Settings, ChevronRight, History, Trash2, Edit, Plus, CheckCircle2,
  PieChart, BarChart as BarChartIcon, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
      else window.alert('Credenciales inválidas');
    } catch (e) { window.alert('Error de conexión con el servidor.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4">
      <div className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md text-center">
        <h1 className="text-4xl font-black text-slate-800 mb-2 italic tracking-tighter">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase mb-10 tracking-widest italic">Haz parte del mejor sistema para tu negocio</p>
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
      {/* SIDEBAR COMPLETO */}
      <aside className="w-72 bg-white border-r px-6 flex flex-col">
        <div className="h-28 flex items-center font-black text-2xl text-slate-800 italic uppercase">ACCUCLOUD <span className="text-blue-600">.</span></div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {canSee(['Admin', 'Contador']) && <MenuButton icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />}
          {canSee(['Admin', 'Vendedor']) && <MenuButton icon={<ShoppingCart size={20}/>} label="Ventas TPV" active={activeTab==='ventas'} onClick={()=>setActiveTab('ventas')} />}
          {canSee(['Admin', 'Bodeguero', 'Prealistador']) && <MenuButton icon={<Package size={20}/>} label="Inventario" active={activeTab==='inventario'} onClick={()=>setActiveTab('inventario')} />}
          {canSee(['Admin', 'Prealistador', 'Produccion', 'Logistica']) && <MenuButton icon={<Factory size={20}/>} label="Producción PRO" active={activeTab==='produccion'} onClick={()=>setActiveTab('produccion')} />}
          {canSee(['Admin', 'Nomina']) && <MenuButton icon={<Users size={20}/>} label="Nómina Cloud" active={activeTab==='nomina'} onClick={()=>setActiveTab('nomina')} />}
          {canSee(['Admin', 'Contador']) && <MenuButton icon={<Calculator size={20}/>} label="Contabilidad" active={activeTab==='conta'} onClick={()=>setActiveTab('conta')} />}
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

      <main className="flex-1 overflow-auto p-10 bg-slate-50">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{activeTab}</h2>
            {turnoActivo ? (
                <div className="px-6 py-2 bg-green-100 text-green-700 rounded-2xl text-[10px] font-black border border-green-200 flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> CAJA ABIERTA: {fmt(turnoActivo.total_vendido)}
                </div>
            ) : (
                <div className="px-6 py-2 bg-red-100 text-red-700 rounded-2xl text-[10px] font-black border border-red-200 uppercase">Cerrado</div>
            )}
        </header>

        {/* MODULOS DINAMICOS */}
        <div className="pb-10">
          {activeTab==='dashboard' && <ResumenView />}
          {activeTab==='ventas' && <VentasView user={user} turnoActivo={turnoActivo}/>}
          {activeTab==='inventario' && <InventarioView />}
          {activeTab==='produccion' && <ProduccionView user={user}/>}
          {activeTab==='nomina' && <NominaView />}
          {activeTab==='conta' && <ContabilidadView />}
          {activeTab==='caja' && <CajaView user={user} turnoActivo={turnoActivo} onUpdate={recargarTurno}/>}
          {activeTab==='admin' && <AdminView />}
        </div>
      </main>
    </div>
  );
}

// ==========================================
//           VISTA: RESUMEN (DASHBOARD)
// ==========================================
function ResumenView() {
  const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
  useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);

  return (
    <div className="grid grid-cols-4 gap-6">
        <CardStat title="Ventas Totales" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
        <CardStat title="Patrimonio Stock" value={fmt(data.valorInventario)} icon={<Package/>} color="purple" />
        <CardStat title="Faltantes Stock" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
        <CardStat title="Estado SaaS" value="Premium 2026" icon={<ShieldCheck/>} color="green" />
    </div>
  );
}

// ==========================================
//           VISTA: INVENTARIO (BODEGAS Y PRODUCTOS)
// ==========================================
function InventarioView() {
  const [mode, setMode] = useState('list');
  const [prods, setProds] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [form, setForm] = useState({ nombre: '', sku: '', precio: '', stock: '', bodega_id: '' });
  const [formB, setFormB] = useState({ nombre: '' });

  const load = useCallback(() => {
    axios.get('/productos').then(res => setProds(res.data));
    axios.get('/bodegas').then(res => setBodegas(res.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveProduct = async (e) => {
    e.preventDefault();
    await axios.post('/productos', form);
    alert("Producto Guardado en la Nube");
    setForm({ nombre: '', sku: '', precio: '', stock: '', bodega_id: '' });
    setMode('list'); load();
  };

  const saveBodega = async (e) => {
    e.preventDefault();
    await axios.post('/bodegas', formB);
    alert("Bodega Creada");
    setFormB({ nombre: '' });
    load();
  };

  return (
    <div className="space-y-6">
        <div className="flex gap-4 p-2 bg-white rounded-3xl w-fit border shadow-sm">
            <button onClick={()=>setMode('list')} className={`px-8 py-2 rounded-xl font-black text-xs ${mode==='list'?'bg-blue-600 text-white':'text-slate-400'}`}>LISTADO</button>
            <button onClick={()=>setMode('new')} className={`px-8 py-2 rounded-xl font-black text-xs ${mode==='new'?'bg-blue-600 text-white':'text-slate-400'}`}>NUEVO PRODUCTO</button>
            <button onClick={()=>setMode('bodegas')} className={`px-8 py-2 rounded-xl font-black text-xs ${mode==='bodegas'?'bg-blue-600 text-white':'text-slate-400'}`}>BODEGAS</button>
        </div>

        {mode === 'list' && (
            <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Detalle</th><th>SKU</th><th>Stock</th><th>Bodega</th></tr></thead>
                    <tbody>
                        {prods.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition-all">
                                <td className="p-8 font-black text-slate-700">{p.nombre}</td>
                                <td className="font-bold text-slate-400">{p.sku}</td>
                                <td className="font-black text-blue-600">{p.stock}</td>
                                <td className="text-xs font-bold uppercase text-slate-400">{p.bodega_nombre || 'Sin Asignar'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {mode === 'new' && (
            <div className="bg-white p-12 rounded-[50px] border max-w-2xl shadow-sm mx-auto">
                <h3 className="text-2xl font-black mb-8 italic text-slate-800">Registrar Nuevo Item</h3>
                <form onSubmit={saveProduct} className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1">Nombre del Producto</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1">SKU</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1">Precio</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" type="number" value={form.precio} onChange={e=>setForm({...form, precio:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1">Stock Inicial</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1">Bodega</label>
                        <select className="w-full p-4 bg-slate-50 rounded-2xl font-black" value={form.bodega_id} onChange={e=>setForm({...form, bodega_id:e.target.value})}>
                            <option value="">Seleccionar...</option>
                            {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                    </div>
                    <button className="col-span-2 py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl mt-4">GUARDAR EN NUBE</button>
                </form>
            </div>
        )}

        {mode === 'bodegas' && (
            <div className="grid grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[40px] border shadow-sm h-fit">
                    <h3 className="font-black mb-8 italic text-slate-800 text-xl">Nueva Bodega</h3>
                    <form onSubmit={saveBodega} className="space-y-6">
                        <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Nombre de Bodega" value={formB.nombre} onChange={e=>setFormB({nombre:e.target.value})} required/>
                        <button className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-lg uppercase text-[10px]">Crear Bodega</button>
                    </form>
                </div>
                <div className="col-span-2 bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Nombre de la Dependencia</th><th className="p-8">Acción</th></tr></thead>
                        <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b hover:bg-slate-50"><td className="p-8 font-black text-slate-700">{b.nombre}</td><td className="p-8 text-red-500 font-bold text-xs cursor-pointer">Eliminar</td></tr>))}</tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
}

// ==========================================
//           VISTA: PRODUCCIÓN PRO (KITS Y ORDENES)
// ==========================================
function ProduccionView({ user }) {
  const [sub, setSub] = useState('materias');
  const [materias, setMaterias] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  
  // Forms
  const [formM, setFormM] = useState({ nombre: '', unidad_medida: 'mg', cantidad: '', costo: '' });
  const [formR, setFormR] = useState({ nombre_producto_final: '', descripcion: '' });

  const load = useCallback(() => {
    axios.get('/produccion/materia').then(res => setMaterias(res.data));
    axios.get('/produccion/recetas').then(res => setRecetas(res.data));
    axios.get('/produccion/ordenes').then(res => setOrdenes(res.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveInsumo = async (e) => {
    e.preventDefault();
    await axios.post('/produccion/materia', formM);
    alert("Insumo Guardado"); setFormM({ nombre: '', unidad_medida: 'mg', cantidad: '', costo: '' }); load();
  };

  const saveReceta = async (e) => {
    e.preventDefault();
    await axios.post('/produccion/recetas', formR);
    alert("Kit Maestro Creado"); setFormR({ nombre_producto_final: '', descripcion: '' }); load();
  };

  const lanzarOrden = async (e) => {
      e.preventDefault();
      const rid = e.target.rid.value;
      const cant = e.target.cant.value;
      await axios.post('/produccion/ordenes', { receta_id: rid, cantidad_a_producir: cant });
      alert("Orden de Producción Lanzada"); load();
  };

  return (
    <div className="space-y-8">
        <div className="flex gap-4 p-2 bg-white rounded-3xl w-fit border shadow-sm">
            <button onClick={()=>setSub('materias')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='materias'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Insumos</button>
            <button onClick={()=>setSub('recetas')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='recetas'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Recetas/Kits</button>
            <button onClick={()=>setSub('ordenes')} className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${sub==='ordenes'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>Órdenes</button>
        </div>

        {sub === 'materias' && (
            <div className="grid grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[40px] border shadow-sm h-fit">
                    <h3 className="font-black mb-8 italic text-slate-800 text-xl">Nuevo Insumo</h3>
                    <form onSubmit={saveInsumo} className="space-y-4">
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Nombre" value={formM.nombre} onChange={e=>setFormM({...formM, nombre:e.target.value})} required/>
                        <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida:e.target.value})}>
                            <option value="mg">mg</option><option value="ml">ml</option><option value="unidades">unidades</option>
                        </select>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Cantidad" type="number" value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad:e.target.value})} required/>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Costo Unitario" type="number" value={formM.costo} onChange={e=>setFormM({...formM, costo:e.target.value})} required/>
                        <button className="w-full py-4 bg-slate-900 text-white font-black rounded-3xl uppercase text-[10px]">Guardar Insumo</button>
                    </form>
                </div>
                <div className="col-span-2 bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Materia</th><th>Stock</th><th>Costo</th></tr></thead>
                        <tbody>{materias.map(m=>(<tr key={m.id} className="border-b"><td className="p-8 font-black text-slate-700">{m.nombre}</td><td>{m.cantidad} {m.unidad_medida}</td><td>{fmt(m.costo)}</td></tr>))}</tbody>
                    </table>
                </div>
            </div>
        )}

        {sub === 'recetas' && (
            <div className="grid grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[40px] border shadow-sm">
                    <h3 className="font-black mb-8 italic text-slate-800 text-xl">Configurar Kit Final</h3>
                    <form onSubmit={saveReceta} className="space-y-4">
                        <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Nombre del Producto" value={formR.nombre_producto_final} onChange={e=>setFormR({...formR, nombre_producto_final:e.target.value})} required/>
                        <textarea className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Descripción de preparación" value={formR.descripcion} onChange={e=>setFormR({...formR, descripcion:e.target.value})} required/>
                        <button className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase text-[10px]">Crear Kit Maestro</button>
                    </form>
                </div>
                <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Kit</th><th>Detalles</th></tr></thead>
                        <tbody>{recetas.map(r=>(<tr key={r.id} className="border-b"><td className="p-8 font-black text-slate-700">{r.nombre_producto_final}</td><td className="p-8 text-xs font-bold text-slate-400">{r.descripcion}</td></tr>))}</tbody>
                    </table>
                </div>
            </div>
        )}

        {sub === 'ordenes' && (
            <div className="space-y-6">
                <form onSubmit={lanzarOrden} className="bg-white p-10 rounded-[40px] border flex gap-6 items-end shadow-xl">
                    <div className="flex-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1">Medicamento a Producir</label>
                        <select name="rid" className="w-full p-5 bg-slate-50 rounded-3xl font-black outline-none border-none">
                            {recetas.map(r => <option key={r.id} value={r.id}>{r.nombre_producto_final}</option>)}
                        </select>
                    </div>
                    <div className="w-40">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1">Cant. Lote</label>
                        <input name="cant" type="number" className="w-full p-5 bg-slate-50 rounded-3xl font-black text-center" defaultValue="1" required/>
                    </div>
                    <button type="submit" className="px-10 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase text-[10px]">Lanzar Órden</button>
                </form>
                <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Orden #</th><th>Producto</th><th>Cantidad</th><th>Estado</th></tr></thead>
                        <tbody>{ordenes.map(o=>(<tr key={o.id} className="border-b"><td className="p-8 font-black text-slate-700">{o.numero_orden}</td><td className="font-bold">{o.nombre_producto_final}</td><td className="font-black">{o.cantidad_a_producir}</td><td><span className="px-4 py-1 bg-yellow-100 text-yellow-600 rounded-full text-[9px] font-black uppercase">{o.estado}</span></td></tr>))}</tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
}

// ==========================================
//           VISTA: NÓMINA (COLOMBIA)
// ==========================================
function NominaView() {
    const [emps, setEmps] = useState([]);
    const [form, setForm] = useState({ nombre: '', documento: '', salario: '', email: '', cargo: 'Operario', eps: '', arl: '', pension: '' });
    
    const load = () => axios.get('/empleados').then(res => setEmps(res.data));
    useEffect(() => { load(); }, []);

    const saveEmpleado = async (e) => {
        e.preventDefault();
        await axios.post('/empleados', form);
        alert("Funcionario Vinculado");
        setForm({ nombre: '', documento: '', salario: '', email: '', cargo: 'Operario', eps: '', arl: '', pension: '' });
        load();
    };

    return (
        <div className="space-y-10">
            <div className="bg-white p-12 rounded-[50px] border shadow-sm">
                <h3 className="text-2xl font-black mb-8 italic text-slate-800">Vincular Nuevo Funcionario</h3>
                <form onSubmit={saveEmpleado} className="grid grid-cols-4 gap-6">
                    <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 ml-4 mb-1 uppercase">Nombre Completo</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 ml-4 mb-1 uppercase">Documento</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={form.documento} onChange={e=>setForm({...form, documento:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 ml-4 mb-1 uppercase">Salario Base</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" type="number" value={form.salario} onChange={e=>setForm({...form, salario:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 ml-4 mb-1 uppercase">EPS</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={form.eps} onChange={e=>setForm({...form, eps:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 ml-4 mb-1 uppercase">ARL</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={form.arl} onChange={e=>setForm({...form, arl:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 ml-4 mb-1 uppercase">Pensión</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={form.pension} onChange={e=>setForm({...form, pension:e.target.value})} required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 ml-4 mb-1 uppercase">Cargo</label>
                        <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={form.cargo} onChange={e=>setForm({...form, cargo:e.target.value})}>
                            <option value="Operario">Operario</option><option value="Admin">Admin</option><option value="Vendedor">Vendedor</option>
                        </select>
                    </div>
                    <button className="col-span-4 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase text-[10px] tracking-widest">Vincular Ahora</button>
                </form>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {emps.map(e => (
                    <div key={e.id} className="bg-white p-10 rounded-[40px] border shadow-sm flex items-center gap-8">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-4xl font-black">{e.nombre?.charAt(0)}</div>
                        <div>
                            <p className="font-black text-slate-800 text-2xl leading-none">{e.nombre}</p>
                            <p className="text-xs font-black text-slate-400 mt-2 uppercase">ID: {e.documento} | {e.cargo}</p>
                            <div className="flex gap-4 mt-4 text-[10px] font-black text-blue-600 uppercase border-t pt-4">
                                <span>EPS: {e.eps}</span> | <span>ARL: {e.arl}</span> | <span>FP: {e.pension}</span>
                            </div>
                            <p className="text-3xl font-black text-green-600 mt-4">{fmt(e.salario)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==========================================
//           VISTA: CONTABILIDAD PRO
// ==========================================
function ContabilidadView() {
    const [data, setData] = useState([]);
    useEffect(() => { axios.get('/contabilidad/movimientos').then(res => setData(res.data)); }, []);
    
    const ingresos = data.filter(d=>d.tipo==='Ingreso').reduce((s,i)=>s+parseFloat(i.total),0);
    const egresos = data.filter(d=>d.tipo==='Egreso').reduce((s,i)=>s+parseFloat(i.total),0);

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[40px] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Ingresos (Ventas)</p><h3 className="text-4xl font-black text-green-600">{fmt(ingresos)}</h3></div>
                <div className="bg-white p-10 rounded-[40px] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Egresos (Insumos)</p><h3 className="text-4xl font-black text-red-500">{fmt(egresos)}</h3></div>
                <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white"><p className="text-[10px] font-black uppercase text-slate-500 mb-2">Balance Neto</p><h3 className="text-4xl font-black">{fmt(ingresos - egresos)}</h3></div>
            </div>
            <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Fecha</th><th>Detalle del Movimiento</th><th>Valor</th><th>Tipo</th></tr></thead>
                    <tbody>
                        {data.map((d, i) => (
                            <tr key={i} className="border-b hover:bg-slate-50 transition-all">
                                <td className="p-8 text-xs font-bold text-slate-400">{new Date(d.fecha).toLocaleDateString()}</td>
                                <td className="font-black text-slate-700">{d.detalle}</td>
                                <td className={`font-black ${d.tipo==='Ingreso'?'text-green-600':'text-red-500'}`}>{fmt(d.total)}</td>
                                <td><span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${d.tipo==='Ingreso'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{d.tipo}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
        await axios.post('/turnos/iniciar', { base_caja: base });
        alert("Turno Abierto"); onUpdate();
    };
    return (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[60px] border shadow-2xl max-w-xl mx-auto mt-10">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[35px] flex items-center justify-center mb-10"><Wallet size={48}/></div>
            {turnoActivo ? (
                <button onClick={async()=> { if(confirm("¿Cerrar Turno de Hoy?")){ await axios.put('/turnos/finalizar', {turno_id: turnoActivo.id}); onUpdate(); }}} className="w-full py-6 bg-red-500 text-white font-black rounded-3xl shadow-xl uppercase">Realizar Cierre</button>
            ) : (
                <div className="w-full space-y-8 text-center">
                    <h3 className="text-3xl font-black italic text-slate-800">Apertura de Turno</h3>
                    <input type="number" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-center text-4xl border-2 border-transparent focus:border-blue-500 outline-none" placeholder="$0" value={base} onChange={e=>setBase(e.target.value)} />
                    <button onClick={handleAbrir} className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase tracking-widest text-xs">Abrir Caja en Nube</button>
                </div>
            )}
        </div>
    );
}

// ==========================================
//           VISTA: ADMIN USUARIOS
// ==========================================
function AdminView() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ nombre: '', email: '', password: '', cargo: 'Vendedor' });
    const load = () => axios.get('/admin/usuarios').then(res => setUsers(res.data));
    useEffect(() => { load(); }, []);

    const saveUser = async (e) => {
        e.preventDefault();
        await axios.post('/admin/usuarios', form);
        alert("Usuario Creado"); setForm({ nombre: '', email: '', password: '', cargo: 'Vendedor' }); load();
    };

    return (
        <div className="space-y-12">
            <div className="bg-white p-12 rounded-[50px] border shadow-sm max-w-4xl mx-auto">
                <h3 className="font-black text-2xl mb-8 italic">Configurar Acceso</h3>
                <form onSubmit={saveUser} className="grid grid-cols-4 gap-4">
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border flex-1" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border flex-1" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/>
                    <input className="p-4 bg-slate-50 rounded-2xl border font-bold flex-1" type="password" placeholder="Pass" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required/>
                    <select className="p-4 bg-slate-50 rounded-2xl font-black border" value={form.cargo} onChange={e=>setForm({...form, cargo:e.target.value})}>
                        <option value="Admin">Admin</option><option value="Vendedor">Vendedor</option><option value="Bodeguero">Bodeguero</option><option value="Prealistador">Prealistador</option>
                    </select>
                    <button type="submit" className="col-span-4 bg-blue-600 text-white py-5 rounded-3xl font-black uppercase text-xs">Guardar Funcionario</button>
                </form>
            </div>
            <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Nombre</th><th>Email Acceso</th><th>Rol</th></tr></thead>
                    <tbody>{users.map(u=>(<tr key={u.id} className="border-b"><td className="p-8 font-black text-slate-700">{u.nombre}</td><td>{u.email}</td><td><span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black">{u.cargo}</span></td></tr>))}</tbody>
                </table>
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
    return <div className="bg-white p-10 rounded-[45px] border shadow-sm"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${c[color]}`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p><h3 className="text-3xl font-black text-slate-800 tracking-tighter">{value}</h3></div>; 
}

function PSEPage({ onBack }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-12 rounded-[50px] shadow-2xl max-w-2xl w-full text-center border-t-[20px] border-blue-600">
                <h1 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter uppercase italic">AccuCloud PRO 2026</h1>
                <div className="bg-blue-50 p-10 rounded-[40px] mb-10 border border-blue-100">
                    <h2 className="text-7xl font-black text-blue-600 tracking-tighter">$600.000</h2>
                    <p className="text-xs text-blue-400 mt-4 font-bold uppercase tracking-widest">Pago Mensual vía PSE</p>
                </div>
                <button onClick={()=>window.alert("Redirigiendo a pasarela PSE...")} className="w-full py-6 bg-slate-900 text-white font-black rounded-[30px] shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all text-sm uppercase"><CreditCard /> PAGAR CON PSE</button>
                <button onClick={onBack} className="mt-8 text-slate-400 font-bold text-xs uppercase tracking-widest underline">REGRESAR</button>
            </div>
        </div>
    );
}

function VentasView({ user, turnoActivo }) {
    const [prods, setProds] = useState([]);
    const [cart, setCart] = useState([]);
    useEffect(() => { axios.get('/productos').then(res => setProds(res.data)); }, []);
    if (!turnoActivo) return <div className="p-20 text-center font-black opacity-20 text-4xl border-4 border-dashed rounded-[50px]">Caja Cerrada</div>;
    return (
        <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 bg-white p-10 rounded-[40px] border shadow-sm min-h-[500px]">
                <div className="grid grid-cols-3 gap-4">
                    {prods.map(p => (
                        <div key={p.id} onClick={()=>setCart([...cart, {...p, cantidad: 1}])} className="p-6 bg-slate-50 rounded-3xl cursor-pointer hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all">
                            <p className="font-black text-slate-800 leading-tight">{p.nombre}</p>
                            <p className="text-blue-600 font-black mt-2">{fmt(p.precio)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border-t-[15px] border-blue-600 h-fit">
                <h3 className="text-center text-[10px] font-black uppercase text-slate-400 mb-8">Carrito de Ventas</h3>
                {cart.map((i, idx) => (<div key={idx} className="flex justify-between border-b py-2 text-xs font-bold"><span>{i.nombre}</span><span>{fmt(i.precio)}</span></div>))}
                <h2 className="text-4xl font-black text-center mt-10 mb-10">{fmt(cart.reduce((s,i)=>s+i.precio,0))}</h2>
                <button onClick={async()=>{ await axios.post('/ventas', {productos: cart, turno_id: turnoActivo.id}); alert("Venta Exitosa"); setCart([]); }} className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl">COBRAR AHORA</button>
            </div>
        </div>
    );
}