const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
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
    connectTimeout: 20000
});

// --- SEGURIDAD: VERIFICAR CLAVE MAESTRA ---
app.post('/api/turnos/verificar-maestra', async (req, res) => {
    try {
        const { company_id, password } = req.body;
        const [co] = await pool.query("SELECT master_password FROM companies WHERE id = ?", [company_id]);
        if (co.length > 0 && co[0].master_password === password) res.json({ success: true });
        else res.json({ success: false });
    } catch (e) { res.status(500).send(e.message); }
});

// --- USUARIOS: CRUD COMPLETO ---
app.get('/api/admin/usuarios', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, nombre, email, cargo FROM usuarios WHERE company_id = ?", [req.query.company_id]);
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/admin/usuarios', async (req, res) => {
    try {
        const { nombre, email, password, cargo, company_id } = req.body;
        await pool.query("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,?)", [nombre, email, password, cargo, company_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.put('/api/admin/usuarios/:id', async (req, res) => {
    try {
        const { nombre, email, password, cargo } = req.body;
        await pool.query("UPDATE usuarios SET nombre=?, email=?, password=?, cargo=? WHERE id=?", [nombre, email, password, cargo, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.delete('/api/admin/usuarios/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM usuarios WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

// --- PRODUCCIÓN: LÓGICA INDUSTRIAL ---
app.get('/api/produccion/siguiente-numero', async (req, res) => {
    const [rows] = await pool.query("SELECT COUNT(*) as total FROM ordenes_produccion WHERE company_id = ?", [req.query.company_id]);
    const num = (rows[0].total + 1).toString().padStart(4, '0');
    res.json({ numero: num });
});

app.post('/api/produccion/materia', async (req, res) => {
    const { nombre, unidad_medida, cantidad, costo, company_id, proposito } = req.body;
    await pool.query("INSERT INTO materia_prima (nombre, unidad_medida, cantidad, costo, company_id, proposito) VALUES (?,?,?,?,?,?)", [nombre, unidad_medida, cantidad, costo, company_id, proposito]);
    res.json({ success: true });
});

app.get('/api/produccion/materia', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM materia_prima WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

app.post('/api/produccion/ordenes', async (req, res) => {
    const { numero_orden, nombre_producto, cantidad, company_id } = req.body;
    await pool.query("INSERT INTO ordenes_produccion (numero_orden, nombre_producto, cantidad_producir, company_id, estado) VALUES (?,?,?,?, 'Prealistamiento')", [numero_orden, nombre_producto, cantidad, company_id]);
    res.json({ success: true });
});

app.get('/api/produccion/ordenes', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM ordenes_produccion WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

app.put('/api/produccion/ordenes/:id', async (req, res) => {
    const { estado, datos_logistica } = req.body;
    await pool.query("UPDATE ordenes_produccion SET estado=?, datos_logistica=? WHERE id=?", [estado, JSON.stringify(datos_logistica), req.params.id]);
    res.json({ success: true });
});

// --- INVENTARIO: CARGA MASIVA Y BODEGAS ---
app.post('/api/productos/importar', async (req, res) => {
    try {
        const { productos, company_id } = req.body;
        for (const p of productos) {
            await pool.query("INSERT INTO productos (nombre, sku, precio, stock, min_stock, company_id) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE stock = stock + ?", 
            [p.nombre, p.sku, p.precio, p.stock, p.min_stock || 5, company_id, p.stock]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/productos', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM productos WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

// --- DASHBOARD: ANALÍTICA ---
app.get('/api/dashboard-data', async (req, res) => {
    const { company_id } = req.query;
    const [v] = await pool.query("SELECT SUM(total) as total FROM ventas WHERE company_id = ?", [company_id]);
    const [p] = await pool.query("SELECT SUM(precio * stock) as valor FROM productos WHERE company_id = ?", [company_id]);
    const [c] = await pool.query("SELECT COUNT(*) as total FROM productos WHERE stock <= min_stock AND company_id = ?", [company_id]);
    res.json({ cajaMayor: v[0].total || 0, cajaMenor: 0, valorInventario: p[0].valor || 0, lowStock: c[0].total || 0 });
});

app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));
app.listen(process.env.PORT || 3001);
module.exports = app;