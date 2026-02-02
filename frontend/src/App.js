/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, ScanBarcode, Factory, X, Plus, 
  ShieldCheck, Calculator, TrendingUp, ChevronRight, Truck, ClipboardList
} from 'lucide-react';

// CONFIGURACIÓN DE RED
axios.defaults.baseURL = window.location.origin + '/api';
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('erp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

// ==========================================
//           COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-blue-600 text-2xl">ACCUCLOUD PRO 2026...</div>;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? (
        <Login onLogin={(data) => {
            setUser(data.user);
            localStorage.setItem('erp_user', JSON.stringify(data.user));
            localStorage.setItem('erp_token', data.token);
        }} />
      ) : (
        <Dashboard user={user} onLogout={() => { setUser(null); localStorage.clear(); }} />
      )}
    </div>
  );
}

// ==========================================
//           PANTALLA DE LOGIN
// ==========================================
function Login({ onLogin }) {
    const [form, setForm] = useState({ email: '', password: '' });
    const handle = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/login', form);
            if (res.data.success) onLogin(res.data);
            else alert("Acceso Incorrecto: Verifica tus credenciales.");
        } catch (e) { alert("Error de conexión con el servidor SaaS."); }
    };
    return (
        <div className="h-screen flex items-center justify-center bg-blue-600 p-4">
            <form onSubmit={handle} className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md">
                <h1 className="text-4xl font-black text-center mb-2 italic">AccuCloud<span className="text-blue-600">.</span></h1>
                <p className="text-center text-slate-400 text-[10px] uppercase font-bold mb-10 tracking-widest">Software de Gestión Empresarial</p>
                <div className="space-y-4">
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" placeholder="Email Corporativo" onChange={e=>setForm({...form, email:e.target.value})} />
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" type="password" placeholder="Contraseña" onChange={e=>setForm({...form, password:e.target.value})} />
                    <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all">INGRESAR AL PANEL</button>
                </div>
            </form>
        </div>
    );
}

// ==========================================
//           DASHBOARD (MENU Y HEADER)
// ==========================================
function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [turno, setTurno] = useState(null);

  const loadTurno = useCallback(() => {
    axios.get('/turnos/activo/' + user.id).then(res => setTurno(res.data)).catch(()=>setTurno(null));
  }, [user.id]);

  useEffect(() => { loadTurno(); }, [loadTurno]);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-72 bg-white border-r px-6 flex flex-col">
        <div className="h-28 flex items-center font-black text-2xl italic text-slate-800 tracking-tighter">ACCUCLOUD<span className="text-blue-600">.</span></div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          <MenuBtn icon={<LayoutDashboard size={20}/>} label="Dashboard" active={tab==='dashboard'} onClick={()=>setTab('dashboard')} />
          <MenuBtn icon={<Package size={20}/>} label="Inventario" active={tab==='inventario'} onClick={()=>setTab('inventario')} />
          <MenuBtn icon={<Factory size={20}/>} label="Producción PRO" active={tab==='produccion'} onClick={()=>setTab('produccion')} />
          <MenuBtn icon={<Users size={20}/>} label="Nómina Cloud" active={tab==='nomina'} onClick={()=>setTab('nomina')} />
          <MenuBtn icon={<Calculator size={20}/>} label="Contabilidad" active={tab==='conta'} onClick={()=>setTab('conta')} />
          <MenuBtn icon={<Wallet size={20}/>} label="Caja" active={tab==='caja'} onClick={()=>setTab('caja')} />
          <MenuBtn icon={<ShieldCheck size={20}/>} label="Usuarios Admin" active={tab==='admin'} onClick={()=>setTab('admin')} />
        </nav>
        <div className="p-8 border-t flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{user.cargo}</span>
            <span className="text-sm font-black text-slate-800 mb-4">{user.nombre}</span>
            <button onClick={onLogout} className="text-red-500 font-bold text-xs uppercase underline text-left hover:text-red-700">Cerrar Sesión</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-10 bg-slate-50">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{tab}</h2>
            {turno ? (
                <div className="px-6 py-2 bg-green-100 text-green-700 rounded-xl font-black text-[10px] border border-green-200">
                    SISTEMA ACTIVO | VENTAS TURNO: {fmt(turno.total_vendido)}
                </div>
            ) : (
                <div className="px-6 py-2 bg-red-100 text-red-700 rounded-xl font-black text-[10px] border border-red-200 uppercase tracking-widest">
                    Caja Cerrada
                </div>
            )}
        </header>
        <div className="animate-fade-in pb-10">
            {tab==='dashboard' && <ResumenView />}
            {tab==='inventario' && <InventarioView />}
            {tab==='produccion' && <ProduccionView />}
            {tab==='nomina' && <NominaView />}
            {tab==='conta' && <ContabilidadView />}
            {tab==='caja' && <CajaView user={user} turno={turno} onUpdate={loadTurno} />}
            {tab==='admin' && <AdminView />}
        </div>
      </main>
    </div>
  );
}

// ==========================================
//           VISTA: DASHBOARD METRICAS
// ==========================================
function ResumenView() {
    const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
    const load = () => axios.get('/dashboard-data').then(res => setData(res.data)).catch(() => {});
    useEffect(() => { load(); }, []);
    return (
        <div className="grid grid-cols-4 gap-6">
            <CardStat title="Ventas Totales" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
            <CardStat title="Patrimonio Stock" value={fmt(data.valorInventario)} icon={<Package/>} color="purple" />
            <CardStat title="Faltantes Stock" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
            <CardStat title="Estado Licencia" value="Premium 2026" icon={<ShieldCheck/>} color="green" />
        </div>
    );
}

// ==========================================
//           VISTA: INVENTARIO COMPLETO
// ==========================================
function InventarioView() {
    const [sub, setSub] = useState('list');
    const [items, setItems] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [form, setForm] = useState({ nombre: '', sku: '', precio: '', stock: '', bodega_id: '' });
    const [formB, setFormB] = useState({ nombre: '' });

    const load = () => {
        axios.get('/productos').then(res => setItems(res.data));
        axios.get('/bodegas').then(res => setBodegas(res.data));
    };
    useEffect(() => { load(); }, []);

    const handleGuardarProducto = async (e) => {
        e.preventDefault();
        if(!form.nombre || !form.sku) return alert("Completa los campos obligatorios");
        await axios.post('/productos', form);
        alert("Producto Guardado Correctamente");
        setForm({ nombre: '', sku: '', precio: '', stock: '', bodega_id: '' });
        setSub('list'); load();
    };

    const handleGuardarBodega = async (e) => {
        e.preventDefault();
        if(!formB.nombre) return;
        await axios.post('/bodegas', formB);
        alert("Bodega Creada");
        setFormB({nombre:''}); load();
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border shadow-sm">
                <button onClick={()=>setSub('list')} className={`px-8 py-2 rounded-xl font-black text-xs ${sub==='list'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>LISTADO</button>
                <button onClick={()=>setSub('new')} className={`px-8 py-2 rounded-xl font-black text-xs ${sub==='new'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>NUEVO ITEM</button>
                <button onClick={()=>setSub('bod')} className={`px-8 py-2 rounded-xl font-black text-xs ${sub==='bod'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>BODEGAS</button>
            </div>

            {sub === 'list' && (
                <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Producto</th><th>SKU</th><th>Stock</th><th>Bodega</th></tr></thead>
                        <tbody>{items.map(p=>(<tr key={p.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 font-bold text-slate-700">{p.nombre}</td><td className="font-bold text-slate-400">{p.sku}</td><td className="font-black text-blue-600">{p.stock}</td><td className="text-xs font-bold uppercase">{p.bodega_nombre || 'Sin Asignar'}</td></tr>))}</tbody>
                    </table>
                </div>
            )}

            {sub === 'new' && (
                <div className="bg-white p-12 rounded-[50px] border max-w-2xl shadow-sm mx-auto">
                    <h3 className="text-2xl font-black mb-8 italic">Información del Producto</h3>
                    <form onSubmit={handleGuardarProducto} className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nombre Completo</label>
                            <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border outline-none focus:border-blue-500" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} />
                        </div>
                        <input className="p-4 bg-slate-50 rounded-2xl font-bold border outline-none" placeholder="SKU" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} />
                        <input className="p-4 bg-slate-50 rounded-2xl font-bold border outline-none" placeholder="Precio Venta" type="number" value={form.precio} onChange={e=>setForm({...form, precio:e.target.value})} />
                        <input className="p-4 bg-slate-50 rounded-2xl font-bold border outline-none" placeholder="Stock Inicial" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} />
                        <select className="p-4 bg-slate-50 rounded-2xl font-bold border outline-none" value={form.bodega_id} onChange={e=>setForm({...form, bodega_id:e.target.value})}>
                            <option value="">-- Bodega --</option>
                            {bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                        <button type="submit" className="col-span-2 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:scale-105 transition-all">GUARDAR EN NUBE</button>
                    </form>
                </div>
            )}

            {sub === 'bod' && (
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-[40px] border h-fit space-y-6 shadow-sm">
                        <h3 className="font-black italic text-xl">Nueva Bodega</h3>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border outline-none focus:border-blue-500" placeholder="Nombre de Bodega" value={formB.nombre} onChange={e=>setFormB({nombre:e.target.value})} />
                        <button onClick={handleGuardarBodega} className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black shadow-lg">CREAR BODEGA</button>
                    </div>
                    <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr className="border-b"><th className="p-6">Nombre de Bodega</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b hover:bg-slate-50"><td className="p-6 font-bold">{b.nombre}</td></tr>))}</tbody>
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
function Produccion() {
    const [sub, setSub] = useState('insumos');
    const [materia, setMateria] = useState([]);
    const [recetas, setRecetas] = useState([]);
    const [ordenes, setOrdenes] = useState([]);
    const [formM, setFormM] = useState({ nombre: '', unidad_medida: 'mg', cantidad: '', costo: '' });
    const [formR, setFormR] = useState({ nombre_producto_final: '', descripcion: '' });

    const load = () => {
        axios.get('/produccion/materia').then(res => setMateria(res.data));
        axios.get('/produccion/recetas').then(res => setRecetas(res.data));
        axios.get('/produccion/ordenes').then(res => setOrdenes(res.data));
    };
    useEffect(() => { load(); }, []);

    const handleSaveMateria = async (e) => {
        e.preventDefault();
        await axios.post('/produccion/materia', formM);
        alert("Insumo Registrado");
        setFormM({ nombre: '', unidad_medida: 'mg', cantidad: '', costo: '' }); load();
    };

    const handleSaveReceta = async (e) => {
        e.preventDefault();
        await axios.post('/produccion/recetas', formR);
        alert("Receta Maestra Creada");
        setFormR({ nombre_producto_final: '', descripcion: '' }); load();
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border shadow-sm">
                <button onClick={()=>setSub('insumos')} className={`px-6 py-2 rounded-xl font-black text-xs ${sub==='insumos'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>INSUMOS</button>
                <button onClick={()=>setSub('recetas')} className={`px-6 py-2 rounded-xl font-black text-xs ${sub==='recetas'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>RECETAS / KITS</button>
                <button onClick={()=>setSub('ordenes')} className={`px-6 py-2 rounded-xl font-black text-xs ${sub==='ordenes'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>ÓRDENES</button>
            </div>

            {sub === 'insumos' && (
                <div className="grid grid-cols-3 gap-8">
                    <form onSubmit={handleSaveMateria} className="bg-white p-10 rounded-[40px] border h-fit space-y-4 shadow-sm">
                        <h3 className="font-black italic">Nuevo Insumo</h3>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Nombre Insumo" value={formM.nombre} onChange={e=>setFormM({...formM, nombre:e.target.value})} />
                        <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida:e.target.value})}>
                            <option value="mg">Miligramos (mg)</option><option value="ml">Mililitros (ml)</option><option value="unidades">Unidades</option>
                        </select>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Cant. Stock" type="number" value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad:e.target.value})} />
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Costo Unitario" type="number" value={formM.costo} onChange={e=>setFormM({...formM, costo:e.target.value})} />
                        <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black shadow-lg">REGISTRAR INSUMO</button>
                    </form>
                    <div className="col-span-2">
                        <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-6">Nombre Insumo</th><th>Stock Actual</th><th>Unidad</th><th>Costo</th></tr></thead>
                                <tbody>{materia.map(m=>(<tr key={m.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-6 font-bold text-slate-700">{m.nombre}</td><td className="font-black text-blue-600">{m.cantidad}</td><td>{m.unidad_medida}</td><td>{fmt(m.costo)}</td></tr>))}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {sub === 'recetas' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <form onSubmit={handleSaveReceta} className="bg-white p-12 rounded-[50px] border shadow-sm space-y-6 h-fit">
                        <h3 className="text-xl font-black italic">Crear Kit / Receta Final</h3>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Nombre del Producto Final" value={formR.nombre_producto_final} onChange={e=>setFormR({...formR, nombre_producto_final:e.target.value})} />
                        <textarea className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Descripción de preparación" rows="4" value={formR.descripcion} onChange={e=>setFormR({...formR, descripcion:e.target.value})} />
                        <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl">CREAR KIT MAESTRO</button>
                    </form>
                    <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr className="border-b"><th className="p-8">Kit Final</th><th>Detalle Preparación</th></tr></thead>
                            <tbody>{recetas.map(r=>(<tr key={r.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 font-black text-slate-700">{r.nombre_producto_final}</td><td className="p-8 text-xs font-bold text-slate-400">{r.descripcion}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {sub === 'ordenes' && (
                <div className="space-y-10">
                    <div className="bg-white p-10 rounded-[50px] border shadow-xl flex gap-6 items-end">
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Medicamento a fabricar</label>
                            <select id="selReceta" className="w-full p-4 bg-slate-50 rounded-2xl font-black border outline-none">
                                <option value="">-- Seleccionar --</option>
                                {recetas.map(r=><option key={r.id} value={r.id}>{r.nombre_producto_final}</option>)}
                            </select>
                        </div>
                        <div className="w-32 space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Lote</label>
                            <input id="cantReceta" type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-black border text-center" defaultValue="1" />
                        </div>
                        <button onClick={async()=>{ 
                            const rid = document.getElementById('selReceta').value;
                            const c = document.getElementById('cantReceta').value;
                            if(!rid) return alert("Selecciona una receta");
                            await axios.post('/produccion/ordenes', {receta_id: rid, cantidad_a_producir: c}); 
                            load(); alert("Orden de Producción Lanzada");
                        }} className="bg-blue-600 text-white px-10 py-5 rounded-3xl font-black shadow-xl uppercase text-[10px]">Lanzar Orden</button>
                    </div>
                    <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Orden #</th><th>Producto Final</th><th>Lote</th><th>Estado Actual</th></tr></thead>
                            <tbody>{ordenes.map(o=>(<tr key={o.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 font-black text-slate-700">{o.numero_orden}</td><td className="font-bold text-slate-500">{o.nombre_producto_final}</td><td className="font-black">{o.cantidad_a_producir}</td><td><span className="px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[9px] font-black uppercase">{o.estado}</span></td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
//           VISTA: NÓMINA CLOUD (FULL)
// ==========================================
function NominaView() {
    const [emps, setEmps] = useState([]);
    const [form, setForm] = useState({ nombre: '', documento: '', salario: '', eps: '', arl: '', pension: '', cargo: 'Operario' });
    
    const load = () => axios.get('/empleados').then(res => setEmps(res.data)).catch(()=>setEmps([]));
    useEffect(() => { load(); }, []);

    const handleVincular = async (e) => {
        e.preventDefault();
        if(!form.nombre || !form.salario) return alert("Faltan datos");
        await axios.post('/empleados', form);
        alert("Empleado Vinculado Exitosamente");
        setForm({ nombre: '', documento: '', salario: '', eps: '', arl: '', pension: '', cargo: 'Operario' });
        load();
    };

    return (
        <div className="space-y-10">
            <div className="bg-white p-12 rounded-[50px] border shadow-sm">
                <h3 className="text-2xl font-black mb-8 italic">Vincular Nuevo Funcionario</h3>
                <form onSubmit={handleVincular} className="grid grid-cols-4 gap-6">
                    <div className="col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nombre Completo</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border outline-none" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Documento</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border outline-none" value={form.documento} onChange={e=>setForm({...form, documento:e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Salario Base</label>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border outline-none" type="number" value={form.salario} onChange={e=>setForm({...form, salario:e.target.value})} />
                    </div>
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border outline-none" placeholder="EPS" value={form.eps} onChange={e=>setForm({...form, eps:e.target.value})} />
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border outline-none" placeholder="ARL" value={form.arl} onChange={e=>setForm({...form, arl:e.target.value})} />
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border outline-none" placeholder="Fondo Pensión" value={form.pension} onChange={e=>setForm({...form, pension:e.target.value})} />
                    <select className="p-4 bg-slate-50 rounded-2xl font-black border outline-none" value={form.cargo} onChange={e=>setForm({...form, cargo:e.target.value})}>
                        <option value="Operario">Operario</option><option value="Admin">Admin</option><option value="Vendedor">Vendedor</option><option value="Logistica">Logística</option>
                    </select>
                    <button type="submit" className="col-span-4 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase text-xs tracking-widest mt-4">Vincular Ahora</button>
                </form>
            </div>
            <div className="grid grid-cols-2 gap-6">
                {emps.map(e => (
                    <div key={e.id} className="bg-white p-8 rounded-[40px] border flex items-center gap-8 shadow-sm hover:shadow-xl transition-all">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-4xl font-black">{e.nombre?.charAt(0)}</div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-black text-slate-800 text-2xl leading-none truncate">{e.nombre}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase mt-2">DOC: {e.documento} | {e.cargo}</p>
                            <div className="flex gap-4 mt-4 text-[9px] font-black text-blue-600 uppercase border-t pt-4">
                                <span>EPS: {e.eps || 'N/A'}</span> | <span>ARL: {e.arl || 'N/A'}</span> | <span>FP: {e.pension || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center mt-6">
                                <p className="text-3xl font-black text-green-600 leading-none">{fmt(e.salario)}</p>
                                <button onClick={()=>alert(`Liquidando a ${e.nombre}...`)} className="bg-slate-100 p-3 rounded-2xl text-[9px] font-black hover:bg-blue-600 hover:text-white transition-all">LIQUIDAR</button>
                            </div>
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
    useEffect(() => { axios.get('/contabilidad/movimientos').then(res => setData(res.data)).catch(()=>setData([])); }, []);
    
    const ingresos = data.filter(d=>d.tipo==='Ingreso').reduce((s,i)=>s+parseFloat(i.total || 0),0);
    const egresos = data.filter(d=>d.tipo==='Egreso').reduce((s,i)=>s+parseFloat(i.total || 0),0);

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[45px] border shadow-sm group hover:border-green-500 transition-all">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Ingresos Totales</p>
                    <h3 className="text-4xl font-black text-green-600">{fmt(ingresos)}</h3>
                </div>
                <div className="bg-white p-10 rounded-[45px] border shadow-sm group hover:border-red-500 transition-all">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Egresos Totales</p>
                    <h3 className="text-4xl font-black text-red-500">{fmt(egresos)}</h3>
                </div>
                <div className="bg-slate-900 p-10 rounded-[45px] shadow-2xl text-white">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Balance Neto</p>
                    <h3 className="text-4xl font-black">{fmt(ingresos - egresos)}</h3>
                </div>
            </div>
            <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Fecha Registro</th><th>Detalle del Movimiento</th><th>Valor Total</th><th>Clasificación</th></tr></thead>
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
//           VISTA: CAJA Y TURNOS
// ==========================================
function CajaView({ user, turno, onUpdate }) {
    const [base, setBase] = useState("");
    const handleApertura = async (e) => {
        e.preventDefault();
        await axios.post('/turnos/iniciar', { base_caja: base });
        alert("Turno Iniciado con Éxito");
        onUpdate();
    };
    return (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[60px] border shadow-2xl max-w-xl mx-auto mt-10">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[35px] flex items-center justify-center mb-10"><Wallet size={48}/></div>
            {turno ? (
                <div className="w-full space-y-8 text-center">
                    <h3 className="text-3xl font-black italic">Turno de {user.nombre}</h3>
                    <div className="bg-slate-50 p-6 rounded-3xl border text-left">
                        <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Recaudo Actual</p>
                        <p className="text-4xl font-black text-blue-600">{fmt(turno.total_vendido)}</p>
                    </div>
                    <button onClick={async()=> { if(confirm("¿Cerrar Turno Hoy?")){ await axios.put('/turnos/finalizar', {turno_id: turno.id}); onUpdate(); alert("Caja Cerrada."); }}} className="w-full py-6 bg-red-500 text-white font-black rounded-3xl shadow-xl hover:bg-red-600 transition-all uppercase tracking-widest text-xs">Finalizar Jornada</button>
                </div>
            ) : (
                <form onSubmit={handleApertura} className="w-full space-y-8 text-center">
                    <h3 className="text-3xl font-black italic text-slate-800">Apertura de Turno</h3>
                    <p className="text-slate-400 text-xs font-bold px-10 leading-tight">Ingresa el dinero disponible en efectivo para iniciar las ventas.</p>
                    <input type="number" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-center text-4xl border-2 border-transparent focus:border-blue-500 outline-none transition-all" placeholder="$0" value={base} onChange={e=>setBase(e.target.value)} required />
                    <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs">Abrir Caja en Nube</button>
                </form>
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

    const handleCrear = async (e) => {
        e.preventDefault();
        await axios.post('/admin/usuarios', form);
        alert("Acceso de Usuario Creado");
        setForm({ nombre: '', email: '', password: '', cargo: 'Vendedor' }); load();
    };

    return (
        <div className="space-y-12">
            <div className="bg-white p-12 rounded-[50px] border shadow-sm max-w-4xl mx-auto">
                <h3 className="font-black text-2xl mb-8 italic">Gestión de Funcionarios Admin</h3>
                <form onSubmit={handleCrear} className="grid grid-cols-4 gap-4">
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border flex-1 outline-none" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border flex-1 outline-none" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/>
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border flex-1 outline-none" type="password" placeholder="Pass" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required/>
                    <select className="p-4 bg-slate-50 rounded-2xl font-black border outline-none" value={form.cargo} onChange={e=>setForm({...form, cargo:e.target.value})}>
                        <option value="Admin">Admin</option><option value="Bodeguero">Bodeguero</option><option value="Contador">Contador</option><option value="Prealistador">Prealistador</option>
                    </select>
                    <button type="submit" className="col-span-4 bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl uppercase text-xs">Guardar Funcionario en Nube</button>
                </form>
            </div>
            <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Funcionario</th><th>Email de Acceso</th><th>Rol Asignado</th></tr></thead>
                    <tbody>{users.map(u=>(<tr key={u.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 font-black text-slate-700">{u.nombre}</td><td>{u.email}</td><td><span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase">{u.cargo}</span></td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
//           HELPERS Y COMPONENTES UI
// ==========================================
function MenuBtn({ icon, label, active, onClick }) { 
    return <button onClick={onClick} className={`w-full flex items-center px-6 py-4 rounded-[22px] mb-2 transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 -translate-y-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}><span className="mr-4">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; 
}

function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return <div className="bg-white p-10 rounded-[45px] border shadow-sm group hover:shadow-xl transition-all duration-300"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p><h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3></div>; 
}

function PSEPage({ onBack }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-16 rounded-[60px] shadow-2xl max-w-2xl w-full border-t-[25px] border-blue-600">
                <h1 className="text-5xl font-black mb-4 italic text-slate-800">AccuCloud PRO 2026</h1>
                <p className="text-slate-400 font-bold text-sm mb-12 px-10 leading-relaxed">Únete a la plataforma ERP más robusta de Colombia. Suscripción SaaS mensual con soporte total incluido.</p>
                <div className="bg-blue-50 p-12 rounded-[40px] mb-12 border border-blue-100">
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

// Reutilizamos la tabla para ahorrar líneas pero manteniendo la robustez
function Table({ headers, data, keys }) {
    return (
        <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr>{headers.map((h, i) => <th key={i} className="p-8">{h}</th>)}</tr></thead>
                <tbody>{(data || []).map((row, i) => (
                    <tr key={i} className="border-b hover:bg-slate-50 transition-all">{keys.map((k, j) => <td key={j} className="p-8 font-bold text-slate-700">{row[k] || '---'}</td>)}</tr>
                ))}</tbody>
            </table>
        </div>
    );
}

// Vista de Ventas TPV simplificada pero conectada al inventario real
function VentasView({ user, turnoActivo }) {
    const [prods, setProds] = useState([]);
    const [cart, setCart] = useState([]);
    useEffect(() => { axios.get('/productos').then(res => setProds(res.data)); }, []);
    const total = cart.reduce((s,i)=>s+(parseFloat(i.precio)*i.cantidad),0);
    const handleVenta = async () => {
        if(!turnoActivo) return alert("Caja cerrada");
        await axios.post('/ventas', { productos: cart, turno_id: turnoActivo.id });
        alert("Venta Exitosa. Stock actualizado."); setCart([]);
    };
    if (!turnoActivo) return <div className="h-[500px] flex items-center justify-center font-black text-slate-300 text-3xl uppercase border-4 border-dashed rounded-[50px]">Módulo Bloqueado: Caja Cerrada</div>;
    return (
        <div className="grid grid-cols-3 gap-10">
            <div className="col-span-2 bg-white p-10 rounded-[40px] border shadow-sm min-h-[500px] grid grid-cols-3 gap-6 auto-rows-min">
                {prods.map(p => (
                    <div key={p.id} onClick={()=>setCart([...cart, {...p, cantidad: 1}])} className="p-6 bg-slate-50 rounded-3xl cursor-pointer hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all flex flex-col justify-between">
                        <p className="font-black text-slate-800 text-sm leading-tight mb-4">{p.nombre}</p>
                        <p className="text-blue-600 font-black">{fmt(p.precio)}</p>
                    </div>
                ))}
            </div>
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border-t-[20px] border-blue-600 h-fit sticky top-10 flex flex-col justify-between">
                <h3 className="text-center text-[10px] font-black uppercase text-slate-400 mb-8 tracking-widest">Facturación TPV</h3>
                <div className="space-y-3 mb-10 max-h-60 overflow-auto px-2">
                    {cart.map((i, idx) => (<div key={idx} className="flex justify-between border-b pb-2 text-[11px] font-bold text-slate-600"><span>{i.nombre}</span><span>{fmt(i.precio)}</span></div>))}
                </div>
                <div className="text-center mb-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Total a Cobrar</p>
                    <h2 className="text-5xl font-black text-slate-800 tracking-tighter">{fmt(total)}</h2>
                </div>
                <button onClick={handleVenta} className="w-full py-7 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:scale-105 transition-all text-xl uppercase tracking-tighter">Cobrar Factura</button>
            </div>
        </div>
    );
}