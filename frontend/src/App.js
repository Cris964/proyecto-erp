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

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-blue-600">ACCUCLOUD PRO...</div>;

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
        try {
            const res = await axios.post('/login', form);
            if (res.data.success) onLogin(res.data);
            else alert("Acceso Denegado");
        } catch (e) { alert("Error de conexión"); }
    };
    return (
        <div className="h-screen flex items-center justify-center bg-blue-600 p-4">
            <form onSubmit={handle} className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md">
                <h1 className="text-4xl font-black text-center mb-2 italic">AccuCloud.</h1>
                <p className="text-center text-slate-400 text-xs uppercase font-bold mb-10 tracking-widest">SaaS ERP 2026</p>
                <input className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold outline-none border-2 focus:border-blue-500" placeholder="Email Corporativo" onChange={e=>setForm({...form, email:e.target.value})} />
                <input className="w-full p-4 bg-slate-50 rounded-2xl mb-6 font-bold outline-none border-2 focus:border-blue-500" type="password" placeholder="Contraseña" onChange={e=>setForm({...form, password:e.target.value})} />
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
        <div className="h-28 flex items-center font-black text-2xl italic text-slate-800">ACCUCLOUD<span className="text-blue-600">.</span></div>
        <nav className="flex-1 space-y-1">
          <MenuBtn icon={<LayoutDashboard size={20}/>} label="Dashboard" active={tab==='dashboard'} onClick={()=>setTab('dashboard')} />
          <MenuBtn icon={<Package size={20}/>} label="Inventario" active={tab==='inventario'} onClick={()=>setTab('inventario')} />
          <MenuBtn icon={<Factory size={20}/>} label="Producción" active={tab==='produccion'} onClick={()=>setTab('produccion')} />
          <MenuBtn icon={<Users size={20}/>} label="Nómina" active={tab==='nomina'} onClick={()=>setTab('nomina')} />
          <MenuBtn icon={<Calculator size={20}/>} label="Contabilidad" active={tab==='conta'} onClick={()=>setTab('conta')} />
          <MenuBtn icon={<Wallet size={20}/>} label="Caja" active={tab==='caja'} onClick={()=>setTab('caja')} />
          <MenuBtn icon={<ShieldCheck size={20}/>} label="Usuarios" active={tab==='admin'} onClick={()=>setTab('admin')} />
        </nav>
        <div className="p-8 border-t flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase">{user.cargo}</span>
            <span className="text-sm font-black text-slate-800 mb-4">{user.nombre}</span>
            <button onClick={onLogout} className="text-red-500 font-bold text-xs uppercase underline text-left">Salir</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-10 bg-slate-50">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{tab}</h2>
            {turno ? <div className="px-6 py-2 bg-green-100 text-green-700 rounded-xl font-black text-xs">SISTEMA ACTIVO | {fmt(turno.total_vendido)}</div> : <div className="px-6 py-2 bg-red-100 text-red-700 rounded-xl font-black text-xs uppercase tracking-widest">Caja Cerrada</div>}
        </header>
        {tab==='dashboard' && <Resumen />}
        {tab==='inventario' && <Inventario />}
        {tab==='produccion' && <Produccion />}
        {tab==='nomina' && <Nomina />}
        {tab==='conta' && <Contabilidad />}
        {tab==='caja' && <CajaView user={user} turno={turno} onUpdate={loadTurno} />}
        {tab==='admin' && <Admin />}
      </main>
    </div>
  );
}

// --- VISTA: INVENTARIO ---
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

    const handleGuardarProducto = async (e) => {
        e.preventDefault();
        if(!form.nombre || !form.precio) return alert("Faltan datos");
        await axios.post('/productos', form);
        alert("Producto Guardado");
        setSub('list'); load();
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border">
                <button onClick={()=>setSub('list')} className={`px-6 py-2 rounded-xl font-black ${sub==='list'?'bg-blue-600 text-white':'text-slate-400'}`}>LISTADO</button>
                <button onClick={()=>setSub('new')} className={`px-6 py-2 rounded-xl font-black ${sub==='new'?'bg-blue-600 text-white':'text-slate-400'}`}>NUEVO ITEM</button>
                <button onClick={()=>setSub('bod')} className={`px-6 py-2 rounded-xl font-black ${sub==='bod'?'bg-blue-600 text-white':'text-slate-400'}`}>BODEGAS</button>
            </div>
            {sub === 'list' && <Table headers={['Producto','SKU','Stock','Bodega']} data={items} keys={['nombre','sku','stock','bodega_nombre']} />}
            {sub === 'new' && (
                <form onSubmit={handleGuardarProducto} className="bg-white p-10 rounded-[40px] border max-w-lg shadow-sm space-y-4">
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Nombre del Producto" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} />
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="SKU Único" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Precio" type="number" value={form.precio} onChange={e=>setForm({...form, precio:e.target.value})} />
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Stock" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} />
                    </div>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" value={form.bodega_id} onChange={e=>setForm({...form, bodega_id:e.target.value})}>
                        <option value="">-- Seleccionar Bodega --</option>
                        {bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                    <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl hover:bg-blue-700 transition-all">GUARDAR EN NUBE</button>
                </form>
            )}
            {sub === 'bod' && (
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-[40px] border h-fit space-y-4 shadow-sm">
                        <h3 className="font-black italic">Nueva Bodega</h3>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Nombre" value={formB.nombre} onChange={e=>setFormB({nombre:e.target.value})} />
                        <button onClick={async()=>{ await axios.post('/bodegas', formB); setFormB({nombre:''}); load(); }} className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black">CREAR BODEGA</button>
                    </div>
                    <Table headers={['Bodegas Registradas']} data={bodegas} keys={['nombre']} />
                </div>
            )}
        </div>
    );
}

// --- VISTA: PRODUCCIÓN ---
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

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border">
                <button onClick={()=>setSub('insumos')} className={`px-6 py-2 rounded-xl font-black ${sub==='insumos'?'bg-blue-600 text-white':'text-slate-400'}`}>INSUMOS</button>
                <button onClick={()=>setSub('recetas')} className={`px-6 py-2 rounded-xl font-black ${sub==='recetas'?'bg-blue-600 text-white':'text-slate-400'}`}>KITS / RECETAS</button>
                <button onClick={()=>setSub('ordenes')} className={`px-6 py-2 rounded-xl font-black ${sub==='ordenes'?'bg-blue-600 text-white':'text-slate-400'}`}>ÓRDENES</button>
            </div>
            {sub === 'insumos' && (
                <div className="grid grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-[40px] border h-fit space-y-4 shadow-sm">
                        <h3 className="font-black italic">Nuevo Insumo</h3>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Nombre" value={formM.nombre} onChange={e=>setFormM({...formM, nombre:e.target.value})} />
                        <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida:e.target.value})}>
                            <option value="mg">mg</option><option value="ml">ml</option><option value="unidades">unidades</option>
                        </select>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Cantidad" type="number" value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad:e.target.value})} />
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Costo" type="number" value={formM.costo} onChange={e=>setFormM({...formM, costo:e.target.value})} />
                        <button onClick={async()=>{ await axios.post('/produccion/materia', formM); setFormM({nombre:'',unidad_medida:'mg',cantidad:'',costo:''}); load(); }} className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black">GUARDAR</button>
                    </div>
                    <div className="col-span-2"><Table headers={['Insumo','Stock','Unidad','Costo']} data={materia} keys={['nombre','cantidad','unidad_medida','costo']} /></div>
                </div>
            )}
            {sub === 'recetas' && (
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-[40px] border space-y-4 shadow-sm">
                        <h3 className="font-black italic">Nuevo Kit / Receta Maestra</h3>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Nombre del Kit Final" value={formR.nombre_producto_final} onChange={e=>setFormR({...formR, nombre_producto_final:e.target.value})} />
                        <textarea className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Descripción de preparación" value={formR.descripcion} onChange={e=>setFormR({...formR, descripcion:e.target.value})} />
                        <button onClick={async()=>{ await axios.post('/produccion/recetas', formR); setFormR({nombre_producto_final:'',descripcion:''}); load(); }} className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black">CREAR RECETA</button>
                    </div>
                    <Table headers={['Kits Disponibles','Descripción']} data={recetas} keys={['nombre_producto_final','descripcion']} />
                </div>
            )}
            {sub === 'ordenes' && (
                <div className="space-y-6">
                    <div className="bg-white p-10 rounded-[40px] border flex gap-6 items-end shadow-sm">
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-1">Medicamento a fabricar</p>
                            <select id="selR" className="w-full p-4 bg-slate-50 rounded-2xl font-black border">
                                {recetas.map(r=><option key={r.id} value={r.id}>{r.nombre_producto_final}</option>)}
                            </select>
                        </div>
                        <input id="cantR" type="number" className="p-4 bg-slate-50 rounded-2xl font-black border w-32" placeholder="Cant." defaultValue="1" />
                        <button onClick={async()=>{ 
                            const rid = document.getElementById('selR').value;
                            const c = document.getElementById('cantR').value;
                            await axios.post('/produccion/ordenes', {receta_id: rid, cantidad_a_producir: c}); 
                            load(); 
                        }} className="bg-blue-600 text-white px-10 py-4 rounded-3xl font-black">LANZAR ÓRDEN</button>
                    </div>
                    <Table headers={['Orden #','Producto Final','Estado']} data={ordenes} keys={['numero_orden','nombre_producto_final','estado']} />
                </div>
            )}
        </div>
    );
}

// --- VISTA: NOMINA ---
function Nomina() {
    const [emps, setEmps] = useState([]);
    const [form, setForm] = useState({ nombre: '', salario: '', cargo: 'Operario' });
    const load = () => axios.get('/empleados').then(res => setEmps(res.data));
    useEffect(() => { load(); }, []);

    const handleVincular = async (e) => {
        e.preventDefault();
        if(!form.nombre || !form.salario) return alert("Faltan datos");
        await axios.post('/empleados', form);
        alert("Empleado Vinculado");
        setForm({ nombre: '', salario: '', cargo: 'Operario' });
        load();
    };

    return (
        <div className="grid grid-cols-3 gap-8">
            <form onSubmit={handleVincular} className="bg-white p-10 rounded-[40px] border h-fit space-y-4 shadow-sm">
                <h3 className="font-black italic">Vincular Funcionario</h3>
                <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Nombre Completo" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} />
                <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Salario Mensual" type="number" value={form.salario} onChange={e=>setForm({...form, salario:e.target.value})} />
                <select className="w-full p-4 bg-slate-50 rounded-2xl font-black border" value={form.cargo} onChange={e=>setForm({...form, cargo:e.target.value})}>
                    <option value="Operario">Operario</option><option value="Admin">Admin</option><option value="Vendedor">Vendedor</option>
                </select>
                <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black">VINCULAR AHORA</button>
            </form>
            <div className="col-span-2 grid grid-cols-2 gap-4">
                {emps.map(e => (
                    <div key={e.id} className="bg-white p-8 rounded-[35px] border flex items-center gap-6 shadow-sm">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl font-black">{e.nombre?.charAt(0)}</div>
                        <div>
                            <p className="font-black text-slate-800 text-lg leading-none">{e.nombre}</p>
                            <p className="text-xs font-black text-slate-400 mt-2 uppercase">{e.cargo}</p>
                            <p className="text-xl font-black text-green-600 mt-2">{fmt(e.salario)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- VISTA: CONTABILIDAD PRO ---
function Contabilidad() {
    const [data, setData] = useState([]);
    useEffect(() => { axios.get('/contabilidad/movimientos').then(res => setData(res.data)); }, []);
    
    const ingresos = data.filter(d=>d.tipo==='Ingreso').reduce((s,i)=>s+parseFloat(i.total),0);
    const egresos = data.filter(d=>d.tipo==='Egreso').reduce((s,i)=>s+parseFloat(i.total),0);

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-10 rounded-[40px] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Ingresos Totales</p><h3 className="text-3xl font-black text-green-600">{fmt(ingresos)}</h3></div>
                <div className="bg-white p-10 rounded-[40px] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Egresos Totales</p><h3 className="text-3xl font-black text-red-500">{fmt(egresos)}</h3></div>
                <div className="bg-slate-900 p-10 rounded-[40px] shadow-xl"><p className="text-[10px] font-black uppercase text-slate-500 mb-2">Balance Neto</p><h3 className="text-3xl font-black text-white">{fmt(ingresos - egresos)}</h3></div>
            </div>
            <Table headers={['Fecha','Detalle del Movimiento','Valor','Tipo']} data={data} keys={['fecha','detalle','total','tipo']} />
        </div>
    );
}

// --- VISTA: CAJA ---
function CajaView({ user, turno, onUpdate }) {
    const [base, setBase] = useState("");
    const handle = async () => {
        const p = window.prompt("Introduce la Clave Maestra:");
        try {
            const res = await axios.post('/turnos/verificar-maestra', { password: p });
            if (res.data.success) {
                await axios.post('/turnos/iniciar', { base_caja: base });
                onUpdate();
            } else alert("Clave Maestra Incorrecta");
        } catch (e) { alert("Error de servidor"); }
    };
    return (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[60px] border shadow-xl max-w-xl mx-auto mt-10">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[35px] flex items-center justify-center mb-10"><Wallet size={48}/></div>
            {turno ? <button onClick={async()=> { if(confirm("¿Cerrar?")){ await axios.put('/turnos/finalizar', {turno_id: turno.id}); onUpdate(); }}} className="w-full py-6 bg-red-500 text-white font-black rounded-3xl shadow-xl">CERRAR CAJA ACTUAL</button> : (
                <div className="w-full space-y-6 text-center">
                    <h3 className="text-3xl font-black italic">Apertura de Caja</h3>
                    <input type="number" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-center text-3xl border-2 border-transparent focus:border-blue-500 outline-none" placeholder="$0" value={base} onChange={e=>setBase(e.target.value)} />
                    <button onClick={handle} className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs">Iniciar Turno</button>
                </div>
            )}
        </div>
    );
}

// --- VISTA: ADMIN ---
function Admin() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ nombre: '', email: '', password: '', cargo: 'Vendedor' });
    const load = () => axios.get('/admin/usuarios').then(res => setUsers(res.data));
    useEffect(() => { load(); }, []);

    const handleCrear = async (e) => {
        e.preventDefault();
        await axios.post('/admin/usuarios', form);
        alert("Usuario Creado");
        setForm({ nombre: '', email: '', password: '', cargo: 'Vendedor' });
        load();
    };

    return (
        <div className="space-y-10">
            <form onSubmit={handleCrear} className="bg-white p-12 rounded-[50px] border shadow-sm max-w-4xl mx-auto grid grid-cols-4 gap-4 items-end">
                <div className="col-span-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1">Nombre</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Ej: Juan" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} /></div>
                <div className="col-span-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1">Email</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></div>
                <div className="col-span-1"><label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1">Pass</label><input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} /></div>
                <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl font-black shadow-xl">GUARDAR</button>
            </form>
            <Table headers={['Nombre Funcionario','Email Acceso','Cargo']} data={users} keys={['nombre','email','cargo']} />
        </div>
    );
}

// --- HELPERS ---
function Table({ headers, data, keys }) {
    return (
        <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr>{headers.map((h, i) => <th key={i} className="p-8">{h}</th>)}</tr></thead>
                <tbody>{data?.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-slate-50 transition-all">{keys.map((k, j) => <td key={j} className="p-8 font-bold text-slate-700">{row[k] || 'N/A'}</td>)}</tr>
                ))}</tbody>
            </table>
        </div>
    );
}

function MenuBtn({ icon, label, active, onClick }) { 
    return <button onClick={onClick} className={`w-full flex items-center px-6 py-4 rounded-[22px] mb-2 transition-all ${active ? 'bg-blue-600 text-white shadow-xl -translate-y-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}><span className="mr-4">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; 
}

function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return <div className="bg-white p-10 rounded-[45px] border shadow-sm"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${c[color]}`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p><h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3></div>; 
}

function Resumen() {
  const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
  useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);
  return (
    <div className="grid grid-cols-3 gap-6">
        <CardStat title="Ventas Totales" value={fmt(data.cajaMayor)} icon={<TrendingUp/>} color="blue" />
        <CardStat title="Patrimonio Stock" value={fmt(data.valorInventario)} icon={<Package/>} color="purple" />
        <CardStat title="Faltantes Stock" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
    </div>
  );
}