/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Factory, ShieldCheck, Plus, X, Truck, CheckCircle2, CreditCard, Calculator, TrendingUp, ArrowRight
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
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-blue-600">CARGANDO ACCUCLOUD PRO...</div>;

  if (!user) return <Login onLogin={(d) => { setUser(d.user); localStorage.setItem('erp_user', JSON.stringify(d.user)); localStorage.setItem('erp_token', d.token); }} />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden text-slate-700">
      <aside className="w-80 bg-white border-r flex flex-col p-8 shadow-2xl z-10">
        <div className="mb-12"><h1 className="text-3xl font-black italic tracking-tighter text-slate-900">ACCUCLOUD<span className="text-blue-600">.</span></h1></div>
        <nav className="flex-1 space-y-3 overflow-y-auto">
            <MenuBtn icon={<LayoutDashboard/>} label="Dashboard" active={tab==='dashboard'} onClick={()=>setTab('dashboard')} />
            <MenuBtn icon={<Package/>} label="Inventario PRO" active={tab==='inventario'} onClick={()=>setTab('inventario')} />
            <MenuBtn icon={<Factory/>} label="Producción PRO" active={tab==='produccion'} onClick={()=>setTab('produccion')} />
            <MenuBtn icon={<Users/>} label="Nómina Cloud" active={tab==='nomina'} onClick={()=>setTab('nomina')} />
            <MenuBtn icon={<CreditCard/>} label="Pagos y Gastos" active={tab==='pagos'} onClick={()=>setTab('pagos')} />
            <MenuBtn icon={<Wallet/>} label="Caja Mayor/Menor" active={tab==='caja'} onClick={()=>setTab('caja')} />
            <MenuBtn icon={<ShieldCheck/>} label="Usuarios Admin" active={tab==='admin'} onClick={()=>setTab('admin')} />
        </nav>
        <div className="pt-8 border-t"><button onClick={()=>{localStorage.clear(); window.location.reload();}} className="text-red-500 font-bold text-xs uppercase hover:bg-red-50 p-4 rounded-2xl w-full transition">Cerrar Sesión</button></div>
      </aside>

      <main className="flex-1 overflow-auto p-12">
        <div className="animate-fade-in pb-20">
            {tab==='dashboard' && <DashboardView />}
            {tab==='inventario' && <InventarioView />}
            {tab==='produccion' && <ProduccionView user={user} />}
            {tab==='nomina' && <NominaView />}
            {tab==='pagos' && <PagosView />}
            {tab==='caja' && <CajaView user={user} />}
            {tab==='admin' && <AdminView />}
        </div>
      </main>
    </div>
  );
}

// --- VISTAS ---

function DashboardView() {
    const [data, setData] = useState({ cajaMayor: 0, topProducts: [] });
    useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);
    return (
        <div className="space-y-12">
            <div className="grid grid-cols-3 gap-8">
                <CardStat title="Caja Mayor (Ventas + Base)" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
                <CardStat title="Licencia Premium" value="Activa 2026" icon={<ShieldCheck/>} color="green" />
                <CardStat title="PSE Pagos" value="Sincronizado" icon={<CheckCircle2/>} color="purple" />
            </div>
            <div className="bg-white p-12 rounded-[50px] shadow-sm border">
                <h3 className="font-black text-xl mb-8 flex items-center gap-2 text-slate-400 uppercase tracking-widest text-xs">Top Productos Más Vendidos</h3>
                <div className="space-y-4">
                    {data.topProducts.map((p, i) => (
                        <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-[25px] border border-slate-100 hover:scale-[1.01] transition-transform">
                            <span className="font-black text-slate-800">{p.nombre_producto}</span>
                            <span className="bg-blue-600 text-white px-5 py-1 rounded-full font-black text-xs uppercase">{p.total} unidades</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function InventarioView() {
    const [sub, setSub] = useState('list');
    const [prods, setProds] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [fP, setFP] = useState({ sku:'', nombre:'', fecha_vencimiento:'', costo_compra:0, costo_venta:0, stock:0, min_stock:5, bodega_id:'' });
    const [fB, setFB] = useState({ nombre:'', detalles:'' });

    const load = useCallback(() => {
        axios.get('/productos').then(res => setProds(res.data));
        axios.get('/bodegas').then(res => setBodegas(res.data));
    }, []);
    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-8">
            <div className="flex gap-4 p-2 bg-white rounded-[25px] w-fit shadow-lg border border-slate-100">
                <button onClick={()=>setSub('list')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>LISTADO</button>
                <button onClick={()=>setSub('new')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='new'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>NUEVO PRODUCTO</button>
                <button onClick={()=>setSub('bod')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='bod'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>BODEGAS</button>
            </div>

            {sub==='list' && (
                <div className="bg-white rounded-[50px] border shadow-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Cod</th><th>Producto</th><th>Vencimiento</th><th>Costo</th><th>Venta</th><th>Stock</th><th>Utilidad</th></tr></thead>
                        <tbody>{prods.map(p => {
                            const util = (((p.costo_venta - p.costo_compra) / p.costo_venta) * 100).toFixed(1);
                            return (
                                <tr key={p.id} className="border-b hover:bg-blue-50/30 transition">
                                    <td className="p-8 font-bold text-slate-400">#{p.sku}</td>
                                    <td className="font-black text-slate-800">{p.nombre}</td>
                                    <td className="text-red-500 font-bold">{p.fecha_vencimiento}</td>
                                    <td>{fmt(p.costo_compra)}</td>
                                    <td className="font-black text-blue-600">{fmt(p.costo_venta)}</td>
                                    <td className={`font-black ${p.stock <= p.min_stock ? 'text-red-500' : ''}`}>{p.stock}</td>
                                    <td><span className="bg-green-100 text-green-700 px-3 py-1 rounded-xl font-black">{util}%</span></td>
                                </tr>
                            )
                        })}</tbody>
                    </table>
                </div>
            )}

            {sub==='new' && (
                <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/productos', fP); alert("Guardado"); load(); setSub('list');}} className="bg-white p-12 rounded-[50px] border shadow-2xl max-w-2xl mx-auto space-y-6">
                    <h3 className="text-2xl font-black italic">Ficha Técnica de Producto</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <input className="col-span-2 p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Nombre" onChange={e=>setFP({...fP, nombre:e.target.value})}/>
                        <input className="p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="SKU" onChange={e=>setFP({...fP, sku:e.target.value})}/>
                        <input className="p-5 bg-slate-50 rounded-3xl font-bold border-none" type="date" onChange={e=>setFP({...fP, fecha_vencimiento:e.target.value})}/>
                        <input className="p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Costo Compra" type="number" onChange={e=>setFP({...fP, costo_compra:e.target.value})}/>
                        <input className="p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Precio Venta" type="number" onChange={e=>setFP({...fP, costo_venta:e.target.value})}/>
                        <input className="p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Stock" type="number" onChange={e=>setFP({...fP, stock:e.target.value})}/>
                        <select className="p-5 bg-slate-50 rounded-3xl font-black border-none" onChange={e=>setFP({...fP, bodega_id:e.target.value})}>
                            <option value="">-- Bodega --</option>{bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase">Guardar en Inventario</button>
                </form>
            )}

            {sub==='bod' && (
                <div className="grid grid-cols-2 gap-12">
                    <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/bodegas', fB); alert("Bodega Creada"); load(); setFB({nombre:'',detalles:''});}} className="bg-white p-12 rounded-[50px] border shadow-2xl space-y-6 h-fit">
                        <h3 className="text-2xl font-black italic">Nueva Bodega</h3>
                        <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Nombre" value={fB.nombre} onChange={e=>setFB({...fB, nombre:e.target.value})} required/>
                        <textarea className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Detalles de la bodega" value={fB.detalles} onChange={e=>setFB({...fB, detalles:e.target.value})} required/>
                        <button type="submit" className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-xl uppercase">Registrar Bodega</button>
                    </form>
                    <div className="bg-white rounded-[50px] border shadow-sm overflow-hidden h-fit">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Bodega</th><th>Detalles</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b"><td className="p-8 font-black">{b.nombre}</td><td className="p-8 text-xs text-slate-400">{b.detalles}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

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
        await axios.put(`/api/produccion/ordenes/${id}/avanzar`, { estado, out, obs });
        load();
        alert(`Estado actualizado: ${estado}`);
    };

    return (
        <div className="space-y-8">
            <div className="flex gap-4 p-2 bg-white rounded-3xl w-fit shadow-lg border">
                <button onClick={()=>setSub('recetas')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='recetas'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>KITS</button>
                <button onClick={()=>setSub('ordenes')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='ordenes'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>ÓRDENES</button>
            </div>

            {sub==='ordenes' && (
                <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[50px] border shadow-2xl flex gap-8 items-end border-t-[15px] border-blue-600">
                        <div className="flex-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Kit a producir</label><select id="rid" className="w-full p-5 bg-slate-50 rounded-3xl font-black border-none">{recetas.map(r=><option key={r.id} value={r.id}>{r.nombre_kit}</option>)}</select></div>
                        <div className="w-32"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Lote</label><input id="rc" type="number" className="w-full p-5 bg-slate-50 rounded-3xl font-black text-center" defaultValue="1" /></div>
                        <button onClick={async()=>{ await axios.post('/produccion/ordenes', {receta_id:document.getElementById('rid').value, cantidad:document.getElementById('rc').value}); load(); alert("Orden Montada"); }} className="bg-blue-600 text-white px-12 py-5 rounded-3xl font-black shadow-xl uppercase text-xs">Montar Órden</button>
                    </div>
                    {ordenes.map(o => (
                        <div key={o.id} className="bg-white p-10 rounded-[45px] border shadow-sm flex justify-between items-center group hover:border-blue-500 transition-all">
                            <div>
                                <h4 className="text-2xl font-black text-slate-900 italic uppercase">{o.numero_orden} - {o.nombre_kit}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Montó: {o.usuario_monta} | Alistó: {o.usuario_bodeguero_alista || '...'}</p>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Requerido / Salida</p>
                                    <p className="font-black text-2xl">{o.cantidad_requerida} / <span className="text-blue-600">{o.cantidad_salida}</span></p>
                                </div>
                                <span className={`px-6 py-2 rounded-2xl font-black text-[10px] uppercase border ${o.estado==='Terminada'?'bg-green-100 text-green-700 border-green-200':'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>{o.estado}</span>
                                {o.estado==='Montada' && <button onClick={()=>avanzar(o.id, 'Alistada')} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl">Alistar Materia</button>}
                                {o.estado==='Alistada' && <button onClick={()=>{ const out = prompt("Salida?"); const obs = prompt("Obs?"); avanzar(o.id, 'Procesada', out, obs); }} className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase">Procesar Orden</button>}
                                {o.estado==='Procesada' && <button onClick={()=>avanzar(o.id, 'Terminada')} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase">Recibir Terminado</button>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function NominaView() {
    const [emps, setEmps] = useState([]);
    const [fN, setFN] = useState({ nombre:'', documento:'', valor_dia:0, hire_date:'', eps:'', arl:'', pension:'', cargo:'Operario' });
    const load = () => axios.get('/empleados').then(res => setEmps(res.data));
    useEffect(() => { load(); }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/empleados', fN); alert("Vinculado"); load(); e.target.reset();}} className="bg-white p-12 rounded-[50px] border shadow-2xl h-fit space-y-6">
                <h3 className="text-2xl font-black italic">Vincular Funcionario</h3>
                <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Nombre" onChange={e=>setFN({...fN, nombre:e.target.value})}/>
                <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Documento" onChange={e=>setFN({...fN, documento:e.target.value})}/>
                <div className="grid grid-cols-2 gap-4">
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none" type="number" placeholder="Valor Día" onChange={e=>setFN({...fN, valor_dia:e.target.value})}/>
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none" type="date" onChange={e=>setFN({...fN, hire_date:e.target.value})}/>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <input className="p-3 bg-slate-50 rounded-xl border text-[9px] font-black uppercase" placeholder="EPS" onChange={e=>setFN({...fN, eps:e.target.value})}/>
                    <input className="p-3 bg-slate-50 rounded-xl border text-[9px] font-black uppercase" placeholder="ARL" onChange={e=>setFN({...fN, arl:e.target.value})}/>
                    <input className="p-3 bg-slate-50 rounded-xl border text-[9px] font-black uppercase" placeholder="Pension" onChange={e=>setFN({...fN, pension:e.target.value})}/>
                </div>
                <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase">Vincular en Nube</button>
            </form>
            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {emps.map(e => (
                        <div key={e.id} className="bg-white p-10 rounded-[45px] border shadow-sm flex flex-col gap-6 group hover:border-blue-600 transition-all">
                            <div className="flex justify-between items-center">
                                <p className="font-black text-2xl text-slate-800 leading-none">{e.nombre}</p>
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">{e.nombre?.charAt(0)}</div>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-5 rounded-[25px]">
                                <div><p className="text-[9px] font-black text-slate-400 uppercase">Salario Diario</p><p className="text-2xl font-black text-green-600">{fmt(e.valor_dia)}</p></div>
                                <button onClick={()=>alert(`Liquidando a ${e.nombre}... Salario Mes: ${fmt(e.valor_dia * 30)}`)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg">LIQUIDAR</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function PagosView() {
    const [data, setData] = useState([]);
    const [f, setF] = useState({ beneficiario:'', monto:0, descripcion:'', categoria:'Proveedor' });
    const load = () => axios.get('/pagos').then(res => setData(res.data));
    useEffect(() => { load(); }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/pagos', f); alert("Registrado"); load(); e.target.reset();}} className="bg-white p-12 rounded-[50px] border shadow-2xl space-y-6 h-fit">
                <h3 className="text-2xl font-black italic text-slate-800">Registrar Egreso</h3>
                <select className="w-full p-5 bg-slate-50 rounded-3xl font-black border-none" onChange={e=>setF({...f, categoria:e.target.value})}>
                    <option value="Proveedor">Proveedor</option><option value="Gasto">Gasto Operativo</option>
                </select>
                <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Beneficiario" onChange={e=>setF({...f, beneficiario:e.target.value})}/>
                <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Monto $" type="number" onChange={e=>setF({...f, monto:e.target.value})}/>
                <textarea className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Motivo" onChange={e=>setF({...f, descripcion:e.target.value})}/>
                <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase">Confirmar Pago</button>
            </form>
            <div className="lg:col-span-2 bg-white rounded-[50px] border shadow-sm overflow-hidden h-fit">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Fecha</th><th>Categoría</th><th>Beneficiario</th><th>Monto</th></tr></thead>
                    <tbody>{data.map(p => (
                        <tr key={p.id} className="border-b hover:bg-slate-50 transition-all">
                            <td className="p-8 text-[9px] font-black text-slate-400">{new Date(p.fecha).toLocaleString()}</td>
                            <td><span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${p.categoria==='Proveedor'?'bg-purple-100 text-purple-600':'bg-orange-100 text-orange-600'}`}>{p.categoria}</span></td>
                            <td className="font-black text-slate-700">{p.beneficiario}</td>
                            <td className="font-black text-red-500">{fmt(p.monto)}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}

function CajaView({ user }) {
    const [sub, setSub] = useState('menor');
    const [menor, setMenor] = useState([]);
    const [activo, setActivo] = useState(null);
    const load = useCallback(() => {
        axios.get('/caja-menor').then(res => setMenor(res.data));
        axios.get('/turnos/activo/'+user.id).then(res => setActivo(res.data)).catch(()=>setActivo(null));
    }, [user.id]);
    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-10">
            <div className="flex gap-4 p-2 bg-white rounded-[25px] w-fit shadow-lg border">
                <button onClick={()=>setSub('menor')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='menor'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>CAJA MENOR</button>
                <button onClick={()=>setSub('mayor')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='mayor'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>CAJA MAYOR</button>
            </div>

            {sub === 'mayor' ? (
                <div className="max-w-2xl mx-auto mt-10">
                    <div className="bg-white p-20 rounded-[60px] border shadow-2xl text-center border-t-[20px] border-blue-600">
                        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-inner"><Wallet size={54}/></div>
                        {activo ? (
                            <div className="space-y-8">
                                <h3 className="text-3xl font-black italic">Turno de {user.nombre}</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-8 rounded-[40px] border text-left"><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Base</p><p className="text-3xl font-black text-slate-600">{fmt(activo.base_caja)}</p></div>
                                    <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-100 text-left"><p className="text-[10px] font-black text-blue-400 uppercase mb-2">Ventas</p><p className="text-3xl font-black text-blue-600">{fmt(activo.total_vendido)}</p></div>
                                </div>
                                <button onClick={async()=>{ if(confirm("¿Cerrar?")){ await axios.put('/turnos/finalizar', {turno_id: activo.id}); load(); }}} className="w-full py-7 bg-red-500 text-white font-black rounded-3xl shadow-xl uppercase text-xs">Realizar Cierre Mayor</button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <h3 className="text-3xl font-black italic">Apertura de Turno</h3>
                                <input id="baseC" type="number" className="w-full p-8 bg-slate-50 rounded-3xl font-black text-5xl text-center border-2 border-transparent focus:border-blue-500 outline-none transition-all" placeholder="$0" />
                                <button onClick={async()=>{ await axios.post('/turnos/iniciar', {base_caja: document.getElementById('baseC').value}); load(); }} className="w-full py-7 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase text-xs">Iniciar Turno Cloud</button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/caja-menor', {tipo:e.target.t.value, tarjeta:e.target.tj.value, monto:e.target.m.value, descripcion:e.target.d.value}); alert("Registrado"); load(); e.target.reset();}} className="bg-white p-12 rounded-[50px] border shadow-2xl space-y-6 h-fit">
                        <h3 className="text-xl font-black italic">Gasto Caja Menor</h3>
                        <select name="t" className="w-full p-4 bg-slate-50 rounded-2xl font-black border-none outline-none"><option value="Efectivo">Efectivo</option><option value="Tarjeta">Tarjeta</option></select>
                        <input name="tj" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Detalle Tarjeta" />
                        <input name="m" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" type="number" placeholder="Monto $" required/>
                        <textarea name="d" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Descripción" required/>
                        <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl">GUARDAR MOVIMIENTO</button>
                    </form>
                    <div className="lg:col-span-2 bg-white rounded-[50px] border shadow-sm h-fit overflow-hidden">
                         <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Fecha</th><th>Tipo</th><th>Monto</th><th>Detalle</th><th>Descripción</th></tr></thead>
                            <tbody>{menor.map(m => (
                                <tr key={m.id} className="border-b hover:bg-slate-50 transition-all">
                                    <td className="p-8 text-[9px] font-black text-slate-400">{new Date(m.fecha).toLocaleString()}</td>
                                    <td className="font-bold text-slate-700">{m.tipo}</td>
                                    <td className="font-black text-blue-600">{fmt(m.monto)}</td>
                                    <td className="text-[9px] uppercase font-bold text-slate-400">{m.detalle_tarjeta || '---'}</td>
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

function AdminView() {
    const [users, setUsers] = useState([]);
    const load = () => axios.get('/admin/usuarios').then(res => setUsers(res.data));
    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-12">
            <div className="bg-white p-12 rounded-[50px] border shadow-sm max-w-4xl mx-auto flex justify-between items-center border-l-[20px] border-blue-600">
                <div className="flex-1 px-8"><h3 className="text-2xl font-black italic">Gestión de Accesos</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Panel Administrativo de Seguridad</p></div>
                <button onClick={async()=>{ const n = prompt("Nombre?"); const e = prompt("Email?"); const p = prompt("Pass?"); const c = prompt("Cargo?"); await axios.post('/admin/usuarios', {nombre:n, email:e, password:p, cargo:c}); load(); }} className="px-10 py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl uppercase text-[10px]">Añadir Nuevo Usuario</button>
            </div>
            <div className="bg-white rounded-[50px] border shadow-sm overflow-hidden h-fit">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Nombre</th><th>Email</th><th>Rol</th><th>Estado</th></tr></thead>
                    <tbody>{users.map(u=>(<tr key={u.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-8 font-black text-slate-700">{u.nombre}</td><td>{u.email}</td><td><span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase">{u.cargo}</span></td><td className="text-green-500 font-bold text-xs uppercase">Activo</td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}

// --- GLOBALES ---
function MenuBtn({ icon, label, active, onClick }) { 
    return <button onClick={onClick} className={`w-full flex items-center px-8 py-5 rounded-[28px] mb-3 transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-2xl shadow-blue-100 -translate-y-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}><span className="mr-5">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; 
}
function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p><h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3></div>; 
}