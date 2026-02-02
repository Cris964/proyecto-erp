/* eslint-disable */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

app.use(cors());
app.use(express.json());

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
    catch (e) { console.error("DB Error:", e); return []; }
};

// LOGIN SIMPLE
app.post('/api/login', async (req, res) => {
    const rows = await q("SELECT * FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]);
    if (rows.length > 0) {
        res.json({ success: true, user: rows[0], token: 'dummy-token' });
    } else res.json({ success: false });
});

// METRICAS DASHBOARD
app.get('/api/dashboard-data', async (req, res) => {
    const v = await q("SELECT SUM(total) as t FROM ventas");
    const p = await q("SELECT SUM(precio * stock) as v FROM productos");
    const l = await q("SELECT COUNT(*) as c FROM productos WHERE stock <= 5");
    res.json({ cajaMayor: v[0]?.t || 0, valorInventario: p[0]?.v || 0, lowStock: l[0]?.c || 0 });
});

// PRODUCTOS
app.get('/api/productos', async (req, res) => res.json(await q("SELECT p.*, b.nombre as bodega_nombre FROM productos p LEFT JOIN bodegas b ON p.bodega_id = b.id")));
app.post('/api/productos', async (req, res) => {
    const { nombre, sku, precio, stock, bodega_id } = req.body;
    await q("INSERT INTO productos (nombre, sku, precio, stock, bodega_id, company_id) VALUES (?,?,?,?,?,1)", [nombre, sku, precio, stock, bodega_id || null]);
    res.json({ success: true });
});

// BODEGAS
app.get('/api/bodegas', async (req, res) => res.json(await q("SELECT * FROM bodegas")));
app.post('/api/bodegas', async (req, res) => {
    await q("INSERT INTO bodegas (nombre, company_id) VALUES (?,1)", [req.body.nombre]);
    res.json({ success: true });
});

// PRODUCCION
app.get('/api/produccion/materia', async (req, res) => res.json(await q("SELECT * FROM materia_prima")));
app.post('/api/produccion/materia', async (req, res) => {
    const { nombre, unidad_medida, cantidad, costo } = req.body;
    await q("INSERT INTO materia_prima (nombre, unidad_medida, cantidad, costo, company_id) VALUES (?,?,?,?,1)", [nombre, unidad_medida, cantidad, costo]);
    res.json({ success: true });
});
app.get('/api/produccion/recetas', async (req, res) => res.json(await q("SELECT * FROM recetas")));
app.post('/api/produccion/recetas', async (req, res) => {
    await q("INSERT INTO recetas (nombre_producto_final, descripcion, company_id) VALUES (?,?,1)", [req.body.nombre_producto_final, req.body.descripcion]);
    res.json({ success: true });
});

// NOMINA
app.get('/api/empleados', async (req, res) => res.json(await q("SELECT * FROM empleados")));
app.post('/api/empleados', async (req, res) => {
    const { nombre, documento, salario, eps, arl, pension } = req.body;
    await q("INSERT INTO empleados (nombre, documento, salario, eps, arl, pension, company_id) VALUES (?,?,?,?,?,?,1)", [nombre, documento, salario, eps, arl, pension]);
    res.json({ success: true });
});

// CAJA
app.get('/api/turnos/activo/:id', async (req, res) => {
    const rows = await q("SELECT * FROM turnos WHERE estado = 'Abierto' LIMIT 1");
    res.json(rows[0] || null);
});
app.post('/api/turnos/iniciar', async (req, res) => {
    await q("INSERT INTO turnos (usuario_id, nombre_usuario, base_caja, company_id, estado) VALUES (1,'Admin',?,1,'Abierto')", [req.body.base_caja]);
    res.json({ success: true });
});
app.put('/api/turnos/finalizar', async (req, res) => {
    await q("UPDATE turnos SET estado = 'Cerrado' WHERE estado = 'Abierto'");
    res.json({ success: true });
});

// ADMIN USUARIOS
app.get('/api/admin/usuarios', async (req, res) => res.json(await q("SELECT * FROM usuarios")));
app.post('/api/admin/usuarios', async (req, res) => {
    const { nombre, email, password, cargo } = req.body;
    await q("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,1)", [nombre, email, password, cargo]);
    res.json({ success: true });
});

// CONTABILIDAD
app.get('/api/contabilidad/movimientos', async (req, res) => {
    const v = await q("SELECT fecha_venta as f, nombre_producto as d, total as t, 'Ingreso' as p FROM ventas");
    const m = await q("SELECT CURRENT_TIMESTAMP as f, nombre as d, (cantidad*costo) as t, 'Egreso' as p FROM materia_prima");
    res.json([...v, ...m]);
});

module.exports = app;