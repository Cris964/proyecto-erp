/* eslint-disable */
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
    connectTimeout: 35000
});

// --- HELPER QUERIES ---
const q = async (sql, params) => {
    try { const [rows] = await pool.query(sql, params); return rows; } 
    catch (e) { console.error("DB Error:", e.message); return null; }
};

// --- USUARIOS ---
app.get('/api/admin/usuarios', async (req, res) => {
    const rows = await q("SELECT id, nombre, email, cargo FROM usuarios WHERE company_id = ?", [req.query.company_id]);
    res.json(rows || []);
});

app.post('/api/admin/usuarios', async (req, res) => {
    const { nombre, email, password, cargo, company_id } = req.body;
    await q("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,?)", [nombre, email, password, cargo, company_id]);
    res.json({ success: true });
});

app.put('/api/admin/usuarios/:id', async (req, res) => {
    const { nombre, email, password, cargo } = req.body;
    await q("UPDATE usuarios SET nombre=?, email=?, password=?, cargo=? WHERE id=?", [nombre, email, password, cargo, req.params.id]);
    res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
    const rows = await q("SELECT * FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]);
    if (rows && rows.length > 0) res.json({ success: true, user: rows[0] });
    else res.json({ success: false });
});

// --- CAJA ---
app.post('/api/turnos/verificar-maestra', async (req, res) => {
    const rows = await q("SELECT master_password FROM companies WHERE id = ?", [req.body.company_id]);
    res.json({ success: rows && rows[0].master_password === req.body.password });
});

app.get('/api/turnos/activo/:id', async (req, res) => {
    const rows = await q("SELECT t.*, (SELECT IFNULL(SUM(total),0) FROM ventas WHERE turno_id = t.id) as total_vendido FROM turnos t WHERE usuario_id = ? AND estado = 'Abierto'", [req.params.id]);
    res.json(rows[0] || null);
});

app.post('/api/turnos/iniciar', async (req, res) => {
    const { usuario_id, nombre_usuario, base_caja, company_id } = req.body;
    await q("INSERT INTO turnos (usuario_id, nombre_usuario, base_caja, company_id, estado) VALUES (?,?,?,?,'Abierto')", [usuario_id, nombre_usuario, base_caja, company_id]);
    res.json({ success: true });
});

app.put('/api/turnos/finalizar', async (req, res) => {
    await q("UPDATE turnos SET estado = 'Cerrado' WHERE id = ?", [req.body.turno_id]);
    res.json({ success: true });
});

// --- INVENTARIO ---
app.get('/api/productos', async (req, res) => {
    const rows = await q("SELECT * FROM productos WHERE company_id = ?", [req.query.company_id]);
    res.json(rows || []);
});

app.post('/api/productos', async (req, res) => {
    const { nombre, sku, precio, stock, min_stock, company_id } = req.body;
    await q("INSERT INTO productos (nombre, sku, precio, stock, min_stock, company_id) VALUES (?,?,?,?,?,?)", [nombre, sku, precio, stock, min_stock, company_id]);
    res.json({ success: true });
});

app.post('/api/productos/importar', async (req, res) => {
    const { productos, company_id } = req.body;
    for (const p of productos) {
        await q("INSERT INTO productos (nombre, sku, precio, stock, min_stock, company_id) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE stock = stock + ?", [p.nombre, p.sku, p.precio, p.stock, 5, company_id, p.stock]);
    }
    res.json({ success: true });
});

// --- VENTAS ---
app.post('/api/ventas', async (req, res) => {
    const { productos, responsable, turno_id, company_id } = req.body;
    for (const p of productos) {
        await q("INSERT INTO ventas (producto_id, nombre_producto, cantidad, total, responsable, turno_id, company_id) VALUES (?,?,?,?,?,?,?)", [p.id, p.nombre, p.cantidad, p.precio * p.cantidad, responsable, turno_id, company_id]);
        await q("UPDATE productos SET stock = stock - ? WHERE id = ?", [p.cantidad, p.id]);
    }
    res.json({ success: true });
});

app.get('/api/contabilidad/ventas', async (req, res) => {
    const rows = await q("SELECT * FROM ventas WHERE company_id = ? ORDER BY fecha DESC", [req.query.company_id]);
    res.json(rows || []);
});

// --- PRODUCCIÓN ---
app.get('/api/produccion/siguiente-numero', async (req, res) => {
    const rows = await q("SELECT COUNT(*) as total FROM ordenes_produccion WHERE company_id = ?", [req.query.company_id]);
    const num = rows ? (rows[0].total + 1).toString().padStart(4, '0') : "0001";
    res.json({ numero: num });
});

app.get('/api/produccion/materia', async (req, res) => {
    const rows = await q("SELECT * FROM materia_prima WHERE company_id = ?", [req.query.company_id]);
    res.json(rows || []);
});

app.post('/api/produccion/materia', async (req, res) => {
    const { nombre, unidad_medida, cantidad, costo, company_id } = req.body;
    await q("INSERT INTO materia_prima (nombre, unidad_medida, cantidad, costo, company_id) VALUES (?,?,?,?,?)", [nombre, unidad_medida, cantidad, costo, company_id]);
    res.json({ success: true });
});

app.get('/api/produccion/ordenes', async (req, res) => {
    const rows = await q("SELECT * FROM ordenes_produccion WHERE company_id = ?", [req.query.company_id]);
    res.json(rows || []);
});

app.post('/api/produccion/ordenes', async (req, res) => {
    const { numero_orden, nombre_producto, cantidad, company_id } = req.body;
    await q("INSERT INTO ordenes_produccion (numero_orden, nombre_producto, cantidad_producir, company_id, estado) VALUES (?,?,?,?, 'Prealistamiento')", [numero_orden, nombre_producto, cantidad, company_id]);
    res.json({ success: true });
});

app.put('/api/produccion/ordenes/:id', async (req, res) => {
    await q("UPDATE ordenes_produccion SET estado=?, datos_logistica=? WHERE id=?", [req.body.estado, JSON.stringify(req.body.datos_logistica), req.params.id]);
    res.json({ success: true });
});

// --- NÓMINA ---
app.get('/api/empleados', async (req, res) => {
    const rows = await q("SELECT * FROM empleados WHERE company_id = ?", [req.query.company_id]);
    res.json(rows || []);
});

app.get('/api/dashboard-data', async (req, res) => {
    const { company_id } = req.query;
    const v = await q("SELECT IFNULL(SUM(total),0) as total FROM ventas WHERE company_id = ?", [company_id]);
    const p = await q("SELECT IFNULL(SUM(precio * stock),0) as valor FROM productos WHERE company_id = ?", [company_id]);
    const c = await q("SELECT COUNT(*) as total FROM productos WHERE stock <= min_stock AND company_id = ?", [company_id]);
    res.json({ cajaMayor: v[0].total, valorInventario: p[0].valor, lowStock: c[0].total });
});

app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));
module.exports = app;