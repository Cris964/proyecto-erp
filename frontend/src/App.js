/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, RefreshCcw, Menu, TrendingUp, Factory, Truck, History, Settings, ChevronRight, CreditCard, Edit3, Trash2, Save, Play, CheckCircle, MapPin, Box, Database, Receipt, Layers, Plus, Search, Trash
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// CONFIGURACIÓN DE RED (Sincronizada con Vercel)
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
axios.defaults.baseURL = window.location.origin + '/api';

const fmt = (number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(number || 0);

// ==========================================
//           COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [showPSE, setShowPSE] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const savedUser = localStorage.getItem('erp_user');
    if (savedUser && savedUser !== "undefined") {
        try { 
            const parsed = JSON.parse(savedUser);
            if(parsed && parsed.id) setUser(parsed);
        } catch (e) { localStorage.removeItem('erp_user'); }
    }
    setLoadingSession(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('erp_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('erp_user');
  };

  if (loadingSession) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse text-2xl uppercase italic">AccuCloud Pro 2026 Cargando...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? (
        <LoginScreen onLogin={handleLogin} onBuy={() => setShowPSE(true)} />
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
          <main className="flex-1 overflow-auto p-4 md:p-10 relative">
             <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{activeTab}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">SISTEMA ACCUCLOUD V2.6 - 2026</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border shadow-sm font-black text-[10px] uppercase text-blue-600 flex items-center gap-2">
                    <UserCircle size={16}/> {user.nombre} ({user.cargo})
                </div>
             </header>

             <div className="animate-fade-in pb-20">
                {activeTab === 'dashboard' && <ResumenView user={user}/>}
                {activeTab === 'ventas' && <VentasTPV user={user}/>}
                {activeTab === 'inventario' && <InventarioIndustrial user={user}/>}
                {activeTab === 'produccion' && <ProduccionIndustrial user={user}/>}
                {activeTab === 'nomina' && <NominaPRO user={user}/>}
                {activeTab === 'conta' && <ContabilidadView user={user}/>}
                {activeTab === 'admin' && <AdminUsuariosView user={user}/>}
                {activeTab === 'caja' && <CajaMasterView user={user}/>}
             </div>
          </main>
        </div>
      )}
    </div>
  );
}

// ==========================================
//      MÓDULO: PRODUCCIÓN (CON KITS)
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
        setMaterias(Array.isArray(resM.data) ? resM.data : []);
        setOrdenes(Array.isArray(resO.data) ? resO.data : []);
        setNumOrden(resN.data.numero || '0001');
    };
    useEffect(() => { load(); }, [sub]);

    const handleAvanzar = async (id, estado) => {
        await axios.put(`/api/produccion/ordenes/${id}`, { estado });
        load();
    };

    const canDo = (roles) => roles.includes(user.cargo) || user.cargo === 'Admin';

    return (
        <div className="space-y-8">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm overflow-x-auto">
                {canDo(['Prealistador']) && <button onClick={()=>setSub('materia')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='materia'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>1. MATERIA PRIMA</button>}
                {canDo(['Prealistador']) && <button onClick={()=>setSub('kits')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='kits'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>2. CREACIÓN DE KITS</button>}
                {canDo(['Prealistador', 'Produccion']) && <button onClick={()=>setSub('ordenes')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='ordenes'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>3. ÓRDENES (OP)</button>}
                {canDo(['Logistica']) && <button onClick={()=>setSub('logistica')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${sub==='logistica'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>4. LOGÍSTICA</button>}
            </div>

            {sub === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="bg-white p-10 rounded-[50px] shadow-sm border h-fit">
                        <h3 className="font-black text-xl mb-6 italic uppercase text-slate-800 tracking-tighter flex items-center gap-3 underline decoration-blue-500"><Database size={24}/> Registrar Insumo</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/api/produccion/materia', {...formM, company_id: user.company_id}); setFormM({nombre:'', unidad_medida:'mg', cantidad:0, costo:0}); load();}} className="space-y-5">
                            <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-blue-500 transition-all" placeholder="Nombre (Ej: Alcohol)" value={formM.nombre} onChange={e=>setFormM({...formM, nombre: e.target.value})} required/>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="p-4 bg-slate-50 rounded-2xl font-black" value={formM.unidad_medida} onChange={e=>setFormM({...formM, unidad_medida: e.target.value})}>
                                    <option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option><option value="unidades">uds</option>
                                </select>
                                <input className="p-4 bg-slate-50 rounded-2xl font-bold border-none" type="number" placeholder="Cant." value={formM.cantidad} onChange={e=>setFormM({...formM, cantidad: e.target.value})} required/>
                            </div>
                            <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" placeholder="Costo Unitario" type="number" value={formM.costo} onChange={e=>setFormM({...formM, costo: e.target.value})} required/>
                            <button className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-black transition-all uppercase text-[10px] tracking-widest">Registrar en Almacén</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[50px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase border-b text-slate-400"><tr><th className="p-10">Insumo Técnico</th><th>Stock Técnico</th><th>Costo</th><th className="p-10 text-right">Valorizado</th></tr></thead>
                            <tbody>{materias.map(m=>(<tr key={m.id} className="border-b hover:bg-slate-50 transition"><td className="p-10 font-black text-slate-800 uppercase">{m.nombre}</td><td className="font-bold text-blue-600">{m.cantidad} {m.unidad_medida}</td><td>{fmt(m.costo)}</td><td className="p-10 text-right font-black text-slate-900">{fmt(m.cantidad * m.costo)}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {sub === 'kits' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-slate-900 p-12 rounded-[60px] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Layers size={200}/></div>
                        <h3 className="text-3xl font-black italic mb-8 uppercase tracking-tighter text-blue-400">Constructor de Kits</h3>
                        <form className="space-y-6">
                            <input className="w-full p-6 bg-slate-800 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-500 transition-all" placeholder="Nombre del Kit"/>
                            <input className="w-full p-6 bg-slate-800 rounded-3xl font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all" type="number" placeholder="Precio Kit"/>
                            <div className="p-8 bg-slate-800/50 rounded-3xl border border-slate-700">
                                <p className="text-[11px] font-black text-slate-500 uppercase mb-5 tracking-widest">Vincular Insumos/Productos</p>
                                <select className="w-full bg-transparent font-black text-lg outline-none text-blue-400 border-b border-slate-700 pb-2">
                                    <option>-- Seleccionar Ítem --</option>
                                    {materias.map(m=><option key={m.id}>{m.nombre}</option>)}
                                </select>
                            </div>
                            <button className="w-full py-8 bg-blue-600 rounded-[35px] font-black shadow-xl uppercase text-sm tracking-widest active:scale-95 transition-all">Crear Kit Final</button>
                        </form>
                    </div>
                    <div className="bg-white p-12 rounded-[70px] border-8 border-dashed border-slate-50 flex flex-col items-center justify-center text-slate-300 italic">
                        <Plus size={100} className="mb-6 opacity-20"/>
                        <p className="font-black text-3xl uppercase tracking-widest opacity-20">Preview Kit</p>
                    </div>
                </div>
            )}

            {sub === 'ordenes' && (
                <div className="space-y-8">
                    <div className="bg-blue-600 p-16 rounded-[80px] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 p-10 opacity-10 rotate-45 scale-150"><Factory size={300}/></div>
                        <div className="relative z-10 text-center md:text-left">
                            <p className="text-[12px] font-black uppercase tracking-[6px] mb-4 opacity-70">Sistema de Batch Control</p>
                            <h3 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-4">OP-{numOrden}</h3>
                        </div>
                        {canDo(['Prealistador']) && <button onClick={async ()=>{ 
                            const n = window.prompt("¿Nombre del producto a fabricar?"); 
                            if(n){ 
                                const num = window.prompt("Confirmar Número de Orden (Editable):", numOrden);
                                await axios.post('/api/produccion/ordenes', {numero_orden: num, nombre_producto: n, cantidad: 10, company_id: user.company_id}); 
                                load(); window.alert("Orden generada.");
                            } 
                        }} className="relative z-10 px-16 py-7 bg-white text-blue-600 font-black rounded-[40px] shadow-2xl hover:scale-110 transition-all uppercase text-sm tracking-widest">+ LANZAR NUEVA OP</button>}
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                        {ordenes.filter(o => ['Prealistamiento', 'Produccion'].includes(o.estado)).map(o => (
                            <div key={o.id} className="bg-white p-12 rounded-[70px] shadow-md border-l-[30px] border-blue-500 flex flex-col lg:flex-row justify-between items-center transition-all hover:shadow-2xl">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[5px] mb-3">LOTE DE PRODUCCIÓN: {o.numero_orden}</p>
                                    <h4 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic mb-4">{o.nombre_producto}</h4>
                                    <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${o.estado==='Produccion'?'bg-orange-100 text-orange-600':'bg-blue-100 text-blue-600'}`}>{o.estado}</span>
                                </div>
                                <div className="flex gap-6 mt-10 lg:mt-0">
                                    {o.estado === 'Prealistamiento' && canDo(['Prealistador']) && (
                                        <button onClick={()=>handleAvanzar(o.id, 'Produccion')} className="flex items-center gap-4 px-12 py-6 bg-slate-900 text-white font-black rounded-[35px] shadow-2xl hover:bg-black transition-all uppercase text-xs tracking-widest active:scale-95"><Play size={24}/> Iniciar Mezcla</button>
                                    )}
                                    {o.estado === 'Produccion' && canDo(['Produccion']) && (
                                        <button onClick={()=>handleAvanzar(o.id, 'Logistica')} className="flex items-center gap-4 px-12 py-6 bg-green-600 text-white font-black rounded-[35px] shadow-2xl hover:bg-green-700 transition-all uppercase text-xs tracking-widest active:scale-95"><CheckCircle size={24}/> Sellar y Finalizar</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {sub === 'logistica' && (
                <div className="bg-white rounded-[50px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest"><tr><th className="p-10">Batch #</th><th>Producto Terminado</th><th>Destino Sugerido</th><th className="text-center p-10">Operación</th></tr></thead>
                        <tbody>{ordenes.filter(o => o.estado === 'Logistica').map(o => (
                            <tr key={o.id} className="border-b">
                                <td className="p-10 font-black text-blue-600 text-lg italic">OP-{o.numero_orden}</td>
                                <td className="font-black text-slate-800 uppercase tracking-tighter text-xl">{o.nombre_producto}</td>
                                <td><div className="text-xs text-slate-400 font-bold uppercase"><MapPin size={12} className="inline mr-1"/> Por asignar guía...</div></td>
                                <td className="text-center p-10">
                                    <button onClick={async ()=>{ const d = window.prompt("Introduce Ciudad, Dirección y Transportadora:"); if(d){ await axios.put(`/api/produccion/ordenes/${o.id}`, {estado: 'Cerrado'}); load(); window.alert("¡Pedido Despachado!"); } }} className="px-10 py-4 bg-blue-600 text-white font-black rounded-3xl text-xs hover:bg-black transition-all">TERMINAR Y CERRAR</button>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: INVENTARIO (MANUAL Y EXCEL)
// ==========================================
function InventarioIndustrial({ user }) {
    const [tab, setTab] = useState('list');
    const [productos, setProductos] = useState([]);
    const [form, setForm] = useState({ nombre: '', sku: '', precio: 0, stock: 0, min_stock: 5 });

    const load = () => axios.get(`/productos?company_id=${user.company_id}`).then(res => setProductos(Array.isArray(res.data) ? res.data : []));
    useEffect(() => { load(); }, []);

    const handleSaveManual = async (e) => {
        e.preventDefault();
        await axios.post('/api/productos', {...form, company_id: user.company_id});
        setForm({nombre:'', sku:'', precio:0, stock:0, min_stock:5});
        load(); window.alert("Producto creado.");
    };

    const handleExcelImport = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            await axios.post('/api/productos/importar', { productos: data, company_id: user.company_id });
            load(); window.alert("Carga masiva finalizada.");
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-10">
            <div className="flex gap-4 p-2 bg-white border rounded-[30px] w-fit shadow-sm">
                <button onClick={()=>setTab('list')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>CONSULTAR STOCK</button>
                <button onClick={()=>setTab('new')} className={`px-10 py-3 rounded-2xl font-black text-[10px] ${tab==='new'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>CREACIÓN MANUAL</button>
                <label className="bg-green-600 text-white px-10 py-3 rounded-2xl font-black text-[10px] cursor-pointer flex items-center gap-2 hover:bg-green-700 shadow-xl transition-all">
                    <Upload size={14}/> CARGAR EXCEL <input type="file" className="hidden" onChange={handleExcelImport} accept=".xlsx, .xls"/>
                </label>
            </div>

            {tab === 'new' && (
                <div className="bg-white p-16 rounded-[70px] shadow-sm border max-w-4xl animate-slide-up">
                    <h3 className="text-3xl font-black italic mb-10 uppercase tracking-tighter text-slate-800">Ficha Técnica de Nuevo Item</h3>
                    <form onSubmit={handleSaveManual} className="grid grid-cols-2 gap-8">
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nombre Comercial</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Lote / Batch ID</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Precio Venta Público</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none" type="number" value={form.precio} onChange={e=>setForm({...form, precio:e.target.value})} required/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Cantidad Inicial</label><input className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} required/></div>
                        <button className="col-span-2 py-8 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:bg-black uppercase tracking-widest active:scale-95 transition-all">Vincular al Inventario</button>
                    </form>
                </div>
            )}

            {tab === 'list' && (
                <div className="bg-white rounded-[60px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase border-b text-slate-400 tracking-widest"><tr><th className="p-10">Descripción del Producto</th><th>Batch / SKU</th><th>Existencias</th><th>Alerta Stock</th><th className="text-center p-10">Operación</th></tr></thead>
                        <tbody>{productos.map(p => (
                            <tr key={p.id} className="border-b hover:bg-slate-50 transition">
                                <td className="p-10 font-black text-slate-800 text-xl tracking-tighter uppercase italic">{p.nombre}</td>
                                <td className="font-bold text-blue-500 text-sm">{p.sku}</td>
                                <td className="font-black text-3xl">{p.stock}</td>
                                <td><span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${p.stock <= p.min_stock ? 'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>{p.stock <= p.min_stock ? 'Crítico' : 'Suficiente'}</span></td>
                                <td className="text-center"><button className="p-5 bg-slate-50 text-slate-400 rounded-[20px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={20}/></button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ==========================================
//      MÓDULO: NÓMINA (CÁLCULOS REALES)
// ==========================================
function NominaPRO({ user }) {
  const [empleados, setEmpleados] = useState([]);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ id: '', dias: 30 });

  const load = () => axios.get(`/api/empleados?company_id=${user.company_id}`).then(res => setEmpleados(Array.isArray(res.data) ? res.data : []));
  useEffect(() => { load(); }, []);

  const calcular = () => {
    const e = empleados.find(x => x.id === parseInt(form.id));
    if(!e) return;
    const sal = parseFloat(e.salario);
    const dias = parseFloat(form.dias);
    const basico = Math.round((sal / 30) * dias);
    const aux = (sal <= 3501810) ? Math.round((249095 / 30) * dias) : 0; // Est. 2026
    const salud = Math.round(basico * 0.04);
    const pension = Math.round(basico * 0.04);
    const neto = (basico + aux) - (salud + pension);
    setPreview({ nombre: e.nombre, neto, basico, aux, salud, pension });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
      <div className="bg-white p-16 rounded-[80px] shadow-xl border border-green-100 h-fit">
        <h3 className="font-black text-4xl mb-12 text-green-800 uppercase italic tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-8">Liquidador Prestacional</h3>
        <div className="space-y-8">
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest">Colaborador</label>
            <select className="w-full p-7 bg-slate-50 rounded-[40px] font-black text-slate-700 outline-none focus:ring-8 ring-green-50 transition-all text-xl" onChange={e=>setForm({...form, id: e.target.value})}>
                <option>-- Listado de Personal --</option>
                {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest">Días Trabajados</label>
            <input type="number" className="w-full p-7 bg-slate-50 rounded-[40px] font-black outline-none focus:ring-8 ring-green-50 text-2xl" placeholder="30" value={form.dias} onChange={e=>setForm({...form, dias: e.target.value})}/></div>
            <button onClick={calcular} className="w-full py-8 bg-slate-900 text-white font-black rounded-[40px] shadow-2xl hover:bg-black transition-all uppercase text-sm tracking-[5px] mt-10">Realizar Simulación</button>
        </div>
      </div>
      <div className="bg-white p-16 rounded-[80px] shadow-2xl border-l-[25px] border-blue-600 flex flex-col justify-center">
          {preview ? (
              <div className="text-center animate-fade-in space-y-8">
                  <h4 className="text-5xl font-black uppercase tracking-tighter text-slate-800 underline decoration-blue-200 decoration-8">{preview.nombre}</h4>
                  <div className="space-y-2 font-bold text-slate-400 uppercase text-xs tracking-[2px]">
                        <p>Sueldo Básico: {fmt(preview.basico)}</p>
                        <p className="text-green-600">(+) Auxilio Transporte: {fmt(preview.aux)}</p>
                        <p className="text-red-500">(-) Deducciones Ley: {fmt(preview.salud + preview.pension)}</p>
                  </div>
                  <div className="bg-blue-600 p-16 rounded-[60px] text-8xl font-black text-white shadow-xl shadow-blue-200 tracking-tighter leading-none">{fmt(preview.neto)}</div>
                  <button className="w-full bg-slate-900 text-white font-black py-8 rounded-[40px] shadow-xl mt-16 uppercase text-sm tracking-widest active:scale-95 transition-all">Confirmar Pago en Libros</button>
              </div>
          ) : <div className="h-full flex items-center justify-center opacity-10 flex-col"><Calculator size={200}/><p className="font-black mt-10 uppercase text-5xl tracking-widest">Payroll Pro</p></div>}
      </div>
    </div>
  );
}

// ==========================================
//      MÓDULO: VENTAS TPV (REAL)
// ==========================================
function VentasTPV({ user, turnoActivo }) {
    const [cart, setCart] = useState([]);
    const [prods, setProds] = useState([]);
    const [search, setSearch] = useState('');

    const load = () => axios.get(`/api/productos?company_id=${user.company_id}`).then(res => setProds(Array.isArray(res.data) ? res.data : []));
    useEffect(() => { load(); }, []);

    if(!turnoActivo) return (
        <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-[90px] border-4 border-dashed border-slate-100 opacity-20 italic animate-pulse">
            <ShoppingCart size={150} className="mb-6"/>
            <h2 className="text-5xl font-black uppercase tracking-tighter">Caja Bloqueada</h2>
            <p className="text-xl font-bold">Abre un turno administrativo para vender</p>
        </div>
    );

    const total = cart.reduce((acc, x) => acc + (x.precio * x.cant), 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 h-[750px]">
            <div className="lg:col-span-2 bg-white rounded-[70px] shadow-sm border border-slate-100 p-12 flex flex-col">
                <div className="flex items-center bg-slate-100 p-10 rounded-[50px] focus-within:ring-8 ring-blue-50 transition-all shadow-inner">
                    <ScanBarcode className="mr-8 text-slate-400" size={40}/>
                    <input className="bg-transparent border-none outline-none font-black text-3xl w-full text-slate-800 placeholder:text-slate-300" placeholder="ESCANEA O BUSCA PRODUCTO..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus/>
                </div>
                <div className="flex-1 mt-12 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-6">
                    {prods.filter(p=>p.nombre.toLowerCase().includes(search.toLowerCase())).map(p=>(
                        <div key={p.id} onClick={()=>{const ex=cart.find(x=>x.id===p.id); if(ex)setCart(cart.map(x=>x.id===p.id?{...x,cant:x.cant+1}:x)); else setCart([...cart,{...p,cant:1}])}} className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 hover:border-blue-500 hover:scale-105 cursor-pointer transition-all flex flex-col justify-between group shadow-sm">
                            <p className="font-black text-slate-800 uppercase text-sm mb-4 leading-tight group-hover:text-blue-600 transition-colors">{p.nombre}</p>
                            <p className="font-black text-blue-600 text-2xl tracking-tighter">{fmt(p.precio)}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-slate-900 rounded-[70px] shadow-2xl p-12 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-45 scale-150"><DollarSign size={250}/></div>
                <div className="relative z-10 flex-1 overflow-y-auto pr-2">
                    <h3 className="text-4xl font-black italic uppercase text-blue-400 mb-12 underline decoration-white decoration-4 underline-offset-8 tracking-tighter">Orden Actual</h3>
                    <div className="space-y-6">
                        {cart.map(x=>(
                            <div key={x.id} className="flex justify-between items-center font-bold border-b border-slate-800 pb-4">
                                <div className="flex flex-col"><span className="text-lg uppercase tracking-tighter">{x.nombre.substring(0,12)}</span><span className="text-blue-400 text-[10px] font-black uppercase">Cant: {x.cant}</span></div>
                                <div className="flex items-center gap-4"><span className="text-xl tracking-tighter">{fmt(x.precio * x.cant)}</span><button onClick={()=>setCart(cart.filter(it=>it.id!==x.id))} className="p-2 text-red-500"><X size={16}/></button></div>
                            </div>
                        ))}
                        {cart.length === 0 && <div className="p-20 text-center opacity-20 font-black italic text-xl">CARRITO VACÍO</div>}
                    </div>
                </div>
                <div className="relative z-10 mt-10">
                    <p className="text-[12px] font-black uppercase tracking-[6px] text-slate-500 mb-2">Monto Total</p>
                    <div className="text-9xl font-black tracking-tighter mb-12 text-white scale-x-90 origin-left">{fmt(total)}</div>
                    <button onClick={async ()=>{
                        await axios.post('/api/ventas', {productos: cart, responsable: user.nombre, turno_id: 1, company_id: user.company_id});
                        setCart([]); window.alert("Venta registrada exitosamente."); load();
                    }} className="w-full py-10 bg-blue-600 text-white font-black rounded-[40px] shadow-2xl hover:bg-white hover:text-blue-600 transition-all uppercase text-sm tracking-[5px] active:scale-95 shadow-blue-900/50">Procesar Venta</button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
//      MÓDULO: ADMINISTRACIÓN (CRUD FULL)
// ==========================================
function AdminUsuariosView({ user }) {
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' });

    const load = () => axios.get(`/api/admin/usuarios?company_id=${user.company_id}`).then(res => setUsuarios(Array.isArray(res.data) ? res.data : []));
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (form.id) await axios.put(`/api/admin/usuarios/${form.id}`, form);
        else await axios.post('/api/admin/usuarios', { ...form, company_id: user.company_id });
        setForm({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' }); load();
        window.alert("¡Hecho!");
    };

    return (
        <div className="space-y-12 animate-fade-in">
            <div className="bg-white p-16 rounded-[80px] shadow-sm border border-slate-100 relative">
                <h3 className="font-black text-3xl mb-12 italic uppercase tracking-tighter text-slate-800 underline decoration-blue-500 decoration-8 underline-offset-8">{form.id ? 'Modificar Acceso' : 'Nuevo Colaborador'}</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6">Nombre</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6">Email</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6">Password</label><input className="w-full p-6 bg-slate-50 rounded-[35px] font-bold border-none outline-none focus:ring-4 ring-blue-50 transition-all" type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required={!form.id}/></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6">Cargo</label><select className="w-full p-6 bg-slate-50 rounded-[35px] font-black text-slate-700 outline-none focus:ring-4 ring-blue-50" value={form.cargo} onChange={e=>setForm({...form, cargo: e.target.value})}>
                        <option value="Admin">Admin</option><option value="Vendedor">Vendedor</option><option value="Bodeguero">Bodeguero</option>
                        <option value="Prealistador">Prealistador</option><option value="Produccion">Produccion</option><option value="Logistica">Logistica</option>
                    </select></div>
                    <div className="flex items-end"><button className="w-full py-6 bg-blue-600 text-white font-black rounded-[35px] shadow-2xl hover:bg-black transition-all transform active:scale-95 uppercase text-xs tracking-widest">Guardar Acceso</button></div>
                </form>
            </div>
            <div className="bg-white rounded-[70px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase border-b tracking-[4px] text-slate-400"><tr><th className="p-12">Nombre del Usuario</th><th>Email</th><th>Rol Corporativo</th><th className="text-center">Operaciones</th></tr></thead>
                    <tbody>{usuarios.map(u => (
                        <tr key={u.id} className="border-b hover:bg-slate-50 transition-all">
                            <td className="p-12 font-black text-slate-800 text-2xl tracking-tighter italic uppercase">{u.nombre}</td>
                            <td className="font-bold text-slate-400">{u.email}</td>
                            <td><span className="bg-blue-50 text-blue-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{u.cargo}</span></td>
                            <td className="p-12 text-center flex justify-center gap-6">
                                <button onClick={()=> {setForm(u); window.scrollTo({top:0, behavior:'smooth'})}} className="p-5 bg-blue-50 text-blue-600 rounded-[25px] hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={24}/></button>
                                <button onClick={async ()=>{if(window.confirm("¿Eliminar acceso?")){ await axios.delete(`/api/admin/usuarios/${u.id}`); load(); }}} className="p-5 bg-red-50 text-red-500 rounded-[25px] hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={24}/></button>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
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
            <h3 className="font-black text-3xl mb-12 italic text-blue-600 uppercase tracking-tighter flex items-center gap-5"><Receipt size={40}/> Libro Diario de Ingresos (TPV)</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50 text-[11px] font-black uppercase border-b tracking-[5px] text-slate-400"><tr><th className="p-10">Fecha y Hora</th><th>Cajero Responsable</th><th>Detalle de la Operación</th><th className="text-right p-10">Monto Final</th></tr></thead>
                    <tbody>{datos.map(d=>(<tr key={d.id} className="border-b hover:bg-slate-50 transition-all">
                        <td className="p-10 text-sm font-bold text-slate-500">{new Date(d.fecha).toLocaleString()}</td>
                        <td className="font-black text-blue-600 uppercase text-xs tracking-[2px]">{d.responsable}</td>
                        <td className="font-black text-slate-800 text-lg tracking-tight italic">Comprobante de Venta Directa #{d.id} (Sincronizado)</td>
                        <td className="p-10 text-right font-black text-slate-900 text-3xl tracking-tighter">{fmt(d.total)}</td>
                    </tr>))}</tbody>
                </table>
                {datos.length === 0 && <div className="p-32 text-center text-slate-300 font-black uppercase text-3xl italic opacity-50">No hay movimientos contables registrados</div>}
            </div>
        </div>
    );
}

// --- VISTAS RESTANTES ---
function ResumenView({ user }) {
  const [data, setData] = useState({ cajaMayor: 0, valorInventario: 0, lowStock: 0 });
  useEffect(() => { axios.get(`/api/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); }, [user]);
  const chartData = [{ name: 'Lun', v: 400 }, { name: 'Mar', v: 300 }, { name: 'Mie', v: 600 }, { name: 'Jue', v: 800 }, { name: 'Vie', v: 500 }, { name: 'Sab', v: 900 }, { name: 'Dom', v: 200 }];
  return (
    <div className="space-y-12 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <CardStat title="Balance General" value={fmt(data.cajaMayor)} color="blue" icon={<TrendingUp size={32}/>}/>
            <CardStat title="Efectivo TPV" value={fmt(0)} color="green" icon={<Wallet size={32}/>}/>
            <CardStat title="Valoración Stock" value={fmt(data.valorInventario)} color="purple" icon={<Box size={32}/>}/>
            <CardStat title="Items Críticos" value={data.lowStock} color="red" icon={<AlertTriangle size={32}/>}/>
        </div>
        <div className="bg-white p-20 rounded-[80px] shadow-sm border h-[600px] relative">
             <h3 className="font-black text-3xl mb-12 uppercase italic text-slate-800 tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-8">Rendimiento Operativo Semanal</h3>
             <ResponsiveContainer width="100%" height="80%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 16, fontWeight: '900', fill: '#94a3b8'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '35px', border: 'none', boxShadow: '0 35px 60px -15px rgb(0 0 0 / 0.3)'}} />
                    <Bar dataKey="v" radius={[25, 25, 0, 0]} fill="#2563eb">
                         {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 5 ? '#2563eb' : '#e2e8f0'} />))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
        </div>
    </div>
  );
}

// ==========================================
//      MÓDULO: CAJA CON CLAVE MAESTRA
// ==========================================
function CajaMasterView({ user, turnoActivo, onUpdate }) {
    const handleApertura = async () => {
        const pass = window.prompt("SEGURIDAD: Introduce la CLAVE MAESTRA corporativa para autorizar turno:");
        if (!pass) return;
        try {
            const resV = await axios.post('/api/turnos/verificar-maestra', { company_id: user.company_id, password: pass });
            if (resV.data.success) {
                const base = window.prompt("Ingresa dinero base inicial en efectivo:", "0");
                await axios.post('/api/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base, company_id: user.company_id });
                onUpdate();
            } else { window.alert("❌ Clave incorrecta."); }
        } catch (e) { window.alert("Error de validación."); }
    };

    return (
        <div className="bg-white p-24 rounded-[90px] shadow-2xl text-center max-w-2xl mx-auto border-t-[30px] border-blue-600 animate-slide-up">
            <div className={`w-32 h-32 mx-auto mb-10 rounded-[45px] flex items-center justify-center shadow-inner ${turnoActivo ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                <Lock size={64}/>
            </div>
            <h3 className="text-6xl font-black mb-8 uppercase italic tracking-tighter text-slate-800">{turnoActivo ? "CAJA ACTIVA" : "CAJA BLOQUEADA"}</h3>
            {turnoActivo ? (
                <div className="space-y-12">
                    <div className="p-16 bg-slate-50 rounded-[60px] border-2 border-dashed border-slate-200">
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[8px] mb-4">Ventas Acumuladas Hoy</p>
                        <h2 className="text-9xl font-black text-green-600 tracking-tighter">{fmt(turnoActivo.total_vendido)}</h2>
                    </div>
                    <button onClick={async ()=>{ if(window.confirm("¿Cerrar caja?")){ await axios.put('/api/turnos/finalizar', { turno_id: turnoActivo.id }); onUpdate(); } }} className="w-full py-10 bg-red-500 text-white font-black rounded-[45px] shadow-xl hover:bg-red-600 transition-all uppercase text-sm tracking-widest active:scale-95">Realizar Cierre de Turno</button>
                </div>
            ) : (
                <div className="space-y-10">
                    <p className="text-slate-400 font-bold px-20 text-xl italic tracking-tight opacity-60 uppercase">Módulo restringido a nivel administrativo maestro</p>
                    <button onClick={handleApertura} className="w-full py-10 bg-blue-600 text-white font-black rounded-[45px] shadow-2xl animate-bounce uppercase text-xs tracking-[5px] hover:bg-black transition-all">Aperturar con Clave Maestra</button>
                </div>
            )}
        </div>
    );
}

// --- LOGIN SCREEN ---
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post('/api/login', { email, password });
        if (res.data.success) onLogin(res.data.user);
        else window.alert('Datos incorrectos.');
    } catch (e) { window.alert('Backend sincronizando... espera 10 seg.'); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4 relative overflow-hidden">
      <div className="bg-white p-20 rounded-[90px] shadow-2xl w-full max-w-lg border-t-[15px] border-slate-900 animate-slide-up">
        <h1 className="text-6xl font-black text-center text-slate-800 mb-4 italic tracking-tighter uppercase leading-none">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[8px] mb-16 italic">Enterprise Management System</p>
        <form onSubmit={handleAuth} className="space-y-8">
          <input className="w-full p-7 bg-slate-100 rounded-[40px] font-black outline-none focus:ring-8 ring-blue-50 transition-all text-lg tracking-tighter" placeholder="Email Corporativo" onChange={e => setEmail(e.target.value)} required />
          <input type="password" class="w-full p-7 bg-slate-100 rounded-[40px] font-black outline-none focus:ring-8 ring-blue-50 transition-all text-lg tracking-tighter" placeholder="Contraseña Maestra" onChange={e => setPassword(e.target.value)} required />
          <button className="w-full bg-slate-900 text-white font-black py-8 rounded-[40px] shadow-2xl hover:bg-blue-600 transition-all active:scale-95 uppercase text-sm tracking-[5px] mt-8 shadow-blue-900/30">Acceder al Sistema</button>
        </form>
      </div>
    </div>
  );
}

// --- HELPERS ---
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
            <h1 className="text-2xl font-black italic mb-10 text-blue-400 uppercase tracking-tighter">AccuCloud.</h1>
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

function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50 shadow-green-200", blue: "text-blue-600 bg-blue-50 shadow-blue-200", purple: "text-purple-600 bg-purple-50 shadow-purple-200", red: "text-red-600 bg-red-50 shadow-red-200" };
    return (
        <div className="bg-white p-16 rounded-[70px] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-5 transition-all duration-1000 group">
            <div className={`w-24 h-24 rounded-[40px] flex items-center justify-center mb-12 shadow-2xl group-hover:scale-110 transition-transform ${c[color]}`}>{icon}</div>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[6px] mb-4 leading-none">{title}</p>
            <h3 className="text-6xl font-black text-slate-800 tracking-tighter leading-none italic">{value}</h3>
        </div>
    ); 
}
function PSEPage({ onBack }) { return <div className="h-screen bg-slate-900 text-white flex items-center justify-center text-8xl font-black uppercase italic tracking-widest text-center px-20">Pasarela Bancaria PSE $600.000 COP</div>; }