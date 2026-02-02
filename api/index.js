/* eslint-disable */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

const SECRET_KEY = process.env.JWT_SECRET || 'AccuCloud_2026_Final';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    ssl: { rejectUnauthorized: false }
});

const q = async (sql, params) => {
    try { const [rows] = await pool.query(sql, params); return rows; } 
    catch (e) { console.error("Error SQL:", e.message); return []; }
};

const verificarToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "No autorizado" });
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Sesión expirada" });
        req.user = decoded;
        next();
    });
};

// --- AUTH ---
app.post('/api/login', async (req, res) => {
    const rows = await q("SELECT * FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]);
    if (rows.length > 0) {
        const u = rows[0];
        const token = jwt.sign({ id: u.id, company_id: u.company_id, cargo: u.cargo, nombre: u.nombre }, SECRET_KEY);
        res.json({ success: true, user: u, token });
    } else res.json({ success: false });
});

// --- DASHBOARD (METRICAS REALES) ---
app.get('/api/dashboard-data', verificarToken, async (req, res) => {
    const cid = req.user.company_id;
    const v = await q("SELECT IFNULL(SUM(total),0) as t FROM ventas WHERE company_id = ?", [cid]);
    const p = await q("SELECT IFNULL(SUM(precio * stock),0) as v FROM productos WHERE company_id = ?", [cid]);
    const l = await q("SELECT COUNT(*) as c FROM productos WHERE stock <= 5 AND company_id = ?", [cid]);
    res.json({ cajaMayor: v[0]?.t || 0, valorInventario: p[0]?.v || 0, lowStock: l[0]?.c || 0 });
});

// --- INVENTARIO ---
app.get('/api/productos', verificarToken, async (req, res) => {
    res.json(await q("SELECT p.*, b.nombre as bodega_nombre FROM productos p LEFT JOIN bodegas b ON p.bodega_id = b.id WHERE p.company_id = ?", [req.user.company_id]));
});
app.post('/api/productos', verificarToken, async (req, res) => {
    const { nombre, sku, precio, stock, bodega_id } = req.body;
    await q("INSERT INTO productos (nombre, sku, precio, stock, bodega_id, company_id) VALUES (?,?,?,?,?,?)", [nombre, sku, precio || 0, stock || 0, bodega_id || null, req.user.company_id]);
    res.json({ success: true });
});

// --- BODEGAS ---
app.get('/api/bodegas', verificarToken, async (req, res) => {
    res.json(await q("SELECT * FROM bodegas WHERE company_id = ?", [req.user.company_id]));
});
app.post('/api/bodegas', verificarToken, async (req, res) => {
    await q("INSERT INTO bodegas (nombre, company_id) VALUES (?,?)", [req.body.nombre, req.user.company_id]);
    res.json({ success: true });
});

// --- PRODUCCION ---
app.get('/api/produccion/materia', verificarToken, async (req, res) => {
    res.json(await q("SELECT * FROM materia_prima WHERE company_id = ?", [req.user.company_id]));
});
app.post('/api/produccion/materia', verificarToken, async (req, res) => {
    const { nombre, unidad_medida, cantidad, costo } = req.body;
    await q("INSERT INTO materia_prima (nombre, unidad_medida, cantidad, costo, company_id) VALUES (?,?,?,?,?)", [nombre, unidad_medida, cantidad || 0, costo || 0, req.user.company_id]);
    res.json({ success: true });
});
app.get('/api/produccion/recetas', verificarToken, async (req, res) => {
    res.json(await q("SELECT * FROM recetas WHERE company_id = ?", [req.user.company_id]));
});
app.post('/api/produccion/recetas', verificarToken, async (req, res) => {
    const { nombre_producto_final, descripcion } = req.body;
    await q("INSERT INTO recetas (nombre_producto_final, descripcion, company_id) VALUES (?,?,?)", [nombre_producto_final, descripcion, req.user.company_id]);
    res.json({ success: true });
});

// --- NOMINA ---
app.get('/api/empleados', verificarToken, async (req, res) => {
    res.json(await q("SELECT * FROM empleados WHERE company_id = ?", [req.user.company_id]));
});
app.post('/api/empleados', verificarToken, async (req, res) => {
    const { nombre, documento, salario, eps, arl, pension } = req.body;
    await q("INSERT INTO empleados (nombre, documento, salario, eps, arl, pension, company_id) VALUES (?,?,?,?,?,?,?)", [nombre, documento, salario || 0, eps, arl, pension, req.user.company_id]);
    res.json({ success: true });
});

// --- CONTABILIDAD ---
app.get('/api/contabilidad/movimientos', verificarToken, async (req, res) => {
    const ventas = await q("SELECT fecha_venta as fecha, CONCAT('Venta: ', nombre_producto) as detalle, total, 'Ingreso' as tipo FROM ventas WHERE company_id = ?", [req.user.company_id]);
    const egresos = await q("SELECT CURRENT_TIMESTAMP as fecha, CONCAT('Insumo: ', nombre) as detalle, (cantidad * costo) as total, 'Egreso' as tipo FROM materia_prima WHERE company_id = ?", [req.user.company_id]);
    res.json([...ventas, ...egresos]);
});

// --- CAJA ---
app.get('/api/turnos/activo/:id', verificarToken, async (req, res) => {
    const rows = await q("SELECT t.*, (SELECT IFNULL(SUM(total),0) FROM ventas WHERE turno_id = t.id) as total_vendido FROM turnos t WHERE usuario_id = ? AND estado = 'Abierto'", [req.params.id]);
    res.json(rows[0] || null);
});
app.post('/api/turnos/iniciar', verificarToken, async (req, res) => {
    await q("INSERT INTO turnos (usuario_id, nombre_usuario, base_caja, company_id, estado) VALUES (?,?,?,?,'Abierto')", [req.user.id, req.user.nombre, req.body.base_caja, req.user.company_id]);
    res.json({ success: true });
});
app.put('/api/turnos/finalizar', verificarToken, async (req, res) => {
    await q("UPDATE turnos SET estado = 'Cerrado' WHERE id = ?", [req.body.turno_id]);
    res.json({ success: true });
});

// --- ADMIN USUARIOS ---
app.get('/api/admin/usuarios', verificarToken, async (req, res) => {
    res.json(await q("SELECT id, nombre, email, cargo FROM usuarios WHERE company_id = ?", [req.user.company_id]));
});
app.post('/api/admin/usuarios', verificarToken, async (req, res) => {
    const { nombre, email, password, cargo } = req.body;
    await q("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,?)", [nombre, email, password, cargo || 'Vendedor', req.user.company_id]);
    res.json({ success: true });
});

module.exports = app;