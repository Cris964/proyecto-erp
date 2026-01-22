const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 1. CONFIGURACIÓN DE BASE DE DATOS (AIVEN CLOUD)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: { rejectUnauthorized: false },
    connectTimeout: 20000
};
const pool = mysql.createPool(dbConfig);

// 2. CONFIGURACIÓN CORREO (GMAIL SEGURO)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: {
        user: 'crisplusplay@gmail.com', 
        pass: 'hzdq dzzk fooa ocdk' 
    },
    tls: { rejectUnauthorized: false }
});

// ==========================================
// 3. RUTAS DE LA API (PREFIJO /API)
// ==========================================

// --- ADMINISTRACIÓN Y USUARIOS ---
app.post('/api/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        await pool.query("INSERT INTO usuarios (nombre, email, password, cargo) VALUES (?, ?, ?, ?)", [nombre, email, password, 'Admin']);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/login', async (req, res) => {
    try { 
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]); 
        res.json(rows.length > 0 ? { success: true, user: rows[0] } : { success: false }); 
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/admin/usuarios', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, nombre, email, cargo FROM usuarios");
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

// --- DASHBOARD ---
app.get('/api/dashboard-data', async (req, res) => {
    try {
        const [mayor] = await pool.query("SELECT IFNULL(SUM(total), 0) as total FROM ventas");
        const [bases] = await pool.query("SELECT IFNULL(SUM(base_caja), 0) as total FROM turnos WHERE estado = 'Abierto'");
        const [ventasTurno] = await pool.query("SELECT IFNULL(SUM(v.total), 0) as total FROM ventas v JOIN turnos t ON v.turno_id = t.id WHERE t.estado = 'Abierto'");
        const [prod] = await pool.query("SELECT COUNT(*) as total, IFNULL(SUM(precio * stock), 0) as valor, IFNULL(SUM(CASE WHEN stock <= min_stock THEN 1 ELSE 0 END), 0) as low FROM productos");
        const [recent] = await pool.query("SELECT * FROM ventas ORDER BY fecha DESC LIMIT 5");
        res.json({ cajaMayor: Number(mayor[0].total), cajaMenor: Number(bases[0].total) + Number(ventasTurno[0].total), totalProductos: Number(prod[0].total), valorInventario: Number(prod[0].valor), lowStock: Number(prod[0].low), recentSales: recent });
    } catch (e) { res.status(500).send(e.message); }
});

// --- GESTIÓN DE EMPLEADOS Y NÓMINA 2026 ---
app.get('/api/empleados', async (req, res) => {
    try { const [rows] = await pool.query("SELECT * FROM empleados ORDER BY nombre ASC"); res.json(rows); } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/empleados', async (req, res) => {
    try {
        const { nombre, documento, cargo, salario, email, eps, arl, pension } = req.body;
        await pool.query("INSERT INTO empleados (nombre, documento, cargo, salario, email, eps, arl, pension_fund) VALUES (?,?,?,?,?,?,?,?)", [nombre, documento, cargo, salario, email, eps, arl, pension]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/empleados/:id/historial', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM nominas WHERE empleado_id = ? ORDER BY fecha_pago DESC", [req.params.id]);
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/nomina/liquidar', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { empleado_id, dias, extras, tipo_extra, responsable, metodo_pago, banco, cuenta } = req.body;
        const [empRows] = await connection.query("SELECT * FROM empleados WHERE id = ?", [empleado_id]);
        const emp = empRows[0];

        const SMLV = 1750905; const AUX_T = 249095; const S = parseFloat(emp.salario);
        const basico = Math.round((S / 30) * dias);
        const auxilio = (S <= SMLV * 2) ? Math.round((AUX_T / 30) * dias) : 0;
        let factor = (tipo_extra === 'Nocturna' || tipo_extra === 'Dominical') ? 1.75 : 1.25;
        if (tipo_extra === 'Recargo_Nocturno') factor = 0.35;
        
        const vExtras = Math.round((S / 240 * factor) * parseFloat(extras || 0));
        const devengado = basico + auxilio + vExtras;
        const salud = Math.round((basico + vExtras) * 0.04);
        const pension = Math.round((basico + vExtras) * 0.04);
        const neto = devengado - salud - pension;

        await connection.query(`INSERT INTO nominas (empleado_id, nombre_empleado, dias_trabajados, salario_base, total_devengado, total_deducido, neto_pagar, responsable, metodo_pago, banco, nro_cuenta, salud, pension, horas_extras) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [emp.id, emp.nombre, dias, S, devengado, (salud+pension), neto, responsable, metodo_pago, banco || 'Efectivo', cuenta || 'N/A', salud, pension, vExtras]);

        try {
            await transporter.sendMail({
                from: '"AccuCloud 2026" <crisplusplay@gmail.com>', to: emp.email, subject: `Pago Nómina`,
                html: `<h1>Comprobante de Pago</h1><p>Neto: <b>$${neto.toLocaleString()}</b></p>`
            });
        } catch (e) { console.log("Error correo nómina"); }

        await connection.commit(); res.json({ success: true });
    } catch (e) { await connection.rollback(); res.status(500).json({ success: false, message: e.message }); }
    finally { connection.release(); }
});

// --- VENTAS (CARRITO MÚLTIPLE) ---
app.post('/api/ventas', async (req, res) => {
    const c = await pool.getConnection();
    try {
        await c.beginTransaction();
        const { productos, responsable, turno_id, metodo_pago, es_electronica, cliente, pago_recibido, cambio } = req.body;
        for (const p of productos) {
            const tot = p.cantidad * p.precio;
            await c.query("INSERT INTO ventas (producto_id, nombre_producto, cantidad, total, estado, responsable, turno_id, metodo_pago, dinero_recibido, cambio) VALUES (?,?,?,?,?,?,?,?,?,?)", [p.id, p.nombre, p.cantidad, tot, 'Pagada', responsable, turno_id, metodo_pago, pago_recibido, cambio]);
            await c.query("UPDATE productos SET stock = stock - ? WHERE id = ?", [p.cantidad, p.id]);
        }
        await c.commit(); res.json({ success: true });
    } catch (e) { await c.rollback(); res.status(500).json({ success: false, message: e.message }); }
    finally { c.release(); }
});

// --- INVENTARIO (LOTE Y VENCIMIENTO) ---
app.get('/api/productos', async(req, res) => {
    try { const [rows] = await pool.query("SELECT * FROM productos ORDER BY nombre ASC"); res.json(rows); } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/productos', async (req, res) => {
    try {
        const { nombre, sku, precio, stock, min_stock, lote, vencimiento } = req.body;
        await pool.query("INSERT INTO productos (nombre, sku, precio, stock, min_stock, lote, vencimiento, categoria) VALUES (?,?,?,?,?,?,?,?)", [nombre, sku, precio, stock, min_stock || 5, lote, vencimiento, 'General']);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/productos/importar', async (req, res) => {
    const c = await pool.getConnection();
    try {
        await c.beginTransaction();
        for (const p of req.body.productos) {
            await c.query(`INSERT INTO productos (nombre, sku, precio, stock, categoria, min_stock) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE stock = stock + VALUES(stock)`, [p.nombre, p.sku, p.precio, p.stock, 'General', 5]);
        }
        await c.commit(); res.json({ success: true });
    } catch (e) { await c.rollback(); res.status(500).send(e.message); }
    finally { c.release(); }
});

// --- CONTABILIDAD PROFESIONAL ---
app.get('/api/contabilidad/diario', async (req, res) => {
    try {
        const sql = `SELECT c.id as comprobante_id, c.fecha, c.tipo as tipo_doc, c.descripcion, a.cuenta_codigo, p.nombre as cuenta_nombre, a.debito, a.credito FROM comprobantes c JOIN asientos a ON c.id = a.comprobante_id JOIN plan_cuentas p ON a.cuenta_codigo = p.codigo ORDER BY c.fecha DESC`;
        const [rows] = await pool.query(sql); res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/contabilidad/balance', async (req, res) => {
    try {
        const sql = `SELECT p.codigo, p.nombre, p.tipo, IFNULL(SUM(a.debito), 0) as total_debito, IFNULL(SUM(a.credito), 0) as total_credito, (IFNULL(SUM(a.debito), 0) - IFNULL(SUM(a.credito), 0)) as saldo FROM plan_cuentas p LEFT JOIN asientos a ON p.codigo = a.cuenta_codigo GROUP BY p.codigo HAVING total_debito > 0 OR total_credito > 0 ORDER BY p.codigo ASC`;
        const [rows] = await pool.query(sql); res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

// --- CAJA Y TURNOS ---
app.get('/api/turnos/activo/:id', async(req, res) => {
    try { 
        const [turno] = await pool.query("SELECT * FROM turnos WHERE usuario_id = ? AND estado = 'Abierto'", [req.params.id]);
        if (turno.length > 0) {
            const [ventas] = await pool.query("SELECT IFNULL(SUM(total), 0) as total FROM ventas WHERE turno_id = ?", [turno[0].id]);
            res.json({ ...turno[0], total_vendido: ventas[0].total });
        } else res.json(null);
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/turnos/iniciar', async(req, res) => {
    try { await pool.query("INSERT INTO turnos (usuario_id, nombre_usuario, base_caja) VALUES (?, ?, ?)", [req.body.usuario_id, req.body.nombre_usuario, req.body.base_caja]); res.json({success: true}); } catch (e) { res.status(500).send(e.message); }
});

app.put('/api/turnos/finalizar', async(req, res) => {
    try {
        const [v] = await pool.query("SELECT IFNULL(SUM(total), 0) as total FROM ventas WHERE turno_id = ?", [req.body.turno_id]);
        await pool.query("UPDATE turnos SET fecha_fin = NOW(), estado = 'Cerrado', total_vendido = ? WHERE id = ?", [v[0].total, req.body.turno_id]);
        res.json({success: true});
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/turnos/historial', async(req, res) => {
    try { const [rows] = await pool.query("SELECT * FROM turnos ORDER BY fecha_inicio DESC"); res.json(rows); } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/nomina/historial', async(req, res) => {
    try { const [rows] = await pool.query("SELECT * FROM nominas ORDER BY fecha_pago DESC"); res.json(rows); } catch (e) { res.status(500).send(e.message); }
});

module.exports = app;