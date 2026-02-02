/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, ScanBarcode, Factory, X, Plus, 
  ShieldCheck, Calculator, TrendingUp, ChevronRight
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

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-blue-600 text-2xl uppercase italic">AccuCloud Pro 2026...</div>;

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
        try {
            const res = await axios.post('/login', form);
            if (res.data.success) onLogin(res.data);
            else alert("Acceso Incorrecto");
        } catch (e) { alert("Error de servidor"); }
    };
    return (
        <div className="h-screen flex items-center justify-center bg-blue-600 p-4">
            <form onSubmit={handle} className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md text-center">
                <h1 className="text-4xl font-black mb-2 italic">AccuCloud<span className="text-blue-600">.</span></h1>
                <p className="text-slate-400 text-[10px] uppercase font-bold mb-10 tracking-widest">Software ERP de Producción</p>
                <div className="space-y-4">
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border" placeholder="Email" onChange={e=>setForm({...form, email:e.target.value})} />
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border" type="password" placeholder="Contraseña" onChange={e=>setForm({...form, password:e.target.value})} />
                    <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl">INGRESAR AL PANEL</button>
                </div>
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
        <nav className="flex-1 space-y-1 overflow-y-auto">
          <MenuBtn icon={<LayoutDashboard/>} label="Dashboard" active={tab==='dashboard'} onClick={()=>setTab('dashboard')} />
          <MenuBtn icon={<Package/>} label="Inventario" active={tab==='inventario'} onClick={()=>setTab('inventario')} />
          <MenuBtn icon={<Factory/>} label="Producción PRO" active={tab==='produccion'} onClick={()=>setTab('produccion')} />
          <MenuBtn icon={<Users/>} label="Nómina Cloud" active={tab==='nomina'} onClick={()=>setTab('nomina')} />
          <MenuBtn icon={<Calculator/>} label="Contabilidad" active={tab==='conta'} onClick={()=>setTab('conta')} />
          <MenuBtn icon={<Wallet/>} label="Caja" active={tab==='caja'} onClick={()=>setTab('caja')} />
          <MenuBtn icon={<ShieldCheck/>} label="Usuarios Admin" active={tab==='admin'} onClick={()=>setTab('admin')} />
        </nav>
        <div className="p-8 border-t flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase">{user.cargo}</span>
            <span className="text-sm font-black text-slate-800 mb-4 truncate">{user.nombre}</span>
            <button onClick={onLogout} className="text-red-500 font-bold text-xs uppercase underline text-left">Salir</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-10 bg-slate-50">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{tab}</h2>
            {turno ? <div className="px-6 py-2 bg-green-100 text-green-700 rounded-xl font-black text-xs uppercase tracking-widest border">Turno Activo | {fmt(turno.total_vendido)}</div> : <div className="px-6 py-2 bg-red-100 text-red-700 rounded-xl font-black text-xs uppercase tracking-widest">Caja Cerrada</div>}
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
//           VISTAS DE MÓDULOS
// ==========================================

function ResumenView() {
    const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
    useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);
    return (
        <div className="grid grid-cols-4 gap-6">
            <CardStat title="Ventas Totales" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
            <CardStat title="Patrimonio Stock" value={fmt(data.valorInventario)} icon={<Package/>} color="purple" />
            <CardStat title="Alertas Stock" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
            <CardStat title="Licencia 2026" value="Premium" icon={<ShieldCheck/>} color="green" />
        </div>
    );
}

function InventarioView() {
    const [sub, setSub] = useState('list');
    const [items, setItems] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [form, setForm] = useState({ nombre: '', sku: '', precio: '', stock: '', bodega_id: '' });
    const [formB, setFormB] = useState({ nombre: '' });

    const load = useCallback(() => {
        axios.get('/productos').then(res => setItems(res.data));
        axios.get('/bodegas').then(res => setBodegas(res.data));
    }, []);
    useEffect(() => { load(); }, [load]);

    const saveProduct = async (e) => {
        e.preventDefault();
        await axios.post('/productos', form);
        alert("Agregado"); setForm({nombre:'',sku:'',precio:'',stock:'',bodega_id:''}); load(); setSub('list');
    };

    const saveBodega = async (e) => {
        e.preventDefault();
        await axios.post('/bodegas', formB);
        alert("Bodega Creada"); setFormB({nombre:''}); load();
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border shadow-sm">
                <button onClick={()=>setSub('list')} className={`px-8 py-2 rounded-xl font-black text-xs ${sub==='list'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>LISTADO</button>
                <button onClick={()=>setSub('new')} className={`px-8 py-2 rounded-xl font-black text-xs ${sub==='new'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>NUEVO PRODUCTO</button>
                <button onClick={()=>setSub('bod')} className={`px-8 py-2 rounded-xl font-black text-xs ${sub==='bod'?'bg-blue-600 text-white shadow-lg':'text-slate-400'}`}>BODEGAS</button>
            </div>

            {sub === 'list' && (
                <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Producto</th><th>SKU</th><th>Stock</th><th>Bodega</th></tr></thead>
                        <tbody>{items.map(p=>(<tr key={p.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 font-bold text-slate-700">{p.nombre}</td><td className="font-bold text-slate-400">{p.sku}</td><td className="font-black text-blue-600">{p.stock}</td><td className="text-xs font-bold uppercase">{p.bodega_nombre || 'S/B'}</td></tr>))}</tbody>
                    </table>
                </div>
            )}

            {sub === 'new' && (
                <form onSubmit={saveProduct} className="bg-white p-12 rounded-[50px] border max-w-lg shadow-sm space-y-4 mx-auto">
                    <h3 className="text-2xl font-black italic">Nuevo Producto</h3>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border outline-none" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                    <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border outline-none" placeholder="SKU" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required/>
                    <div className="grid grid-cols-2 gap-4">
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border outline-none" placeholder="Precio" type="number" onChange={e=>setForm({...form, precio:e.target.value})} required/>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border outline-none" placeholder="Stock" type="number" onChange={e=>setForm({...form, stock:e.target.value})} required/>
                    </div>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl font-black border outline-none" onChange={e=>setForm({...form, bodega_id:e.target.value})}>
                        <option value="">Seleccionar Bodega...</option>{bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                    <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl">GUARDAR EN NUBE</button>
                </form>
            )}

            {sub === 'bod' && (
                <div className="grid grid-cols-2 gap-8">
                    <form onSubmit={saveBodega} className="bg-white p-10 rounded-[40px] border h-fit space-y-6 shadow-sm">
                        <h3 className="font-black italic text-xl">Nueva Bodega</h3>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Nombre" value={formB.nombre} onChange={e=>setFormB({nombre:e.target.value})} required/>
                        <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black">CREAR BODEGA</button>
                    </form>
                    <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr className="border-b"><th className="p-8">Bodegas Registradas</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b hover:bg-slate-50"><td className="p-8 font-black text-slate-700">{b.nombre}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProduccionView() {
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
            <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border shadow-sm">
                <button onClick={()=>setSub('ins')} className={`px-6 py-2 rounded-xl font-black text-xs ${sub==='ins'?'bg-blue-600 text-white':'text-slate-400'}`}>INSUMOS</button>
                <button onClick={()=>setSub('rec')} className={`px-6 py-2 rounded-xl font-black text-xs ${sub==='rec'?'bg-blue-600 text-white':'text-slate-400'}`}>RECETAS / KITS</button>
            </div>
            {sub === 'ins' && (
                <div className="grid grid-cols-3 gap-8">
                    <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/produccion/materia', formM); alert("Insumo Guardado"); setFormM({nombre:'',unidad_medida:'mg',cantidad:'',costo:''}); load(); }} className="bg-white p-10 rounded-[40px] border space-y-4 h-fit shadow-sm">
                        <h3 className="font-black italic">Nuevo Insumo</h3>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Nombre" value={formM.nombre} onChange={e=>setFormM({...formM, nombre:e.target.value})} />
                        <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida:e.target.value})}>
                            <option value="mg">mg</option><option value="ml">ml</option><option value="unidades">unidades</option>
                        </select>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Stock" type="number" value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad:e.target.value})} />
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Costo" type="number" value={formM.costo} onChange={e=>setFormM({...formM, costo:e.target.value})} />
                        <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black shadow-lg">GUARDAR MATERIA</button>
                    </form>
                    <div className="col-span-2">
                         <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr className="border-b"><th className="p-8">Insumo</th><th>Stock</th><th>Unidad</th><th>Costo</th></tr></thead>
                                <tbody>{materia.map(m=>(<tr key={m.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 font-black text-slate-700">{m.nombre}</td><td>{m.cantidad}</td><td>{m.unidad_medida}</td><td>{fmt(m.costo)}</td></tr>))}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            {sub === 'rec' && (
                <div className="grid grid-cols-2 gap-8">
                    <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/produccion/recetas', formR); alert("Kit Creado"); setFormR({nombre_producto_final:'',descripcion:''}); load(); }} className="bg-white p-10 rounded-[40px] border space-y-4 shadow-sm h-fit">
                        <h3 className="font-black italic">Nueva Receta Maestra</h3>
                        <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Nombre Kit Final" value={formR.nombre_producto_final} onChange={e=>setFormR({...formR, nombre_producto_final:e.target.value})} />
                        <textarea className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Instrucciones" value={formR.descripcion} onChange={e=>setFormR({...formR, descripcion:e.target.value})} />
                        <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black uppercase text-xs">Crear Kit Maestro</button>
                    </form>
                    <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr className="border-b"><th className="p-8">Kit / Medicamento</th><th>Detalles</th></tr></thead>
                            <tbody>{kits.map(r=>(<tr key={r.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 font-black text-slate-700">{r.nombre_producto_final}</td><td className="p-8 text-xs">{r.descripcion}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function NominaView() {
    const [emps, setEmps] = useState([]);
    const [form, setForm] = useState({ nombre: '', documento: '', salario: '', eps: '', arl: '', pension: '' });
    const load = useCallback(() => axios.get('/empleados').then(res => setEmps(res.data)), []);
    useEffect(() => { load(); }, [load]);

    const handleNomina = async (e) => {
        e.preventDefault();
        await axios.post('/empleados', form);
        alert("Funcionario Vinculado"); setForm({nombre:'',documento:'',salario:'',eps:'',arl:'',pension:''}); load();
    };

    return (
        <div className="space-y-10">
            <form onSubmit={handleNomina} className="bg-white p-12 rounded-[50px] border shadow-sm grid grid-cols-3 gap-6">
                <h3 className="col-span-3 text-xl font-black italic">Vincular Funcionario</h3>
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Cédula" value={form.documento} onChange={e=>setForm({...form, documento:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Salario" type="number" value={form.salario} onChange={e=>setForm({...form, salario:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="EPS" value={form.eps} onChange={e=>setForm({...form, eps:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="ARL" value={form.arl} onChange={e=>setForm({...form, arl:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Pensión" value={form.pension} onChange={e=>setForm({...form, pension:e.target.value})} />
                <button type="submit" className="col-span-3 bg-blue-600 text-white py-5 rounded-3xl font-black uppercase text-xs">VINCULAR AHORA</button>
            </form>
            <div className="grid grid-cols-2 gap-6">
                {emps.map(e => (
                    <div key={e.id} className="bg-white p-8 rounded-[40px] border flex flex-col gap-4 shadow-sm group hover:border-blue-600 transition-all">
                        <div className="flex justify-between items-center border-b pb-4">
                            <p className="font-black text-2xl text-slate-800 leading-none">{e.nombre}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase">DOC: {e.documento}</p>
                        </div>
                        <div className="flex gap-4 text-[9px] font-black text-blue-600 uppercase">
                            <span>EPS: {e.eps}</span> <span>ARL: {e.arl}</span> <span>FP: {e.pension}</span>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <p className="text-3xl font-black text-green-600">{fmt(e.salario)}</p>
                            <button onClick={()=>alert(`Liquidación de ${e.nombre} en proceso...`)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase">LIQUIDAR</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ContabilidadView() {
    const [data, setData] = useState([]);
    useEffect(() => { axios.get('/contabilidad/movimientos').then(res => setData(res.data)); }, []);
    const ingresos = data.filter(d=>d.p==='Ingreso').reduce((s,i)=>s+parseFloat(i.t || 0),0);
    const egresos = data.filter(d=>d.p==='Egreso').reduce((s,i)=>s+parseFloat(i.t || 0),0);
    return (
        <div className="space-y-10">
            <div className="grid grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[45px] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Ingresos Totales</p><h3 className="text-4xl font-black text-green-600">{fmt(ingresos)}</h3></div>
                <div className="bg-white p-10 rounded-[45px] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">Egresos Totales</p><h3 className="text-4xl font-black text-red-500">{fmt(egresos)}</h3></div>
                <div className="bg-slate-900 p-10 rounded-[45px] shadow-2xl text-white"><p className="text-[10px] font-black uppercase text-slate-500 mb-2">Balance Neto</p><h3 className="text-4xl font-black">{fmt(ingresos - egresos)}</h3></div>
            </div>
            <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-8">Fecha</th><th>Detalle</th><th>Valor</th><th>Tipo</th></tr></thead>
                    <tbody>{data.map((d, i) => (<tr key={i} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 text-xs font-bold text-slate-400">{new Date(d.f).toLocaleDateString()}</td><td className="font-black text-slate-700">{d.d}</td><td className={`font-black ${d.p==='Ingreso'?'text-green-600':'text-red-500'}`}>{fmt(d.t)}</td><td><span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${d.p==='Ingreso'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{d.p}</span></td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}

function CajaView({ user, turno, onUpdate }) {
    const [base, setBase] = useState("");
    const handleApertura = async (e) => {
        e.preventDefault();
        await axios.post('/turnos/iniciar', { base_caja: base });
        alert("Caja Abierta"); onUpdate();
    };
    return (
        <div className="bg-white p-20 rounded-[60px] border shadow-2xl max-w-xl mx-auto flex flex-col items-center mt-10">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[35px] flex items-center justify-center mb-10"><Wallet size={48}/></div>
            {turno ? (
                <div className="w-full text-center space-y-8">
                    <h3 className="text-3xl font-black italic">Turno de {user.nombre}</h3>
                    <div className="bg-slate-50 p-6 rounded-3xl border text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Efectivo en Caja</p>
                        <p className="text-4xl font-black text-blue-600">{fmt(turno.total_vendido)}</p>
                    </div>
                    <button onClick={async()=>{ await axios.put('/turnos/finalizar', {turno_id: turno.id}); onUpdate(); alert("Turno Cerrado"); }} className="w-full py-6 bg-red-500 text-white font-black rounded-3xl shadow-xl uppercase text-xs">Finalizar Turno de Hoy</button>
                </div>
            ) : (
                <form onSubmit={handleApertura} className="w-full text-center space-y-8">
                    <h3 className="text-3xl font-black italic">Apertura de Caja</h3>
                    <input type="number" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-center text-4xl border-2 outline-none focus:border-blue-500" placeholder="$ Base" value={base} onChange={e=>setBase(e.target.value)} required />
                    <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase text-xs">Abrir Caja Cloud</button>
                </form>
            )}
        </div>
    );
}

function AdminView() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ nombre: '', email: '', password: '', cargo: 'Vendedor' });
    const load = useCallback(() => axios.get('/admin/usuarios').then(res => setUsers(res.data)), []);
    useEffect(() => { load(); }, [load]);

    const handleUser = async (e) => {
        e.preventDefault();
        await axios.post('/admin/usuarios', form);
        alert("Usuario Creado"); setForm({nombre:'',email:'',password:'',cargo:'Vendedor'}); load();
    };

    return (
        <div className="space-y-12">
            <form onSubmit={handleUser} className="bg-white p-12 rounded-[50px] border flex gap-6 max-w-4xl mx-auto shadow-sm">
                <input className="p-4 bg-slate-50 rounded-2xl font-bold flex-1 border" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl font-bold flex-1 border" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
                <input className="p-4 bg-slate-50 rounded-2xl border flex-1" type="password" placeholder="Pass" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
                <button type="submit" className="bg-blue-600 text-white px-10 rounded-2xl font-black shadow-lg">GUARDAR</button>
            </form>
            <div className="bg-white rounded-[50px] border overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Funcionario</th><th>Email Acceso</th><th>Rol Asignado</th></tr></thead>
                    <tbody>{users.map(u=>(<tr key={u.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 font-black text-slate-700">{u.nombre}</td><td>{u.email}</td><td><span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase">{u.cargo}</span></td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}

// HELPERS
function CardStat({ title, value, icon, color }) {
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return <div className="bg-white p-10 rounded-[45px] border shadow-sm group hover:shadow-xl transition-all duration-300"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p><h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3></div>;
}
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
function MenuBtn({ icon, label, active, onClick }) { return <button onClick={onClick} className={`w-full flex items-center px-6 py-4 rounded-[22px] mb-2 transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-xl -translate-y-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}><span className="mr-4">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; }