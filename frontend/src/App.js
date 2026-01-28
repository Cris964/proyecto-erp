/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, DollarSign, 
  AlertTriangle, Wallet, Lock, Mail, Calculator, 
  ScanBarcode, Upload, X, ShieldCheck, ChevronDown, UserCircle, RefreshCcw, Menu, TrendingUp, Landmark, Warehouse, Truck, History, Settings, ChevronRight, CreditCard
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// CONFIGURACIÓN DE RED (Sincronizada con Vercel)
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
axios.defaults.baseURL = window.location.origin + '/api';

const fmt = (number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(number || 0);

// --- FUNCIÓN IMPRESIÓN DE FACTURA ---
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
            startY: 35, margin: { left: 2, right: 2 },
            head: [['Cant', 'Producto', 'Subt']],
            body: cart.map(p => [p.cantidad, p.nombre.substring(0,12), fmt(p.precio * p.cantidad)]),
            theme: 'plain', styles: { fontSize: 7 }
        });
        const finalY = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(10);
        doc.text(`TOTAL: ${fmt(total)}`, ancho - 5, finalY, { align: 'right' });
        doc.setFontSize(7);
        doc.text(`Recibido: ${fmt(recibido || total)}`, 5, finalY + 5);
        doc.text(`Cambio: ${fmt(cambio || 0)}`, 5, finalY + 9);
        window.open(doc.output('bloburl'), '_blank');
    } catch (e) { console.error(e); }
};

// ==========================================
//           COMPONENTE PRINCIPAL
// ==========================================
function App() {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [showPSE, setShowPSE] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('erp_user');
    if (savedUser) {
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

  if (loadingSession) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse">INICIANDO ACCUCLOUD...</div>;
  if (showPSE) return <PSEPage onBack={() => setShowPSE(false)} />;

  return (
    <div className="font-sans text-slate-600 bg-slate-50 min-h-screen">
      {!user ? <LoginScreen onLogin={handleLogin} onBuy={() => setShowPSE(true)} /> : <Dashboard user={user} onLogout={handleLogout} />}
    </div>
  );
}

// --- LOGIN ---
function LoginScreen({ onLogin, onBuy }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regForm, setRegForm] = useState({ nombre: '', email: '', password: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await axios.post('/register', regForm);
        window.alert("Empresa registrada. Ahora puedes ingresar."); setIsRegistering(false);
      } else {
        const res = await axios.post('/login', { email, password });
        if (res.data.success) onLogin(res.data.user);
        else window.alert('Datos incorrectos');
      }
    } catch (e) { window.alert('Error de conexión o servidor despertando.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4">
      <div className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md">
        <h1 className="text-4xl font-black text-center text-slate-800 mb-2 italic tracking-tighter">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-center text-slate-400 font-bold text-[10px] uppercase mb-10 tracking-widest">{isRegistering ? 'Crear Cuenta SaaS' : 'Ingreso al Sistema'}</p>
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Nombre Empresa" onChange={e=>setRegForm({...regForm, nombre:e.target.value})} required/>}
          <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={isRegistering ? regForm.email : email} onChange={e => isRegistering ? setRegForm({...regForm, email:e.target.value}) : setEmail(e.target.value)} placeholder="Email" required />
          <input type="password" class="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={isRegistering ? regForm.password : password} onChange={e => isRegistering ? setRegForm({...regForm, password:e.target.value}) : setPassword(e.target.value)} placeholder="Contraseña" required />
          <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all">
            {isRegistering ? 'REGISTRARME' : 'INGRESAR'}
          </button>
        </form>
        <button onClick={onBuy} className="w-full mt-10 p-4 bg-green-50 text-green-600 border-2 border-green-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-100 transition-all">
            Haz parte del mejor sistema para tu negocio ($600.000)
        </button>
        <button onClick={()=>setIsRegistering(!isRegistering)} className="w-full mt-4 text-blue-600 font-black text-sm hover:underline uppercase tracking-tighter">
            {isRegistering ? 'Ya tengo cuenta' : 'Registrar Nueva Empresa'}
        </button>
      </div>
    </div>
  );
}

// --- DASHBOARD LAYOUT ---
function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const recargarTurno = useCallback(() => {
    if (user?.id) axios.get('/turnos/activo/' + user.id).then(res => setTurnoActivo(res.data));
  }, [user?.id]);

  useEffect(() => { recargarTurno(); }, [recargarTurno]);

  const canSee = (roles) => roles.includes(user?.cargo);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 flex-col md:flex-row">
      <div className="md:hidden bg-white p-4 flex justify-between items-center border-b shadow-sm z-30">
        <h1 className="font-black text-xl italic">ACCUCLOUD<span className="text-blue-600">.</span></h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-100 rounded-xl">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r transform transition-transform duration-300 ease-in-out px-6 flex flex-col md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-28 hidden md:flex items-center font-black text-2xl text-slate-800 italic uppercase tracking-tighter">ACCUCLOUD <span className="text-blue-600">.</span></div>
        <nav className="flex-1 space-y-1 overflow-y-auto mt-10 md:mt-0">
          {canSee(['Admin', 'Contador']) && <MenuButton icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab==='dashboard'} onClick={()=>{setActiveTab('dashboard'); setIsMobileMenuOpen(false);}} />}
          {canSee(['Admin', 'Vendedor']) && <MenuButton icon={<ShoppingCart size={20}/>} label="Ventas (TPV)" active={activeTab==='ventas'} onClick={()=>{setActiveTab('ventas'); setIsMobileMenuOpen(false);}} />}
          {canSee(['Admin', 'Bodeguero', 'Prealistador']) && <MenuButton icon={<Package size={20}/>} label="Inventario" active={activeTab==='inventario'} onClick={()=>{setActiveTab('inventario'); setIsMobileMenuOpen(false);}} />}
          {canSee(['Admin', 'Prealistador', 'Produccion', 'Logistica']) && <MenuButton icon={<Factory size={20}/>} label="Producción" active={activeTab==='produccion'} onClick={()=>{setActiveTab('produccion'); setIsMobileMenuOpen(false);}} />}
          {canSee(['Admin', 'Nomina']) && <MenuButton icon={<Users size={20}/>} label="Nómina PRO" active={activeTab==='nomina'} onClick={()=>{setActiveTab('nomina'); setIsMobileMenuOpen(false);}} />}
          {canSee(['Admin', 'Contador']) && <MenuButton icon={<Calculator size={20}/>} label="Contabilidad" active={activeTab==='conta'} onClick={()=>{setActiveTab('conta'); setIsMobileMenuOpen(false);}} />}
          {canSee(['Admin', 'Vendedor']) && <MenuButton icon={<Wallet size={20}/>} label="Caja y Turnos" active={activeTab==='caja'} onClick={()=>{setActiveTab('caja'); setIsMobileMenuOpen(false);}} />}
          {user?.cargo === 'Admin' && <MenuButton icon={<ShieldCheck size={20}/>} label="Admin Usuarios" active={activeTab==='admin'} onClick={()=>{setActiveTab('admin'); setIsMobileMenuOpen(false);}} />}
        </nav>
        <div className="py-8 border-t space-y-4">
            <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-3 border border-slate-100">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black">{user?.nombre?.charAt(0)}</div>
                <div className="overflow-hidden">
                    <p className="font-black text-slate-800 text-sm truncate">{user?.nombre}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase">{user?.cargo}</p>
                </div>
            </div>
            <button onClick={onLogout} className="w-full text-red-500 text-xs font-black py-2 hover:bg-red-50 rounded-xl transition uppercase tracking-widest">Salir</button>
        </div>
      </aside>

      {isMobileMenuOpen && <div onClick={()=>setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"></div>}

      <main className="flex-1 overflow-auto p-4 md:p-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter capitalize italic">{activeTab}</h2>
            {turnoActivo ? <div className="w-full md:w-auto px-4 py-2 bg-green-100 text-green-700 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 border border-green-200 uppercase tracking-widest"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> EN TURNO: {user?.nombre?.toUpperCase()} | {fmt(turnoActivo.total_vendido)}</div> : <div className="w-full md:w-auto px-4 py-2 bg-red-100 text-red-700 rounded-xl text-[10px] font-black border border-red-200 text-center uppercase tracking-widest">Caja Cerrada</div>}
        </header>

        <div className="pb-20 md:pb-0">
          {activeTab==='dashboard' && <ResumenView user={user}/>}
          {activeTab==='caja' && <CajaView user={user} turnoActivo={turnoActivo} onUpdate={recargarTurno}/>}
          {activeTab==='ventas' && <VentasView user={user} turnoActivo={turnoActivo}/>}
          {activeTab==='inventario' && <InventarioView user={user}/>}
          {activeTab==='nomina' && <NominaView user={user}/>}
          {activeTab==='conta' && <ContabilidadView user={user}/>}
          {activeTab==='admin' && <AdminView user={user}/>}
          {activeTab==='produccion' && <ProduccionView user={user}/>}
        </div>
      </main>
    </div>
  );
}

// --- VISTA DASHBOARD ---
function ResumenView({ user }) {
  const [data, setData] = useState({ cajaMayor: 0, cajaMenor: 0, valorInventario: 0, lowStock: 0, recentSales: [] });
  useEffect(() => { 
      if(user?.company_id) axios.get(`/dashboard-data?company_id=${user.company_id}`).then(res => setData(res.data)); 
  }, [user?.company_id]);
  const chartData = [{ name: 'L', v: 400 }, { name: 'M', v: 300 }, { name: 'M', v: 600 }, { name: 'J', v: 800 }, { name: 'V', v: 500 }, { name: 'S', v: 900 }, { name: 'D', v: 200 }];
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <CardStat title="Balance" value={fmt(data.cajaMayor)} icon={<DollarSign size={16}/>} color="blue" />
        <CardStat title="Caja" value={fmt(data.cajaMenor)} icon={<Wallet size={16}/>} color="green" />
        <CardStat title="Stock" value={fmt(data.valorInventario)} icon={<Package size={16}/>} color="purple" />
        <CardStat title="Alertas" value={data.lowStock} icon={<AlertTriangle size={16}/>} color="red" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[40px] shadow-sm border border-slate-100 h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '15px', border: 'none'}} />
                      <Bar dataKey="v" radius={[10, 10, 0, 0]} fill="#2563eb" />
                  </BarChart>
              </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 md:p-10 rounded-[30px] md:rounded-[40px] shadow-sm border border-slate-100 h-80 md:h-96 overflow-auto">
              <h3 className="font-black text-slate-800 mb-6 tracking-tighter text-lg uppercase italic">Ventas Recientes</h3>
              {(data.recentSales || []).map(v => (
                  <div key={v.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl mb-2">
                      <div className="text-xs font-bold text-slate-700 truncate mr-2">{v.nombre_producto}</div>
                      <span className="font-black text-slate-800 text-sm whitespace-nowrap">{fmt(v.total)}</span>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}

// --- VISTA CAJA ---
function CajaView({ user, turnoActivo, onUpdate }) {
    const [historial, setHistorial] = useState([]);
    const loadHistorial = useCallback(() => {
        if(user?.company_id) axios.get(`/turnos/historial?company_id=${user.company_id}`).then(res => setHistorial(Array.isArray(res.data) ? res.data : []));
    }, [user?.company_id]);
    useEffect(() => { loadHistorial(); }, [loadHistorial]);
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="bg-white p-10 rounded-[40px] shadow-xl border border-blue-50 text-center flex flex-col justify-center">
                <div className={`w-24 h-24 mx-auto rounded-[32px] flex items-center justify-center mb-8 ${turnoActivo ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>{turnoActivo ? <ScanBarcode size={48}/> : <Lock size={48}/>}</div>
                <h3 className="text-3xl font-black mb-2 tracking-tighter uppercase italic">{turnoActivo ? "Turno Activo" : "Caja Cerrada"}</h3>
                {turnoActivo && <div className="bg-slate-50 p-6 rounded-3xl mb-8 text-left font-black tracking-tight italic">Ventas Hoy: <span className="text-green-600">{fmt(turnoActivo.total_vendido)}</span></div>}
                <button onClick={async ()=>{
                    if(turnoActivo){ if(window.confirm("¿Cerrar?")) { await axios.put('/turnos/finalizar', { turno_id: turnoActivo.id }); onUpdate(); loadHistorial(); } }
                    else { 
                        const pass = window.prompt("Introduce la CLAVE MAESTRA de la empresa:");
                        const resV = await axios.post('/turnos/verificar-maestra', { company_id: user.company_id, password: pass });
                        if (resV.data.success) {
                            const b = window.prompt("Base Inicial?", "0");
                            if(b) { await axios.post('/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: b, company_id: user.company_id }); onUpdate(); loadHistorial(); }
                        } else { window.alert("Clave maestra incorrecta"); }
                    }
                }} className={`w-full py-5 rounded-3xl font-black text-white ${turnoActivo ? 'bg-red-500' : 'bg-blue-600'} transition-all active:scale-95 shadow-xl`}>
                    {turnoActivo ? "REALIZAR CIERRE" : "ABRIR NUEVA CAJA"}
                </button>
            </div>
            <div className="lg:col-span-2 bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                <div className="overflow-x-auto"><table className="w-full text-left min-w-[500px]"><thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Responsable</th><th>Base</th><th className="text-right">Ventas</th><th className="p-8 text-center">Estado</th></tr></thead><tbody>{(historial || []).map(t => (<tr key={t.id} className="border-b hover:bg-slate-50 transition"><td className="p-8 font-black">{t.nombre_usuario}</td><td>{fmt(t.base_caja)}</td><td className="text-right font-black text-blue-600">{fmt(t.total_vendido)}</td><td className="p-8 text-center uppercase text-[10px] font-black">{t.estado}</td></tr>))}</tbody></table></div>
            </div>
        </div>
    );
}

// --- VISTA VENTAS ---
function VentasView({ user, turnoActivo }) {
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [metodo, setMetodo] = useState('Efectivo');
  const [pagaCon, setPagaCon] = useState('');
  const load = useCallback(() => {
      if(user?.company_id) axios.get(`/productos?company_id=${user.company_id}`).then(res => setProductos(res.data));
  }, [user?.company_id]);
  useEffect(() => { load(); }, [load]);
  const totalVenta = cart.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  const devuelta = (parseFloat(pagaCon) || 0) - totalVenta;
  const addToCart = useCallback((prod) => {
      setCart(prev => {
        const existe = prev.find(item => item.id === prod.id);
        if (existe) return prev.map(item => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item);
        return [...prev, { ...prod, cantidad: 1 }];
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
      if(metodo === 'Efectivo' && (parseFloat(pagaCon) < totalVenta || !pagaCon)) return window.alert("Monto insuficiente.");
      try {
          const res = await axios.post('/ventas', { productos: cart, responsable: user.nombre, turno_id: turnoActivo.id, metodo_pago: metodo, pago_recibido: pagaCon, cambio: devuelta, company_id: user.company_id });
          if(res.data.success) {
              imprimirFactura(cart, totalVenta, user.nombre, metodo, null, pagaCon, devuelta);
              setCart([]); setPagaCon(''); window.alert("Venta exitosa."); load();
          }
      } catch (e) { window.alert("Error servidor."); }
  };
  if(!turnoActivo) return <div className="text-center p-20 opacity-30 font-black uppercase"><h2>Caja Cerrada</h2></div>;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-[30px] shadow-sm border border-blue-50">
              <div className="flex items-center bg-slate-50 p-4 rounded-2xl border focus-within:ring-2 ring-blue-500 transition-all">
                <ScanBarcode className="text-slate-400 mr-3" />
                <input autoFocus className="bg-transparent border-none outline-none w-full font-bold" placeholder="Escanear o buscar..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
              </div>
              {searchTerm && <div className="absolute bg-white border rounded-2xl shadow-2xl z-50 p-4 w-full md:w-1/2 mt-2 max-h-60 overflow-auto">{(productos || []).filter(p=>p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.includes(searchTerm)).map(p=>(<div key={p.id} onClick={()=>addToCart(p)} className="p-3 border-b cursor-pointer hover:bg-blue-50 font-black text-slate-700 text-sm">{p.nombre}</div>))}</div>}
            </div>
            <div className="bg-white p-6 rounded-[30px] shadow-sm border overflow-hidden">
                <div className="overflow-x-auto"><table className="w-full text-left min-w-[400px]"><thead className="text-[10px] font-black uppercase text-slate-400 border-b"><tr><th className="pb-4">Producto</th><th>Cant</th><th>Total</th><th></th></tr></thead><tbody>{cart.map((item, i) => (<tr key={i} className="border-b"><td className="py-4 font-bold text-sm">{item.nombre}</td><td><input type="number" className="w-12 border rounded text-center font-bold" value={item.cantidad} onChange={(e) => setCart(cart.map(it => it.id === item.id ? { ...it, cantidad: parseInt(e.target.value) || 1 } : it))} /></td><td className="font-black text-sm">{fmt(item.precio * item.cantidad)}</td><td><button onClick={()=>setCart(cart.filter(it => it.id !== item.id))} className="text-red-500 font-bold p-2">X</button></td></tr>))}</tbody></table></div>
            </div>
        </div>
        <div className="bg-white p-8 rounded-[30px] md:rounded-[40px] shadow-xl border flex flex-col justify-between h-fit sticky top-10">
            <div className="space-y-6">
                <div className="text-center"><p className="text-[10px] font-black uppercase text-slate-300">Total</p><h1 className="text-4xl md:text-5xl font-black text-blue-600 tracking-tighter">{fmt(totalVenta)}</h1></div>
                <div className="flex gap-2"><button onClick={()=>setMetodo('Efectivo')} className={`flex-1 p-3 rounded-2xl font-bold border text-xs ${metodo==='Efectivo'?'bg-green-50 border-green-500 text-green-700 shadow-xl shadow-green-50':'bg-white text-slate-400'}`}>EFECTIVO</button><button onClick={()=>setMetodo('Transferencia')} className={`flex-1 p-3 rounded-2xl font-bold border text-xs ${metodo==='Transferencia'?'bg-blue-50 border-blue-300 text-blue-700 shadow-xl shadow-blue-100':'bg-white text-slate-400'}`}>BANCO</button></div>
                {metodo === 'Efectivo' && <div className="bg-slate-50 p-4 rounded-3xl border-2 border-dashed border-slate-200"><div className="flex justify-between items-center mb-2 text-sm"><span>Recibido:</span><input type="number" className="w-20 p-2 rounded-xl text-right font-black text-green-600 outline-none" value={pagaCon} onChange={e=>setPagaCon(e.target.value)} /></div><div className="flex justify-between font-black text-blue-600 text-sm border-t pt-2"><span>Cambio:</span><span>{fmt(devuelta)}</span></div></div>}
            </div>
            <button onClick={procesar} className="w-full bg-blue-600 text-white font-black py-5 rounded-[25px] shadow-xl hover:scale-105 transition-all active:scale-95 text-lg mt-6 tracking-tight">CONFIRMAR VENTA</button>
        </div>
    </div>
  );
}

// --- VISTA INVENTARIO ---
function InventarioView({ user }) {
  const [mode, setMode] = useState('list'); 
  const [productos, setProductos] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [selectedProd, setSelectedProd] = useState(null);
  const [form, setForm] = useState({ nombre: '', sku: '', precio: '', costo: 0, stock: 0, bodega_id: 1, lote: '', vencimiento: '' });
  const [ajuste, setAjuste] = useState({ id: '', cantidad: 0 });

  const load = useCallback(async () => {
    if(!user?.company_id) return;
    const resP = await axios.get(`/productos?company_id=${user.company_id}`);
    const resB = await axios.get(`/bodegas?company_id=${user.company_id}`);
    setProductos(Array.isArray(resP.data) ? resP.data : []);
    setBodegas(Array.isArray(resB.data) ? resB.data : []);
  }, [user?.company_id]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (e) => {
      e.preventDefault();
      await axios.put(`/productos/${selectedProd.id}`, selectedProd);
      window.alert("Actualizado."); setMode('list'); load();
  };

  return (
    <div className="space-y-10 animate-fade-in">
        <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm overflow-x-auto">
            <button onClick={()=>setMode('list')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${mode==='list'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Stock y Lotes</button>
            <button onClick={()=>setMode('ajuste')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${mode==='ajuste'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Ajustar Stock</button>
        </div>

        {mode === 'list' ? (
            <div className="space-y-10">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-fit">
                    <h3 className="font-black text-xl mb-8 tracking-tighter uppercase italic text-slate-800">Ingresar Lote</h3>
                    <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/productos', {...form, company_id: user.company_id}); load();}} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Nombre" onChange={e=>setForm({...form, nombre:e.target.value})} required/>
                        <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Lote" onChange={e=>setForm({...form, lote:e.target.value})} required/>
                        <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" type="date" onChange={e=>setForm({...form, vencimiento:e.target.value})} required/>
                        <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold" type="number" placeholder="Precio" onChange={e=>setForm({...form, precio:e.target.value})} required/>
                        <button className="bg-blue-600 text-white font-black rounded-2xl col-span-2 shadow-xl hover:scale-105">REGISTRAR</button>
                    </form>
                </div>
                <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                    <div className="overflow-x-auto"><table className="w-full text-left min-w-[600px]"><thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Producto</th><th>Bodega</th><th>Lote</th><th>Stock</th><th></th></tr></thead><tbody>{(productos || []).map(p=>(<tr key={p.id} className="border-b hover:bg-slate-50 transition"><td className="p-8 font-black text-slate-800">{p.nombre}</td><td className="text-blue-600 font-bold">{(bodegas || []).find(b=>b.id === p.bodega_id)?.nombre || 'S/B'}</td><td>{p.lote}</td><td className="font-black">{p.stock}</td><td className="p-8"><button onClick={()=>{setSelectedProd(p); setMode('detalle');}} className="p-3 bg-slate-100 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><History size={16}/></button></td></tr>))}</tbody></table></div>
                </div>
            </div>
        ) : (
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 h-fit max-w-xl">
                <h3 className="font-black text-xl mb-8 tracking-tighter uppercase italic text-green-600">Aumentar Stock</h3>
                <form onSubmit={async (e)=>{e.preventDefault(); await axios.put('/productos/stock', ajuste); load(); window.alert("Actualizado.");}} className="space-y-4">
                    <select className="w-full p-4 bg-slate-50 border-none rounded-3xl font-black text-slate-700" onChange={e=>setAjuste({...ajuste, id: e.target.value})}>
                        <option>-- Seleccionar Producto --</option>{(productos || []).map(p=><option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>)}
                    </select>
                    <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" type="number" placeholder="Cantidad a sumar" onChange={e=>setAjuste({...ajuste, cantidad: e.target.value})}/>
                    <button className="w-full bg-green-600 text-white font-black py-4 rounded-2xl shadow-xl">ACTUALIZAR STOCK</button>
                </form>
            </div>
        )}

        {mode === 'detalle' && selectedProd && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
                <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl h-fit">
                    <h2 className="text-3xl font-black tracking-tighter mb-8 uppercase italic">{selectedProd.nombre}</h2>
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div><label className="text-[10px] font-black uppercase text-slate-500">Proveedor</label><input className="w-full bg-slate-800 p-4 rounded-2xl border-none mt-1 font-bold" value={selectedProd.proveedor || ''} onChange={e=>setSelectedProd({...selectedProd, proveedor: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-[10px] font-black uppercase text-slate-500">Costo</label><input type="number" className="w-full bg-slate-800 p-4 rounded-2xl border-none mt-1 font-bold" value={selectedProd.costo || 0} onChange={e=>setSelectedProd({...selectedProd, costo: e.target.value})} /></div>
                            <div><label className="text-[10px] font-black uppercase text-slate-500">Precio</label><input type="number" className="w-full bg-slate-800 p-4 rounded-2xl border-none mt-1 font-bold" value={selectedProd.precio || 0} onChange={e=>setSelectedProd({...selectedProd, precio: e.target.value})} /></div>
                        </div>
                        <button className="w-full py-5 bg-blue-600 rounded-3xl font-black shadow-xl">GUARDAR CAMBIOS</button>
                        <button onClick={()=>setMode('list')} className="w-full text-slate-500 font-bold text-xs uppercase tracking-widest">Cancelar</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}

// --- VISTA NÓMINA ---
function NominaView({ user }) {
  const [mode, setMode] = useState('liquidar');
  const [empleados, setEmpleados] = useState([]);
  const [nominas, setNominas] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null); 
  const [empHistory, setEmpHistory] = useState([]);
  const [formEmp, setFormEmp] = useState({ nombre: '', documento: '', cargo: '', salario: '', email: '', eps: '', arl: '', pension: '' });
  const [formLiq, setFormLiq] = useState({ empleado_id: '', dias: 30, extras: 0, tipo_extra: 'Diurna', metodo: 'Transferencia', banco: '', cuenta: '' });
  const [preview, setPreview] = useState(null);

  const load = useCallback(() => { 
    if(!user?.company_id) return;
    axios.get(`/empleados?company_id=${user.company_id}`).then(res => setEmpleados(Array.isArray(res.data) ? res.data : [])); 
    axios.get(`/nomina/historial?company_id=${user.company_id}`).then(res => setNominas(Array.isArray(res.data) ? res.data : [])); 
  }, [user?.company_id]);
  useEffect(() => { load(); }, [load]);

  const verPerfil = async (emp) => {
      setSelectedEmp(emp);
      const res = await axios.get(`/empleados/${emp.id}/historial`);
      setEmpHistory(Array.isArray(res.data) ? res.data : []);
      setMode('perfil');
  };

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
      <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm overflow-x-auto">
        {['liquidar', 'empleados', 'history'].map(m => <button key={m} onClick={()=>{setMode(m); setSelectedEmp(null);}} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${mode===m || (mode==='perfil' && m==='empleados') ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-800'}`}>{m}</button>)}
      </div>
      {mode === 'liquidar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white p-12 rounded-[40px] shadow-xl border border-green-100"><h3 className="font-black text-2xl mb-8 text-green-800 tracking-tighter italic"><Calculator/> LIQUIDADOR</h3><div className="space-y-6"><div><select className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black text-slate-700" onChange={e=>setFormLiq({...formLiq, empleado_id: e.target.value})}><option>-- Empleado --</option>{(empleados || []).map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div><div className="grid grid-cols-2 gap-6"><div><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Días</label><input type="number" className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black" value={formLiq.dias} onChange={e=>setFormLiq({...formLiq, dias: e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Extras</label><input type="number" className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black" value={formLiq.extras} onChange={e=>setFormLiq({...formLiq, extras: e.target.value})}/></div></div><div><select className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black text-slate-700" value={formLiq.tipo_extra} onChange={e=>setFormLiq({...formLiq, tipo_extra: e.target.value})}><option value="Diurna">Diurna</option><option value="Nocturna">Nocturna</option><option value="Dominical">Dominical</option><option value="Recargo_Nocturno">Recargo</option></select></div><button onClick={calcular} className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl shadow-xl hover:bg-black transition-all">CALCULAR</button></div></div>
              <div className="bg-white p-12 rounded-[40px] shadow-2xl border-l-[12px] border-blue-600 flex flex-col justify-between">{preview ? (<div className="space-y-6 animate-fade-in"><div className="text-center border-b pb-8"><h4 className="text-3xl font-black text-slate-800 tracking-tighter">{preview.nombre}</h4></div><div className="bg-blue-600 p-8 rounded-[32px] text-center text-5xl font-black text-white shadow-xl shadow-blue-100">{fmt(preview.neto)}</div><button onClick={async ()=>{if(window.confirm(`¿Confirmar pago a ${preview.nombre}?`)){await axios.post('/api/nomina/liquidar', {...formLiq, extras: formLiq.extras, responsable: user.nombre, company_id: user.company_id}); window.alert("Éxito"); load(); setMode('history'); setPreview(null);}}} className="w-full bg-slate-900 text-white font-black py-6 rounded-[32px] shadow-xl hover:scale-102 transition-all active:scale-95">CONFIRMAR PAGO</button></div>) : <div className="h-full flex items-center justify-center opacity-20 flex-col"><Mail size={100}/><p className="font-black mt-4 uppercase tracking-widest">Listo</p></div>}</div>
          </div>
      )}
      {mode === 'empleados' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 h-fit"><h3 className="font-black text-xl mb-8 tracking-tighter text-slate-800 uppercase italic">Vincular</h3><form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/api/empleados', {...formEmp, company_id: user.company_id}); load(); setFormEmp({nombre:'',email:'',salario:'',eps:'',arl:'',pension:''});}} className="space-y-4"><input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Nombre" value={formEmp.nombre} onChange={e=>setFormEmp({...formEmp, nombre: e.target.value})} required/><input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" type="email" placeholder="Email" value={formEmp.email} onChange={e=>setFormEmp({...formEmp, email: e.target.value})} required/><input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" type="number" placeholder="Salario" value={formEmp.salario} onChange={e=>setFormEmp({...formEmp, salario: e.target.value})} required/><div className="grid grid-cols-3 gap-2"><input className="p-3 bg-slate-50 border-none rounded-xl text-[10px] uppercase font-black" placeholder="EPS" value={formEmp.eps} onChange={e=>setFormEmp({...formEmp, eps: e.target.value})}/><input className="p-3 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase" placeholder="ARL" value={formEmp.arl} onChange={e=>setFormEmp({...formEmp, arl: e.target.value})}/><input className="p-3 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase" placeholder="F.P" value={formEmp.pension} onChange={e=>setFormEmp({...formEmp, pension: e.target.value})}/></div><button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl">VINCULAR</button></form></div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit pr-2">{(empleados || []).map(e=>(<div key={e.id} onClick={()=>verPerfil(e)} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center gap-6 hover:scale-[1.02] transition-all cursor-pointer group"><div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">{e.nombre.charAt(0)}</div><div className="overflow-hidden"><p className="font-black text-slate-800 text-lg tracking-tighter truncate">{e.nombre}</p><p className="text-xl font-black text-green-600 mt-1">{fmt(e.salario)}</p></div></div>))}</div>
        </div>
      )}
      {mode === 'perfil' && selectedEmp && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
              <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl h-fit">
                  <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl font-black mb-6">{selectedEmp.nombre.charAt(0)}</div>
                  <h2 className="text-3xl font-black tracking-tighter mb-1 leading-none">{selectedEmp.nombre}</h2>
                  <p className="text-blue-400 font-bold text-sm mb-8 tracking-tight">{selectedEmp.email}</p>
                  <div className="space-y-4 border-t border-slate-800 pt-8 text-xs font-black uppercase tracking-widest">
                      <div className="flex justify-between"><span>EPS</span><span className="text-green-400">{selectedEmp.eps || 'N/A'}</span></div>
                      <div className="flex justify-between"><span>ARL</span><span className="text-orange-400">{selectedEmp.arl || 'N/A'}</span></div>
                      <div className="flex justify-between"><span>PENSIÓN</span><span className="text-purple-400">{selectedEmp.pension_fund || 'N/A'}</span></div>
                  </div>
                  <button onClick={()=>setMode('empleados')} className="w-full mt-10 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-xs transition-all text-slate-300">VOLVER</button>
              </div>
              <div className="lg:col-span-2 space-y-6">
                  <h3 className="font-black text-2xl tracking-tighter text-slate-800 uppercase italic">Historial de Pagos</h3>
                  <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden pr-2"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest border-b"><tr className="border-b"><th className="p-6">Fecha</th><th className="text-right p-6">Neto Pagado</th></tr></thead><tbody>{(empHistory || []).map(h => (<tr key={h.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-6 text-sm font-bold text-slate-500">{new Date(h.fecha_pago).toLocaleDateString()}</td><td className="p-6 text-right font-black text-blue-600">{fmt(h.neto_pagar)}</td></tr>))}</tbody></table></div></div>
              </div>
          </div>
      )}
      {mode === 'history' && (
          <div className="bg-white rounded-[40px] shadow-sm overflow-hidden border border-slate-100 pr-2"><div className="overflow-x-auto"><table className="w-full text-left text-sm min-w-[500px]"><thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 border-b"><tr className="tracking-widest"> <th className="p-8">Fecha Pago</th><th>Empleado</th><th className="p-8 text-right">Neto Pagado</th></tr></thead><tbody>{(nominas || []).map(n => (<tr key={n.id} className="border-b hover:bg-slate-50 transition"><td className="p-8 text-xs font-black text-slate-500">{new Date(n.fecha_pago).toLocaleDateString()}</td><td className="font-black text-slate-800 text-lg tracking-tight">{n.nombre_empleado}</td><td className="p-8 font-black text-green-600 text-xl text-right">{fmt(n.neto_pagar)}</td></tr>))}</tbody></table></div></div>
      )}
    </div>
  );
}

// --- VISTA CONTABILIDAD ---
function ContabilidadView({ user }) {
    const [subTab, setSubTab] = useState('ventas');
    const [datos, setDatos] = useState([]);
    const [sort, setSort] = useState('fecha DESC');

    const load = useCallback(async () => {
        if(!user?.company_id) return;
        const res = await axios.get(`/contabilidad/${subTab}?sort=${sort}&company_id=${user.company_id}`);
        setDatos(Array.isArray(res.data) ? res.data : []);
    }, [subTab, sort, user?.company_id]);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm overflow-x-auto">
                <button onClick={()=>setSubTab('ventas')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${subTab==='ventas'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Libro Ventas</button>
                <button onClick={()=>setSubTab('compras')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${subTab==='compras'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Proveedores</button>
            </div>
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 overflow-hidden pr-2">
                <div className="overflow-x-auto"><table className="w-full text-left min-w-[600px]"><thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-6">Fecha</th><th>Detalle</th><th className="text-right p-6">Total</th></tr></thead><tbody>{(datos || []).map(d=>(<tr key={d.id} className="border-b hover:bg-slate-50 transition-all"><td className="p-6 text-xs font-bold text-slate-400">{new Date(d.fecha).toLocaleDateString()}</td><td className="font-black text-slate-700 uppercase text-xs">{d.nombre_producto || d.proveedor_nombre}</td><td className="p-6 text-right font-black text-blue-600">{fmt(d.total)}</td></tr>))}</tbody></table></div>
            </div>
        </div>
    );
}

// --- VISTA PRODUCCIÓN ---
function ProduccionView({ user }) {
    const [subTab, setSubTab] = useState('materia');
    const [materias, setMaterias] = useState([]);
    const [ordenes, setOrdenes] = useState([]);
    const [formMateria, setFormMateria] = useState({ nombre: '', unidad: 'mg', cantidad: 0, proposito: '', costo: 0 });

    const load = useCallback(async () => {
        if(!user?.company_id) return;
        const resM = await axios.get(`/produccion/materia?company_id=${user.company_id}`);
        const resO = await axios.get(`/produccion/ordenes?company_id=${user.company_id}`);
        setMaterias(Array.isArray(resM.data) ? resM.data : []);
        setOrdenes(Array.isArray(resO.data) ? resO.data : []);
    }, [user?.company_id]);

    useEffect(() => { load(); }, [load, subTab]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm overflow-x-auto">
                <button onClick={()=>setSubTab('materia')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${subTab==='materia'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Insumos</button>
                <button onClick={()=>setSubTab('ordenes')} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${subTab==='ordenes'?'bg-blue-600 text-white shadow-xl':'text-slate-400'}`}>Órdenes</button>
            </div>
            {subTab === 'materia' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border h-fit">
                        <h3 className="font-black text-xl mb-6 uppercase italic">Ingresar Insumo</h3>
                        <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/produccion/materia', {...formMateria, company_id: user.company_id}); load();}} className="space-y-4">
                            <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Nombre" onChange={e=>setFormMateria({...formMateria, nombre: e.target.value})} required/>
                            <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black" onChange={e=>setFormMateria({...formMateria, unidad: e.target.value})}>
                                <option value="mg">mg</option><option value="g">g</option><option value="ml">ml</option><option value="unidades">unidades</option>
                            </select>
                            <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" type="number" placeholder="Cantidad" onChange={e=>setFormMateria({...formMateria, cantidad: e.target.value})} required/>
                            <button className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl">GUARDAR</button>
                        </form>
                    </div>
                    <div className="lg:col-span-2 bg-white rounded-[40px] shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase"><tr><th className="p-6">Insumo</th><th>Cantidad</th></tr></thead>
                            <tbody>{(materias || []).map(m=>(<tr key={m.id} className="border-b"><td className="p-6 font-black">{m.nombre}</td><td>{m.cantidad} {m.unidad_medida}</td></tr>))}</tbody></table>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- VISTA ADMIN ---
function AdminView({ user }) {
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' });
    const load = useCallback(() => {
        if(user?.company_id) axios.get(`/admin/usuarios?company_id=${user.company_id}`).then(res => setUsuarios(Array.isArray(res.data) ? res.data : []));
    }, [user?.company_id]);
    useEffect(() => { load(); }, [load]);
    const handleSave = async (e) => {
        e.preventDefault();
        if (form.id) await axios.put(`/admin/usuarios/${form.id}`, form);
        else await axios.post('/admin/usuarios', { ...form, company_id: user.company_id });
        setForm({ id: null, nombre: '', email: '', password: '', cargo: 'Vendedor' }); load();
    };
    return (
        <div className="space-y-10 animate-fade-in">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 h-fit">
                <h3 className="font-black text-xl mb-6 tracking-tighter uppercase italic">{form.id ? 'Editar Acceso' : 'Crear Acceso'}</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/>
                    <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required/>
                    <select className="p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-700 text-sm" value={form.cargo} onChange={e=>setForm({...form, cargo: e.target.value})}>
                        <option value="Admin">Admin</option><option value="Vendedor">Vendedor</option><option value="Contador">Contador</option>
                    </select>
                    <button className="bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-[10px]">Guardar</button>
                </form>
            </div>
            <div className="bg-white rounded-[40px] shadow-sm overflow-hidden border border-slate-100">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-8">Nombre</th><th>Email</th><th>Rol</th><th></th></tr></thead>
                    <tbody>{(usuarios || []).map(u => (<tr key={u.id} className="border-b hover:bg-slate-50 transition"><td className="p-8 font-black">{u.nombre}</td><td>{u.email}</td><td><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{u.cargo}</span></td><td><button onClick={()=>setForm(u)} className="text-blue-600 font-bold text-xs">Editar</button></td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}

// --- PÁGINA PSE ---
function PSEPage({ onBack }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white p-12 rounded-[50px] shadow-2xl max-w-2xl w-full text-center border-t-[20px] border-blue-600">
                <h1 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter uppercase italic">AccuCloud PRO 2026</h1>
                <div className="bg-blue-50 p-10 rounded-[40px] mb-10 border border-blue-100">
                    <h2 className="text-7xl font-black text-blue-600 tracking-tighter">$600.000</h2>
                    <p className="text-xs text-blue-400 mt-4 font-bold uppercase tracking-widest">Pago Mensual vía PSE</p>
                </div>
                <button onClick={()=>window.alert("Redirigiendo...")} className="w-full py-6 bg-slate-900 text-white font-black rounded-[30px] shadow-2xl flex items-center justify-center gap-4 hover:bg-black transition-all text-sm"><CreditCard /> PAGAR CON PSE</button>
                <button onClick={onBack} className="mt-8 text-slate-400 font-bold text-xs uppercase tracking-widest underline">VOLVER</button>
            </div>
        </div>
    );
}

// --- HELPERS ---
function MenuButton({ icon, label, active, onClick }) { return <button onClick={onClick} className={`w-full flex items-center px-6 py-5 rounded-[24px] mb-2 transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 -translate-y-1 scale-105' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}><span className="mr-4">{icon}</span><span className="text-sm font-black tracking-tight">{label}</span></button>; }
function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return <div className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow duration-300">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center mb-4 ${c[color]}`}>{icon}</div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-xs">{title}</p>
        <h3 className="text-sm md:text-2xl font-black text-slate-800 truncate">{value}</h3>
    </div>; 
}

export default App;