/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LayoutDashboard, Package, ShoppingCart, Users, DollarSign, AlertTriangle, Wallet, Factory, ShieldCheck, Plus, X } from 'lucide-react';

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

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-blue-600">INICIANDO...</div>;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? (
        <Login onLogin={(data) => { setUser(data.user); localStorage.setItem('erp_user', JSON.stringify(data.user)); localStorage.setItem('erp_token', data.token); }} />
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
        else alert("Acceso Incorrecto");
    };
    return (
        <div className="h-screen flex items-center justify-center bg-blue-600">
            <form onSubmit={handle} className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md text-center">
                <h1 className="text-4xl font-black mb-10 italic">AccuCloud.</h1>
                <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold border" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} />
                <input className="w-full p-4 bg-slate-50 rounded-2xl mb-6 font-bold border" type="password" placeholder="Contraseña" onChange={e=>setForm({...form, password:e.target.value})} />
                <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl">INGRESAR</button>
            </form>
        </div>
    );
}

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
        <div className="h-28 flex items-center font-black text-2xl italic">ACCUCLOUD.</div>
        <nav className="flex-1 space-y-1">
          <MenuBtn icon={<LayoutDashboard/>} label="Dashboard" active={tab==='dashboard'} onClick={()=>setTab('dashboard')} />
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
            {turno ? <div className="px-6 py-2 bg-green-100 text-green-700 rounded-xl font-black text-xs">ACTIVO: {fmt(turno.total_vendido)}</div> : <div className="px-6 py-2 bg-red-100 text-red-700 rounded-xl font-black text-xs">CERRADO</div>}
        </header>
        {tab==='dashboard' && <Resumen />}
        {tab==='inventario' && <Inventario />}
        {tab==='produccion' && <Produccion />}
        {tab==='nomina' && <Nomina />}
        {tab==='caja' && <CajaView user={user} turno={turno} onUpdate={loadTurno} />}
        {tab==='admin' && <Admin />}
      </main>
    </div>
  );
}

// VISTAS DETALLADAS
function Resumen() {
  const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
  useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);
  return (
    <div className="grid grid-cols-4 gap-6">
        <CardStat title="Ventas Totales" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
        <CardStat title="Patrimonio Stock" value={fmt(data.valorInventario)} icon={<Package/>} color="purple" />
        <CardStat title="Faltantes Stock" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
        <CardStat title="Licencia" value="Premium 2026" icon={<ShieldCheck/>} color="green" />
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
            <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border">
                <button onClick={()=>setSub('list')} className={`px-8 py-2 rounded-xl font-black ${sub==='list'?'bg-blue-600 text-white':'text-slate-400'}`}>LISTADO</button>
                <button onClick={()=>setSub('new')} className={`px-8 py-2 rounded-xl font-black ${sub==='new'?'bg-blue-600 text-white':'text-slate-400'}`}>NUEVO</button>
                <button onClick={()=>setSub('bod')} className={`px-8 py-2 rounded-xl font-black ${sub==='bod'?'bg-blue-600 text-white':'text-slate-400'}`}>BODEGAS</button>
            </div>
            {sub === 'list' && (
                <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr><th className="p-6">Producto</th><th>SKU</th><th>Stock</th><th>Bodega</th></tr></thead>
                        <tbody>{items.map(p=>(<tr key={p.id} className="border-b"><td className="p-6 font-bold">{p.nombre}</td><td>{p.sku}</td><td className="font-black text-blue-600">{p.stock}</td><td>{p.bodega_nombre || '---'}</td></tr>))}</tbody>
                    </table>
                </div>
            )}
            {sub === 'new' && (
                <div className="bg-white p-10 rounded-[40px] border max-w-lg shadow-sm space-y-4">
                    <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Nombre" onChange={e=>setForm({...form, nombre:e.target.value})} />
                    <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="SKU" onChange={e=>setForm({...form, sku:e.target.value})} />
                    <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Precio" type="number" onChange={e=>setForm({...form, precio:e.target.value})} />
                    <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Stock" type="number" onChange={e=>setForm({...form, stock:e.target.value})} />
                    <select className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" onChange={e=>setForm({...form, bodega_id:e.target.value})}>
                        <option value="">-- Seleccionar Bodega --</option>{bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                    <button onClick={async()=>{ await axios.post('/api/productos', form); load(); setSub('list'); }} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black">GUARDAR</button>
                </div>
            )}
            {sub === 'bod' && (
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-[40px] border h-fit space-y-4">
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Nombre Bodega" onChange={e=>setFormB({nombre:e.target.value})} />
                        <button onClick={async()=>{ await axios.post('/api/bodegas', formB); load(); }} className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black">CREAR</button>
                    </div>
                    <div className="bg-white rounded-[40px] border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr><th className="p-6">Bodega</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b"><td className="p-6 font-bold">{b.nombre}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function Produccion() {
    const [sub, setSub] = useState('ins');
    const [materia, setMateria] = useState([]);
    const [recetas, setRecetas] = useState([]);
    const [formM, setFormM] = useState({ nombre: '', unidad_medida: 'mg', cantidad: '', costo: '' });
    const [formR, setFormR] = useState({ nombre_producto_final: '', descripcion: '' });

    const load = () => {
        axios.get('/produccion/materia').then(res => setMateria(res.data));
        axios.get('/produccion/recetas').then(res => setRecetas(res.data));
    };
    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border">
                <button onClick={()=>setSub('ins')} className={`px-6 py-2 rounded-xl font-black ${sub==='ins'?'bg-blue-600 text-white':'text-slate-400'}`}>INSUMOS</button>
                <button onClick={()=>setSub('rec')} className={`px-6 py-2 rounded-xl font-black ${sub==='rec'?'bg-blue-600 text-white':'text-slate-400'}`}>RECETAS</button>
            </div>
            {sub === 'ins' && (
                <div className="grid grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-[40px] border space-y-4 shadow-sm h-fit">
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Nombre" onChange={e=>setFormM({...formM, nombre:e.target.value})} />
                        <select className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" onChange={e=>setFormM({...formM, unidad_medida:e.target.value})}><option value="mg">mg</option><option value="unidades">unidades</option></select>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Cant" type="number" onChange={e=>setFormM({...formM, cantidad:e.target.value})} />
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Costo" type="number" onChange={e=>setFormM({...formM, costo:e.target.value})} />
                        <button onClick={async()=>{ await axios.post('/produccion/materia', formM); load(); }} className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black">GUARDAR</button>
                    </div>
                    <div className="col-span-2 bg-white rounded-[40px] border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr><th className="p-6">Insumo</th><th>Stock</th></tr></thead>
                            <tbody>{materia.map(m=>(<tr key={m.id} className="border-b"><td className="p-6 font-bold">{m.nombre}</td><td>{m.cantidad}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
            {sub === 'rec' && (
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-[40px] border space-y-4 shadow-sm h-fit">
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Kit Final" onChange={e=>setFormR({...formR, nombre_producto_final:e.target.value})} />
                        <textarea className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Detalles" onChange={e=>setFormR({...formR, descripcion:e.target.value})} />
                        <button onClick={async()=>{ await axios.post('/produccion/recetas', formR); load(); }} className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black">CREAR KIT</button>
                    </div>
                    <div className="bg-white rounded-[40px] border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr><th className="p-6">Kit</th><th>Detalle</th></tr></thead>
                            <tbody>{recetas.map(r=>(<tr key={r.id} className="border-b"><td className="p-6 font-bold">{r.nombre_producto_final}</td><td className="p-6 text-xs">{r.descripcion}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function Nomina() {
    const [emps, setEmps] = useState([]);
    const [form, setForm] = useState({ nombre: '', documento: '', salario: '', eps: '', arl: '', pension: '' });
    const load = () => axios.get('/empleados').then(res => setEmps(res.data));
    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-8">
            <div className="bg-white p-10 rounded-[40px] border shadow-sm grid grid-cols-3 gap-4">
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Nombre" onChange={e=>setForm({...form, nombre:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Doc" onChange={e=>setForm({...form, documento:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Salario" type="number" onChange={e=>setForm({...form, salario:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="EPS" onChange={e=>setForm({...form, eps:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="ARL" onChange={e=>setForm({...form, arl:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Pensión" onChange={e=>setForm({...form, pension:e.target.value})} />
                <button onClick={async()=>{ await axios.post('/api/empleados', form); load(); }} className="bg-blue-600 text-white p-4 rounded-3xl font-black col-span-3">VINCULAR AHORA</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {emps.map(e => (
                    <div key={e.id} className="bg-white p-6 rounded-3xl border flex flex-col gap-2">
                        <p className="font-black text-xl">{e.nombre}</p>
                        <p className="text-xs font-bold text-slate-400">EPS: {e.eps} | ARL: {e.arl}</p>
                        <p className="text-green-600 font-black text-xl">{fmt(e.salario)}</p>
                        <button onClick={()=>alert(`Liquidando a ${e.nombre}...`)} className="bg-slate-100 py-2 rounded-xl text-[9px] font-black uppercase">Liquidar</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CajaView({ user, turno, onUpdate }) {
    const [base, setBase] = useState("");
    return (
        <div className="bg-white p-20 rounded-[50px] border shadow-2xl max-w-lg mx-auto flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[35px] flex items-center justify-center mb-10"><Wallet size={48}/></div>
            {turno ? <button onClick={async()=>{ await axios.put('/turnos/finalizar', {turno_id: turno.id}); onUpdate(); }} className="w-full py-6 bg-red-500 text-white font-black rounded-3xl shadow-xl">CERRAR CAJA</button> : (
                <div className="w-full space-y-6">
                    <input type="number" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-center text-4xl border-2" placeholder="$ Base" onChange={e=>setBase(e.target.value)} />
                    <button onClick={async()=>{ await axios.post('/api/turnos/iniciar', {base_caja: base}); onUpdate(); }} className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase">Iniciar Turno</button>
                </div>
            )}
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
            <div className="bg-white p-10 rounded-[40px] border flex gap-4 max-w-4xl shadow-sm">
                <input className="p-4 bg-slate-50 rounded-2xl font-bold flex-1" placeholder="Nombre" onChange={e=>setForm({...form, nombre:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl font-bold flex-1" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border flex-1" type="password" placeholder="Pass" onChange={e=>setForm({...form, password:e.target.value})} />
                <button onClick={async()=>{ await axios.post('/admin/usuarios', form); load(); }} className="bg-blue-600 text-white px-8 rounded-2xl font-black">GUARDAR</button>
            </div>
            <div className="bg-white rounded-[40px] border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr><th className="p-6">Funcionario</th><th>Rol</th></tr></thead>
                    <tbody>{users.map(u=>(<tr key={u.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-6 font-bold">{u.nombre}</td><td>{u.cargo}</td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}

// HELPERS
function CardStat({ title, value, icon, color }) {
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return <div className="bg-white p-10 rounded-[45px] border shadow-sm"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${c[color]}`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p><h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3></div>;
}
function MenuBtn({ icon, label, active, onClick }) { return <button onClick={onClick} className={`w-full flex items-center px-6 py-4 rounded-[22px] mb-2 transition-all ${active ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}><span className="mr-4">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; }