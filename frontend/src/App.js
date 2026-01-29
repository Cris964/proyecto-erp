/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, RefreshCcw, Menu, TrendingUp, Factory, Truck, History, Settings, ChevronRight, CreditCard, Edit3, Trash2, Save, Play, CheckCircle, MapPin, Box, Database, Receipt, Layers, Plus, Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

axios.defaults.baseURL = window.location.origin + '/api';
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPSE, setShowPSE] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-2xl uppercase italic">AccuCloud Pro 2026...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? (
        <LoginScreen onLogin={(u) => { setUser(u); localStorage.setItem('erp_user', JSON.stringify(u)); }} onBuy={()=>setShowPSE(true)} />
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={()=>{setUser(null); localStorage.removeItem('erp_user');}} />
          <main className="flex-1 overflow-auto p-10 bg-slate-50">
             <header className="flex justify-between items-center mb-10">
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">{activeTab}</h2>
                <div className="bg-white px-6 py-3 rounded-2xl border shadow-sm font-black text-[10px] uppercase text-blue-600 flex items-center gap-2">
                    <UserCircle size={16}/> {user.nombre} ({user.cargo})
                </div>
             </header>

             {activeTab === 'dashboard' && <ResumenView user={user}/>}
             {activeTab === 'ventas' && <VentasTPV user={user}/>}
             {activeTab === 'inventario' && <InventarioIndustrial user={user}/>}
             {activeTab === 'produccion' && <ProduccionIndustrial user={user}/>}
             {activeTab === 'nomina' && <NominaPRO user={user}/>}
             {activeTab === 'conta' && <ContabilidadView user={user}/>}
             {activeTab === 'admin' && <AdminUsuariosView user={user}/>}
             {activeTab === 'caja' && <CajaMasterView user={user}/>}
          </main>
        </div>
      )}
    </div>
  );
}

// --- SIDEBAR ---
function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
    const menu = [
        { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard/>, roles: ['Admin', 'Contador'] },
        { id: 'ventas', label: 'Ventas (TPV)', icon: <ShoppingCart/>, roles: ['Admin', 'Vendedor'] },
        { id: 'inventario', label: 'Bodegas e Inv.', icon: <Package/>, roles: ['Admin', 'Bodeguero'] },
        { id: 'produccion', label: 'Producción Ind.', icon: <Factory/>, roles: ['Admin', 'Prealistador', 'Produccion', 'Logistica'] },
        { id: 'nomina', label: 'Nómina PRO', icon: <Users/>, roles: ['Admin', 'Nomina'] },
        { id: 'conta', label: 'Contabilidad', icon: <Calculator/>, roles: ['Admin', 'Contador'] },
        { id: 'caja', label: 'Caja y Turno', icon: <Wallet/>, roles: ['Admin', 'Vendedor'] },
        { id: 'admin', label: 'Configuración', icon: <ShieldCheck/>, roles: ['Admin'] },
    ];
    return (
        <aside className="w-72 bg-slate-900 text-white flex flex-col p-6 shadow-2xl relative z-40">
            <h1 className="text-2xl font-black italic mb-10 text-blue-400 uppercase tracking-tighter leading-none">AccuCloud<span className="text-white">.</span></h1>
            <nav className="flex-1 space-y-2 overflow-y-auto">
                {menu.filter(m => m.roles.includes(user?.cargo)).map(m => (
                    <button key={m.id} onClick={()=>setActiveTab(m.id)} className={`w-full flex items-center p-4 rounded-[22px] transition-all ${activeTab===m.id?'bg-blue-600 text-white shadow-xl scale-105':'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                        <span className="mr-3">{m.icon}</span> <span className="font-bold text-sm tracking-tight">{m.label}</span>
                    </button>
                ))}
            </nav>
            <button onClick={onLogout} className="text-red-500 font-black text-[10px] uppercase p-4 hover:underline">Cerrar Sesión</button>
        </aside>
    );
}

// ==========================================
//      MÓDULO: NÓMINA (AGREGAR Y PAGAR)
// ==========================================
function NominaPRO({ user }) {
  const [tab, setTab] = useState('list');
  const [empleados, setEmpleados] = useState([]);
  const [form, setForm] = useState({ nombre: '', email: '', salario: '', eps: '', arl: '', pension: '' });
  const [preview, setPreview] = useState(null);

  const load = () => axios.get(`/empleados?company_id=${user.company_id}`).then(res => setEmpleados(Array.isArray(res.data) ? res.data : []));
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await axios.post('/api/empleados', { ...form, company_id: user.company_id });
    window.alert("Colaborador vinculado."); setForm({nombre:'', email:'', salario:'', eps:'', arl:'', pension:''}); setTab('list'); load();
  };

  const calcular = (emp) => {
    const sal = parseFloat(emp.salario);
    const aux = (sal <= 3501810) ? 249095 : 0; 
    const neto = (sal + aux) - (sal * 0.08);
    setPreview({ ...emp, neto, aux, sal });
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm">
            <button onClick={()=>setTab('list')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>LISTADO PERSONAL</button>
            <button onClick={()=>setTab('add')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='add'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>+ VINCULAR COLABORADOR</button>
        </div>

        {tab === 'add' && (
            <div className="bg-white p-16 rounded-[70px] shadow-sm border max-w-4xl">
                <h3 className="text-3xl font-black italic mb-10 uppercase text-slate-800 tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-8">Vinculación de Personal</h3>
                <form onSubmit={handleSave} className="grid grid-cols-2 gap-8">
                    <input className="p-6 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Nombre Completo" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                    <input className="p-6 bg-slate-50 rounded-3xl font-bold border-none" placeholder="Email (Para desprendible)" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/>
                    <input className="p-6 bg-slate-50 rounded-3xl font-bold border-none" type="number" placeholder="Salario Base" value={form.salario} onChange={e=>setForm({...form, salario:e.target.value})} required/>
                    <div className="grid grid-cols-3 gap-4">
                        <input className="p-4 bg-slate-100 rounded-2xl font-black text-xs" placeholder="EPS" onChange={e=>setForm({...form, eps:e.target.value})}/>
                        <input className="p-4 bg-slate-100 rounded-2xl font-black text-xs" placeholder="ARL" onChange={e=>setForm({...form, arl:e.target.value})}/>
                        <input className="p-4 bg-slate-100 rounded-2xl font-black text-xs" placeholder="PENSIÓN" onChange={e=>setForm({...form, pension:e.target.value})}/>
                    </div>
                    <button className="col-span-2 py-8 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase tracking-widest active:scale-95 transition-all">REGISTRAR Y HABILITAR NÓMINA</button>
                </form>
            </div>
        )}

        {tab === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white rounded-[50px] shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b"><tr><th className="p-10">Colaborador</th><th>Salario</th><th className="text-center">Acción</th></tr></thead>
                        <tbody>{empleados.map(e=>(
                            <tr key={e.id} className="border-b">
                                <td className="p-10 font-black text-slate-800 text-lg uppercase italic">{e.nombre} <br/><span className="text-xs text-blue-500 lowercase">{e.email}</span></td>
                                <td className="font-black text-slate-600">{fmt(e.salario)}</td>
                                <td className="text-center"><button onClick={()=>calcular(e)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Calculator/></button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
                {preview && (
                    <div className="bg-white p-12 rounded-[60px] shadow-2xl border-l-[20px] border-blue-600 animate-slide-up">
                        <h4 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-6">{preview.nombre}</h4>
                        <div className="space-y-4 border-y py-8 font-bold text-slate-500 uppercase text-xs">
                            <div className="flex justify-between"><span>Sueldo Base:</span><span>{fmt(preview.sal)}</span></div>
                            <div className="flex justify-between text-green-600"><span>(+) Auxilio Transporte:</span><span>{fmt(preview.aux)}</span></div>
                            <div className="flex justify-between text-red-500"><span>(-) Deducciones Ley (8%):</span><span>-{fmt(preview.sal * 0.08)}</span></div>
                        </div>
                        <div className="bg-blue-600 p-12 rounded-[45px] text-center text-7xl font-black text-white shadow-xl mt-10">
                            {fmt(preview.neto)}
                        </div>
                        <button onClick={async ()=>{if(window.confirm("¿Enviar correo de pago?")){await axios.post('/api/nomina/liquidar', preview); window.alert("¡Enviado!");}}} className="w-full py-8 bg-slate-900 text-white font-black rounded-[30px] shadow-xl mt-10 uppercase text-xs">ENVIAR COMPROBANTE POR CORREO</button>
                    </div>
                )}
            </div>
        )}
    </div>
  );
}

// ==========================================
//      MÓDULO: PRODUCCIÓN (KITS Y ORDENES)
// ==========================================
function ProduccionIndustrial({ user }) {
    const [sub, setSub] = useState('materia');
    const [materias, setMaterias] = useState([]);
    const [ordenes, setOrdenes] = useState([]);
    const [numOrden, setNumOrden] = useState('0001');
    const [formM, setFormM] = useState({ nombre: '', unidad_medida: 'mg', cantidad: 0, costo: 0 });

    const load = async () => {
        const resM = await axios.get(`/produccion/materia?company_id=${user.company_id}`);
        const resO = await axios.get(`/produccion/ordenes?company_id=${user.company_id}`);
        const resN = await axios.get(`/produccion/siguiente-numero?company_id=${user.company_id}`);
        setMaterias(resM.data);
        setOrdenes(resO.data);
        setNumOrden(resN.data.numero);
    };
    useEffect(() => { load(); }, [sub]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm overflow-x-auto">
                <button onClick={()=>setSub('materia')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='materia'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>1. STOCK INSUMOS</button>
                <button onClick={()=>setSub('kits')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='kits'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>2. CREACIÓN DE KITS</button>
                <button onClick={()=>setSub('ordenes')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='ordenes'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>3. ÓRDENES (OP-{numOrden})</button>
                <button onClick={()=>setSub('logistica')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='logistica'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>4. LOGÍSTICA</button>
            </div>

            {sub === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="bg-white p-10 rounded-[50px] shadow-sm border h-fit">
                        <h3 className="font-black text-xl mb-6 italic uppercase flex items-center gap-3"><Database className="text-blue-600"/> Entrada de Materia</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/api/produccion/materia', {...formM, company_id: user.company_id}); setFormM({nombre:'', unidad_medida:'mg', cantidad:0, costo:0}); load();}} className="space-y-5">
                            <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Nombre Químico" value={formM.nombre} onChange={e=>setFormM({...formM, nombre: e.target.value})} required/>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="p-4 bg-slate-50 rounded-2xl font-black" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida: e.target.value})}>
                                    <option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option><option value="unidades">uds</option>
                                </select>
                                <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none" type="number" placeholder="Cantidad" value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad: e.target.value})} required/>
                            </div>
                            <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Costo por unidad" type="number" value={formM.costo} onChange={e=>setFormM({...formM, costo: e.target.value})} required/>
                            <button className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl">GUARDAR EN STOCK TÉCNICO</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[50px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase border-b text-slate-400"><tr><th className="p-10">Materia Prima</th><th>Stock Disponible</th><th>Costo unit.</th><th className="p-10 text-right">Valorizado</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b hover:bg-slate-50 transition"><td className="p-10 font-black text-slate-800 uppercase italic tracking-tighter text-xl">{m.nombre}</td><td className="font-bold text-blue-600 text-lg">{m.cantidad} {m.unidad_medida}</td><td>{fmt(m.costo)}</td><td className="p-10 text-right font-black text-slate-900 text-xl">{fmt(m.cantidad * m.costo)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {sub === 'kits' && (
                <div className="bg-slate-900 p-20 rounded-[80px] shadow-2xl relative overflow-hidden text-white animate-slide-up">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-45 scale-150"><Layers size={300}/></div>
                    <div className="max-w-2xl relative z-10">
                        <h3 className="text-5xl font-black italic uppercase tracking-tighter text-blue-400 mb-6">Armado de Kits Dinámicos</h3>
                        <p className="text-slate-400 font-bold mb-12 text-lg italic">Selecciona múltiples productos para generar un combo con SKU especial.</p>
                        <form className="space-y-6">
                            <input className="w-full p-6 bg-slate-800 rounded-3xl font-bold border-none" placeholder="Nombre del Combo Permanente"/>
                            <div className="p-8 bg-slate-800/50 rounded-3xl border border-slate-700">
                                <p className="text-[11px] font-black text-slate-500 uppercase mb-4 tracking-widest">Insumos Vinculados al Kit</p>
                                <select className="w-full bg-transparent font-black text-xl text-blue-400 outline-none">
                                    <option>-- Seleccionar Ítem del Inventario --</option>
                                    {materias.map(m=><option key={m.id}>{m.nombre}</option>)}
                                </select>
                            </div>
                            <button className="px-16 py-6 bg-blue-600 rounded-[35px] font-black shadow-xl uppercase text-xs">+ Crear Kit de Venta</button>
                        </form>
                    </div>
                </div>
            )}

            {sub === 'ordenes' && (
                <div className="space-y-10">
                    <div className="bg-blue-600 p-16 rounded-[80px] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 p-10 opacity-10 rotate-45 scale-150"><Factory size={300}/></div>
                        <div className="relative z-10 text-center md:text-left">
                            <p className="text-[12px] font-black uppercase tracking-[6px] mb-4 opacity-70">Sistema de Batch Control</p>
                            <h3 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-4">OP-{numOrden}</h3>
                        </div>
                        <button onClick={async ()=>{ 
                            const n = window.prompt("Nombre del Producto a Fabricar:"); 
                            if(n){ await axios.post('/api/produccion/ordenes', {numero_orden: numOrden, nombre_producto: n, cantidad: 10, company_id: user.company_id}); load(); } 
                        }} className="relative z-10 px-16 py-7 bg-white text-blue-600 font-black rounded-[40px] shadow-2xl hover:scale-110 transition-all uppercase text-sm tracking-widest active:scale-95">+ Lanzar Orden OP</button>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                        {ordenes.filter(o => ['Prealistamiento', 'Produccion'].includes(o.estado)).map(o => (
                            <div key={o.id} className="bg-white p-12 rounded-[70px] shadow-md border-l-[30px] border-blue-500 flex flex-col lg:flex-row justify-between items-center transition-all hover:shadow-2xl">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[5px] mb-3">LOTE ID: {o.numero_orden}</p>
                                    <h4 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic mb-4">{o.nombre_producto}</h4>
                                    <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${o.estado==='Produccion'?'bg-orange-100 text-orange-600':'bg-blue-100 text-blue-600'}`}>{o.estado}</span>
                                </div>
                                <div className="flex gap-6 mt-10 lg:mt-0">
                                    {o.estado === 'Prealistamiento' && <button onClick={async ()=>{ await axios.put(`/api/produccion/ordenes/${o.id}`, {estado: 'Produccion'}); load(); }} className="flex items-center gap-4 px-12 py-6 bg-slate-900 text-white font-black rounded-[35px] shadow-2xl uppercase text-xs"><Play size={24}/> Iniciar Etapa</button>}
                                    {o.estado === 'Produccion' && <button onClick={async ()=>{ await axios.put(`/api/produccion/ordenes/${o.id}`, {estado: 'Logistica'}); load(); }} className="flex items-center gap-4 px-12 py-6 bg-green-600 text-white font-black rounded-[35px] shadow-2xl uppercase text-xs"><CheckCircle size={24}/> Finalizar y Sellar</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: INVENTARIO ( MANUAL Y EXCEL )
// ==========================================
function InventarioIndustrial({ user }) {
    const [tab, setTab] = useState('list');
    const [productos, setProductos] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [form, setForm] = useState({ nombre: '', sku: '', precio: '', stock: '', bodega_id: '' });

    const load = () => {
        axios.get(`/productos?company_id=${user.company_id}`).then(res => setProductos(Array.isArray(res.data) ? res.data : []));
        axios.get(`/bodegas?company_id=${user.company_id}`).then(res => setBodegas(Array.isArray(res.data) ? res.data : []));
    };
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        await axios.post('/api/productos', { ...form, company_id: user.company_id });
        setForm({nombre:'', sku:'', precio:'', stock:'', bodega_id:''}); setTab('list'); load();
        window.alert("¡Producto vinculado!");
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            await axios.post('/api/productos/importar', { productos: data, company_id: user.company_id });
            load(); window.alert("Importación de Excel finalizada.");
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm">
                <button onClick={()=>setTab('list')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>VER STOCK</button>
                <button onClick={()=>setTab('new')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='new'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>CREACIÓN MANUAL</button>
                <button onClick={()=>setTab('bodegas')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='bodegas'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>BODEGAS</button>
                <label className="bg-green-600 text-white px-10 py-3 rounded-2xl font-black text-[10px] cursor-pointer flex items-center gap-2 hover:bg-green-700 shadow-xl transition-all">
                    <Upload size={14}/> EXCEL <input type="file" className="hidden" onChange={handleImportExcel} accept=".xlsx, .xls"/>
                </label>
            </div>

            {tab === 'new' && (
                <div className="bg-white p-16 rounded-[70px] shadow-sm border max-w-4xl animate-slide-up">
                    <h3 className="text-3xl font-black italic mb-10 uppercase tracking-tighter text-slate-800">Ficha Técnica de Nuevo Producto</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-2 gap-8">
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nombre Comercial</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Lote / SKU</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Precio Venta Público</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50" type="number" value={form.precio} onChange={e=>setForm({...form, precio:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Cant. Inicial</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} required/></div>
                        <select className="col-span-2 p-6 bg-slate-50 rounded-3xl font-black outline-none focus:ring-4 ring-blue-50" onChange={e=>setForm({...form, bodega_id: e.target.value})} required>
                            <option value="">-- Seleccionar Bodega de Destino --</option>
                            {bodegas.map(b=><option key={b.id} value={b.id}>{b.nombre}</option>)}
                        </select>
                        <button className="col-span-2 py-8 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase tracking-widest active:scale-95 transition-all">Sincronizar al Inventario</button>
                    </form>
                </div>
            )}

            {tab === 'bodegas' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white p-12 rounded-[60px] shadow-sm border h-fit">
                        <h3 className="font-black text-2xl mb-8 uppercase italic tracking-tighter">Gestionar Bodegas</h3>
                        <div className="flex gap-4">
                            <input className="flex-1 p-5 bg-slate-50 rounded-3xl font-bold border-none outline-none" placeholder="Nombre Zona (Ej: Almacén Norte)" id="nbn"/>
                            <button onClick={async ()=>{ const n=document.getElementById('nbn').value; await axios.post('/api/bodegas', {nombre: n, company_id: user.company_id}); load(); }} className="bg-blue-600 text-white px-10 rounded-3xl font-black shadow-xl">AÑADIR</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-[50px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase"><tr><th className="p-8">Zona Registrada</th><th className="text-right p-8">Opción</th></tr></thead>
                            <tbody>{bodegas.map(b=>(<tr key={b.id} className="border-b"><td className="p-8 font-black uppercase italic tracking-tighter text-xl text-slate-800">{b.nombre}</td><td className="text-right p-8 text-red-500 font-bold cursor-pointer">ELIMINAR</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'list' && (
                <div className="bg-white rounded-[60px] shadow-sm border overflow-hidden pr-2">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase border-b text-slate-400 tracking-widest"><tr><th className="p-10">Descripción Item</th><th>Batch ID</th><th>Bodega</th><th>Existencias</th><th className="text-center">Operación</th></tr></thead>
                        <tbody>{productos.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition">
                                <td className="p-10 font-black text-slate-800 text-2xl tracking-tighter uppercase italic">{p.nombre}</td>
                                <td className="font-bold text-blue-500">{p.sku}</td>
                                <td className="text-xs font-black uppercase">{bodegas.find(b=>b.id===p.bodega_id)?.nombre || 'Gral'}</td>
                                <td className="font-black text-4xl leading-none scale-x-90 origin-left">{p.stock}</td>
                                <td className="text-center p-10"><button className="p-5 bg-slate-50 text-slate-400 rounded-[25px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={24}/></button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: VENTAS TPV (DISEÑO TOTAL)
// ==========================================
function VentasTPV({ user, turnoActivo }) {
    const [cart, setCart] = useState([]);
    const [prods, setProds] = useState([]);
    const [search, setSearch] = useState('');

    const load = () => axios.get(`/api/productos?company_id=${user.company_id}`).then(res => setProds(Array.isArray(res.data) ? res.data : []));
    useEffect(() => { load(); }, []);

    if(!turnoActivo) return <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-[90px] border-4 border-dashed border-slate-100 opacity-20 italic">Caja Bloqueada</div>;

    const total = cart.reduce((acc, x) => acc + (x.precio * x.cant), 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 h-[750px] animate-fade-in">
            <div className="lg:col-span-2 bg-white rounded-[70px] shadow-sm border border-slate-100 p-12 flex flex-col">
                <div className="flex items-center bg-slate-100 p-10 rounded-[50px] focus-within:ring-8 ring-blue-50 transition-all shadow-inner">
                    <ScanBarcode className="mr-8 text-slate-400" size={40}/>
                    <input className="bg-transparent border-none outline-none font-black text-3xl w-full text-slate-800" placeholder="BUSCAR O ESCANEAR..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus/>
                </div>
                <div className="flex-1 mt-12 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-6">
                    {prods.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase())).map(p=>(
                        <div key={p.id} onClick={()=>{const ex=cart.find(x=>x.id===p.id); if(ex)setCart(cart.map(x=>x.id===p.id?{...x,cant:x.cant+1}:x)); else setCart([...cart,{...p,cant:1}])}} className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 hover:border-blue-500 hover:scale-105 cursor-pointer transition-all flex flex-col justify-between group shadow-sm">
                            <p className="font-black text-slate-800 uppercase text-sm group-hover:text-blue-600">{p.nombre}</p>
                            <p className="font-black text-blue-600 text-2xl tracking-tighter mt-4">{fmt(p.precio)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-slate-900 rounded-[70px] shadow-2xl p-12 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-45 scale-150"><DollarSign size={250}/></div>
                <div className="relative z-10 flex-1 overflow-y-auto pr-2">
                    <h3 className="text-4xl font-black italic uppercase text-blue-400 mb-12 underline decoration-white decoration-4 underline-offset-8">Ticket Actual</h3>
                    <div className="space-y-6">
                        {cart.map(x=>(
                            <div key={x.id} className="flex justify-between items-center font-bold border-b border-slate-800 pb-4">
                                <div className="flex flex-col"><span className="text-lg uppercase tracking-tighter italic">{x.nombre.substring(0,14)}</span><span className="text-blue-400 text-[10px] font-black uppercase">Cant: {x.cant}</span></div>
                                <div className="flex items-center gap-4"><span className="text-2xl tracking-tighter">{fmt(x.precio * x.cant)}</span><button onClick={()=>setCart(cart.filter(it=>it.id!==x.id))} className="p-2 text-red-500"><X size={18}/></button></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative z-10 mt-10">
                    <p className="text-[12px] font-black uppercase tracking-[6px] text-slate-500 mb-2">Total Orden</p>
                    <div className="text-9xl font-black tracking-tighter mb-12 text-white scale-x-90 origin-left">{fmt(total)}</div>
                    <button onClick={async ()=>{
                        await axios.post('/api/ventas', {productos: cart, responsable: user.nombre, turno_id: turnoActivo.id, company_id: user.company_id});
                        setCart([]); window.alert("Venta registrada."); load();
                    }} className="w-full py-10 bg-blue-600 text-white font-black rounded-[40px] shadow-xl uppercase tracking-widest active:scale-95 transition-all">Cobrar Ticket</button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: CONTABILIDAD (LIBROS REALES)
// ==========================================
function ContabilidadView({ user }) {
    const [datos, setDatos] = useState([]);
    useEffect(() => { axios.get(`/api/contabilidad/ventas?company_id=${user.company_id}`).then(res => setDatos(Array.isArray(res.data) ? res.data : [])); }, []);
    return (
        <div className="bg-white p-16 rounded-[80px] shadow-sm border border-slate-100 overflow-hidden pr-2 animate-fade-in">
            <h3 className="font-black text-3xl mb-12 italic text-blue-600 uppercase tracking-tighter flex items-center gap-5 underline decoration-blue-100 decoration-8 underline-offset-8"><Receipt size={40}/> Libro de Ventas TPV</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50 text-[11px] font-black uppercase border-b tracking-[5px] text-slate-400"><tr><th className="p-10">Fecha / Hora</th><th>Responsable de Caja</th><th>Detalle Operación</th><th className="text-right p-10">Total Recibido</th></tr></thead>
                    <tbody>{datos.map(d=>(<tr key={d.id} className="border-b hover:bg-slate-50 transition-all">
                        <td className="p-10 text-sm font-bold text-slate-500">{new Date(d.fecha).toLocaleString()}</td>
                        <td className="font-black text-blue-600 uppercase text-xs tracking-[2px]">{d.responsable}</td>
                        <td className="font-black text-slate-800 text-lg tracking-tight italic">Comprobante de Venta TPV #{d.id}</td>
                        <td className="p-10 text-right font-black text-slate-900 text-3xl tracking-tighter">{fmt(d.total)}</td>
                    </tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}

// --- LOGIN, RESUMEN, CAJA Y HELPERS... (IGUALES A LOS ANTERIORES) ---
function CajaMasterView({ user, turnoActivo, onUpdate }) {
    const handleApertura = async () => {
        const pass = window.prompt("SEGURIDAD: Introduce la CLAVE MAESTRA:");
        if (!pass) return;
        try {
            const resV = await axios.post('/api/turnos/verificar-maestra', { company_id: user.company_id, password: pass });
            if (resV.data.success) {
                const base = window.prompt("¿Valor base inicial?", "0");
                await axios.post('/api/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id });
                onUpdate();
            } else { window.alert("❌ Clave incorrecta."); }
        } catch (e) { window.alert("Error de seguridad."); }
    };
    return <div className="bg-white p-24 rounded-[90px] shadow-2xl text-center max-w-2xl mx-auto border-t-[30px] border-blue-600 animate-slide-up relative overflow-hidden">
        {turnoActivo ? (
            <div className="space-y-12">
                <div className="p-16 bg-slate-50 rounded-[60px] border-2 border-dashed border-slate-200">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[8px] mb-4">Ventas Hoy</p>
                    <h2 className="text-9xl font-black text-green-600 tracking-tighter leading-none">{fmt(turnoActivo.total_vendido)}</h2>
                </div>
                <button onClick={async ()=>{ if(window.confirm("¿Cerrar turno?")){ await axios.put('/api/turnos/finalizar', { turno_id: turnoActivo.id }); onUpdate(); } }} className="w-full py-10 bg-red-500 text-white font-black rounded-[40px] shadow-xl uppercase text-sm">Cerrar Turno</button>
            </div>
        ) : (
            <button onClick={handleApertura} className="w-full py-10 bg-blue-600 text-white font-black rounded-[40px] shadow-2xl animate-bounce uppercase text-xs tracking-[5px]">Aperturar con Clave Maestra</button>
        )}
    </div>;
}

function ResumenView({ user }) {
  const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
  useEffect(() => { axios.get(`/api/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); }, [user]);
  const chartData = [{ name: 'L', v: 400 }, { name: 'M', v: 300 }, { name: 'M', v: 600 }, { name: 'J', v: 800 }, { name: 'V', v: 500 }, { name: 'S', v: 900 }, { name: 'D', v: 200 }];
  return <div className="space-y-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <CardStat title="Ventas Totales" value={fmt(data.cajaMayor)} color="blue" icon={<TrendingUp size={32}/>}/>
          <CardStat title="Bodega Valorada" value={fmt(data.valorInventario)} color="purple" icon={<Box size={32}/>}/>
          <CardStat title="Alertas Stock" value={data.lowStock} color="red" icon={<AlertTriangle size={32}/>}/>
      </div>
      <div className="bg-white p-20 rounded-[80px] shadow-sm border h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9"/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 16, fontWeight: '900', fill: '#94a3b8'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '35px', border: 'none', boxShadow: '0 35px 60px -15px rgb(0 0 0 / 0.3)'}} />
                  <Bar dataKey="v" radius={[25, 25, 0, 0]} fill="#2563eb" />
              </BarChart>
          </ResponsiveContainer>
      </div>
  </div>;
}

function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50 shadow-green-200", blue: "text-blue-600 bg-blue-50 shadow-blue-200", purple: "text-purple-600 bg-purple-50 shadow-purple-200", red: "text-red-600 bg-red-50 shadow-red-200" };
    return <div className="bg-white p-16 rounded-[70px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-5 transition-all duration-1000 group">
        <div className={`w-24 h-24 rounded-[40px] flex items-center justify-center mb-12 shadow-2xl group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div>
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[6px] mb-4 leading-none">{title}</p>
        <h3 className="text-5xl font-black text-slate-800 tracking-tighter italic">{value}</h3>
    </div>; 
}

function PSEPage() { return <div className="h-screen bg-slate-900 text-white flex items-center justify-center text-8xl font-black uppercase italic tracking-widest text-center px-20">Pasarela Bancaria PSE $600.000 COP</div>; }

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleAuth = async (e) => {
    e.preventDefault();
    const res = await axios.post('/api/login', { email, password });
    if (res.data.success) onLogin(res.data.user);
    else window.alert('Credenciales no válidas.');
  };
  return <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4 relative">
    <div className="bg-white p-20 rounded-[90px] shadow-2xl w-full max-w-lg border-t-[15px] border-slate-900 animate-slide-up">
      <h1 className="text-6xl font-black text-center text-slate-800 mb-4 tracking-tighter italic uppercase leading-none">AccuCloud<span className="text-blue-600">.</span></h1>
      <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[8px] mb-16 italic">Enterprise Management System</p>
      <form onSubmit={handleAuth} className="space-y-8">
        <input className="w-full p-7 bg-slate-100 rounded-[40px] font-black outline-none focus:ring-8 ring-blue-50 transition-all text-lg tracking-tighter" placeholder="Email Corporativo" onChange={e => setEmail(e.target.value)} required />
        <input type="password" class="w-full p-7 bg-slate-100 rounded-[40px] font-black outline-none focus:ring-8 ring-blue-50 transition-all text-lg tracking-tighter" placeholder="Contraseña Maestra" onChange={e => setPassword(e.target.value)} required />
        <button className="w-full bg-slate-900 text-white font-black py-8 rounded-[40px] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase text-sm mt-8 shadow-blue-900/30">Acceder al Sistema</button>
      </form>
    </div>
  </div>;
}