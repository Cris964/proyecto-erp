/* eslint-disable */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: { rejectUnauthorized: false },
    connectTimeout: 35000
});

// CONFIG CORREO (Asegúrate de configurar estas variables en Vercel)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// --- SEGURIDAD: CLAVE MAESTRA ---
app.post('/api/turnos/verificar-maestra', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT master_password FROM companies WHERE id = ?", [req.body.company_id]);
        res.json({ success: rows[0]?.master_password === req.body.password });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- USUARIOS: CRUD TOTAL ---
app.get('/api/admin/usuarios', async (req, res) => {
    const [rows] = await pool.query("SELECT id, nombre, email, cargo FROM usuarios WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});
app.post('/api/admin/usuarios', async (req, res) => {
    const { nombre, email, password, cargo, company_id } = req.body;
    await pool.query("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,?)", [nombre, email, password, cargo, company_id]);
    res.json({ success: true });
});
app.put('/api/admin/usuarios/:id', async (req, res) => {
    const { nombre, email, password, cargo } = req.body;
    await pool.query("UPDATE usuarios SET nombre=?, email=?, password=?, cargo=? WHERE id=?", [nombre, email, password, cargo, req.params.id]);
    res.json({ success: true });
});
app.delete('/api/admin/usuarios/:id', async (req, res) => {
    await pool.query("DELETE FROM usuarios WHERE id = ?", [req.params.id]);
    res.json({ success: true });
});

// --- INVENTARIO Y BODEGAS ---
app.get('/api/productos', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM productos WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});
app.post('/api/productos', async (req, res) => {
    const { nombre, sku, precio, stock, bodega_id, company_id } = req.body;
    await pool.query("INSERT INTO productos (nombre, sku, precio, stock, bodega_id, company_id, min_stock) VALUES (?,?,?,?,?,?,5)", [nombre, sku, precio, stock, bodega_id, company_id]);
    res.json({ success: true });
});
app.get('/api/bodegas', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM bodegas WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});
app.post('/api/bodegas', async (req, res) => {
    await pool.query("INSERT INTO bodegas (nombre, company_id) VALUES (?,?)", [req.body.nombre, req.body.company_id]);
    res.json({ success: true });
});

// --- PRODUCCIÓN: SIGUIENTE NÚMERO 0001 ---
app.get('/api/produccion/siguiente-numero', async (req, res) => {
    const [rows] = await pool.query("SELECT COUNT(*) as total FROM ordenes_produccion WHERE company_id = ?", [req.query.company_id]);
    res.json({ numero: (rows[0].total + 1).toString().padStart(4, '0') });
});
app.get('/api/produccion/materia', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM materia_prima WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});
app.post('/api/produccion/materia', async (req, res) => {
    const { nombre, unidad_medida, cantidad, costo, company_id, proposito } = req.body;
    await pool.query("INSERT INTO materia_prima (nombre, unidad_medida, cantidad, costo, company_id, proposito) VALUES (?,?,?,?,?,?)", [nombre, unidad_medida, cantidad, costo, company_id, proposito]);
    res.json({ success: true });
});
app.get('/api/produccion/ordenes', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM ordenes_produccion WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});
app.post('/api/produccion/ordenes', async (req, res) => {
    const { numero_orden, nombre_producto, cantidad, company_id } = req.body;
    await pool.query("INSERT INTO ordenes_produccion (numero_orden, nombre_producto, cantidad_producir, company_id, estado) VALUES (?,?,?,?, 'Prealistamiento')", [numero_orden, nombre_producto, cantidad, company_id]);
    res.json({ success: true });
});
app.put('/api/produccion/ordenes/:id', async (req, res) => {
    await pool.query("UPDATE ordenes_produccion SET estado=?, datos_logistica=? WHERE id=?", [req.body.estado, JSON.stringify(req.body.datos_logistica), req.params.id]);
    res.json({ success: true });
});

// --- NÓMINA ---
app.get('/api/empleados', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM empleados WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});
app.post('/api/empleados', async (req, res) => {
    const { nombre, email, salario, eps, arl, pension, company_id } = req.body;
    await pool.query("INSERT INTO empleados (nombre, email, salario, eps, arl, pension, company_id) VALUES (?,?,?,?,?,?,?)", [nombre, email, salario, eps, arl, pension, company_id]);
    res.json({ success: true });
});
app.post('/api/nomina/liquidar', async (req, res) => {
    const { email, nombre, neto } = req.body;
    try {
        await transporter.sendMail({
            from: '"AccuCloud Nómina" <no-reply@accucloud.com>',
            to: email, subject: "Comprobante de Pago 2026",
            text: `Hola ${nombre}, tu pago por valor de ${neto} ha sido procesado.`
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// LOGIN
app.post('/api/login', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]);
    if (rows.length > 0) res.json({ success: true, user: rows[0] });
    else res.json({ success: false });
});

// DASHBOARD
app.get('/api/dashboard-data', async (req, res) => {
    const { company_id } = req.query;
    const [v] = await pool.query("SELECT IFNULL(SUM(total),0) as total FROM ventas WHERE company_id = ?", [company_id]);
    const [p] = await pool.query("SELECT IFNULL(SUM(precio * stock),0) as valor FROM productos WHERE company_id = ?", [company_id]);
    const [c] = await pool.query("SELECT COUNT(*) as low FROM productos WHERE stock <= min_stock AND company_id = ?", [company_id]);
    res.json({ cajaMayor: v[0].total, valorInventario: p[0].valor, lowStock: c[0].low });
});

app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));
module.exports = app;