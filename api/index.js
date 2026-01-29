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

// --- SEGURIDAD: CLAVE MAESTRA ---
app.post('/api/turnos/verificar-maestra', async (req, res) => {
    try {
        const [co] = await pool.query("SELECT master_password FROM companies WHERE id = ?", [req.body.company_id]);
        res.json({ success: co[0].master_password === req.body.password });
    } catch (e) { res.status(500).send(e.message); }
});

// --- BODEGAS ---
app.get('/api/bodegas', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM bodegas WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});
app.post('/api/bodegas', async (req, res) => {
    await pool.query("INSERT INTO bodegas (nombre, company_id) VALUES (?,?)", [req.body.nombre, req.body.company_id]);
    res.json({ success: true });
});

// --- INVENTARIO ---
app.get('/api/productos', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM productos WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});
app.post('/api/productos', async (req, res) => {
    const { nombre, sku, precio, stock, bodega_id, company_id } = req.body;
    await pool.query("INSERT INTO productos (nombre, sku, precio, stock, bodega_id, company_id, min_stock) VALUES (?,?,?,?,?,?,5)", 
    [nombre, sku, precio, stock, bodega_id, company_id]);
    res.json({ success: true });
});

// --- NÓMINA (COLABORADORES) ---
app.get('/api/empleados', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM empleados WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});
app.post('/api/empleados', async (req, res) => {
    const { nombre, email, salario, eps, arl, pension, company_id } = req.body;
    await pool.query("INSERT INTO empleados (nombre, email, salario, eps, arl, pension, company_id) VALUES (?,?,?,?,?,?,?)", 
    [nombre, email, salario, eps, arl, pension, company_id]);
    res.json({ success: true });
});

// --- PRODUCCIÓN (MATERIA PRIMA) ---
app.get('/api/produccion/materia', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM materia_prima WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});
app.post('/api/produccion/materia', async (req, res) => {
    const { nombre, unidad_medida, cantidad, costo, company_id } = req.body;
    await pool.query("INSERT INTO materia_prima (nombre, unidad_medida, cantidad, costo, company_id) VALUES (?,?,?,?,?)", 
    [nombre, unidad_medida, cantidad, costo, company_id]);
    res.json({ success: true });
});

app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));
module.exports = app;