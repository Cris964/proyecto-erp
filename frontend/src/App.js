/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, ScanBarcode, Factory, X, Plus, ShieldCheck, Calculator, TrendingUp
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

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-blue-600 text-2xl uppercase">AccuCloud Pro 2026...</div>;

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
        <div className="h-screen flex items-center justify-center bg-blue-600 p-4">
            <form onSubmit={handle} className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md text-center">
                <h1 className="text-4xl font-black mb-8 italic">AccuCloud.</h1>
                <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold border outline-none focus:border-blue-500" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} />
                <input className="w-full p-4 bg-slate-50 rounded-2xl mb-6 font-bold border outline-none focus:border-blue-500" type="password" placeholder="Pass" onChange={e=>setForm({...form, password:e.target.value})} />
                <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl">INGRESAR AL PANEL</button>
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
        <div className="h-28 flex items-center font-black text-2xl italic text-slate-800">ACCUCLOUD.</div>
        <nav className="flex-1 space-y-1">
          <MenuBtn icon={<LayoutDashboard/>} label="Dashboard" active={tab==='dashboard'} onClick={()=>setTab('dashboard')} />
          <MenuBtn icon={<Package/>} label="Inventario" active={tab==='inventario'} onClick={()=>setTab('inventario')} />
          <MenuBtn icon={<Factory/>} label="Producción PRO" active={tab==='produccion'} onClick={()=>setTab('produccion')} />
          <MenuBtn icon={<Users/>} label="Nómina Cloud" active={tab==='nomina'} onClick={()=>setTab('nomina')} />
          <MenuBtn icon={<Calculator/>} label="Contabilidad" active={tab==='conta'} onClick={()=>setTab('conta')} />
          <MenuBtn icon={<Wallet/>} label="Caja" active={tab==='caja'} onClick={()=>setTab('caja')} />
          <MenuBtn icon={<ShieldCheck/>} label="Usuarios Admin" active={tab==='admin'} onClick={()=>setTab('admin')} />
        </nav>
        <div className="p-8 border-t flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{user.cargo}</span>
            <span className="text-sm font-black text-slate-800 mb-4 truncate">{user.nombre}</span>
            <button onClick={onLogout} className="text-red-500 font-bold text-xs uppercase underline text-left">Cerrar Sesión</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-10 bg-slate-50">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{tab}</h2>
            {turno ? <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-black text-xs uppercase">SISTEMA ACTIVO | VENTAS: {fmt(turno.total_vendido)}</div> : <div className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-black text-xs uppercase">Caja Cerrada</div>}
        </header>
        <div className="animate-fade-in">
            {tab==='dashboard' && <Resumen />}
            {tab==='inventario' && <Inventario />}
            {tab==='produccion' && <Produccion />}
            {tab==='nomina' && <Nomina />}
            {tab==='conta' && <Contabilidad />}
            {tab==='caja' && <CajaView user={user} turno={turno} onUpdate={loadTurno} />}
            {tab==='admin' && <Admin />}
        </div>
      </main>
    </div>
  );
}

// --- MODULO: RESUMEN ---
function Resumen() {
  const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
  useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);
  return (
    <div className="grid grid-cols-4 gap-6">
        <CardStat title="Ventas Totales" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
        <CardStat title="Patrimonio Stock" value={fmt(data.valorInventario)} icon={<Package/>} color="purple" />
        <CardStat title="Alertas Stock" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
        <CardStat title="SaaS Status" value="Premium 2026" icon={<ShieldCheck/>} color="green" />
    </div>
  );
}

// --- MODULO: INVENTARIO ---
function Inventario() {
    const [sub, setSub] = useState('list');
    const [items, setItems] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [form, setForm] = useState({ nombre: '', sku: '', precio: '', stock: '', bodega_id: '' });
    const [formB, setFormB] = useState({ nombre: '' });

    const load = useCallback(() => {
        axios.get('/productos').then(res => setItems(Array.isArray(res.data) ? res.data : []));
        axios.get('/bodegas').then(res => setBodegas(Array.isArray(res.data) ? res.data : []));
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleProduct = async (e) => {
        e.preventDefault();
        await axios.post('/productos', form);
        alert("Guardado"); setSub('list'); load();
    };

    const handleBodega = async (e) => {
        e.preventDefault();
        await axios.post('/bodegas', formB);
        alert("Bodega Creada"); setFormB({nombre:''}); load();
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border">
                <button onClick={()=>setSub('list')} className={`px-8 py-2 rounded-xl font-black ${sub==='list'?'bg-blue-600 text-white':'text-slate-400'}`}>LISTADO</button>
                <button onClick={()=>setSub('new')} className={`px-8 py-2 rounded-xl font-black ${sub==='new'?'bg-blue-600 text-white':'text-slate-400'}`}>NUEVO ITEM</button>
                <button onClick={()=>setSub('bod')} className={`px-8 py-2 rounded-xl font-black ${sub==='bod'?'bg-blue-600 text-white':'text-slate-400'}`}>BODEGAS</button>
            </div>
            {sub === 'list' && <Table headers={['Producto','SKU','Existencias','Ubicación']} data={items} keys={['nombre','sku','stock','bodega_nombre']} />}
            {sub === 'new' && (
                <form onSubmit={handleProduct} className="bg-white p-12 rounded-[50px] border shadow-sm max-w-lg space-y-4 mx-auto">
                    <h3 className="font-black italic text-xl">Ficha Técnica de Producto</h3>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Nombre" onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="SKU" onChange={e=>setForm({...form, sku:e.target.value})} required/>
                    <div className="grid grid-cols-2 gap-4">
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Precio" type="number" onChange={e=>setForm({...form, precio:e.target.value})} />
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Stock" type="number" onChange={e=>setForm({...form, stock:e.target.value})} />
                    </div>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl border font-black" onChange={e=>setForm({...form, bodega_id:e.target.value})}>
                        <option value="">-- Bodega --</option>{bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                    <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl">REGISTRAR EN NUBE</button>
                </form>
            )}
            {sub === 'bod' && (
                <div className="grid grid-cols-2 gap-8">
                    <form onSubmit={handleBodega} className="bg-white p-10 rounded-[40px] border h-fit space-y-6">
                        <h3 className="font-black italic">Nueva Bodega</h3>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Nombre Bodega" value={formB.nombre} onChange={e=>setFormB({nombre:e.target.value})} required/>
                        <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black">CREAR DEPENDENCIA</button>
                    </form>
                    <Table headers={['Bodegas Activas']} data={bodegas} keys={['nombre']} />
                </div>
            )}
        </div>
    );
}

// --- MODULO: PRODUCCIÓN ---
function Produccion() {
    const [sub, setSub] = useState('ins');
    const [materia, setMateria] = useState([]);
    const [kits, setKits] = useState([]);
    const [formM, setFormM] = useState({ nombre: '', unidad_medida: 'mg', cantidad: '', costo: '' });
    const [formR, setFormR] = useState({ nombre_producto_final: '', descripcion: '' });

    const load = useCallback(() => {
        axios.get('/produccion/materia').then(res => setMateria(res.data));
        axios.get('/produccion/recetas').then(res => setKits(res.data));
    }, []);
    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border">
                <button onClick={()=>setSub('ins')} className={`px-6 py-2 rounded-xl font-black ${sub==='ins'?'bg-blue-600 text-white':'text-slate-400'}`}>INSUMOS</button>
                <button onClick={()=>setSub('rec')} className={`px-6 py-2 rounded-xl font-black ${sub==='rec'?'bg-blue-600 text-white':'text-slate-400'}`}>RECETAS / KITS</button>
            </div>
            {sub === 'ins' && (
                <div className="grid grid-cols-3 gap-8">
                    <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/produccion/materia', formM); setFormM({nombre:'',unidad_medida:'mg',cantidad:'',costo:''}); load(); }} className="bg-white p-10 rounded-[40px] border space-y-4 h-fit shadow-sm">
                        <h3 className="font-black italic">Nuevo Insumo</h3>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Nombre Insumo" value={formM.nombre} onChange={e=>setFormM({...formM, nombre:e.target.value})} />
                        <select className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida:e.target.value})}>
                            <option value="mg">mg</option><option value="ml">ml</option><option value="unidades">unidades</option>
                        </select>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Cantidad" type="number" value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad:e.target.value})} />
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Costo" type="number" value={formM.costo} onChange={e=>setFormM({...formM, costo:e.target.value})} />
                        <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black">GUARDAR MATERIA</button>
                    </form>
                    <div className="col-span-2"><Table headers={['Materia Prima','Stock','Unidad']} data={materia} keys={['nombre','cantidad','unidad_medida']} /></div>
                </div>
            )}
            {sub === 'rec' && (
                <div className="grid grid-cols-2 gap-8">
                    <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/produccion/recetas', formR); setFormR({nombre_producto_final:'',descripcion:''}); load(); }} className="bg-white p-10 rounded-[40px] border space-y-4 shadow-sm h-fit">
                        <h3 className="font-black italic">Nueva Receta Farmacéutica</h3>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Producto Final" value={formR.nombre_producto_final} onChange={e=>setFormR({...formR, nombre_producto_final:e.target.value})} />
                        <textarea className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Pasos de Preparación" value={formR.descripcion} onChange={e=>setFormR({...formR, descripcion:e.target.value})} />
                        <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black uppercase text-xs">Crear Kit Maestro</button>
                    </form>
                    <Table headers={['Kit Creado','Detalles']} data={kits} keys={['nombre_producto_final','descripcion']} />
                </div>
            )}
        </div>
    );
}

// --- MODULO: NOMINA ---
function Nomina() {
    const [emps, setEmps] = useState([]);
    const [form, setForm] = useState({ nombre: '', documento: '', salario: '', eps: '', arl: '', pension: '' });
    const load = useCallback(() => axios.get('/empleados').then(res => setEmps(Array.isArray(res.data) ? res.data : [])), []);
    useEffect(() => { load(); }, [load]);

    const handleVincular = async (e) => {
        e.preventDefault();
        await axios.post('/empleados', form);
        alert("Funcionario Vinculado");
        setForm({ nombre: '', documento: '', salario: '', eps: '', arl: '', pension: '' }); load();
    };

    return (
        <div className="space-y-10">
            <form onSubmit={handleVincular} className="bg-white p-10 rounded-[50px] border shadow-sm grid grid-cols-3 gap-6">
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Doc" value={form.documento} onChange={e=>setForm({...form, documento:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Salario" type="number" value={form.salario} onChange={e=>setForm({...form, salario:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="EPS" value={form.eps} onChange={e=>setForm({...form, eps:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="ARL" value={form.arl} onChange={e=>setForm({...form, arl:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Pension" value={form.pension} onChange={e=>setForm({...form, pension:e.target.value})} />
                <button type="submit" className="col-span-3 bg-blue-600 text-white py-5 rounded-3xl font-black uppercase text-xs shadow-xl">VINCULAR FUNCIONARIO</button>
            </form>
            <div className="grid grid-cols-2 gap-6">
                {emps.map(e => (
                    <div key={e.id} className="bg-white p-8 rounded-[40px] border shadow-sm flex flex-col gap-2 group hover:border-blue-600 transition-all">
                        <p className="font-black text-2xl">{e.nombre}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-4">DOC: {e.documento} | EPS: {e.eps}</p>
                        <div className="flex justify-between items-center mt-auto border-t pt-4">
                            <p className="text-3xl font-black text-green-600 leading-none">{fmt(e.salario)}</p>
                            <button onClick={()=>alert(`Neto a pagar: ${fmt(e.salario * 0.92 + 162000)}`)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase">Liquidar</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- MODULO: CONTABILIDAD ---
function Contabilidad() {
    const [data, setData] = useState([]);
    const load = () => axios.get('/contabilidad/movimientos').then(res => setData(res.data));
    useEffect(() => { load(); }, []);
    
    const ingresos = data.filter(d=>d.tipo==='Ingreso').reduce((s,i)=>s+parseFloat(i.total || 0),0);
    const egresos = data.filter(d=>d.tipo==='Egreso').reduce((s,i)=>s+parseFloat(i.total || 0),0);

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-10 rounded-[45px] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Ingresos Totales</p><h3 className="text-4xl font-black text-green-600">{fmt(ingresos)}</h3></div>
                <div className="bg-white p-10 rounded-[45px] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Egresos Totales</p><h3 className="text-4xl font-black text-red-500">{fmt(egresos)}</h3></div>
                <div className="bg-slate-900 p-10 rounded-[45px] shadow-2xl text-white"><p className="text-[10px] font-black uppercase text-slate-500 mb-2">Balance Neto</p><h3 className="text-4xl font-black">{fmt(ingresos - egresos)}</h3></div>
            </div>
            <Table headers={['Fecha','Descripción','Total','Tipo']} data={data} keys={['fecha','detalle','total','tipo']} />
        </div>
    );
}

// --- MODULO: CAJA ---
function CajaView({ user, turno, onUpdate }) {
    const [base, setBase] = useState("");
    const handle = async (e) => {
        e.preventDefault();
        await axios.post('/turnos/iniciar', { base_caja: base });
        alert("Caja Abierta"); onUpdate();
    };
    return (
        <div className="bg-white p-20 rounded-[60px] border shadow-2xl max-w-lg mx-auto flex flex-col items-center mt-10">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-10"><Wallet size={48}/></div>
            {turno ? (
                <button onClick={async()=>{ await axios.put('/turnos/finalizar', {turno_id: turno.id}); onUpdate(); alert("Caja Cerrada"); }} className="w-full py-6 bg-red-500 text-white font-black rounded-3xl shadow-xl hover:scale-105 transition-all">REALIZAR CIERRE DE CAJA</button>
            ) : (
                <form onSubmit={handle} className="w-full space-y-6 text-center">
                    <h3 className="text-3xl font-black italic">Apertura de Turno</h3>
                    <input type="number" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-center text-4xl border-2 outline-none focus:border-blue-500" placeholder="$0" value={base} onChange={e=>setBase(e.target.value)} required />
                    <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase text-xs">Abrir Turno Cloud</button>
                </form>
            )}
        </div>
    );
}

// --- MODULO: ADMIN USUARIOS ---
function Admin() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ nombre: '', email: '', password: '', cargo: 'Vendedor' });
    const load = () => axios.get('/admin/usuarios').then(res => setUsers(res.data));
    useEffect(() => { load(); }, []);

    const handleAdmin = async (e) => {
        e.preventDefault();
        await axios.post('/admin/usuarios', form);
        alert("Usuario Creado"); setForm({nombre:'',email:'',password:'',cargo:'Vendedor'}); load();
    };

    return (
        <div className="space-y-10">
            <form onSubmit={handleAdmin} className="bg-white p-12 rounded-[50px] border flex gap-6 max-w-4xl mx-auto shadow-sm">
                <input className="p-4 bg-slate-50 rounded-2xl font-bold flex-1 border" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl font-bold flex-1 border" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border flex-1" type="password" placeholder="Pass" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
                <button type="submit" className="bg-blue-600 text-white px-10 rounded-2xl font-black shadow-lg">GUARDAR</button>
            </form>
            <Table headers={['Funcionario','Email de Acceso','Rol Asignado']} data={users} keys={['nombre','email','cargo']} />
        </div>
    );
}

// --- HELPERS GLOBALES ---
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
function MenuBtn({ icon, label, active, onClick }) { return <button onClick={onClick} className={`w-full flex items-center px-6 py-4 rounded-[22px] mb-2 transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}><span className="mr-4">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; }
function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return <div className="bg-white p-10 rounded-[45px] border shadow-sm group hover:shadow-xl transition-all duration-300"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${c[color]}`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p><h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3></div>; 
}