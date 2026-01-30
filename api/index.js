/* eslint-disable */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const app = express();

const SECRET_KEY = process.env.JWT_SECRET || 'AccuCloud_2026';

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
    catch (e) { console.error("Error SQL:", e.message); throw e; }
};

const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "No token" });
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Token fail" });
        req.user = decoded;
        next();
    });
};

// LOGIN
app.post('/api/login', async (req, res) => {
    const rows = await q("SELECT * FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]);
    if (rows.length > 0) {
        const user = rows[0];
        const token = jwt.sign({ id: user.id, company_id: user.company_id, cargo: user.cargo, nombre: user.nombre }, SECRET_KEY);
        res.json({ success: true, user, token });
    } else { res.json({ success: false }); }
});

// CLAVE MAESTRA
app.post('/api/turnos/verificar-maestra', verificarToken, async (req, res) => {
    const rows = await q("SELECT master_password FROM usuarios WHERE company_id = ? AND master_password = ?", [req.user.company_id, req.body.password]);
    if (rows.length > 0) res.json({ success: true });
    else res.json({ success: false });
});

// USUARIOS
app.get('/api/admin/usuarios', verificarToken, async (req, res) => {
    res.json(await q("SELECT * FROM usuarios WHERE company_id = ?", [req.user.company_id]));
});
app.post('/api/admin/usuarios', verificarToken, async (req, res) => {
    const { nombre, email, password, cargo } = req.body;
    await q("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,?)", [nombre, email, password, cargo, req.user.company_id]);
    res.json({ success: true });
});

// INVENTARIO
app.get('/api/productos', verificarToken, async (req, res) => {
    res.json(await q("SELECT p.*, b.nombre as bodega_nombre FROM productos p LEFT JOIN bodegas b ON p.bodega_id = b.id WHERE p.company_id = ?", [req.user.company_id]));
});
app.post('/api/productos', verificarToken, async (req, res) => {
    const { nombre, sku, precio, stock, bodega_id } = req.body;
    await q("INSERT INTO productos (nombre, sku, precio, stock, bodega_id, company_id) VALUES (?,?,?,?,?,?)", [nombre, sku, precio, stock, bodega_id || null, req.user.company_id]);
    res.json({ success: true });
});

// BODEGAS
app.get('/api/bodegas', verificarToken, async (req, res) => {
    res.json(await q("SELECT * FROM bodegas WHERE company_id = ?", [req.user.company_id]));
});
app.post('/api/bodegas', verificarToken, async (req, res) => {
    await q("INSERT INTO bodegas (nombre, company_id) VALUES (?,?)", [req.body.nombre, req.user.company_id]);
    res.json({ success: true });
});

// PRODUCCION
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
app.get('/api/produccion/ordenes', verificarToken, async (req, res) => {
    res.json(await q("SELECT op.*, r.nombre_producto_final FROM ordenes_produccion op LEFT JOIN recetas r ON op.receta_id = r.id WHERE op.company_id = ?", [req.user.company_id]));
});

// NOMINA
app.get('/api/empleados', verificarToken, async (req, res) => {
    res.json(await q("SELECT * FROM empleados WHERE company_id = ?", [req.user.company_id]));
});
app.post('/api/empleados', verificarToken, async (req, res) => {
    const { nombre, salario, cargo } = req.body;
    await q("INSERT INTO empleados (nombre, salario, cargo, company_id) VALUES (?,?,?,?)", [nombre, salario, cargo, req.user.company_id]);
    res.json({ success: true });
});

// CAJA
app.get('/api/turnos/activo/:id', verificarToken, async (req, res) => {
    const rows = await q("SELECT t.*, (SELECT IFNULL(SUM(total),0) FROM ventas WHERE turno_id = t.id) as total_vendido FROM turnos t WHERE usuario_id = ? AND estado = 'Abierto'", [req.params.id]);
    res.json(rows[0] || null);
});
app.post('/api/turnos/iniciar', verificarToken, async (req, res) => {
    await q("INSERT INTO turnos (usuario_id, nombre_usuario, base_caja, company_id, estado) VALUES (?,?,?,?,'Abierto')", [req.user.id, req.user.nombre, req.body.base_caja, req.user.company_id]);
    res.json({ success: true });
});

// DASHBOARD
app.get('/api/dashboard-data', verificarToken, async (req, res) => {
    const cid = req.user.company_id;
    const v = await q("SELECT IFNULL(SUM(total),0) as total FROM ventas WHERE company_id = ?", [cid]);
    const p = await q("SELECT IFNULL(SUM(precio * stock),0) as valor FROM productos WHERE company_id = ?", [cid]);
    const c = await q("SELECT COUNT(*) as low FROM productos WHERE stock <= 5 AND company_id = ?", [cid]);
    res.json({ cajaMayor: v[0].total, valorInventario: p[0].valor, lowStock: c[0].low, recentSales: [] });
});

app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));
module.exports = app;