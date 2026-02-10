/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Factory, ShieldCheck, Plus, X, Truck, CheckCircle2, CreditCard, Calculator, Settings, TrendingUp, Search, Layers, ClipboardList
} from 'lucide-react';

axios.defaults.baseURL = window.location.origin + '/api';
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('erp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

// ==========================================
//           APP CORE
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-blue-600 text-2xl uppercase">AccuCloud Pro 2026...</div>;

  if (!user) return <Login onLogin={(d) => { setUser(d.user); localStorage.setItem('erp_user', JSON.stringify(d.user)); localStorage.setItem('erp_token', d.token); }} />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden text-slate-700">
      {/* SIDEBAR */}
      <aside className="w-80 bg-slate-900 flex flex-col p-8 shadow-2xl z-20 text-white">
        <div className="mb-12"><h1 className="text-3xl font-black italic tracking-tighter text-white">ACCUCLOUD<span className="text-blue-500">.</span></h1></div>
        <nav className="flex-1 space-y-3 overflow-y-auto">
            <MenuBtn icon={<LayoutDashboard/>} label="Dashboard" active={tab==='dashboard'} onClick={()=>setTab('dashboard')} />
            <MenuBtn icon={<ShoppingCart/>} label="Ventas TPV" active={tab==='ventas'} onClick={()=>setTab('ventas')} />
            <MenuBtn icon={<Package/>} label="Inventario PRO" active={tab==='inventario'} onClick={()=>setTab('inventario')} />
            <MenuBtn icon={<Factory/>} label="Producción PRO" active={tab==='produccion'} onClick={()=>setTab('produccion')} />
            <MenuBtn icon={<Users/>} label="Nómina Cloud" active={tab==='nomina'} onClick={()=>setTab('nomina')} />
            <MenuBtn icon={<Calculator/>} label="Contabilidad" active={tab==='conta'} onClick={()=>setTab('conta')} />
            <MenuBtn icon={<Wallet/>} label="Cajas" active={tab==='caja'} onClick={()=>setTab('caja')} />
            <MenuBtn icon={<Settings/>} label="Configuración" active={tab==='config'} onClick={()=>setTab('config')} />
        </nav>
        <div className="pt-6 border-t border-slate-800 mt-6 flex flex-col gap-4">
            <div className="text-xs font-bold text-slate-500 uppercase">Sesión: {user.nombre}</div>
            <button onClick={()=>{localStorage.clear(); window.location.reload();}} className="bg-red-500/10 text-red-500 font-bold text-xs uppercase p-4 rounded-2xl w-full transition hover:bg-red-500 hover:text-white">Cerrar Sesión</button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-12 bg-slate-50">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{tab}</h2>
            <div className="bg-white shadow-sm border px-6 py-2 rounded-2xl font-black text-blue-600 text-xs">LICENCIA PREMIUM V2026</div>
        </header>

        <div className="animate-fade-in pb-20">
            {tab==='dashboard' && <DashboardView />}
            {tab==='ventas' && <VentasTPV user={user} />}
            {tab==='inventario' && <InventarioPro />}
            {tab==='produccion' && <ProduccionPro user={user} />}
            {tab==='nomina' && <NominaPro />}
            {tab==='conta' && <ContabilidadPro />}
            {tab==='caja' && <CajaPro user={user} />}
            {tab==='config' && <ConfigPro />}
        </div>
      </main>
    </div>
  );
}

// ==========================================
//           1. DASHBOARD
// ==========================================
function DashboardView() {
    const [data, setData] = useState({ cajaMayor: 0, topProducts: [], lowStock: 0 });
    useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);
    return (
        <div className="space-y-12">
            <div className="grid grid-cols-3 gap-8">
                <CardStat title="Caja Mayor (Ventas + Base)" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
                <CardStat title="Alertas Inventario" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
                <CardStat title="Estado SaaS" value="Premium 2026" icon={<ShieldCheck/>} color="green" />
            </div>
            <div className="bg-white p-12 rounded-[50px] shadow-sm border">
                <h3 className="font-black text-xl mb-8 flex items-center gap-2 text-slate-400 uppercase text-xs tracking-widest">Top Productos Más Vendidos</h3>
                <div className="space-y-4">
                    {data.topProducts.map((p, i) => (
                        <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-[30px] border border-slate-100">
                            <span className="font-black text-slate-800">{p.nombre_producto}</span>
                            <span className="bg-blue-600 text-white px-5 py-1 rounded-full font-black text-xs uppercase">{p.total} unidades</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ==========================================
//           2. VENTAS TPV
// ==========================================
function VentasTPV({ user }) {
    const [prods, setProds] = useState([]);
    const [cart, setCart] = useState([]);
    const [turno, setTurno] = useState(null);

    useEffect(() => {
        axios.get('/productos').then(res => setProds(res.data));
        axios.get('/turnos/activo/'+user.id).then(res => setTurno(res.data));
    }, [user.id]);

    const handleVenta = async () => {
        if(!turno) return alert("Caja cerrada");
        await axios.post('/ventas', { productos: cart, turno_id: turno.id });
        alert("Venta Exitosa"); setCart([]);
    };

    if(!turno) return <div className="bg-white p-20 rounded-[50px] border-4 border-dashed text-center font-black text-slate-300 text-2xl uppercase">Debe abrir turno en el módulo de Cajas</div>;

    return (
        <div className="grid grid-cols-3 gap-10">
            <div className="col-span-2 bg-white p-10 rounded-[50px] shadow-sm border min-h-[600px]">
                <div className="grid grid-cols-3 gap-6">
                    {prods.map(p => (
                        <div key={p.id} onClick={()=>setCart([...cart, {...p, cantidad:1}])} className="p-6 bg-slate-50 rounded-[35px] border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all flex flex-col justify-between">
                            <p className="font-black text-slate-800 leading-tight mb-4">{p.nombre}</p>
                            <p className="text-blue-600 font-black text-xl">{fmt(p.costo_venta)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border-t-[15px] border-blue-600 h-fit sticky top-10">
                <h3 className="text-center text-[10px] font-black uppercase text-slate-400 mb-8">Carrito Actual</h3>
                <div className="space-y-4 mb-10 max-h-60 overflow-auto">
                    {cart.map((c, i) => (<div key={i} className="flex justify-between border-b pb-2 text-sm font-bold"><span>{c.nombre}</span><span>{fmt(c.costo_venta)}</span></div>))}
                </div>
                <h2 className="text-5xl font-black text-center mb-10">{fmt(cart.reduce((s,i)=>s+i.costo_venta,0))}</h2>
                <button onClick={handleVenta} className="w-full py-7 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase text-xl">Cobrar</button>
            </div>
        </div>
    );
}

// ==========================================
//           3. INVENTARIO PRO
// ==========================================
function InventarioPro() {
    const [sub, setSub] = useState('list');
    const [items, setItems] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [fP, setFP] = useState({ sku:'', nombre:'', fecha_vencimiento:'', costo_compra:0, costo_venta:0, stock:0, min_stock:5, bodega_id:'' });

    const load = useCallback(() => {
        axios.get('/productos').then(res => setItems(res.data));
        axios.get('/bodegas').then(res => setBodegas(res.data));
    }, []);
    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-8">
            <div className="flex gap-4 p-2 bg-white rounded-3xl w-fit shadow-lg border">
                <button onClick={()=>setSub('list')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>LISTADO</button>
                <button onClick={()=>setSub('new')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='new'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>NUEVO PRODUCTO</button>
                <button onClick={()=>setSub('bod')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='bod'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>BODEGAS</button>
            </div>

            {sub==='list' && (
                <div className="bg-white rounded-[50px] border shadow-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Cod</th><th>Producto</th><th>Vencimiento</th><th>Costo Compra</th><th>Costo Venta</th><th>Stock</th><th>Utilidad</th></tr></thead>
                        <tbody>{items.map(p => {
                            const util = (((p.costo_venta - p.costo_compra) / p.costo_venta) * 100).toFixed(1);
                            return (
                                <tr key={p.id} className="border-b hover:bg-slate-50 transition">
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
                    <h3 className="text-2xl font-black italic">Nueva Ficha de Producto</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <input className="col-span-2 p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Nombre" onChange={e=>setFP({...fP, nombre:e.target.value})} required/>
                        <input className="p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="SKU" onChange={e=>setFP({...fP, sku:e.target.value})} required/>
                        <input className="p-5 bg-slate-50 rounded-3xl font-bold border-none" type="date" onChange={e=>setFP({...fP, fecha_vencimiento:e.target.value})} required/>
                        <input className="p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Compra $" type="number" onChange={e=>setFP({...fP, costo_compra:e.target.value})} required/>
                        <input className="p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Venta $" type="number" onChange={e=>setFP({...fP, costo_venta:e.target.value})} required/>
                        <input className="p-5 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Stock" type="number" onChange={e=>setFP({...fP, stock:e.target.value})} required/>
                        <select className="p-5 bg-slate-50 rounded-3xl font-black border-none" onChange={e=>setFP({...fP, bodega_id:e.target.value})}>
                            <option value="">-- Bodega --</option>{bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase">Registrar en Inventario</button>
                </form>
            )}

            {sub==='bod' && (
                <div className="grid grid-cols-2 gap-12">
                    <div className="bg-white p-12 rounded-[50px] border shadow-2xl space-y-6 h-fit text-center">
                        <h3 className="text-2xl font-black italic">Nueva Bodega</h3>
                        <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none" id="bN" placeholder="Nombre de Bodega" />
                        <textarea className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none" id="bD" placeholder="Detalles de ubicación" />
                        <button onClick={async()=>{ await axios.post('/bodegas', {nombre:document.getElementById('bN').value, detalles:document.getElementById('bD').value}); alert("Creada"); load(); }} className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl">REGISTRAR BODEGA</button>
                    </div>
                    <div className="bg-white rounded-[50px] border shadow-sm overflow-hidden h-fit">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase border-b"><tr><th className="p-8">Nombre Bodega</th><th>Detalles</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b"><td className="p-8 font-black">{b.nombre}</td><td className="p-8 text-xs">{b.detalles}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
//           4. NOMINA PRO (LIQUIDACION)
// ==========================================
function NominaPro() {
    const [emps, setEmps] = useState([]);
    const [fN, setFN] = useState({ nombre:'', documento:'', valor_dia:0, hire_date:'', eps:'', arl:'', pension:'', cargo:'Operario' });
    const load = () => axios.get('/empleados').then(res => setEmps(res.data));
    useEffect(() => { load(); }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/empleados', fN); alert("Vinculado"); load(); }} className="bg-white p-12 rounded-[50px] border shadow-2xl h-fit space-y-6">
                <h3 className="text-2xl font-black italic">Vincular Funcionario</h3>
                <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Nombre Completo" onChange={e=>setFN({...fN, nombre:e.target.value})}/>
                <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Cédula" onChange={e=>setFN({...fN, documento:e.target.value})}/>
                <div className="grid grid-cols-2 gap-4">
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none" type="number" placeholder="Valor Día" onChange={e=>setFN({...fN, valor_dia:e.target.value})}/>
                    <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none" type="date" onChange={e=>setFN({...fN, hire_date:e.target.value})}/>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <input className="p-3 bg-slate-50 rounded-xl border text-[9px] font-black uppercase" placeholder="EPS" onChange={e=>setFN({...fN, eps:e.target.value})}/>
                    <input className="p-3 bg-slate-50 rounded-xl border text-[9px] font-black uppercase" placeholder="ARL" onChange={e=>setFN({...fN, arl:e.target.value})}/>
                    <input className="p-3 bg-slate-50 rounded-xl border text-[9px] font-black uppercase" placeholder="Pension" onChange={e=>setFN({...fN, pension:e.target.value})}/>
                </div>
                <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl">VINCULAR EN NUBE</button>
            </form>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-fit">
                {emps.map(e => (
                    <div key={e.id} className="bg-white p-10 rounded-[45px] border shadow-sm flex flex-col gap-6 hover:border-blue-600 transition-all group">
                        <div className="flex justify-between items-center">
                            <div><p className="font-black text-2xl leading-none">{e.nombre}</p><p className="text-[9px] font-black text-slate-400 uppercase mt-2">DOC: {e.documento}</p></div>
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">{e.nombre?.charAt(0)}</div>
                        </div>
                        <div className="flex justify-between items-center border-t pt-6">
                            <div><p className="text-[9px] font-black text-slate-400 uppercase">Salario Diario</p><p className="text-3xl font-black text-green-600">{fmt(e.valor_dia)}</p></div>
                            <button onClick={()=>alert(`Liquidando a ${e.nombre}... Valor Mes: ${fmt(e.valor_dia * 30)}`)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg">LIQUIDAR</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==========================================
//           5. PRODUCCIÓN PRO (4 ETAPAS)
// ==========================================
function ProduccionPro({ user }) {
    const [sub, setSub] = useState('ordenes');
    const [ordenes, setOrdenes] = useState([]);
    const [recetas, setRecetas] = useState([]);
    const load = useCallback(() => {
        axios.get('/produccion/ordenes').then(res => setOrdenes(res.data));
        axios.get('/produccion/recetas').then(res => setRecetas(res.data));
    }, []);
    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-8">
            <div className="flex gap-4 p-2 bg-white rounded-3xl w-fit shadow-lg border">
                <button onClick={()=>setSub('recetas')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='recetas'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>KITS</button>
                <button onClick={()=>setSub('ordenes')} className={`px-10 py-3 rounded-2xl font-black text-xs ${sub==='ordenes'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>ÓRDENES ACTIVAS</button>
            </div>

            {sub==='recetas' && (
                <div className="bg-white p-12 rounded-[50px] border shadow-2xl">
                    <h3 className="text-2xl font-black italic mb-10 text-slate-800">Recetas Farmacéuticas</h3>
                    <div className="grid grid-cols-2 gap-10">
                        {recetas.map(r => (
                            <div key={r.id} className="p-8 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                                <p className="font-black text-2xl text-blue-600 mb-4">{r.nombre_kit}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Materia Prima Vinculada</p>
                                <div className="text-xs font-bold text-slate-500 italic">--- Lista de componentes ---</div>
                            </div>
                        ))}
                        <button onClick={async()=>{ const n = prompt("Nombre Kit?"); await axios.post('/produccion/recetas', {nombre:n, descripcion:'...'}); load(); }} className="p-10 border-4 border-dotted rounded-[40px] flex flex-col items-center justify-center text-slate-300 font-black hover:bg-slate-50 transition-all uppercase">+ Nueva Receta</button>
                    </div>
                </div>
            )}

            {sub==='ordenes' && (
                <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[50px] border shadow-2xl flex gap-8 items-end border-t-[15px] border-blue-600">
                        <div className="flex-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Medicamento</label><select id="rId" className="w-full p-5 bg-slate-50 rounded-3xl font-black border-none">{recetas.map(r=><option key={r.id} value={r.id}>{r.nombre_kit}</option>)}</select></div>
                        <div className="w-32"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Lote</label><input id="rC" type="number" className="w-full p-5 bg-slate-50 rounded-3xl font-black text-center" defaultValue="1" /></div>
                        <button onClick={async()=>{ await axios.post('/produccion/ordenes', {receta_id:document.getElementById('rId').value, cantidad:document.getElementById('rC').value}); load(); alert("Orden Montada"); }} className="bg-blue-600 text-white px-12 py-5 rounded-3xl font-black shadow-xl uppercase">Montar Órden</button>
                    </div>
                    {ordenes.map(o => (
                        <div key={o.id} className="bg-white p-10 rounded-[45px] border shadow-sm flex justify-between items-center group hover:border-blue-500 transition-all">
                            <div>
                                <h4 className="text-2xl font-black text-slate-900 italic uppercase">{o.numero_orden} - {o.nombre_kit}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Montó: {o.quien_monta} | Alistó: {o.bodeguero_alista || '...'}</p>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Requerido / Salida</p><p className="font-black text-2xl">{o.cantidad_requerida} / <span className="text-blue-600">{o.cantidad_salida}</span></p></div>
                                <span className={`px-6 py-2 rounded-2xl font-black text-[10px] uppercase border ${o.estado==='Terminada'?'bg-green-100 text-green-700 border-green-200':'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>{o.estado}</span>
                                {o.estado==='Montada' && <button onClick={async()=>{ await axios.put(`/api/produccion/ordenes/${o.id}/avanzar`, {estado:'Alistada'}); load(); }} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-xl">Alistar Materia</button>}
                                {o.estado==='Alistada' && <button onClick={async()=>{ const out = prompt("Salida?"); const obs = prompt("Obs?"); await axios.put(`/api/produccion/ordenes/${o.id}/avanzar`, {estado:'Procesada', out, obs}); load(); }} className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase">Procesar Orden</button>}
                                {o.estado==='Procesada' && <button onClick={async()=>{ await axios.put(`/api/produccion/ordenes/${o.id}/avanzar`, {estado:'Terminada'}); load(); }} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase">Recibir Terminado</button>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ==========================================
//           6. FINANZAS Y CAJA
// ==========================================
function ContabilidadPro() {
    const [data, setData] = useState([]);
    const [fP, setFP] = useState({ beneficiario:'', monto:0, descripcion:'', categoria:'Proveedor' });
    const load = () => axios.get('/pagos').then(res => setData(res.data));
    useEffect(() => { load(); }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <form onSubmit={async(e)=>{e.preventDefault(); await axios.post('/pagos', fP); alert("Gasto Guardado"); load(); e.target.reset();}} className="bg-white p-12 rounded-[50px] border shadow-2xl space-y-6 h-fit">
                <h3 className="text-2xl font-black italic">Registrar Egreso</h3>
                <select className="w-full p-5 bg-slate-50 rounded-3xl font-black border-none" onChange={e=>setFP({...fP, categoria:e.target.value})}>
                    <option value="Proveedor">Pago a Proveedor</option><option value="Gasto">Gasto Operativo</option>
                </select>
                <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold" placeholder="Beneficiario" onChange={e=>setFP({...fP, beneficiario:e.target.value})}/>
                <input className="w-full p-5 bg-slate-50 rounded-3xl font-bold" placeholder="Monto $" type="number" onChange={e=>setFP({...fP, monto:e.target.value})}/>
                <textarea className="w-full p-5 bg-slate-50 rounded-3xl font-bold" placeholder="Motivo del pago" onChange={e=>setFP({...fP, descripcion:e.target.value})}/>
                <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase">Confirmar Egreso</button>
            </form>
            <div className="lg:col-span-2 bg-white rounded-[50px] border shadow-sm overflow-hidden h-fit">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Fecha/Hora</th><th>Categoría</th><th>Beneficiario</th><th>Monto Total</th></tr></thead>
                    <tbody>{data.map(p => (
                        <tr key={p.id} className="border-b hover:bg-slate-50 transition">
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

function CajaPro({ user }) {
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
                    <div className="bg-white p-20 rounded-[60px] border shadow-2xl text-center border-t-[20px] border-blue-600 relative overflow-hidden">
                        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-inner"><Wallet size={54}/></div>
                        {activo ? (
                            <div className="space-y-8 animate-fade-in">
                                <h3 className="text-3xl font-black italic">Turno de {user.nombre}</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-8 rounded-[40px] border text-left"><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Base</p><p className="text-3xl font-black text-slate-600">{fmt(activo.base_caja)}</p></div>
                                    <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-100 text-left"><p className="text-[10px] font-black text-blue-400 uppercase mb-2">Ventas</p><p className="text-3xl font-black text-blue-600">{fmt(activo.total_vendido)}</p></div>
                                </div>
                                <button onClick={async()=>{ if(confirm("¿Cerrar?")){ await axios.put('/turnos/finalizar', {turno_id: activo.id}); load(); }}} className="w-full py-7 bg-red-500 text-white font-black rounded-3xl shadow-xl uppercase text-xs">Realizar Cierre Mayor</button>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-fade-in">
                                <h3 className="text-3xl font-black italic">Apertura de Turno</h3>
                                <input id="bC" type="number" className="w-full p-8 bg-slate-50 rounded-3xl font-black text-5xl text-center border-2 border-transparent focus:border-blue-500 outline-none" placeholder="$0" />
                                <button onClick={async()=>{ await axios.post('/turnos/iniciar', {base_caja: document.getElementById('bC').value}); load(); }} className="w-full py-7 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase text-xs">Iniciar Turno Cloud</button>
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

function ConfigPro() {
    return (
        <div className="bg-white p-20 rounded-[60px] shadow-2xl border flex flex-col items-center justify-center max-w-4xl mx-auto text-center border-l-[30px] border-blue-600">
            <Settings size={64} className="mb-8 text-blue-600 animate-spin-slow" />
            <h2 className="text-4xl font-black italic mb-6">Configuraciones de Empresa</h2>
            <div className="grid grid-cols-2 gap-6 w-full text-left">
                <div className="p-6 bg-slate-50 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Clave Maestra</p>
                    <button onClick={()=>alert("Escribe la nueva clave maestra:")} className="font-black text-blue-600 hover:underline">Cambiar Password Central</button>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Datos de Empresa</p>
                    <button onClick={()=>alert("Editar NIT y Dirección:")} className="font-black text-blue-600 hover:underline">Editar Información Fiscal</button>
                </div>
            </div>
            <p className="mt-12 text-xs font-bold text-slate-300">Versión 8.7.5 SaaS Cloud 2026</p>
        </div>
    );
}

// --- GLOBALES UI ---
function MenuBtn({ icon, label, active, onClick }) { 
    return <button onClick={onClick} className={`w-full flex items-center px-8 py-5 rounded-[28px] mb-3 transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-2xl shadow-blue-100 -translate-y-1 scale-[1.02]' : 'text-slate-400 hover:bg-white hover:shadow-lg hover:text-slate-800'}`}><span className="mr-5">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; 
}
function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p><h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3></div>; 
}

function Login({ onLogin }) {
    const handle = async (e) => {
        e.preventDefault();
        const res = await axios.post('/login', { email: e.target.e.value, password: e.target.p.value });
        if (res.data.success) onLogin(res.data); else alert("Acceso Incorrecto");
    };
    return (
        <div className="h-screen flex items-center justify-center bg-blue-600">
            <form onSubmit={handle} className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md text-center">
                <h1 className="text-4xl font-black mb-10 italic">AccuCloud.</h1>
                <input name="e" className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none mb-4" placeholder="Email" />
                <input name="p" className="w-full p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none mb-8" type="password" placeholder="Pass" />
                <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest">Ingresar</button>
            </form>
        </div>
    );
}