/* eslint-disable */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configuración de la base de datos (Usando variables de entorno de Vercel)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: { rejectUnauthorized: false },
    connectTimeout: 30000
});

// --- RUTA DE LOGIN (LA QUE ESTÁ FALLANDO) ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Intento de login para:", email);
        
        const [rows] = await pool.query(
            "SELECT * FROM usuarios WHERE email = ? AND password = ?", 
            [email, password]
        );

        if (rows.length > 0) {
            res.json({ success: true, user: rows[0] });
        } else {
            res.json({ success: false, message: "Credenciales inválidas" });
        }
    } catch (e) {
        console.error("Error en Login:", e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

// --- RUTA DE SEGURIDAD (CLAVE MAESTRA) ---
app.post('/api/turnos/verificar-maestra', async (req, res) => {
    try {
        const { company_id, password } = req.body;
        const [rows] = await pool.query("SELECT master_password FROM companies WHERE id = ?", [company_id]);
        res.json({ success: rows[0]?.master_password === password });
    } catch (e) { res.status(500).send(e.message); }
});

// --- OTRAS RUTAS (USUARIOS, PRODUCCIÓN, etc.) ---
app.get('/api/admin/usuarios', async (req, res) => {
    const [rows] = await pool.query("SELECT id, nombre, email, cargo FROM usuarios WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

app.post('/api/admin/usuarios', async (req, res) => {
    const { nombre, email, password, cargo, company_id } = req.body;
    await pool.query("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,?)", [nombre, email, password, cargo, company_id]);
    res.json({ success: true });
});

app.get('/api/productos', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM productos WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

app.get('/api/produccion/materia', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM materia_prima WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

// Dashboard Data
app.get('/api/dashboard-data', async (req, res) => {
    try {
        const { company_id } = req.query;
        const [v] = await pool.query("SELECT IFNULL(SUM(total),0) as total FROM ventas WHERE company_id = ?", [company_id]);
        const [p] = await pool.query("SELECT IFNULL(SUM(precio * stock),0) as valor FROM productos WHERE company_id = ?", [company_id]);
        const [c] = await pool.query("SELECT COUNT(*) as low FROM productos WHERE stock <= min_stock AND company_id = ?", [company_id]);
        res.json({ cajaMayor: v[0].total, valorInventario: p[0].valor, lowStock: c[0].low });
    } catch (e) { res.json({ cajaMayor: 0, valorInventario: 0, lowStock: 0 }); }
});

// Servir el frontend
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));

module.exports = app;