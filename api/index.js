/* eslint-disable */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const app = express();

const SECRET_KEY = process.env.JWT_SECRET || 'AccuCloud_2026_Secure';

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
    catch (e) { console.error("SQL Error:", e.message); throw e; }
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

app.post('/api/turnos/verificar-maestra', verificarToken, async (req, res) => {
    const rows = await q("SELECT id FROM usuarios WHERE company_id = ? AND master_password = ?", [req.user.company_id, req.body.password]);
    res.json({ success: rows.length > 0 });
});

// --- INVENTARIO ---
app.get('/api/productos', verificarToken, async (req, res) => {
    res.json(await q("SELECT p.*, b.nombre as bodega_nombre FROM productos p LEFT JOIN bodegas b ON p.bodega_id = b.id WHERE p.company_id = ?", [req.user.company_id]));
});

app.post('/api/productos', verificarToken, async (req, res) => {
    const { nombre, sku, precio, stock, bodega_id } = req.body;
    await q("INSERT INTO productos (nombre, sku, precio, stock, bodega_id, company_id) VALUES (?,?,?,?,?,?)", [nombre, sku, precio, stock, bodega_id || null, req.user.company_id]);
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
    await q("INSERT INTO materia_prima (nombre, unidad_medida, cantidad, costo, company_id) VALUES (?,?,?,?,?)", [nombre, unidad_medida, cantidad, costo, req.user.company_id]);
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

app.get('/api/produccion/ordenes', verificarToken, async (req, res) => {
    res.json(await q("SELECT op.*, r.nombre_producto_final FROM ordenes_produccion op LEFT JOIN recetas r ON op.receta_id = r.id WHERE op.company_id = ?", [req.user.company_id]));
});

app.post('/api/produccion/ordenes', verificarToken, async (req, res) => {
    const { receta_id, cantidad_a_producir } = req.body;
    const num = Math.floor(Math.random() * 9000) + 1000;
    await q("INSERT INTO ordenes_produccion (numero_orden, receta_id, cantidad_a_producir, company_id) VALUES (?,?,?,?)", [num, receta_id, cantidad_a_producir, req.user.company_id]);
    res.json({ success: true });
});

// --- NOMINA ---
app.get('/api/empleados', verificarToken, async (req, res) => {
    res.json(await q("SELECT * FROM empleados WHERE company_id = ?", [req.user.company_id]));
});

app.post('/api/empleados', verificarToken, async (req, res) => {
    const { nombre, salario, cargo } = req.body;
    await q("INSERT INTO empleados (nombre, salario, cargo, company_id) VALUES (?,?,?,?)", [nombre, salario, cargo || 'Operario', req.user.company_id]);
    res.json({ success: true });
});

// --- CONTABILIDAD ---
app.get('/api/contabilidad/movimientos', verificarToken, async (req, res) => {
    const ventas = await q("SELECT fecha_venta as fecha, CONCAT('Venta: ', nombre_producto) as detalle, total, 'Ingreso' as tipo FROM ventas WHERE company_id = ?", [req.user.company_id]);
    const materia = await q("SELECT CURRENT_TIMESTAMP as fecha, CONCAT('Compra Insumo: ', nombre) as detalle, (cantidad * costo) as total, 'Egreso' as tipo FROM materia_prima WHERE company_id = ?", [req.user.company_id]);
    res.json([...ventas, ...materia]);
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

app.get('/api/admin/usuarios', verificarToken, async (req, res) => {
    res.json(await q("SELECT id, nombre, email, cargo FROM usuarios WHERE company_id = ?", [req.user.company_id]));
});

app.post('/api/admin/usuarios', verificarToken, async (req, res) => {
    const { nombre, email, password, cargo } = req.body;
    await q("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,?)", [nombre, email, password, cargo, req.user.company_id]);
    res.json({ success: true });
});

app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));
module.exports = app;