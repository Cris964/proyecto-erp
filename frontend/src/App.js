/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, ScanBarcode, Factory, X, Plus, ShieldCheck
} from 'lucide-react';

axios.defaults.baseURL = window.location.origin + '/api';
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('erp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">CARGANDO...</div>;

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

function Login({ onLogin }) {
    const [form, setForm] = useState({ email: '', password: '' });
    const handle = async (e) => {
        e.preventDefault();
        const res = await axios.post('/login', form);
        if (res.data.success) onLogin(res.data);
        else alert("Error de acceso");
    };
    return (
        <div className="h-screen flex items-center justify-center bg-blue-600 p-4">
            <form onSubmit={handle} className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md">
                <h1 className="text-4xl font-black text-center mb-10 italic">AccuCloud.</h1>
                <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} />
                <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" type="password" placeholder="Contraseña" onChange={e=>setForm({...form, password:e.target.value})} />
                <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl">INGRESAR</button>
            </form>
        </div>
    );
}

function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [turno, setTurno] = useState(null);

  const loadTurno = useCallback(() => {
    axios.get('/turnos/activo/' + user.id).then(res => setTurno(res.data));
  }, [user.id]);

  useEffect(() => { loadTurno(); }, [loadTurno]);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-72 bg-white border-r px-6 flex flex-col">
        <div className="h-28 flex items-center font-black text-2xl italic uppercase">ACCUCLOUD.</div>
        <nav className="flex-1 space-y-1">
          <MenuBtn icon={<LayoutDashboard/>} label="Dashboard" active={tab==='dashboard'} onClick={()=>setTab('dashboard')} />
          <MenuBtn icon={<ShoppingCart/>} label="Ventas TPV" active={tab==='ventas'} onClick={()=>setTab('ventas')} />
          <MenuBtn icon={<Package/>} label="Inventario" active={tab==='inventario'} onClick={()=>setTab('inventario')} />
          <MenuBtn icon={<Factory/>} label="Producción PRO" active={tab==='produccion'} onClick={()=>setTab('produccion')} />
          <MenuBtn icon={<Users/>} label="Nómina" active={tab==='nomina'} onClick={()=>setTab('nomina')} />
          <MenuBtn icon={<Wallet/>} label="Caja" active={tab==='caja'} onClick={()=>setTab('caja')} />
          <MenuBtn icon={<ShieldCheck/>} label="Usuarios Admin" active={tab==='admin'} onClick={()=>setTab('admin')} />
        </nav>
        <button onClick={onLogout} className="p-8 text-red-500 font-black text-xs uppercase underline">Cerrar Sesión</button>
      </aside>
      <main className="flex-1 overflow-auto p-10 bg-slate-50">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{tab}</h2>
            {turno ? <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-[10px] font-black">CAJA ABIERTA: {fmt(turno.total_vendido)}</div> : <div className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-[10px] font-black uppercase">Cerrado</div>}
        </header>
        {tab==='dashboard' && <Resumen />}
        {tab==='inventario' && <Inventario />}
        {tab==='caja' && <Caja user={user} turno={turno} onUpdate={loadTurno} />}
        {tab==='nomina' && <Nomina />}
        {tab==='produccion' && <Produccion />}
        {tab==='admin' && <Admin />}
      </main>
    </div>
  );
}

// COMPONENTES DE VISTA
function Resumen() {
  const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
  useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);
  return (
    <div className="grid grid-cols-4 gap-6">
        <CardStat title="Ventas Totales" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
        <CardStat title="Valor Stock" value={fmt(data.valorInventario)} icon={<Package/>} color="purple" />
        <CardStat title="Alertas Stock" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
        <CardStat title="SaaS Status" value="Premium" icon={<ShieldCheck/>} color="green" />
    </div>
  );
}

function Inventario() {
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

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <button onClick={()=>setSub('list')} className={`px-6 py-2 rounded-xl font-black ${sub==='list'?'bg-blue-600 text-white':'bg-white'}`}>LISTADO</button>
                <button onClick={()=>setSub('new')} className={`px-6 py-2 rounded-xl font-black ${sub==='new'?'bg-blue-600 text-white':'bg-white'}`}>NUEVO ITEM</button>
                <button onClick={()=>setSub('bodegas')} className={`px-6 py-2 rounded-xl font-black ${sub==='bodegas'?'bg-blue-600 text-white':'bg-white'}`}>BODEGAS</button>
            </div>
            {sub === 'list' && (
                <div className="bg-white rounded-[40px] border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr className="border-b"><th className="p-6">Producto</th><th>SKU</th><th>Stock</th><th>Bodega</th></tr></thead>
                        <tbody>{items.map(p=>(<tr key={p.id} className="border-b"><td className="p-6 font-bold">{p.nombre}</td><td>{p.sku}</td><td className="font-black text-blue-600">{p.stock}</td><td>{p.bodega_nombre || 'S/B'}</td></tr>))}</tbody>
                    </table>
                </div>
            )}
            {sub === 'new' && (
                <div className="bg-white p-10 rounded-[40px] border max-w-lg">
                    <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" placeholder="Nombre" onChange={e=>setForm({...form, nombre:e.target.value})} />
                    <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" placeholder="SKU" onChange={e=>setForm({...form, sku:e.target.value})} />
                    <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" placeholder="Precio" type="number" onChange={e=>setForm({...form, precio:e.target.value})} />
                    <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" placeholder="Stock Inicial" type="number" onChange={e=>setForm({...form, stock:e.target.value})} />
                    <select className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" onChange={e=>setForm({...form, bodega_id:e.target.value})}>
                        <option value="">Seleccionar Bodega...</option>
                        {bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                    <button onClick={async()=>{ await axios.post('/productos', form); setSub('list'); load(); }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black">GUARDAR</button>
                </div>
            )}
            {sub === 'bodegas' && (
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[40px] border h-fit">
                        <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" placeholder="Nombre Bodega" onChange={e=>setFormB({nombre:e.target.value})} />
                        <button onClick={async()=>{ await axios.post('/bodegas', formB); load(); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">CREAR BODEGA</button>
                    </div>
                    <div className="bg-white rounded-[40px] border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr><th className="p-6">Nombre</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b"><td className="p-6 font-bold">{b.nombre}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function Produccion() {
    const [sub, setSub] = useState('materia');
    const [materias, setMaterias] = useState([]);
    const [recetas, setRecetas] = useState([]);
    const [ordenes, setOrdenes] = useState([]);
    const [formM, setFormM] = useState({ nombre: '', unidad_medida: 'mg', cantidad: '', costo: '' });

    const load = () => {
        axios.get('/produccion/materia').then(res => setMaterias(res.data));
        axios.get('/produccion/recetas').then(res => setRecetas(res.data));
        axios.get('/produccion/ordenes').then(res => setOrdenes(res.data));
    };
    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <button onClick={()=>setSub('materia')} className={`px-6 py-2 rounded-xl font-black ${sub==='materia'?'bg-blue-600 text-white':'bg-white'}`}>INSUMOS</button>
                <button onClick={()=>setSub('recetas')} className={`px-6 py-2 rounded-xl font-black ${sub==='recetas'?'bg-blue-600 text-white':'bg-white'}`}>RECETAS / KITS</button>
                <button onClick={()=>setSub('ordenes')} className={`px-6 py-2 rounded-xl font-black ${sub==='ordenes'?'bg-blue-600 text-white':'bg-white'}`}>ÓRDENES</button>
            </div>
            {sub === 'materia' && (
                <div className="grid grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-[40px] border h-fit">
                        <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" placeholder="Insumo" onChange={e=>setFormM({...formM, nombre:e.target.value})} />
                        <select className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" onChange={e=>setFormM({...formM, unidad_medida:e.target.value})}>
                            <option value="mg">mg</option><option value="ml">ml</option><option value="unidades">unidades</option>
                        </select>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" placeholder="Cant" type="number" onChange={e=>setFormM({...formM, cantidad:e.target.value})} />
                        <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" placeholder="Costo" type="number" onChange={e=>setFormM({...formM, costo:e.target.value})} />
                        <button onClick={async()=>{ await axios.post('/produccion/materia', formM); load(); }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black">GUARDAR</button>
                    </div>
                    <div className="col-span-2 bg-white rounded-[40px] border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr><th className="p-6">Nombre</th><th>Stock</th><th>Unidad</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b"><td className="p-6 font-bold">{m.nombre}</td><td>{m.cantidad}</td><td>{m.unidad_medida}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
            {sub === 'recetas' && <div className="p-20 text-center font-black opacity-20 uppercase border-2 border-dashed rounded-[40px]">Módulo de Kits/Recetas Listo para Configurar</div>}
            {sub === 'ordenes' && (
                <div className="bg-white rounded-[40px] border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr className="border-b"><th className="p-6">Orden #</th><th>Producto</th><th>Estado</th></tr></thead>
                        <tbody>{ordenes.map(o=>(<tr key={o.id} className="border-b"><td className="p-6 font-black">{o.numero_orden}</td><td>{o.nombre_producto_final}</td><td>{o.estado}</td></tr>))}</tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function Caja({ user, turno, onUpdate }) {
  const [base, setBase] = useState("");
  const handleAbrir = async () => {
    const p = window.prompt("Clave Maestra:");
    const rv = await axios.post('/turnos/verificar-maestra', { password: p });
    if (rv.data.success) {
      await axios.post('/turnos/iniciar', { base_caja: base });
      onUpdate();
    } else alert("Clave Maestra Incorrecta");
  };
  return (
    <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border shadow-sm max-w-xl mx-auto">
      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6"><Wallet size={40}/></div>
      {turno ? (
        <button onClick={async () => { if(window.confirm("¿Cerrar?")){ await axios.put('/turnos/finalizar', { turno_id: turno.id }); onUpdate(); } }} className="px-10 py-5 bg-red-500 text-white font-black rounded-3xl shadow-xl">CERRAR CAJA</button>
      ) : (
        <div className="space-y-4 w-full text-center">
          <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-center border-2" placeholder="Base Inicial" onChange={e=>setBase(e.target.value)} />
          <button onClick={handleAbrir} className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl">ABRIR TURNO</button>
        </div>
      )}
    </div>
  );
}

function Nomina() {
    const [emps, setEmps] = useState([]);
    const [form, setForm] = useState({ nombre: '', salario: '', cargo: 'Operario' });
    const load = () => axios.get('/api/empleados').then(res => setEmps(res.data));
    useEffect(() => { load(); }, []);

    return (
        <div className="grid grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[40px] border h-fit">
                <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" placeholder="Nombre Empleado" onChange={e=>setForm({...form, nombre:e.target.value})} />
                <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold" placeholder="Salario" type="number" onChange={e=>setForm({...form, salario:e.target.value})} />
                <button onClick={async()=>{ await axios.post('/empleados', form); load(); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black">VINCULAR</button>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4">
                {emps.map(e => (
                    <div key={e.id} className="bg-white p-6 rounded-3xl border flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center font-black">{e.nombre.charAt(0)}</div>
                        <div><p className="font-black leading-none">{e.nombre}</p><p className="text-green-600 font-bold">{fmt(e.salario)}</p></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Admin() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ nombre: '', email: '', password: '', cargo: 'Vendedor' });
    const load = () => axios.get('/admin/usuarios').then(res => setUsers(res.data));
    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-10">
            <div className="bg-white p-10 rounded-[40px] border max-w-4xl grid grid-cols-4 gap-4">
                <input className="p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Nombre" onChange={e=>setForm({...form, nombre:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Pass" type="password" onChange={e=>setForm({...form, password:e.target.value})} />
                <button onClick={async()=>{ await axios.post('/admin/usuarios', form); load(); }} className="bg-blue-600 text-white rounded-2xl font-black">GUARDAR</button>
            </div>
            <div className="bg-white rounded-[40px] border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr><th className="p-8">Nombre</th><th>Email</th><th>Rol</th></tr></thead>
                    <tbody>{users.map(u=>(<tr key={u.id} className="border-b"><td className="p-8 font-black">{u.nombre}</td><td>{u.email}</td><td>{u.cargo}</td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}

function MenuBtn({ icon, label, active, onClick }) { 
  return <button onClick={onClick} className={`w-full flex items-center px-6 py-4 rounded-[22px] mb-2 transition-all ${active ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}><span className="mr-4">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; 
}
function CardStat({ title, value, icon, color }) { 
  const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
  return <div className="bg-white p-8 rounded-[40px] border shadow-sm">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${c[color]}`}>{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3>
  </div>; 
}