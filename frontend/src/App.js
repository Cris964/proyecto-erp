/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, Landmark, TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
axios.defaults.baseURL = window.location.origin + '/api';

const fmt = (number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(number || 0);

// --- FUNCIÓN IMPRESIÓN ---
const imprimirFactura = (cart, total, responsable, metodo, cliente, recibido, cambio) => {
    try {
        const doc = new jsPDF({ unit: 'mm', format: [80, 150 + (cart.length * 10)] }); 
        const ancho = 80;
        doc.setFontSize(14); doc.text("ACCUCLOUD ERP", ancho/2, 10, {align: 'center'});
        doc.setFontSize(8);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 5, 20);
        doc.text(`Cajero: ${responsable}`, 5, 24);
        doc.text(`Cliente: ${cliente?.nombre || 'General'}`, 5, 28);
        autoTable(doc, {
            startY: 35,
            margin: { left: 2, right: 2 },
            head: [['Cant', 'Producto', 'Subt']],
            body: cart.map(p => [p.cantidad, p.nombre.substring(0,12), fmt(p.precio * p.cantidad)]),
            theme: 'plain',
            styles: { fontSize: 7 }
        });
        const finalY = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(10);
        doc.text(`TOTAL: ${fmt(total)}`, ancho - 5, finalY, { align: 'right' });
        window.open(doc.output('bloburl'), '_blank');
    } catch (e) { console.error(e); }
};

function App() {
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  if (!user) {
    return isRegistering ? 
      <RegisterScreen onBack={() => setIsRegistering(false)} /> : 
      <LoginScreen onLogin={setUser} onGoToRegister={() => setIsRegistering(true)} />;
  }
  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      <Dashboard user={user} onLogout={() => setUser(null)} />
    </div>
  );
}

function RegisterScreen({ onBack }) {
    const [form, setForm] = useState({ nombre: '', email: '', password: '' });
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/register', form);
            window.alert("Registrado."); onBack();
        } catch (e) { window.alert("Error."); }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-black mb-6">Nueva Cuenta</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                    <input className="w-full p-4 border rounded-2xl bg-slate-50" placeholder="Nombre Empresa" onChange={e => setForm({...form, nombre: e.target.value})} required />
                    <input className="w-full p-4 border rounded-2xl bg-slate-50" type="email" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} required />
                    <input className="w-full p-4 border rounded-2xl bg-slate-50" type="password" placeholder="Contraseña" onChange={e => setForm({...form, password: e.target.value})} required />
                    <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl">REGISTRARME</button>
                </form>
                <button onClick={onBack} className="w-full mt-4 text-slate-400 font-bold text-sm">Volver</button>
            </div>
        </div>
    );
}

function LoginScreen({ onLogin, onGoToRegister }) {
  const [email, setEmail] = useState('admin@empresa.com');
  const [password, setPassword] = useState('123456');
  const handle = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/login', { email, password });
      if (res.data.success) onLogin(res.data.user);
      else window.alert('Datos incorrectos');
    } catch (e) { window.alert('Error: Backend desconectado'); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4">
      <div className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md">
        <h1 className="text-5xl font-black text-center text-slate-800 mb-10 tracking-tighter italic">AccuCloud<span className="text-blue-600">.</span></h1>
        <form onSubmit={handle} className="space-y-4">
          <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" />
          <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl">INGRESAR</button>
        </form>
        <button onClick={onGoToRegister} className="w-full mt-8 text-blue-600 font-black text-sm hover:underline">REGISTRAR EMPRESA</button>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [turnoActivo, setTurnoActivo] = useState(null);
  const recargarTurno = useCallback(() => {
    if (user) axios.get('/turnos/activo/' + user.id).then(res => setTurnoActivo(res.data));
  }, [user]);
  useEffect(() => { recargarTurno(); }, [recargarTurno]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="w-72 bg-white border-r flex flex-col z-20 shadow-xl px-6">
        <div className="h-28 flex items-center font-black text-2xl text-slate-800 tracking-tighter italic italic uppercase">ACCUCLOUD <span className="text-blue-600">.</span></div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          <MenuButton icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />
          <div className="px-4 text-[10px] font-black text-slate-300 uppercase mt-8 mb-4 tracking-[2px]">Operaciones</div>
          <MenuButton icon={<Wallet size={20}/>} label="Caja y Turnos" active={activeTab==='caja'} onClick={()=>setActiveTab('caja')} />
          <MenuButton icon={<ShoppingCart size={20}/>} label="Ventas (POS)" active={activeTab==='ventas'} onClick={()=>setActiveTab('ventas')} />
          <MenuButton icon={<Package size={20}/>} label="Inventario" active={activeTab==='inventario'} onClick={()=>setActiveTab('inventario')} />
          <div className="px-4 text-[10px] font-black text-slate-300 uppercase mt-8 mb-4 tracking-[2px]">Gestión</div>
          <MenuButton icon={<Users size={20}/>} label="Nómina PRO" active={activeTab==='nomina'} onClick={()=>setActiveTab('nomina')} />
          <MenuButton icon={<Calculator size={20}/>} label="Contabilidad" active={activeTab==='conta'} onClick={()=>setActiveTab('conta')} />
        </nav>
        <div className="py-8 border-t">
            <button onClick={onLogout} className="w-full text-red-500 text-xs font-black py-2 hover:bg-red-50 rounded-xl transition">CERRAR SESIÓN</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-10">
        <header className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize">{activeTab}</h2>
            {turnoActivo ? <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm"><div className="w-2 bg-green-500 h-2 rounded-full animate-pulse"></div> CAJA ABIERTA</div> : <div className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-black">CAJA CERRADA</div>}
        </header>
        {activeTab==='dashboard' && <ResumenView/>}
        {activeTab==='caja' && <CajaView user={user} turnoActivo={turnoActivo} onUpdate={recargarTurno}/>}
        {activeTab==='ventas' && <VentasView user={user} turnoActivo={turnoActivo}/>}
        {activeTab==='inventario' && <InventarioView user={user}/>}
        {activeTab==='nomina' && <NominaView user={user}/>}
        {activeTab==='conta' && <ContabilidadView/>}
      </main>
    </div>
  );
}

function ResumenView() {
  const [data, setData] = useState({ cajaMayor: 0, cajaMenor: 0, valorInventario: 0, lowStock: 0, recentSales: [] });
  useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);
  const chartData = [{ name: 'Lun', v: 400 }, { name: 'Mar', v: 300 }, { name: 'Mie', v: 600 }, { name: 'Jue', v: 800 }, { name: 'Vie', v: 500 }, { name: 'Sab', v: 900 }, { name: 'Dom', v: 200 }];
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <CardStat title="Balance Total" value={fmt(data.cajaMayor)} icon={<DollarSign/>} color="blue" />
        <CardStat title="Caja Menor" value={fmt(data.cajaMenor)} icon={<Wallet/>} color="green" />
        <CardStat title="Valor Stock" value={fmt(data.valorInventario)} icon={<Package/>} color="purple" />
        <CardStat title="Alertas" value={data.lowStock} icon={<AlertTriangle/>} color="red" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 h-96">
              <h3 className="font-black text-slate-800 mb-6 tracking-tight">Desempeño Semanal</h3>
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '15px', border: 'none'}} />
                      <Bar dataKey="v" radius={[10, 10, 0, 0]} fill="#2563eb" />
                  </BarChart>
              </ResponsiveContainer>
          </div>
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 h-96 overflow-auto">
              <h3 className="font-black text-slate-800 mb-6 tracking-tighter">Ventas Recientes</h3>
              {data.recentSales.map(v => (
                  <div key={v.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl mb-2 hover:bg-blue-50 transition-all">
                      <div className="text-sm font-bold text-slate-700">{v.nombre_producto}</div>
                      <span className="font-black text-slate-800">{fmt(v.total)}</span>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}

function CajaView({ user, turnoActivo, onUpdate }) {
    const [historial, setHistorial] = useState([]);
    const loadHistorial = useCallback(() => {
        axios.get('/turnos/historial').then(res => setHistorial(Array.isArray(res.data) ? res.data : []));
    }, []);
    useEffect(() => { loadHistorial(); }, [loadHistorial]);
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="bg-white p-10 rounded-[40px] shadow-xl border border-blue-50 text-center flex flex-col justify-center">
                <div className={`w-24 h-24 mx-auto rounded-[32px] flex items-center justify-center mb-8 ${turnoActivo ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>{turnoActivo ? <ScanBarcode size={48}/> : <Lock size={48}/>}</div>
                <h3 className="text-3xl font-black mb-2">{turnoActivo ? "CAJA ABIERTA" : "CAJA CERRADA"}</h3>
                {turnoActivo && <div className="bg-slate-50 p-6 rounded-3xl mb-8 text-left font-black tracking-tight">Ventas Hoy: <span className="text-green-600">{fmt(turnoActivo.total_vendido)}</span></div>}
                <button onClick={async ()=>{
                    if(turnoActivo){ if(window.confirm("¿Cerrar?")) { await axios.put('/turnos/finalizar', { turno_id: turnoActivo.id }); onUpdate(); loadHistorial(); } }
                    else { const b = window.prompt("Base?", "0"); if(b) { await axios.post('/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: b }); onUpdate(); loadHistorial(); } }
                }} className={`w-full py-5 rounded-3xl font-black text-white ${turnoActivo ? 'bg-red-500 shadow-xl shadow-red-100' : 'bg-blue-600 shadow-xl shadow-blue-100'} transition-all`}>
                    {turnoActivo ? "REALIZAR CIERRE" : "ABRIR NUEVA CAJA"}
                </button>
            </div>
            <div className="lg:col-span-2 bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-[10px] font-black uppercase"><tr className="border-b"><th className="p-8">Responsable</th><th>Base</th><th className="text-right">Ventas</th><th className="p-8 text-center">Estado</th></tr></thead>
                    <tbody>{historial.map(t => (<tr key={t.id} className="border-b hover:bg-slate-50 transition">
                        <td className="p-8 font-black">{t.nombre_usuario}</td><td>{fmt(t.base_caja)}</td><td className="text-right font-black text-blue-600">{fmt(t.total_vendido)}</td><td className="p-8 text-center uppercase text-[10px] font-black">{t.estado}</td>
                    </tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}

function VentasView({ user, turnoActivo }) {
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [metodo, setMetodo] = useState('Efectivo');
  const [pagaCon, setPagaCon] = useState('');
  const [esElectronica, setEsElectronica] = useState(false);
  const [cliente, setCliente] = useState({ nombre: '', nit: '', email: '', tel: '' });
  const load = useCallback(() => axios.get('/productos').then(res => setProductos(res.data)), []);
  useEffect(() => { load(); }, [load]);
  const totalVenta = cart.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  const devuelta = (parseFloat(pagaCon) || 0) - totalVenta;
  
  const addToCart = useCallback((prod) => {
      setCart(prev => {
        const existe = prev.find(item => item.id === prod.id);
        if (existe) { return prev.map(item => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item); } 
        else { return [...prev, { ...prod, cantidad: 1 }]; }
      });
      setSearchTerm('');
  }, []);

  useEffect(() => {
    let barcode = "";
    const handleKey = (e) => {
        if(e.key === 'Enter') {
            const prod = productos.find(p => p.sku === barcode);
            if(prod) addToCart(prod);
            barcode = "";
        } else { barcode += e.key; }
    };
    window.addEventListener('keypress', handleKey);
    return () => window.removeEventListener('keypress', handleKey);
  }, [productos, addToCart]);

  const procesar = async () => {
      if(cart.length === 0) return window.alert("Carrito vacío.");
      if(metodo === 'Efectivo' && (parseFloat(pagaCon) < totalVenta || !pagaCon)) return window.alert("Dinero insuficiente.");
      try {
          const res = await axios.post('/ventas', {
              productos: cart, responsable: user.nombre, turno_id: turnoActivo.id, metodo_pago: metodo,
              es_electronica: esElectronica, cliente: esElectronica ? cliente : {nombre: 'General', nit: '222'}, pago_recibido: pagaCon, cambio: devuelta
          });
          if(res.data.success) {
              imprimirFactura(cart, totalVenta, user.nombre, metodo, cliente, pagaCon, devuelta);
              setCart([]); setPagaCon(''); setEsElectronica(false); setSearchTerm('');
              window.alert("Venta completada."); load(); 
          }
      } catch (e) { window.alert("Error."); }
  };

  if(!turnoActivo) return <div className="text-center p-20 opacity-30"><h2>CAJA CERRADA</h2></div>;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-xl border border-blue-50">
            <h3 className="font-black text-2xl mb-6 flex items-center gap-3 tracking-tighter uppercase"><ScanBarcode className="text-blue-600"/> TPV 2026</h3>
            <input autoFocus className="w-full p-4 border rounded-2xl bg-slate-50 font-bold mb-6 focus:ring-2 ring-blue-100 outline-none" placeholder="Escanea o busca..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
            {searchTerm && <div className="absolute bg-white border rounded-2xl shadow-2xl z-50 p-4 w-1/2 mt-[-20px] max-h-60 overflow-auto">{productos.filter(p=>p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.includes(searchTerm)).map(p=>(<div key={p.id} onClick={()=>addToCart(p)} className="p-3 border-b cursor-pointer hover:bg-blue-50 font-black transition-all text-slate-700">{p.nombre}</div>))}</div>}
            <div className="max-h-[300px] overflow-auto">
                <table className="w-full text-left">
                    <thead className="text-[10px] font-black uppercase text-slate-400 border-b"><tr><th className="pb-4">Producto</th><th>Cant</th><th>Subtotal</th><th></th></tr></thead>
                    <tbody>{cart.map((item, i) => (
                        <tr key={i} className="border-b"><td className="py-4 font-bold">{item.nombre}</td><td><input type="number" className="w-16 border rounded-lg text-center" value={item.cantidad} onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setCart(cart.map(it => it.id === item.id ? { ...it, cantidad: val } : it));
                        }} /></td><td className="font-black">{fmt(item.precio * item.cantidad)}</td><td><button onClick={()=>setCart(cart.filter(it => it.id !== item.id))} className="text-red-500 font-bold hover:bg-red-50 p-2 rounded-xl transition-all">X</button></td></tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
        <div className="bg-white p-8 rounded-[40px] shadow-xl border flex flex-col justify-between">
            <div className="space-y-6">
                <div className="text-center"><p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Total</p><h1 className="text-5xl font-black text-blue-600 tracking-tighter">{fmt(totalVenta)}</h1></div>
                <div className="flex gap-2"><button onClick={()=>setMetodo('Efectivo')} className={`flex-1 p-3 rounded-2xl font-bold border transition-all ${metodo==='Efectivo'?'bg-green-50 border-green-500 text-green-700 shadow-xl shadow-green-50':'bg-white border-slate-50'}`}>EFECTIVO</button><button onClick={()=>setMetodo('Transferencia')} className={`flex-1 p-3 rounded-2xl font-bold border transition-all ${metodo==='Transferencia'?'bg-blue-50 border-blue-300 text-blue-700 shadow-xl shadow-blue-100':'bg-white border-slate-50'}`}>BANCO</button></div>
                {metodo === 'Efectivo' && <div className="bg-slate-50 p-4 rounded-3xl border-2 border-dashed border-slate-200"><div className="flex justify-between items-center mb-2"><span className="text-xs font-black uppercase text-slate-400">Recibido:</span><input type="number" className="w-24 p-2 rounded-xl text-right font-black text-green-600" value={pagaCon} onChange={e=>setPagaCon(e.target.value)} /></div><div className="flex justify-between font-black text-blue-600 tracking-tighter border-t pt-2 mt-2"><span>Cambio:</span><span>{fmt(devuelta)}</span></div></div>}
                <div className="p-4 bg-slate-900 rounded-3xl text-white flex justify-between items-center cursor-pointer hover:bg-black transition-all" onClick={()=>setEsElectronica(!esElectronica)}><div className="flex items-center gap-2"><Mail size={16}/><span className="text-[10px] font-black uppercase tracking-widest">Factura Electrónica</span></div><div className={`w-8 h-4 rounded-full relative transition-all ${esElectronica?'bg-blue-500':'bg-slate-700'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${esElectronica?'left-4':'left-1'}`}></div></div></div>
                {esElectronica && <div className="space-y-2 animate-fade-in"><input className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-black text-slate-700" placeholder="Nombre" onChange={e=>setCliente(prev => ({...prev, nombre: e.target.value}))} /><input className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-black text-slate-700" placeholder="NIT" onChange={e=>setCliente(prev => ({...prev, nit: e.target.value}))} /><input className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-black text-slate-700" placeholder="Email" onChange={e=>setCliente(prev => ({...prev, email: e.target.value}))} /></div>}
            </div>
            <button onClick={procesar} className="w-full bg-blue-600 text-white font-black py-5 rounded-[28px] shadow-2xl shadow-blue-100 hover:scale-[1.03] transition-all active:scale-95 text-xl tracking-tight mt-6">PAGAR</button>
        </div>
    </div>
  );
}

function InventarioView({ user }) {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ nombre: '', sku: '', precio: '', stock: '', min_stock: 5 });
  const load = useCallback(() => axios.get('/productos').then(res => setProductos(res.data)), []);
  useEffect(() => { load(); }, [load]);
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      const prods = data.map(item => ({ nombre: item.Nombre || item.nombre, sku: item.SKU || item.sku, precio: item.Precio || item.precio, stock: item.Stock || item.stock, min_stock: item.Minimo || 5 }));
      if (window.confirm(`¿Importar ${prods.length} productos?`)) {
        try { await axios.post('/productos/importar', { productos: prods, responsable: user.nombre }); window.alert("Éxito"); load(); } catch (e) { window.alert("Error"); }
      }
    };
    reader.readAsBinaryString(file);
  };
  return (
    <div className="space-y-10 animate-fade-in">
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-xl tracking-tighter text-slate-800">Stock</h3>
                <label className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-black flex items-center gap-2 shadow-xl shadow-slate-100"><Upload size={14} className="text-blue-500"/> Carga Masiva<input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} className="hidden" /></label>
            </div>
            <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/productos', {...form, responsable: user.nombre}); load(); setForm({nombre:'',sku:'',precio:'',stock:'',min_stock:5});}} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/>
                <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="SKU" value={form.sku} onChange={e=>setForm({...form, sku: e.target.value})} required/>
                <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold" type="number" placeholder="Precio" value={form.precio} onChange={e=>setForm({...form, precio: e.target.value})} required/>
                <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold" type="number" placeholder="Stock" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} required/><button className="bg-blue-600 text-white font-black rounded-2xl transition-all">CREAR</button></form>
        </div>
        <div className="bg-white rounded-[40px] shadow-sm overflow-hidden border border-slate-100 pr-2">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Producto</th><th>SKU</th><th>Precio</th><th>Stock</th><th className="p-8 text-center">Estado</th></tr></thead>
                <tbody>{productos.map(p=>(<tr key={p.id} className="border-b hover:bg-slate-50 transition">
                    <td className="p-8 font-black text-slate-800">{p.nombre}</td><td className="font-mono text-slate-400 font-bold">{p.sku}</td><td className="font-black text-slate-700">{fmt(p.precio)}</td><td className="font-black text-slate-800">{p.stock}</td>
                    <td className="p-8 text-center">{p.stock <= p.min_stock ? <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Crítico</span> : <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">OK</span>}</td>
                </tr>))}</tbody>
            </table>
        </div>
    </div>
  );
}

function NominaView({ user }) {
  const [mode, setMode] = useState('liquidar');
  const [empleados, setEmpleados] = useState([]);
  const [nominas, setNominas] = useState([]);
  const [formEmp, setFormEmp] = useState({ nombre: '', email: '', salario: '', eps: '', arl: '', pension: '' });
  const [formLiq, setFormLiq] = useState({ empleado_id: '', dias: 30, extras: 0, tipo_extra: 'Diurna', metodo: 'Transferencia', banco: '', cuenta: '' });
  const [preview, setPreview] = useState(null);
  const load = useCallback(() => { axios.get('/api/empleados').then(res => setEmpleados(res.data)); axios.get('/api/nomina/historial').then(res => setNominas(res.data)); }, []);
  useEffect(() => { load(); }, [load]);
  const calcular = () => {
    const e = empleados.find(emp => emp.id === parseInt(formLiq.empleado_id)); if(!e) return;
    const S = parseFloat(e.salario); const dias = parseFloat(formLiq.dias);
    const basico = Math.round((S / 30) * dias); const auxilio = (S <= 3501810) ? Math.round((249095 / 30) * dias) : 0;
    let factor = 1.25; if (formLiq.tipo_extra === 'Nocturna') factor = 1.75; if (formLiq.tipo_extra === 'Dominical') factor = 2.00; if (formLiq.tipo_extra === 'Recargo_Nocturno') factor = 0.35;
    const extras = Math.round((S / 240 * factor) * parseFloat(formLiq.extras || 0));
    const neto = (basico + auxilio + extras) - (Math.round((basico+extras)*0.08));
    setPreview({ nombre: e.nombre, neto, basico, auxilio, extras });
  };
  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm">{['liquidar', 'empleados', 'history'].map(m => <button key={m} onClick={()=>setMode(m)} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${mode===m?'bg-blue-600 text-white shadow-xl':'text-slate-400 hover:text-slate-800'}`}>{m}</button>)}</div>
      {mode === 'empleados' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 h-fit"><h3 className="font-black text-xl mb-8 tracking-tighter text-slate-800">Vincular Personal</h3><form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/api/empleados', formEmp); load(); setFormEmp({nombre:'',email:'',salario:'',eps:'',arl:'',pension:''});}} className="space-y-4"><input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Nombre completo" value={formEmp.nombre} onChange={e=>setFormEmp({...formEmp, nombre: e.target.value})} required/><input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" type="email" placeholder="Email" value={formEmp.email} onChange={e=>setFormEmp({...formEmp, email: e.target.value})} required/><input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" type="number" placeholder="Salario Mensual" value={formEmp.salario} onChange={e=>setFormEmp({...formEmp, salario: e.target.value})} required/><div className="grid grid-cols-3 gap-2"><input className="p-3 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase" placeholder="EPS" value={formEmp.eps} onChange={e=>setFormEmp({...formEmp, eps: e.target.value})}/><input className="p-3 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase" placeholder="ARL" value={formEmp.arl} onChange={e=>setFormEmp({...formEmp, arl: e.target.value})}/><input className="p-3 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase" placeholder="F.P" value={formEmp.pension} onChange={e=>setFormEmp({...formEmp, pension: e.target.value})}/></div><button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100">VINCULAR</button></form></div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit pr-2">{empleados.map(e=>(<div key={e.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center gap-6 hover:scale-[1.02] transition-all cursor-pointer"><div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-2xl text-blue-600">{e.nombre.charAt(0)}</div><div className="overflow-hidden"><p className="font-black text-slate-800 text-lg tracking-tighter truncate">{e.nombre}</p><p className="text-xl font-black text-green-600 mt-1">{fmt(e.salario)}</p></div></div>))}</div>
        </div>
      )}
      {mode === 'liquidar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white p-12 rounded-[40px] shadow-xl border border-green-100"><h3 className="font-black text-2xl mb-8 text-green-800 tracking-tighter flex items-center gap-3"><Calculator/> LIQUIDADOR</h3><div className="space-y-6"><div><label className="text-[10px] font-black uppercase text-slate-400 ml-4 block mb-2">Empleado</label><select className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black text-slate-700" onChange={e=>setFormLiq({...formLiq, empleado_id: e.target.value})}><option>-- Seleccionar --</option>{empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div><div className="grid grid-cols-2 gap-6"><div><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Días</label><input type="number" className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black" value={formLiq.dias} onChange={e=>setFormLiq({...formLiq, dias: e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Extras</label><input type="number" className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black" value={formLiq.extras} onChange={e=>setFormLiq({...formLiq, extras: e.target.value})}/></div></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Tipo Recargo</label><select className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black text-slate-700" value={formLiq.tipo_extra} onChange={e=>setFormLiq({...formLiq, tipo_extra: e.target.value})}><option value="Diurna">Diurna</option><option value="Nocturna">Nocturna</option><option value="Dominical">Dominical</option><option value="Recargo_Nocturno">Recargo</option></select></div><button onClick={calcular} className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl shadow-xl hover:bg-black transition-all">CALCULAR</button></div></div>
              <div className="bg-white p-12 rounded-[40px] shadow-2xl border-l-[12px] border-blue-600 flex flex-col justify-between">{preview ? (<div className="space-y-6 animate-fade-in"><div className="text-center border-b pb-8"><h4 className="text-3xl font-black text-slate-800 tracking-tighter">{preview.nombre}</h4></div><div className="bg-blue-600 p-8 rounded-[32px] text-center text-5xl font-black text-white shadow-xl shadow-blue-100">{fmt(preview.neto)}</div><button onClick={async ()=>{if(window.confirm(`¿Confirmar pago a ${preview.nombre}?`)){await axios.post('/api/nomina/liquidar', {...formLiq, extras: formLiq.extras, responsable: user.nombre}); window.alert("Éxito"); load(); setMode('history'); setPreview(null);}}} className="w-full bg-slate-900 text-white font-black py-6 rounded-[32px] shadow-xl hover:scale-102 transition-all active:scale-95">PAGAR</button></div>) : <div className="h-full flex items-center justify-center opacity-20"><Mail size={100}/></div>}</div>
          </div>
      )}
      {mode === 'history' && (
          <div className="bg-white rounded-[40px] shadow-sm overflow-hidden border border-slate-100 pr-2"><table className="w-full text-left text-sm"><thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 border-b"><tr className="tracking-widest"> <th className="p-8">Fecha Pago</th><th>Empleado</th><th className="p-8 text-right">Neto Pagado</th></tr></thead><tbody>{nominas.map(n => (<tr key={n.id} className="border-b hover:bg-slate-50 transition"><td className="p-8 text-xs font-black text-slate-500">{new Date(n.fecha_pago).toLocaleDateString()}</td><td className="font-black text-slate-800 text-lg tracking-tight">{n.nombre_empleado}</td><td className="p-8 font-black text-green-600 text-xl text-right">{fmt(n.neto_pagar)}</td></tr>))}</tbody></table></div>
      )}
    </div>
  );
}

function ContabilidadView() {
    const [subTab, setSubTab] = useState('diario');
    const [diario, setDiario] = useState([]);
    const [balance, setBalance] = useState([]);
    const loadData = useCallback(async () => {
        try {
            const [resDiario, resBalance] = await Promise.all([ axios.get('/api/contabilidad/diario'), axios.get('/api/contabilidad/balance') ]);
            setDiario(Array.isArray(resDiario.data) ? resDiario.data : []);
            setBalance(Array.isArray(resBalance.data) ? resBalance.data : []);
        } catch (e) { console.error(e); }
    }, []);
    useEffect(() => { loadData(); }, [loadData]);
    const gruposDiario = diario.reduce((acc, curr) => { if (!acc[curr.comprobante_id]) { acc[curr.comprobante_id] = { id: curr.comprobante_id, fecha: curr.fecha, tipo: curr.tipo_doc, desc: curr.descripcion, asientos: [] }; } acc[curr.comprobante_id].asientos.push(curr); return acc; }, {});
    const totalActivos = balance.filter(c => c.codigo.startsWith('1')).reduce((a, b) => a + parseFloat(b.saldo), 0);
    const totalPasivos = balance.filter(c => c.codigo.startsWith('2')).reduce((a, b) => a + Math.abs(parseFloat(b.saldo)), 0);
    const utilidadBruta = balance.filter(c => c.codigo.startsWith('4')).reduce((a, b) => a + Math.abs(parseFloat(b.saldo)), 0) - balance.filter(c => c.codigo.startsWith('5') || c.codigo.startsWith('6')).reduce((a, b) => a + parseFloat(b.saldo), 0);
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group"><p className="text-[10px] font-black uppercase tracking-[3px] text-blue-400 mb-2">Activos</p><h3 className="text-3xl font-black tracking-tighter text-white">{fmt(totalActivos)}</h3></div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border-l-[12px] border-l-red-500"><p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Pasivos</p><h3 className="text-3xl font-black tracking-tighter text-slate-800">{fmt(totalPasivos)}</h3></div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border-l-[12px] border-l-blue-600"><p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Utilidad</p><h3 className="text-3xl font-black tracking-tighter text-slate-800">{fmt(utilidadBruta)}</h3></div>
            </div>
            <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm"><button onClick={()=>setSubTab('diario')} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase transition-all ${subTab==='diario'?'bg-slate-900 text-white shadow-xl':'text-slate-400 hover:text-slate-900'}`}>Diario</button><button onClick={()=>setSubTab('balance')} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase transition-all ${subTab==='balance'?'bg-slate-900 text-white shadow-xl':'text-slate-400 hover:text-slate-900'}`}>Balance</button></div>
            {subTab === 'diario' && (
                <div className="space-y-6">
                    {Object.values(gruposDiario).map(comp => (
                        <div key={comp.id} className="bg-white rounded-[40px] shadow-sm border border-slate-50 overflow-hidden animate-slide-up"><div className="px-8 py-4 bg-slate-50 border-b flex justify-between items-center"><span className="font-black text-slate-800 tracking-tight">{comp.tipo} #{comp.id}</span><span className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(comp.fecha).toLocaleDateString()}</span></div><table className="w-full text-left text-sm"><tbody>{comp.asientos.map((as, idx) => (<tr key={idx} className="border-b last:border-none hover:bg-slate-50 transition"><td className="p-4 pl-12 font-bold text-slate-600 text-xs"><span className="text-blue-600 mr-2">{as.cuenta_codigo}</span> {as.cuenta_nombre}</td><td className="text-right font-black text-slate-800">{as.debito > 0 ? fmt(as.debito) : '-'}</td><td className="p-4 pr-12 text-right font-black text-slate-800">{as.credito > 0 ? fmt(as.credito) : '-'}</td></tr>))}</tbody></table></div>
                    ))}
                </div>
            )}
            {subTab === 'balance' && (
                <div className="bg-white rounded-[40px] shadow-sm border border-slate-50 overflow-hidden pr-2 animate-slide-up pr-2"><table className="w-full text-left"><thead className="bg-slate-900 text-white"><tr className="text-[10px] font-black uppercase tracking-widest"><th className="p-8">Código</th><th>Cuenta Contable</th><th className="p-8 text-right">Saldo Final</th></tr></thead><tbody>{balance.map((cta, i) => (<tr key={i} className="border-b hover:bg-blue-50 transition group"><td className="p-6 font-black text-blue-600">{cta.codigo}</td><td className="font-bold text-slate-700">{cta.nombre}</td><td className={`p-8 text-right font-black ${cta.saldo < 0 ? 'text-red-500' : 'text-slate-900'}`}>{fmt(Math.abs(cta.saldo))} {cta.saldo < 0 ? '(Cr)' : '(Db)'}</td></tr>))}</tbody></table></div>
            )}
        </div>
    );
}

function MenuButton({ icon, label, active, onClick }) { return <button onClick={onClick} className={`w-full flex items-center px-6 py-5 rounded-[24px] mb-2 transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 -translate-y-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}><span className="mr-4">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; }
function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow duration-300">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${c[color]}`}>{icon}</div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-xs">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 mt-1 tracking-tighter leading-none">{value}</h3>
    </div>; 
}

export default App;