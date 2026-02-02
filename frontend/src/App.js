/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, ScanBarcode, Factory, X, Plus, 
  ShieldCheck, Calculator, TrendingUp, ChevronRight
} from 'lucide-react';

axios.defaults.baseURL = window.location.origin + '/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [turno, setTurno] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const loadTurno = useCallback(() => {
    axios.get('/turnos/activo/1').then(res => setTurno(res.data)).catch(()=>setTurno(null));
  }, []);

  useEffect(() => { if(user) loadTurno(); }, [user, loadTurno]);

  if (!user) return <Login onLogin={(u) => { setUser(u); localStorage.setItem('erp_user', JSON.stringify(u)); }} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-72 bg-white border-r flex flex-col p-6">
        <h1 className="text-2xl font-black mb-10 italic">ACCUCLOUD<span className="text-blue-600">.</span></h1>
        <nav className="flex-1 space-y-2">
            <MenuBtn icon={<LayoutDashboard/>} label="Dashboard" active={tab==='dashboard'} onClick={()=>setTab('dashboard')} />
            <MenuBtn icon={<Package/>} label="Inventario" active={tab==='inventario'} onClick={()=>setTab('inventario')} />
            <MenuBtn icon={<Factory/>} label="Producción PRO" active={tab==='produccion'} onClick={()=>setTab('produccion')} />
            <MenuBtn icon={<Users/>} label="Nómina Cloud" active={tab==='nomina'} onClick={()=>setTab('nomina')} />
            <MenuBtn icon={<Calculator/>} label="Contabilidad" active={tab==='conta'} onClick={()=>setTab('conta')} />
            <MenuBtn icon={<Wallet/>} label="Caja" active={tab==='caja'} onClick={()=>setTab('caja')} />
            <MenuBtn icon={<ShieldCheck/>} label="Usuarios Admin" active={tab==='admin'} onClick={()=>setTab('admin')} />
        </nav>
        <button onClick={()=>{localStorage.clear(); window.location.reload();}} className="text-red-500 font-bold text-xs uppercase underline p-4">Cerrar Sesión</button>
      </aside>

      <main className="flex-1 overflow-auto p-10">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-800 capitalize italic">{tab}</h2>
            {turno ? <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-xs">SISTEMA ACTIVO</div> : <div className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-bold text-xs">CAJA CERRADA</div>}
        </header>

        {tab==='dashboard' && <Resumen />}
        {tab==='inventario' && <Inventario />}
        {tab==='produccion' && <Produccion />}
        {tab==='nomina' && <Nomina />}
        {tab==='conta' && <Contabilidad />}
        {tab==='caja' && <Caja turno={turno} onUpdate={loadTurno} />}
        {tab==='admin' && <Admin />}
      </main>
    </div>
  );
}

function Login({ onLogin }) {
    const handle = async (e) => {
        e.preventDefault();
        const res = await axios.post('/login', { email: e.target.e.value, password: e.target.p.value });
        if (res.data.success) onLogin(res.data.user);
        else alert("Error");
    };
    return (
        <div className="h-screen flex items-center justify-center bg-blue-600">
            <form onSubmit={handle} className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md">
                <h1 className="text-4xl font-black text-center mb-10 italic">AccuCloud.</h1>
                <input name="e" className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold border" placeholder="Email" />
                <input name="p" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 font-bold border" type="password" placeholder="Pass" />
                <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl">INGRESAR</button>
            </form>
        </div>
    );
}

function Resumen() {
    const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
    useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);
    return (
        <div className="grid grid-cols-4 gap-6">
            <CardStat title="Ventas" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
            <CardStat title="Stock" value={fmt(data.valorInventario)} icon={<Package/>} color="purple" />
            <CardStat title="Alertas" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
            <CardStat title="SaaS" value="Premium 2026" icon={<ShieldCheck/>} color="green" />
        </div>
    );
}

function Inventario() {
    const [sub, setSub] = useState('list');
    const [items, setItems] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const load = () => {
        axios.get('/productos').then(res => setItems(res.data));
        axios.get('/bodegas').then(res => setBodegas(res.data));
    };
    useEffect(() => { load(); }, []);

    const handleProd = async (e) => {
        e.preventDefault();
        const d = { nombre: e.target.n.value, sku: e.target.s.value, precio: e.target.p.value, stock: e.target.st.value, bodega_id: e.target.b.value };
        await axios.post('/productos', d);
        alert("Guardado"); setSub('list'); load();
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border shadow-sm">
                <button onClick={()=>setSub('list')} className={`px-8 py-2 rounded-xl font-black ${sub==='list'?'bg-blue-600 text-white':'text-slate-400'}`}>LISTADO</button>
                <button onClick={()=>setSub('new')} className={`px-8 py-2 rounded-xl font-black ${sub==='new'?'bg-blue-600 text-white':'text-slate-400'}`}>NUEVO</button>
                <button onClick={()=>setSub('bod')} className={`px-8 py-2 rounded-xl font-black ${sub==='bod'?'bg-blue-600 text-white':'text-slate-400'}`}>BODEGAS</button>
            </div>
            {sub === 'list' && <Table headers={['Producto','SKU','Stock','Bodega']} data={items} keys={['nombre','sku','stock','bodega_nombre']} />}
            {sub === 'new' && (
                <form onSubmit={handleProd} className="bg-white p-10 rounded-[40px] border shadow-sm max-w-lg space-y-4 mx-auto">
                    <input name="n" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Nombre" />
                    <input name="s" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="SKU" />
                    <input name="p" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Precio" type="number" />
                    <input name="st" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border" placeholder="Stock" type="number" />
                    <select name="b" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border">
                        <option value="">Bodega...</option>{bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                    <button className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl">GUARDAR</button>
                </form>
            )}
            {sub === 'bod' && (
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-[40px] border h-fit space-y-4">
                        <input className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" id="bn" placeholder="Nombre Bodega" />
                        <button onClick={async()=>{ await axios.post('/bodegas', {nombre: document.getElementById('bn').value}); load(); alert("Bodega Creada"); }} className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black">CREAR</button>
                    </div>
                    <Table headers={['Bodega']} data={bodegas} keys={['nombre']} />
                </div>
            )}
        </div>
    );
}

function Produccion() {
    const [sub, setSub] = useState('ins');
    const [materia, setMateria] = useState([]);
    const [kits, setKits] = useState([]);
    const load = () => {
        axios.get('/produccion/materia').then(res => setMateria(res.data));
        axios.get('/produccion/recetas').then(res => setKits(res.data));
    };
    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-6">
            <div className="flex gap-4 p-2 bg-white rounded-2xl w-fit border shadow-sm">
                <button onClick={()=>setSub('ins')} className={`px-6 py-2 rounded-xl font-black ${sub==='ins'?'bg-blue-600 text-white':'text-slate-400'}`}>INSUMOS</button>
                <button onClick={()=>setSub('rec')} className={`px-6 py-2 rounded-xl font-black ${sub==='rec'?'bg-blue-600 text-white':'text-slate-400'}`}>RECETAS</button>
            </div>
            {sub === 'ins' && (
                <div className="grid grid-cols-3 gap-8">
                    <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/produccion/materia', {nombre:e.target.n.value, unidad_medida:e.target.u.value, cantidad:e.target.c.value, costo:e.target.co.value}); load(); alert("Guardado"); }} className="bg-white p-8 rounded-[40px] border space-y-4 h-fit">
                        <input name="n" className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Insumo" />
                        <select name="u" className="w-full p-4 bg-slate-50 rounded-2xl border font-bold"><option value="mg">mg</option><option value="unidades">unidades</option></select>
                        <input name="c" className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Cant" type="number" />
                        <input name="co" className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Costo" type="number" />
                        <button className="w-full bg-blue-600 text-white py-4 rounded-3xl font-black">GUARDAR</button>
                    </form>
                    <div className="col-span-2"><Table headers={['Nombre','Stock','Unidad','Costo']} data={materia} keys={['nombre','cantidad','unidad_medida','costo']} /></div>
                </div>
            )}
            {sub === 'rec' && (
                <div className="grid grid-cols-2 gap-8">
                    <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/produccion/recetas', {nombre_producto_final:e.target.n.value, descripcion:e.target.d.value}); load(); alert("Receta Creada"); }} className="bg-white p-10 rounded-[40px] border space-y-4 h-fit shadow-sm">
                        <input name="n" className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Nombre Kit" />
                        <textarea name="d" className="w-full p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Instrucciones" />
                        <button className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black shadow-xl">CREAR KIT MAESTRO</button>
                    </form>
                    <Table headers={['Kit Maestro','Detalles']} data={kits} keys={['nombre_producto_final','descripcion']} />
                </div>
            )}
        </div>
    );
}

function Nomina() {
    const [emps, setEmps] = useState([]);
    const load = () => axios.get('/empleados').then(res => setEmps(res.data));
    useEffect(() => { load(); }, []);

    const handleNom = async (e) => {
        e.preventDefault();
        const d = { nombre: e.target.n.value, documento: e.target.d.value, salario: e.target.s.value, eps: e.target.e.value, arl: e.target.a.value, pension: e.target.p.value };
        await axios.post('/empleados', d);
        alert("Vinculado"); load();
    };

    return (
        <div className="space-y-10">
            <form onSubmit={handleNom} className="bg-white p-10 rounded-[50px] border shadow-sm grid grid-cols-3 gap-4">
                <input name="n" className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Nombre" />
                <input name="d" className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Doc" />
                <input name="s" className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Salario" type="number" />
                <input name="e" className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="EPS" />
                <input name="a" className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="ARL" />
                <input name="p" className="p-4 bg-slate-50 rounded-2xl border font-bold" placeholder="Pension" />
                <button className="col-span-3 bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl uppercase text-xs">VINCULAR AHORA</button>
            </form>
            <div className="grid grid-cols-2 gap-6">
                {emps.map(e => (
                    <div key={e.id} className="bg-white p-8 rounded-[40px] border flex flex-col gap-4 shadow-sm">
                        <p className="font-black text-2xl leading-none">{e.nombre}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">DOC: {e.documento} | EPS: {e.eps}</p>
                        <div className="flex justify-between items-center mt-auto border-t pt-4">
                            <p className="text-3xl font-black text-green-600 leading-none">{fmt(e.salario)}</p>
                            <button onClick={()=>alert(`Liquidando a ${e.nombre}...`)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase">Liquidar</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Contabilidad() {
    const [data, setData] = useState([]);
    useEffect(() => { axios.get('/contabilidad/movimientos').then(res => setData(res.data)); }, []);
    const ingresos = data.filter(d=>d.p==='Ingreso').reduce((s,i)=>s+parseFloat(i.t || 0),0);
    const egresos = data.filter(d=>d.p==='Egreso').reduce((s,i)=>s+parseFloat(i.t || 0),0);
    return (
        <div className="space-y-10">
            <div className="grid grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[45px] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400">Ingresos</p><h3 className="text-4xl font-black text-green-600">{fmt(ingresos)}</h3></div>
                <div className="bg-white p-10 rounded-[45px] border shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400">Egresos</p><h3 className="text-4xl font-black text-red-500">{fmt(egresos)}</h3></div>
                <div className="bg-slate-900 p-10 rounded-[45px] shadow-2xl text-white"><p className="text-[10px] font-black uppercase text-slate-500">Balance</p><h3 className="text-4xl font-black">{fmt(ingresos - egresos)}</h3></div>
            </div>
            <Table headers={['Fecha','Detalle','Valor','Tipo']} data={data} keys={['f','d','t','p']} />
        </div>
    );
}

function Caja({ turno, onUpdate }) {
    const handle = async (e) => {
        e.preventDefault();
        await axios.post('/turnos/iniciar', { base_caja: e.target.b.value });
        alert("Iniciado"); onUpdate();
    };
    return (
        <div className="bg-white p-20 rounded-[60px] border shadow-2xl max-w-xl mx-auto text-center mt-10">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[35px] flex items-center justify-center mb-10 mx-auto"><Wallet size={48}/></div>
            {turno ? (
                <button onClick={async()=>{ await axios.put('/turnos/finalizar', {turno_id: turno.id}); onUpdate(); alert("Cerrado"); }} className="w-full py-6 bg-red-500 text-white font-black rounded-3xl shadow-xl">REALIZAR CIERRE</button>
            ) : (
                <form onSubmit={handle} className="space-y-6">
                    <input name="b" type="number" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-center text-4xl border-2" placeholder="$ Base" required />
                    <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase">Abrir Caja</button>
                </form>
            )}
        </div>
    );
}

function Admin() {
    const [users, setUsers] = useState([]);
    const load = () => axios.get('/admin/usuarios').then(res => setUsers(res.data));
    useEffect(() => { load(); }, []);
    const handle = async (e) => {
        e.preventDefault();
        await axios.post('/admin/usuarios', { nombre: e.target.n.value, email: e.target.e.value, password: e.target.p.value, cargo: e.target.c.value });
        alert("Guardado"); load();
    };
    return (
        <div className="space-y-10">
            <form onSubmit={handle} className="bg-white p-12 rounded-[50px] border flex gap-4 max-w-4xl mx-auto shadow-sm">
                <input name="n" className="p-4 bg-slate-50 rounded-2xl font-bold flex-1 border" placeholder="Nombre" />
                <input name="e" className="p-4 bg-slate-50 rounded-2xl font-bold flex-1 border" placeholder="Email" />
                <input name="p" className="p-4 bg-slate-50 rounded-2xl border flex-1" type="password" placeholder="Pass" />
                <select name="c" className="p-4 bg-slate-50 rounded-2xl border font-bold"><option value="Admin">Admin</option><option value="Vendedor">Vendedor</option></select>
                <button className="bg-blue-600 text-white px-10 rounded-2xl font-black shadow-lg">GUARDAR</button>
            </form>
            <Table headers={['Nombre','Email','Rol']} data={users} keys={['nombre','email','cargo']} />
        </div>
    );
}

// --- GLOBALES ---
function Table({ headers, data, keys }) {
    return (
        <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr>{headers.map((h, i) => <th key={i} className="p-8">{h}</th>)}</tr></thead>
                <tbody>{(data || []).map((row, i) => (
                    <tr key={i} className="border-b hover:bg-slate-50 transition-all">{keys.map((k, j) => <td key={j} className="p-8 font-bold text-slate-700">{row[k] || '---'}</td>)}</tr>
                ))}</tbody>
            </table>
        </div>
    );
}
function MenuBtn({ icon, label, active, onClick }) { return <button onClick={onClick} className={`w-full flex items-center px-6 py-4 rounded-[22px] mb-2 transition-all ${active ? 'bg-blue-600 text-white shadow-xl -translate-y-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}><span className="mr-4">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; }
function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return <div className="bg-white p-10 rounded-[45px] border shadow-sm"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${c[color]}`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p><h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3></div>; 
}

const fmt_n = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);