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
    port: Number(process.env.DB_PORT) || 3306,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 35000
});

// --- RUTA DE LOGIN (LA QUE FALLA EN LA IMAGEN) ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [email, password]);
        if (rows.length > 0) res.json({ success: true, user: rows[0] });
        else res.json({ success: false, message: "Credenciales incorrectas" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// --- SEGURIDAD: CLAVE MAESTRA ---
app.post('/api/turnos/verificar-maestra', async (req, res) => {
    try {
        const { company_id, password } = req.body;
        const [rows] = await pool.query("SELECT master_password FROM companies WHERE id = ?", [company_id]);
        res.json({ success: rows.length > 0 && rows[0].master_password === password });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- USUARIOS ---
app.get('/api/admin/usuarios', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, nombre, email, cargo FROM usuarios WHERE company_id = ?", [req.query.company_id]);
        res.json(rows);
    } catch (e) { res.json([]); }
});

app.post('/api/admin/usuarios', async (req, res) => {
    try {
        const { nombre, email, password, cargo, company_id } = req.body;
        await pool.query("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,?)", [nombre, email, password, cargo, company_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- INVENTARIO Y BODEGAS ---
app.get('/api/productos', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM productos WHERE company_id = ?", [req.query.company_id]);
        res.json(rows);
    } catch (e) { res.json([]); }
});

app.post('/api/productos', async (req, res) => {
    try {
        const { nombre, sku, precio, stock, bodega_id, company_id } = req.body;
        await pool.query("INSERT INTO productos (nombre, sku, precio, stock, bodega_id, company_id, min_stock) VALUES (?,?,?,?,?,?,5)", [nombre, sku, precio, stock, bodega_id, company_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bodegas', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM bodegas WHERE company_id = ?", [req.query.company_id]);
        res.json(rows);
    } catch (e) { res.json([]); }
});

app.post('/api/bodegas', async (req, res) => {
    try {
        await pool.query("INSERT INTO bodegas (nombre, company_id) VALUES (?,?)", [req.body.nombre, req.body.company_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PRODUCCIÓN ---
app.get('/api/produccion/siguiente-numero', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) as total FROM ordenes_produccion WHERE company_id = ?", [req.query.company_id]);
        res.json({ numero: (rows[0].total + 1).toString().padStart(4, '0') });
    } catch (e) { res.json({ numero: "0001" }); }
});

app.get('/api/produccion/materia', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM materia_prima WHERE company_id = ?", [req.query.company_id]);
        res.json(rows);
    } catch (e) { res.json([]); }
});

app.post('/api/produccion/materia', async (req, res) => {
    try {
        const { nombre, unidad_medida, cantidad, costo, company_id } = req.body;
        await pool.query("INSERT INTO materia_prima (nombre, unidad_medida, cantidad, costo, company_id) VALUES (?,?,?,?,?)", [nombre, unidad_medida, cantidad, costo, company_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- NÓMINA ---
app.get('/api/empleados', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM empleados WHERE company_id = ?", [req.query.company_id]);
        res.json(rows);
    } catch (e) { res.json([]); }
});

app.post('/api/empleados', async (req, res) => {
    try {
        const { nombre, email, salario, eps, arl, pension, company_id } = req.body;
        await pool.query("INSERT INTO empleados (nombre, email, salario, eps, arl, pension, company_id) VALUES (?,?,?,?,?,?,?)", [nombre, email, salario, eps, arl, pension, company_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- DASHBOARD ---
app.get('/api/dashboard-data', async (req, res) => {
    try {
        const { company_id } = req.query;
        const [v] = await pool.query("SELECT IFNULL(SUM(total),0) as total FROM ventas WHERE company_id = ?", [company_id]);
        const [p] = await pool.query("SELECT IFNULL(SUM(precio * stock),0) as valor FROM productos WHERE company_id = ?", [company_id]);
        const [c] = await pool.query("SELECT COUNT(*) as low FROM productos WHERE stock <= min_stock AND company_id = ?", [company_id]);
        res.json({ cajaMayor: v[0].total, valorInventario: p[0].valor, lowStock: c[0].low });
    } catch (e) { res.json({ cajaMayor: 0, valorInventario: 0, lowStock: 0 }); }
});

app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));

module.exports = app;