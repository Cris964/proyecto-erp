const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: { rejectUnauthorized: false },
    connectTimeout: 15000
};

const pool = mysql.createPool(dbConfig); 

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

// === RUTAS SIN PREFIJO /API (Vercel ya lo agrega por el nombre de la carpeta) ===

app.post('/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        await pool.query("INSERT INTO usuarios (nombre, email, password, cargo) VALUES (?, ?, ?, ?)", [nombre, email, password, 'Admin']);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/login', async (req, res) => {
    try { 
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]); 
        res.json(rows.length > 0 ? { success: true, user: rows[0] } : { success: false }); 
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/dashboard-data', async (req, res) => {
    try {
        const [mayor] = await pool.query("SELECT IFNULL(SUM(total), 0) as total FROM ventas");
        const [bases] = await pool.query("SELECT IFNULL(SUM(base_caja), 0) as total FROM turnos WHERE estado = 'Abierto'");
        const [ventasTurno] = await pool.query("SELECT IFNULL(SUM(v.total), 0) as total FROM ventas v JOIN turnos t ON v.turno_id = t.id WHERE t.estado = 'Abierto'");
        const [prod] = await pool.query("SELECT COUNT(*) as total, IFNULL(SUM(precio * stock), 0) as valor, IFNULL(SUM(CASE WHEN stock <= min_stock THEN 1 ELSE 0 END), 0) as low FROM productos");
        const [recent] = await pool.query("SELECT * FROM ventas ORDER BY fecha DESC LIMIT 5");
        res.json({ cajaMayor: Number(mayor[0].total), cajaMenor: Number(bases[0].total) + Number(ventasTurno[0].total), totalProductos: Number(prod[0].total), valorInventario: Number(prod[0].valor), lowStock: Number(prod[0].low), recentSales: recent });
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/ventas', async (req, res) => {
    const c = await pool.getConnection();
    try {
        await c.beginTransaction();
        const { productos, responsable, turno_id, metodo_pago, pago_recibido, cambio } = req.body;
        for (const p of productos) {
            const tot = p.cantidad * p.precio;
            await c.query("INSERT INTO ventas (producto_id, nombre_producto, cantidad, total, estado, responsable, turno_id, metodo_pago, dinero_recibido, cambio) VALUES (?,?,?,?,?,?,?,?,?,?)", [p.id, p.nombre, p.cantidad, tot, 'Pagada', responsable, turno_id, metodo_pago, pago_recibido, cambio]);
            await c.query("UPDATE productos SET stock = stock - ? WHERE id = ?", [p.cantidad, p.id]);
        }
        await c.commit();
        res.json({ success: true });
    } catch (e) { await c.rollback(); res.status(500).json({ success: false, message: e.message }); }
    finally { c.release(); }
});

app.get('/productos', async(req, res) => {
    try { const [rows] = await pool.query("SELECT * FROM productos"); res.json(rows); } catch (e) { res.status(500).send(e.message); }
});

app.post('/productos/importar', async (req, res) => {
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

app.get('/empleados', async(req, res) => {
    try { const [rows] = await pool.query("SELECT * FROM empleados"); res.json(rows); } catch (e) { res.status(500).send(e.message); }
});

app.post('/empleados', async(req, res) => {
    try {
        const { nombre, documento, cargo, salario, email, eps, arl, pension } = req.body;
        await pool.query("INSERT INTO empleados (nombre, documento, cargo, salario, email, eps, arl, pension_fund) VALUES (?,?,?,?,?,?,?,?)", [nombre, documento, cargo, salario, email, eps, arl, pension]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/turnos/activo/:id', async(req, res) => {
    try { const [rows] = await pool.query("SELECT * FROM turnos WHERE usuario_id=? AND estado='Abierto'", [req.params.id]); res.json(rows[0] || null); } catch (e) { res.status(500).send(e.message); }
});

app.post('/turnos/iniciar', async(req, res) => {
    try { await pool.query("INSERT INTO turnos (usuario_id, nombre_usuario, base_caja) VALUES (?, ?, ?)", [req.body.usuario_id, req.body.nombre_usuario, req.body.base_caja]); res.json({success: true}); } catch (e) { res.status(500).send(e.message); }
});

app.put('/turnos/finalizar', async(req, res) => {
    try {
        const [v] = await pool.query("SELECT IFNULL(SUM(total), 0) as total FROM ventas WHERE turno_id = ?", [req.body.turno_id]);
        await pool.query("UPDATE turnos SET fecha_fin = NOW(), estado = 'Cerrado', total_vendido = ? WHERE id = ?", [v[0].total, req.body.turno_id]);
        res.json({success: true});
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/turnos/historial', async(req, res) => {
    try { const [rows] = await pool.query("SELECT * FROM turnos ORDER BY fecha_inicio DESC"); res.json(rows); } catch (e) { res.status(500).send(e.message); }
});

app.get('/nomina/historial', async(req, res) => {
    try { const [rows] = await pool.query("SELECT * FROM nominas ORDER BY fecha_pago DESC"); res.json(rows); } catch (e) { res.status(500).send(e.message); }
});

module.exports = app;