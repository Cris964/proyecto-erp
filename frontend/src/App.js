import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Search, DollarSign, 
  AlertTriangle, TrendingUp, Edit, X, Wallet, Clock, Lock, CreditCard, 
  Banknote, Landmark, Upload, Mail, Calculator, DownloadCloud, ScanBarcode, 
  Plus, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
axios.defaults.baseURL = window.location.origin;

const fmt = (number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(number || 0);

// ==========================================
//    FUNCIÓN GLOBAL: IMPRESIÓN DE FACTURA
// ==========================================
const imprimirFactura = (venta, cliente) => {
    try {
        const doc = new jsPDF({ unit: 'mm', format: [80, 150] }); 
        const ancho = 80;
        const nombreCliente = cliente?.nombre || "Consumidor Final";
        const nitCliente = cliente?.nit || "222222222222";

        doc.setFontSize(14);
        doc.text("ACCUCLOUD ERP", ancho/2, 10, {align: 'center'});
        doc.setFontSize(7);
        doc.text("------------------------------------------", ancho/2, 15, {align: 'center'});

        doc.setFontSize(8);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 5, 22);
        doc.text(`Cajero: ${venta.responsable || 'Cajero'}`, 5, 26);
        doc.text(`Cliente: ${nombreCliente}`, 5, 30);
        doc.text(`NIT/CC: ${nitCliente}`, 5, 34);

        autoTable(doc, {
            startY: 40,
            margin: { left: 2, right: 2 },
            head: [['Cant', 'Producto', 'Total']],
            body: [
                [
                    venta.cantidad || 1, 
                    (venta.nombre_producto || 'Producto').substring(0, 15), 
                    fmt(venta.total || 0)
                ]
            ],
            theme: 'plain',
            styles: { fontSize: 7, cellPadding: 1 }
        });

        const finalY = doc.lastAutoTable.finalY + 8;
        doc.setFontSize(10);
        doc.text(`TOTAL: ${fmt(venta.total || 0)}`, ancho - 5, finalY, { align: 'right' });
        
        doc.setFontSize(7);
        doc.text(`Paga con: ${fmt(venta.pago_recibido || 0)}`, 5, finalY + 5);
        doc.text(`Cambio: ${fmt(venta.cambio || 0)}`, 5, finalY + 9);
        doc.text("¡Gracias por su compra!", ancho / 2, finalY + 18, { align: 'center' });

        const pdfOutput = doc.output('bloburl');
        window.open(pdfOutput, '_blank');

    } catch (error) {
        console.error("Error detallado:", error);
        window.alert("La venta se guardó pero falló la generación del PDF.");
    }
};

// ==========================================
//           COMPONENTE PRINCIPAL
// ==========================================
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

// --- PANTALLA DE REGISTRO ---
function RegisterScreen({ onBack }) {
    const [form, setForm] = useState({ nombre: '', email: '', password: '' });
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/register', form);
            window.alert("Empresa registrada con éxito.");
            onBack();
        } catch (e) { window.alert("Error al registrar."); }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-black mb-2 text-slate-800">Nueva Cuenta</h2>
                <p className="text-slate-400 mb-8">Gestión Profesional 2026.</p>
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

// --- LOGIN ---
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
        <h1 className="text-5xl font-black text-center text-slate-800 mb-2 tracking-tighter italic">AccuCloud<span className="text-blue-600">.</span></h1>
        <p className="text-center text-slate-400 font-medium mb-10 text-[10px] uppercase tracking-widest">Gestión Inteligente 2026</p>
        <form onSubmit={handle} className="space-y-4">
          <input className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-blue-500 font-bold" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 ring-blue-500 font-bold" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" />
          <button className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all">INGRESAR</button>
        </form>
        <div className="mt-8 text-center">
            <button onClick={onGoToRegister} className="text-blue-600 font-black text-sm hover:underline">REGISTRAR NUEVA EMPRESA</button>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD LAYOUT ---
function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [turnoActivo, setTurnoActivo] = useState(null);

  const recargarTurno = useCallback(() => {
    if (user) axios.get(`/turnos/activo/${user.id}`).then(res => setTurnoActivo(res.data));
  }, [user]);

  useEffect(() => { recargarTurno(); }, [recargarTurno]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="w-72 bg-white border-r flex flex-col z-20 shadow-xl px-6">
        <div className="h-28 flex items-center font-black text-2xl text-slate-800 tracking-tighter italic uppercase">ACCUCLOUD <span className="text-blue-600">.</span></div>
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
        <div className="py-8 border-t space-y-4">
            <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black">{user.nombre.charAt(0)}</div>
                <div className="overflow-hidden"><p className="font-black text-slate-800 text-sm truncate">{user.nombre}</p></div>
            </div>
            <button onClick={onLogout} className="w-full text-red-500 text-xs font-black py-2 hover:bg-red-50 rounded-xl transition">CERRAR SESIÓN</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-10">
        <header className="flex justify-between items-center mb-10">
            <div><h2 className="text-4xl font-black text-slate-800 tracking-tighter capitalize">{activeTab}</h2><p className="text-slate-400 font-medium">Gestión Profesional 2026</p></div>
            <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-2">
                    {turnoActivo ? <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-black flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> CAJA ABIERTA</div> : <div className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-black">CAJA CERRADA</div>}
                </div>
            </div>
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

// --- DASHBOARD ---
function ResumenView() {
  const [data, setData] = useState({ cajaMayor: 0, cajaMenor: 0, valorInventario: 0, lowStock: 0, recentSales: [] });
  useEffect(() => { axios.get('/dashboard-data').then(res => setData(res.data)); }, []);

  const chartData = [
      { name: 'Lun', ventas: 400 }, { name: 'Mar', ventas: 300 }, { name: 'Mie', ventas: 600 },
      { name: 'Jue', ventas: 800 }, { name: 'Vie', ventas: 500 }, { name: 'Sab', ventas: 900 }, { name: 'Dom', ventas: 200 }
  ];

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
              <h3 className="font-black text-slate-800 mb-6">Desempeño Semanal</h3>
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)'}} />
                      <Bar dataKey="ventas" radius={[10, 10, 0, 0]}>
                          {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 5 ? '#2563eb' : '#93c5fd'} />
                          ))}
                      </Bar>
                  </BarChart>
              </ResponsiveContainer>
          </div>
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
              <h3 className="font-black text-slate-800 mb-6 tracking-tighter">Últimas Ventas</h3>
              <div className="space-y-4">
                  {data.recentSales.map(v => (
                      <div key={v.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all">
                          <div className="flex gap-3 text-sm">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 shadow-sm">{v.nombre_producto.charAt(0)}</div>
                              <div><p className="font-black text-slate-700">{v.nombre_producto}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{v.metodo_pago}</p></div>
                          </div>
                          <span className="font-black text-slate-800">{fmt(v.total)}</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
}

// --- VISTA CAJA ---
function CajaView({ user, turnoActivo, onUpdate }) {
    const [historial, setHistorial] = useState([]);
    const loadHistorial = useCallback(() => {
        axios.get('/turnos/historial')
            .then(res => { if (Array.isArray(res.data)) setHistorial(res.data); else setHistorial([]); })
            .catch(() => setHistorial([]));
    }, []);

    useEffect(() => { loadHistorial(); }, [loadHistorial]);

    const iniciarTurno = async () => {
        const base = window.prompt("¿Base Inicial?", "0");
        if (base === null) return;
        await axios.post('/turnos/iniciar', { usuario_id: user.id, nombre_usuario: user.nombre, base_caja: base });
        onUpdate(); loadHistorial();
    };
    const finalizarTurno = async () => {
        if(!window.confirm("¿Cerrar caja ahora?")) return;
        await axios.put('/turnos/finalizar', { turno_id: turnoActivo.id });
        onUpdate(); loadHistorial();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="bg-white p-10 rounded-[40px] shadow-xl border border-blue-50 text-center flex flex-col justify-center">
                <div className={`w-24 h-24 mx-auto rounded-[32px] flex items-center justify-center mb-8 ${turnoActivo ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>{turnoActivo ? <ScanBarcode size={48}/> : <Lock size={48}/>}</div>
                <h3 className="text-3xl font-black mb-2 tracking-tighter">{turnoActivo ? "CAJA ABIERTA" : "CAJA CERRADA"}</h3>
                {turnoActivo && (
                    <div className="bg-slate-50 p-6 rounded-3xl space-y-4 mb-8 text-left border border-slate-100">
                        <div className="flex justify-between items-center"><span className="text-xs font-black text-slate-400 uppercase">Base Apertura</span><span className="font-black text-slate-700">{fmt(turnoActivo.base_caja)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs font-black text-slate-400 uppercase">Ventas Hoy</span><span className="font-black text-green-600 text-xl">{fmt(turnoActivo.total_vendido)}</span></div>
                    </div>
                )}
                <button onClick={turnoActivo ? finalizarTurno : iniciarTurno} className={`w-full py-5 rounded-3xl font-black text-white shadow-2xl transition transform active:scale-95 ${turnoActivo ? 'bg-red-500' : 'bg-blue-600'}`}>{turnoActivo ? "REALIZAR CIERRE" : "ABRIR NUEVA CAJA"}</button>
            </div>
            <div className="lg:col-span-2 bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center"><h4 className="font-black tracking-tighter text-lg">Historial de Turnos</h4></div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                        <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                            <th className="p-8">Responsable</th>
                            <th>Base</th>
                            <th className="text-right">Ventas</th>
                            <th className="p-8 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(historial) && historial.map(t => (
                            <tr key={t.id} className="border-b hover:bg-slate-50 transition">
                                <td className="p-8">
                                    <p className="font-black text-slate-800">{t.nombre_usuario}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{new Date(t.fecha_inicio).toLocaleDateString()}</p>
                                </td>
                                <td className="font-bold text-slate-500">{fmt(t.base_caja)}</td>
                                <td className="text-right font-black text-blue-600">{fmt(t.total_vendido)}</td>
                                <td className="p-8 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${t.estado==='Abierto'?'bg-green-100 text-green-700':'bg-slate-100 text-slate-400'}`}>{t.estado.toUpperCase()}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- VISTA VENTAS (PUNTO DE VENTA 2026) ---
function VentasView({ user, turnoActivo }) {
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ventaForm, setVentaForm] = useState({ producto_id: '', cantidad: 1, precio: 0, nombre: '' });
  const [metodo, setMetodo] = useState('Efectivo');
  
  const [pagaCon, setPagaCon] = useState('');
  const [esElectronica, setEsElectronica] = useState(false);
  const [cliente, setCliente] = useState({ nombre: '', nit: '', email: '', tel: '' });

  const load = useCallback(() => axios.get('/productos').then(res => setProductos(res.data)), []);
  useEffect(() => { load(); }, [load]);

  const totalVenta = ventaForm.cantidad * ventaForm.precio;
  const devuelta = (parseFloat(pagaCon) || 0) - totalVenta;

  useEffect(() => {
    let barcode = "";
    const handleKey = (e) => {
        if(e.key === 'Enter') {
            const prod = productos.find(p => p.sku === barcode);
            if(prod) { setVentaForm({ producto_id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: 1 }); }
            barcode = "";
        } else { barcode += e.key; }
    };
    window.addEventListener('keypress', handleKey);
    return () => window.removeEventListener('keypress', handleKey);
  }, [productos]);

  const procesar = async () => {
      if(!ventaForm.producto_id) return window.alert("Selecciona un producto primero.");
      if(metodo === 'Efectivo' && (parseFloat(pagaCon) < totalVenta || !pagaCon)) return window.alert("El monto pagado es insuficiente.");

      try {
          const res = await axios.post('/ventas', {
              producto_id: ventaForm.producto_id,
              nombre_producto: ventaForm.nombre,
              precio_unitario: ventaForm.precio,
              cantidad: ventaForm.cantidad,
              responsable: user.nombre,
              turno_id: turnoActivo.id,
              metodo_pago: metodo,
              es_electronica: esElectronica,
              cliente: esElectronica ? cliente : { nombre: 'General', nit: '222' },
              pago_recibido: pagaCon || totalVenta,
              cambio: devuelta > 0 ? devuelta : 0
          });

          if(res.data.success) {
              imprimirFactura({ ...ventaForm, total: totalVenta, responsable: user.nombre, metodo_pago: metodo, pago_recibido: pagaCon, cambio: devuelta }, esElectronica ? cliente : null);
              setVentaForm({ producto_id: '', cantidad: 1, precio: 0, nombre: '' });
              setPagaCon(''); setEsElectronica(false); setSearchTerm('');
              window.alert("Venta Completada Correctamente.");
              load(); 
          }
      } catch (e) { window.alert("Error de conexión con el servidor."); }
  };

  if(!turnoActivo) return <div className="text-center p-20 opacity-30"><Lock size={80} className="mx-auto"/><h2>INICIA TURNO PARA VENDER</h2></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in">
        <div className="bg-white p-10 rounded-[40px] shadow-xl border border-blue-50">
            <h3 className="font-black text-2xl mb-8 flex items-center gap-3 tracking-tighter"><ScanBarcode className="text-blue-600"/> CAJA REGISTRADORA</h3>
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Buscar o Escanear</label>
                    <input autoFocus className="w-full p-4 border rounded-2xl bg-slate-50 font-bold" placeholder="Pasa la pistola..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                    {searchTerm && <div className="absolute bg-white border rounded-2xl shadow-2xl z-50 p-4 w-[400px] mt-2">
                        {productos.filter(p=>p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.includes(searchTerm)).map(p=>(
                            <div key={p.id} onClick={()=>{setVentaForm({producto_id:p.id,nombre:p.nombre,precio:p.precio,cantidad:1});setSearchTerm('');}} className="p-3 border-b hover:bg-blue-50 cursor-pointer font-black text-slate-700">{p.nombre}</div>
                        ))}
                    </div>}
                </div>
                {ventaForm.nombre && <div className="bg-blue-50 p-6 rounded-3xl flex justify-between items-center border border-blue-100"><span className="font-black text-blue-900">{ventaForm.nombre}</span><input type="number" className="w-20 p-2 rounded-xl text-center font-bold" value={ventaForm.cantidad} onChange={e=>setVentaForm({...ventaForm, cantidad: e.target.value})} /></div>}
                <div className="flex gap-4">
                    <button onClick={()=>setMetodo('Efectivo')} className={`flex-1 p-5 rounded-3xl font-black border-2 transition ${metodo==='Efectivo'?'bg-green-50 border-green-500 text-green-700 shadow-xl':'bg-white'}`}>EFECTIVO</button>
                    <button onClick={()=>setMetodo('Transferencia')} className={`flex-1 p-5 rounded-3xl font-black border-2 transition ${metodo==='Transferencia'?'bg-blue-50 border-blue-300 text-blue-700 shadow-xl':'bg-white'}`}>TRANSFERENCIA</button>
                </div>
                {metodo === 'Efectivo' && (
                    <div className="bg-slate-50 p-8 rounded-[32px] border-2 border-dashed border-slate-200 animate-slide-up">
                        <div className="flex justify-between items-center mb-4"><span>Paga con:</span><input type="number" className="w-40 p-4 rounded-2xl text-right font-black text-2xl text-green-600 outline-none" placeholder="$ 0" value={pagaCon} onChange={e=>setPagaCon(e.target.value)} /></div>
                        <div className="flex justify-between items-center border-t pt-4"><span className="font-black text-slate-400 text-xs">Devuelta:</span><span className={`text-2xl font-black ${devuelta < 0 ? 'text-red-500' : 'text-blue-600'}`}>{fmt(devuelta)}</span></div>
                    </div>
                )}
                <div className="p-6 bg-slate-900 rounded-[32px] text-white flex justify-between items-center cursor-pointer" onClick={()=>setEsElectronica(!esElectronica)}><div className="flex items-center gap-3"><Mail className="text-blue-400"/><span className="font-black tracking-tighter">FACTURA ELECTRÓNICA</span></div><div className={`w-12 h-6 rounded-full relative transition-colors ${esElectronica?'bg-blue-500':'bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${esElectronica?'left-7':'left-1'}`}></div></div></div>
                {esElectronica && <div className="grid grid-cols-2 gap-4 mt-6 animate-fade-in text-white">
                    <input className="p-4 bg-slate-800 border-none rounded-2xl text-xs font-bold text-white" placeholder="Nombre" onChange={e=>setCliente({...cliente, nombre: e.target.value})} />
                    <input className="p-4 bg-slate-800 border-none rounded-2xl text-xs font-bold text-white" placeholder="NIT" onChange={e=>setCliente({...cliente, nit: e.target.value})} />
                    <input className="p-4 bg-slate-800 border-none rounded-2xl text-xs font-bold text-white" placeholder="Email" onChange={e=>setCliente({...cliente, email: e.target.value})} />
                    <input className="p-4 bg-slate-800 border-none rounded-2xl text-xs font-bold text-white" placeholder="Tel" onChange={e=>setCliente({...cliente, tel: e.target.value})} />
                </div>}
            </div>
        </div>
        <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-slate-100 text-center flex flex-col justify-between">
            <div><p className="text-xs font-black text-slate-300 uppercase tracking-[4px] mb-4">Total a Recaudar</p><h1 className="text-7xl font-black text-slate-800 tracking-tighter mb-10">{fmt(totalVenta)}</h1></div>
            <button onClick={procesar} className="w-full bg-blue-600 text-white font-black py-7 rounded-[32px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-2xl mt-10">CONFIRMAR VENTA</button>
        </div>
    </div>
  );
}

// --- VISTA INVENTARIO ---
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
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      const productosImportados = data.map(item => ({
        nombre: item.Nombre || item.nombre,
        sku: item.SKU || item.sku,
        precio: item.Precio || item.precio,
        stock: item.Stock || item.stock,
        min_stock: item.Minimo || 5
      }));
      if (window.confirm(`¿Importar ${productosImportados.length} productos?`)) {
        try {
          await axios.post('/productos/importar', { productos: productosImportados, responsable: user.nombre });
          window.alert("✅ Carga masiva completada");
          load();
        } catch (error) { window.alert("❌ Error en el formato"); }
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-10 animate-fade-in">
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-xl tracking-tighter">Inventario 2026</h3>
                <label className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] cursor-pointer hover:bg-black flex items-center gap-2 shadow-xl">
                    <Upload size={14} className="text-blue-400"/> CARGA MASIVA EXCEL
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} className="hidden" />
                </label>
            </div>
            <form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/productos', {...form, responsable: user.nombre}); load(); setForm({nombre:'',sku:'',precio:'',stock:'',min_stock:5});}} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} required/>
                <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="SKU/Código" value={form.sku} onChange={e=>setForm({...form, sku: e.target.value})} required/>
                <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold" type="number" placeholder="Precio" value={form.precio} onChange={e=>setForm({...form, precio: e.target.value})} required/>
                <input className="p-4 bg-slate-50 border-none rounded-2xl font-bold" type="number" placeholder="Stock" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} required/>
                <button className="bg-blue-600 text-white font-black rounded-2xl p-4 shadow-xl">GUARDAR</button>
            </form>
        </div>
        <div className="bg-white rounded-[40px] shadow-sm overflow-hidden border border-slate-100">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                    <tr className="text-[10px] font-black uppercase text-slate-400 border-b"><th className="p-8">Producto</th><th>Código SKU</th><th>Precio</th><th>Stock</th><th className="p-8 text-center">Estado</th></tr>
                </thead>
                <tbody>
                    {productos.map(p=>(
                        <tr key={p.id} className="border-b hover:bg-slate-50 transition">
                            <td className="p-8 font-black text-slate-800">{p.nombre}</td><td className="font-mono text-slate-400">{p.sku}</td><td className="font-black text-slate-700">{fmt(p.precio)}</td><td className="font-black text-slate-800">{p.stock}</td>
                            <td className="p-8 text-center">{p.stock <= p.min_stock ? <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Crítico</span> : <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">OK</span>}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}

// --- VISTA NÓMINA ---
function NominaView({ user }) {
  const [mode, setMode] = useState('liquidar');
  const [empleados, setEmpleados] = useState([]);
  const [nominas, setNominas] = useState([]);
  const [formEmp, setFormEmp] = useState({ nombre: '', email: '', salario: '', eps: '', arl: '', pension: '' });
  const [formLiq, setFormLiq] = useState({ empleado_id: '', dias: 30, extras: 0, tipo_extra: 'Diurna', metodo: 'Transferencia', banco: '', cuenta: '' });
  const [preview, setPreview] = useState(null);
  const bancosCO = ["Bancolombia", "Nequi", "Daviplata", "Davienda", "Banco de Bogotá", "Lulo Bank", "Nu Bank", "Dale"];

  const load = useCallback(() => { axios.get('/empleados').then(res => setEmpleados(res.data)); axios.get('/nomina/historial').then(res => setNominas(res.data)); }, []);
  useEffect(() => { load(); }, [load]);

  const calcular = () => {
    const e = empleados.find(emp => emp.id === parseInt(formLiq.empleado_id));
    if(!e) return;
    const SMLV_2026 = 1750905;
    const AUX_TRANS_2026 = 249095;
    const S = parseFloat(e.salario);
    const basico = Math.round((S / 30) * parseFloat(formLiq.dias));
    const auxilio = (S <= (SMLV_2026 * 2)) ? Math.round((AUX_TRANS_2026 / 30) * parseFloat(formLiq.dias)) : 0;
    const valorHora = S / 240;
    let factor = 1.25;
    if (formLiq.tipo_extra === 'Nocturna') factor = 1.75;
    if (formLiq.tipo_extra === 'Dominical') factor = 2.00;
    if (formLiq.tipo_extra === 'Recargo_Nocturno') factor = 0.35;
    const valorExtras = Math.round((valorHora * factor) * parseFloat(formLiq.extras || 0));
    const devengado = basico + auxilio + valorExtras;
    const ibc = basico + valorExtras;
    const salud = Math.round(ibc * 0.04);
    const pension = Math.round(ibc * 0.04);
    const neto = devengado - salud - pension;
    setPreview({ nombre: e.nombre, basico, auxilio, extras: valorExtras, tipo_extra_label: formLiq.tipo_extra, salud, pension, neto });
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm">
        {['liquidar', 'empleados', 'history'].map(m => <button key={m} onClick={()=>setMode(m)} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${mode===m?'bg-blue-600 text-white shadow-xl shadow-blue-100':'text-slate-400 hover:text-slate-800'}`}>{m}</button>)}
      </div>
      {mode === 'empleados' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100"><h3 className="font-black text-xl mb-8 tracking-tighter">Vinculación</h3><form onSubmit={async (e)=>{e.preventDefault(); await axios.post('/empleados', formEmp); load(); setFormEmp({nombre:'',email:'',salario:'',eps:'',arl:'',pension:''});}} className="space-y-4"><input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Nombre" value={formEmp.nombre} onChange={e=>setFormEmp({...formEmp, nombre: e.target.value})} required/><input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" type="email" placeholder="Email" value={formEmp.email} onChange={e=>setFormEmp({...formEmp, email: e.target.value})} required/><input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" type="number" placeholder="Salario" value={formEmp.salario} onChange={e=>setFormEmp({...formEmp, salario: e.target.value})} required/><div className="grid grid-cols-3 gap-2"><input className="p-3 bg-slate-50 border-none rounded-xl text-[10px] uppercase" placeholder="EPS" value={formEmp.eps} onChange={e=>setFormEmp({...formEmp, eps: e.target.value})}/><input className="p-3 bg-slate-50 border-none rounded-xl text-[10px] uppercase" placeholder="ARL" value={formEmp.arl} onChange={e=>setFormEmp({...formEmp, arl: e.target.value})}/><input className="p-3 bg-slate-50 border-none rounded-xl text-[10px] uppercase" placeholder="F.P" value={formEmp.pension} onChange={e=>setFormEmp({...formEmp, pension: e.target.value})}/></div><button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl">VINCULAR</button></form></div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">{empleados.map(e=>(<div key={e.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-blue-200 transition-all"><div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">{e.nombre.charAt(0)}</div><div className="overflow-hidden"><p className="font-black text-slate-800 text-lg tracking-tighter truncate">{e.nombre}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{e.email}</p><p className="text-xl font-black text-green-600 mt-1">{fmt(e.salario)}</p></div></div>))}</div>
        </div>
      )}
      {mode === 'liquidar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white p-12 rounded-[40px] shadow-xl border border-green-100"><h3 className="font-black text-2xl mb-8 text-green-800 tracking-tighter flex items-center gap-3"><Calculator/> LIQUIDADOR 2026</h3><div className="space-y-6"><div><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 block mb-2">Empleado</label><select className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black" onChange={e=>setFormLiq({...formLiq, empleado_id: e.target.value})}><option>-- Seleccionar --</option>{empleados.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div><div className="grid grid-cols-2 gap-6"><div><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Días</label><input type="number" className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black" value={formLiq.dias} onChange={e=>setFormLiq({...formLiq, dias: e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Extras</label><input type="number" className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black" value={formLiq.extras} onChange={e=>setFormLiq({...formLiq, extras: e.target.value})}/></div></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-4">Tipo Recargo</label><select className="w-full p-5 bg-slate-50 border-none rounded-3xl font-black" value={formLiq.tipo_extra} onChange={e=>setFormLiq({...formLiq, tipo_extra: e.target.value})}><option value="Diurna">Diurna (1.25)</option><option value="Nocturna">Nocturna (1.75)</option><option value="Dominical">Dominical (2.00)</option><option value="Recargo_Nocturno">Recargo (0.35)</option></select></div><div className="flex gap-4"><button onClick={()=>setFormLiq({...formLiq, metodo: 'Efectivo'})} className={`flex-1 p-5 rounded-3xl font-black border-2 transition ${formLiq.metodo==='Efectivo'?'bg-green-50 border-green-500 text-green-700':'bg-white border-slate-50'}`}>EFECTIVO</button><button onClick={()=>setFormLiq({...formLiq, metodo: 'Transferencia'})} className={`flex-1 p-5 rounded-3xl font-black border-2 transition ${formLiq.metodo==='Transferencia'?'bg-blue-50 border-blue-500 text-blue-700':'bg-white border-slate-50'}`}>BANCO</button></div>{formLiq.metodo === 'Transferencia' && (<div className="grid grid-cols-2 gap-4 animate-fade-in"><select className="p-5 bg-slate-50 border-none rounded-3xl font-bold" onChange={e=>setFormLiq({...formLiq, banco: e.target.value})}><option>-- Banco --</option>{bancosCO.map(b=><option key={b}>{b}</option>)}</select><input className="p-5 bg-slate-50 border-none rounded-3xl font-bold" placeholder="Nro Cuenta" onChange={e=>setFormLiq({...formLiq, cuenta: e.target.value})} /></div>)}<button onClick={calcular} className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl shadow-xl hover:bg-black transition-all">CALCULAR RESUMEN</button></div></div>
              <div className="bg-white p-12 rounded-[40px] shadow-2xl border-l-[12px] border-blue-600 flex flex-col justify-between">{preview ? (<div className="space-y-6 animate-fade-in"><div className="text-center border-b pb-8"><h4 className="text-3xl font-black text-slate-800 tracking-tighter">{preview.nombre}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mt-2">Nómina 2026</p></div><div className="space-y-3 font-bold text-sm text-slate-600"><div className="flex justify-between"><span>Básico:</span><span className="text-slate-800">{fmt(preview.basico)}</span></div><div className="flex justify-between"><span>Auxilio:</span><span className="text-slate-800">{fmt(preview.auxilio)}</span></div><div className="flex justify-between"><span>Extras:</span><span className="text-slate-800">{fmt(preview.extras)}</span></div><div className="flex justify-between text-red-500 border-t pt-4"><span>Deducciones:</span><span>-{fmt(preview.salud + preview.pension)}</span></div></div><div className="bg-blue-600 p-8 rounded-[32px] text-center shadow-2xl shadow-blue-100"><span className="text-blue-200 text-[10px] font-black uppercase block mb-1">Total Neto</span><span className="text-5xl font-black text-white tracking-tighter">{fmt(preview.neto)}</span></div><button onClick={async ()=>{if(window.confirm(`¿Confirmar pago a ${preview.nombre}?`)){await axios.post('/nomina/liquidar', {...formLiq, extras: formLiq.extras, responsable: user.nombre}); window.alert("Pagado"); load(); setMode('history'); setPreview(null);}}} className="w-full bg-slate-900 text-white font-black py-6 rounded-[32px] shadow-xl hover:scale-[1.02] transition-all">CONFIRMAR Y ENVIAR EMAIL</button></div>) : <div className="h-full flex items-center justify-center opacity-20"><Mail size={100}/></div>}</div>
          </div>
      )}
      {mode === 'history' && (
          <div className="bg-white rounded-[40px] shadow-sm overflow-hidden border border-slate-100"><table className="w-full text-left text-sm"><thead className="bg-slate-50/50"><tr className="text-[10px] font-black uppercase text-slate-400 border-b"><th className="p-8">Fecha</th><th>Empleado</th><th>Devengado</th><th>Deducciones</th><th className="p-8 text-right">Neto Pagado</th></tr></thead><tbody>{nominas.map(n => (<tr key={n.id} className="border-b hover:bg-slate-50 transition"><td className="p-8 text-xs font-black text-slate-500">{new Date(n.fecha_pago).toLocaleDateString()}</td><td className="font-black text-slate-800 text-lg tracking-tight">{n.nombre_empleado}</td><td className="font-bold text-slate-600">{fmt(n.total_devengado)}</td><td className="font-bold text-red-500">-{fmt(n.total_deducido)}</td><td className="p-8 font-black text-green-600 text-xl text-right">{fmt(n.neto_pagar)}</td></tr>))}</tbody></table></div>
      )}
    </div>
  );
}

// --- VISTA CONTABILIDAD ---
function ContabilidadView() {
    const [subTab, setSubTab] = useState('diario');
    const [diario, setDiario] = useState([]);
    const [balance, setBalance] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [resDiario, resBalance] = await Promise.all([ axios.get('/contabilidad/diario'), axios.get('/contabilidad/balance') ]);
            setDiario(Array.isArray(resDiario.data) ? resDiario.data : []);
            setBalance(Array.isArray(resBalance.data) ? resBalance.data : []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const gruposDiario = diario.reduce((acc, curr) => {
        if (!acc[curr.comprobante_id]) { acc[curr.comprobante_id] = { id: curr.comprobante_id, fecha: curr.fecha, tipo: curr.tipo_doc, desc: curr.descripcion, asientos: [] }; }
        acc[curr.comprobante_id].asientos.push(curr);
        return acc;
    }, {});

    const totalActivos = balance.filter(c => c.codigo.startsWith('1')).reduce((a, b) => a + parseFloat(b.saldo), 0);
    const totalPasivos = balance.filter(c => c.codigo.startsWith('2')).reduce((a, b) => a + Math.abs(parseFloat(b.saldo)), 0);
    const utilidadBruta = balance.filter(c => c.codigo.startsWith('4')).reduce((a, b) => a + Math.abs(parseFloat(b.saldo)), 0) - 
                          balance.filter(c => c.codigo.startsWith('5') || c.codigo.startsWith('6')).reduce((a, b) => a + parseFloat(b.saldo), 0);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group"><p className="text-[10px] font-black uppercase tracking-[3px] text-blue-400 mb-2">Activos</p><h3 className="text-3xl font-black tracking-tighter">{fmt(totalActivos)}</h3></div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border-l-[12px] border-l-red-500"><p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Pasivos</p><h3 className="text-3xl font-black tracking-tighter">{fmt(totalPasivos)}</h3></div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border-l-[12px] border-l-blue-600"><p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Utilidad</p><h3 className="text-3xl font-black tracking-tighter">{fmt(utilidadBruta)}</h3></div>
            </div>
            <div className="flex gap-4 p-2 bg-white border rounded-3xl w-fit shadow-sm">
                <button onClick={()=>setSubTab('diario')} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase transition-all ${subTab==='diario'?'bg-slate-900 text-white shadow-xl':'text-slate-400 hover:text-slate-800'}`}>Diario</button>
                <button onClick={()=>setSubTab('balance')} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase transition-all ${subTab==='balance'?'bg-slate-900 text-white shadow-xl':'text-slate-400 hover:text-slate-800'}`}>Balance</button>
            </div>
            {subTab === 'diario' && (
                <div className="space-y-6">
                    {Object.values(gruposDiario).map(comp => (
                        <div key={comp.id} className="bg-white rounded-[40px] shadow-sm border overflow-hidden animate-slide-up"><div className="px-8 py-4 bg-slate-50 border-b flex justify-between items-center"><span className="font-black text-slate-800 tracking-tight">{comp.tipo} #{comp.id}</span><span className="text-xs font-black text-slate-400">{new Date(comp.fecha).toLocaleDateString()}</span></div><table className="w-full text-left text-sm"><tbody>{comp.asientos.map((as, idx) => (<tr key={idx} className="border-b last:border-none hover:bg-slate-50 transition"><td className="p-4 pl-12 font-bold text-slate-600 text-sm"><span className="text-blue-600 mr-2">{as.cuenta_codigo}</span> {as.cuenta_nombre}</td><td className="text-right font-black text-slate-800">{as.debito > 0 ? fmt(as.debito) : '-'}</td><td className="p-4 pr-12 text-right font-black text-slate-800">{as.credito > 0 ? fmt(as.credito) : '-'}</td></tr>))}</tbody></table></div>
                    ))}
                </div>
            )}
            {subTab === 'balance' && (
                <div className="bg-white rounded-[40px] shadow-sm border overflow-hidden animate-slide-up"><table className="w-full text-left"><thead className="bg-slate-900 text-white"><tr className="text-[10px] font-black uppercase tracking-widest"><th className="p-8">Código</th><th>Cuenta</th><th className="p-8 text-right">Saldo Final</th></tr></thead><tbody>{balance.map((cta, i) => (<tr key={i} className="border-b hover:bg-blue-50 transition group"><td className="p-6 font-black text-blue-600">{cta.codigo}</td><td className="font-bold text-slate-700">{cta.nombre}</td><td className={`p-8 text-right font-black ${cta.saldo < 0 ? 'text-red-500' : 'text-slate-900'}`}>{fmt(Math.abs(cta.saldo))} {cta.saldo < 0 ? '(Cr)' : '(Db)'}</td></tr>))}</tbody></table></div>
            )}
        </div>
    );
}

// --- HELPERS ---
function MenuButton({ icon, label, active, onClick }) { return <button onClick={onClick} className={`w-full flex items-center px-4 py-4 rounded-2xl mb-1 transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 -translate-y-0.5' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}><span className="mr-3">{icon}</span><span className="text-sm font-black">{label}</span></button>; }
function CardStat({ title, value, icon, color }) { 
    const c = { green: "text-green-600 bg-green-50", blue: "text-blue-600 bg-blue-50", purple: "text-purple-600 bg-purple-50", red: "text-red-600 bg-red-50" };
    return <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow duration-300">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${c[color]}`}>{icon}</div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 mt-1 tracking-tighter leading-none">{value}</h3>
    </div>; 
}

export default App;
este es el codigo que tengo, solo cambia el error y ya, vuelvelo a mandarmelo sin cambiar nada mas: