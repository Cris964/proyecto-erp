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
    port: Number(process.env.DB_PORT) || 3306,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 35000
});

// --- HELPER QUERIES ---
const q = async (sql, params) => {
    try { const [rows] = await pool.query(sql, params); return rows; } 
    catch (e) { console.error("DB Error:", e.message); throw e; }
};

// --- LOGIN Y SEGURIDAD ---
app.post('/api/login', async (req, res) => {
    const rows = await q("SELECT * FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]);
    if (rows.length > 0) res.json({ success: true, user: rows[0] });
    else res.json({ success: false });
});

app.post('/api/turnos/verificar-maestra', async (req, res) => {
    const { company_id, password } = req.body;
    const rows = await q("SELECT master_password FROM companies WHERE id = ?", [company_id]);
    res.json({ success: rows[0]?.master_password === password });
});

// --- CAJA ---
app.get('/api/turnos/activo/:id', async (req, res) => {
    const rows = await q("SELECT t.*, (SELECT IFNULL(SUM(total),0) FROM ventas WHERE turno_id = t.id) as total_vendido FROM turnos t WHERE usuario_id = ? AND estado = 'Abierto'", [req.params.id]);
    res.json(rows[0] || null);
});
app.post('/api/turnos/iniciar', async (req, res) => {
    await q("INSERT INTO turnos (usuario_id, nombre_usuario, base_caja, company_id, estado) VALUES (?,?,?,?,'Abierto')", [req.body.usuario_id, req.body.nombre_usuario, req.body.base_caja, req.body.company_id]);
    res.json({ success: true });
});
app.put('/api/turnos/finalizar', async (req, res) => {
    await q("UPDATE turnos SET estado = 'Cerrado' WHERE id = ?", [req.body.turno_id]);
    res.json({ success: true });
});

// --- USUARIOS ---
app.get('/api/admin/usuarios', async (req, res) => {
    const rows = await q("SELECT id, nombre, email, cargo FROM usuarios WHERE company_id = ?", [req.query.company_id]);
    res.json(rows || []);
});
app.post('/api/admin/usuarios', async (req, res) => {
    await q("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,?)", [req.body.nombre, req.body.email, req.body.password, req.body.cargo, req.body.company_id]);
    res.json({ success: true });
});
app.put('/api/admin/usuarios/:id', async (req, res) => {
    await q("UPDATE usuarios SET nombre=?, email=?, password=?, cargo=? WHERE id=?", [req.body.nombre, req.body.email, req.body.password, req.body.cargo, req.params.id]);
    res.json({ success: true });
});
app.delete('/api/admin/usuarios/:id', async (req, res) => {
    await q("DELETE FROM usuarios WHERE id = ?", [req.params.id]);
    res.json({ success: true });
});

// --- INVENTARIO Y BODEGAS ---
app.get('/api/productos', async (req, res) => {
    const rows = await q("SELECT * FROM productos WHERE company_id = ?", [req.query.company_id]);
    res.json(rows || []);
});
app.post('/api/productos', async (req, res) => {
    await q("INSERT INTO productos (nombre, sku, precio, stock, bodega_id, company_id, min_stock) VALUES (?,?,?,?,?,?,?)", [req.body.nombre, req.body.sku, req.body.precio, req.body.stock, req.body.bodega_id, req.body.company_id, 5]);
    res.json({ success: true });
});
app.post('/api/productos/importar', async (req, res) => {
    const { productos, company_id } = req.body;
    for (const p of productos) {
        await q("INSERT INTO productos (nombre, sku, precio, stock, company_id, min_stock) VALUES (?,?,?,?,?,5) ON DUPLICATE KEY UPDATE stock = stock + ?", [p.nombre, p.sku, p.precio, p.stock, company_id, p.stock]);
    }
    res.json({ success: true });
});
app.get('/api/bodegas', async (req, res) => {
    const rows = await q("SELECT * FROM bodegas WHERE company_id = ?", [req.query.company_id]);
    res.json(rows || []);
});
app.post('/api/bodegas', async (req, res) => {
    await q("INSERT INTO bodegas (nombre, company_id) VALUES (?,?)", [req.body.nombre, req.body.company_id]);
    res.json({ success: true });
});

// --- PRODUCCIÓN ---
app.get('/api/produccion/siguiente-numero', async (req, res) => {
    const rows = await q("SELECT COUNT(*) as total FROM ordenes_produccion WHERE company_id = ?", [req.query.company_id]);
    res.json({ numero: (rows[0].total + 1).toString().padStart(4, '0') });
});
app.get('/api/produccion/materia', async (req, res) => {
    const rows = await q("SELECT * FROM materia_prima WHERE company_id = ?", [req.query.company_id]);
    res.json(rows || []);
});
app.post('/api/produccion/materia', async (req, res) => {
    await q("INSERT INTO materia_prima (nombre, unidad_medida, cantidad, costo, company_id) VALUES (?,?,?,?,?)", [req.body.nombre, req.body.unidad_medida, req.body.cantidad, req.body.costo, req.body.company_id]);
    res.json({ success: true });
});
app.get('/api/produccion/ordenes', async (req, res) => {
    const rows = await q("SELECT * FROM ordenes_produccion WHERE company_id = ?", [req.query.company_id]);
    res.json(rows || []);
});
app.post('/api/produccion/ordenes', async (req, res) => {
    await q("INSERT INTO ordenes_produccion (numero_orden, nombre_producto, cantidad_producir, company_id, estado) VALUES (?,?,?,?, 'Prealistamiento')", [req.body.numero_orden, req.body.nombre_producto, req.body.cantidad, req.body.company_id]);
    res.json({ success: true });
});
app.put('/api/produccion/ordenes/:id', async (req, res) => {
    await q("UPDATE ordenes_produccion SET estado=? WHERE id=?", [req.body.estado, req.params.id]);
    res.json({ success: true });
});

// --- NÓMINA ---
app.get('/api/empleados', async (req, res) => {
    const rows = await q("SELECT * FROM empleados WHERE company_id = ?", [req.query.company_id]);
    res.json(rows || []);
});
app.post('/api/empleados', async (req, res) => {
    await q("INSERT INTO empleados (nombre, email, salario, eps, arl, pension, company_id) VALUES (?,?,?,?,?,?,?)", [req.body.nombre, req.body.email, req.body.salario, req.body.eps, req.body.arl, req.body.pension, req.body.company_id]);
    res.json({ success: true });
});

// --- DASHBOARD ---
app.get('/api/dashboard-data', async (req, res) => {
    const { company_id } = req.query;
    const v = await q("SELECT IFNULL(SUM(total),0) as total FROM ventas WHERE company_id = ?", [company_id]);
    const p = await q("SELECT IFNULL(SUM(precio * stock),0) as valor FROM productos WHERE company_id = ?", [company_id]);
    const c = await q("SELECT COUNT(*) as low FROM productos WHERE stock <= min_stock AND company_id = ?", [company_id]);
    res.json({ cajaMayor: v[0].total, valorInventario: p[0].valor, lowStock: c[0].low });
});

app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));
module.exports = app;