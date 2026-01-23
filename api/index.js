const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

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

// 2. CONFIGURACIÓN CORREO
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: { user: 'crisplusplay@gmail.com', pass: 'hzdq dzzk fooa ocdk' },
    tls: { rejectUnauthorized: false }
});

// ==========================================
// 3. RUTAS DE AUTENTICACIÓN SAAS
// ==========================================

// REGISTRO DE NUEVA EMPRESA + ADMIN
app.post('/api/register', async (req, res) => {
    const c = await pool.getConnection();
    try {
        await c.beginTransaction();
        const { nombre, email, password } = req.body; // 'nombre' aquí es el nombre de la empresa

        // 1. Crear la empresa
        const [resCo] = await c.query("INSERT INTO companies (nombre_empresa) VALUES (?)", [nombre]);
        const companyId = resCo.insertId;

        // 2. Crear el usuario Administrador para esa empresa
        await c.query("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?, ?, ?, ?, ?)", 
        ['Administrador ' + nombre, email, password, 'Admin', companyId]);

        await c.commit();
        res.json({ success: true, message: "Empresa y Admin creados" });
    } catch (err) {
        await c.rollback();
        res.status(500).json({ success: false, message: err.message });
    } finally { c.release(); }
});

// LOGIN (Retorna el company_id para que React lo guarde)
app.post('/api/login', async (req, res) => {
    try { 
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]); 
        if (rows.length > 0) {
            res.json({ success: true, user: rows[0] }); 
        } else {
            res.json({ success: false, message: "Credenciales inválidas" });
        }
    } catch (err) { res.status(500).send(err.message); }
});

// ==========================================
// 4. RUTAS DE ADMINISTRACIÓN DE SUB-USUARIOS
// ==========================================

app.get('/api/admin/usuarios', async (req, res) => {
    try {
        const { company_id } = req.query;
        const [rows] = await pool.query("SELECT id, nombre, email, cargo FROM usuarios WHERE company_id = ?", [company_id]);
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/admin/usuarios', async (req, res) => {
    try {
        const { nombre, email, password, cargo, company_id } = req.body;
        await pool.query("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,?)", 
        [nombre, email, password, cargo, company_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.delete('/api/admin/usuarios/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM usuarios WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

// ==========================================
// 5. RUTAS OPERATIVAS (FILTRADAS POR EMPRESA)
// ==========================================

// Dashboard
app.get('/api/dashboard-data', async (req, res) => {
    try {
        const { company_id } = req.query;
        const [mayor] = await pool.query("SELECT IFNULL(SUM(total), 0) as total FROM ventas WHERE company_id = ?", [company_id]);
        const [bases] = await pool.query("SELECT IFNULL(SUM(base_caja), 0) as total FROM turnos WHERE estado = 'Abierto' AND company_id = ?", [company_id]);
        const [prod] = await pool.query("SELECT COUNT(*) as total, IFNULL(SUM(precio * stock), 0) as valor, IFNULL(SUM(CASE WHEN stock <= min_stock THEN 1 ELSE 0 END), 0) as low FROM productos WHERE company_id = ?", [company_id]);
        const [recent] = await pool.query("SELECT * FROM ventas WHERE company_id = ? ORDER BY fecha DESC LIMIT 5", [company_id]);
        
        res.json({ 
            cajaMayor: Number(mayor[0].total), 
            cajaMenor: Number(bases[0].total), 
            valorInventario: Number(prod[0].valor), 
            lowStock: Number(prod[0].low), 
            recentSales: recent 
        });
    } catch (e) { res.status(500).send(e.message); }
});

// Inventario y Bodegas
app.get('/api/productos', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM productos WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

app.post('/api/productos', async (req, res) => {
    const { nombre, sku, precio, stock, bodega_id, lote, vencimiento, company_id } = req.body;
    await pool.query("INSERT INTO productos (nombre, sku, precio, stock, bodega_id, lote, vencimiento, company_id) VALUES (?,?,?,?,?,?,?,?)", 
    [nombre, sku, precio, stock, bodega_id, lote, vencimiento, company_id]);
    res.json({ success: true });
});

app.get('/api/bodegas', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM bodegas WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

app.post('/api/bodegas', async (req, res) => {
    await pool.query("INSERT INTO bodegas (nombre, company_id) VALUES (?, ?)", [req.body.nombre, req.body.company_id]);
    res.json({ success: true });
});

// Ventas (Carrito)
app.post('/api/ventas', async (req, res) => {
    const c = await pool.getConnection();
    try {
        await c.beginTransaction();
        const { productos, responsable, turno_id, metodo_pago, pago_recibido, cambio, company_id } = req.body;
        for (const p of productos) {
            const tot = p.cantidad * p.precio;
            await c.query("INSERT INTO ventas (producto_id, nombre_producto, cantidad, total, estado, responsable, turno_id, metodo_pago, dinero_recibido, cambio, company_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
            [p.id, p.nombre, p.cantidad, tot, 'Pagada', responsable, turno_id, metodo_pago, pago_recibido, cambio, company_id]);
            await c.query("UPDATE productos SET stock = stock - ? WHERE id = ?", [p.cantidad, p.id]);
        }
        await c.commit(); res.json({ success: true });
    } catch (e) { await c.rollback(); res.status(500).json({ success: false, message: e.message }); }
    finally { c.release(); }
});

// Nómina 2026
app.get('/api/empleados', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM empleados WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

app.post('/api/nomina/liquidar', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { empleado_id, dias, extras, tipo_extra, responsable, company_id } = req.body;
        const [empRows] = await connection.query("SELECT * FROM empleados WHERE id = ?", [empleado_id]);
        const emp = empRows[0];
        const SMLV = 1750905; const AUX = 249095;
        const basico = Math.round((emp.salario / 30) * dias);
        const auxilio = (emp.salario <= SMLV * 2) ? Math.round((AUX / 30) * dias) : 0;
        const neto = (basico + auxilio) - Math.round(basico * 0.08);

        await connection.query(`INSERT INTO nominas (empleado_id, nombre_empleado, neto_pagar, responsable, company_id) VALUES (?,?,?,?,?)`, 
        [emp.id, emp.nombre, neto, responsable, company_id]);

        await connection.commit(); res.json({ success: true });
    } catch (e) { await connection.rollback(); res.status(500).json({ success: false, message: e.message }); }
    finally { connection.release(); }
});

// Contabilidad
app.get('/api/contabilidad/diario', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM comprobantes WHERE company_id = ? ORDER BY fecha DESC", [req.query.company_id]);
    res.json(rows);
});

// Turnos
app.get('/api/turnos/activo/:id', async (req, res) => {
    const [turno] = await pool.query("SELECT * FROM turnos WHERE usuario_id = ? AND estado = 'Abierto'", [req.params.id]);
    if (turno.length > 0) {
        const [v] = await pool.query("SELECT IFNULL(SUM(total), 0) as total FROM ventas WHERE turno_id = ?", [turno[0].id]);
        res.json({ ...turno[0], total_vendido: v[0].total });
    } else res.json(null);
});

app.post('/api/turnos/iniciar', async (req, res) => {
    const { usuario_id, nombre_usuario, base_caja, company_id } = req.body;
    await pool.query("INSERT INTO turnos (usuario_id, nombre_usuario, base_caja, company_id) VALUES (?,?,?,?)", [usuario_id, nombre_usuario, base_caja, company_id]);
    res.json({ success: true });
});

// FINAL: Servir Frontend
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

module.exports = app;