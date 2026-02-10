/* eslint-disable */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const SECRET = 'AccuCloud_2026_Ultra_Premium';

app.use(cors()); app.use(express.json({ limit: '50mb' }));
const pool = mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, ssl: { rejectUnauthorized: false } });

const q = async (sql, params) => { try { const [r] = await pool.query(sql, params); return r; } catch (e) { console.error(e); return []; } };

const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send("No Auth");
    jwt.verify(token, SECRET, (err, dec) => { if (err) return res.status(403).send("Exp"); req.user = dec; next(); });
};

// LOGIN & PERFIL
app.post('/api/login', async (req, res) => {
    const r = await q("SELECT * FROM usuarios WHERE email=? AND password=?", [req.body.email, req.body.password]);
    if (r.length > 0) {
        const u = r[0];
        const token = jwt.sign({ id: u.id, company_id: u.company_id, cargo: u.cargo, nombre: u.nombre }, SECRET);
        res.json({ success: true, user: u, token });
    } else res.json({ success: false });
});

app.put('/api/perfil', auth, async (req, res) => {
    const { nombre, telefono, direccion, avatar_url } = req.body;
    await q("UPDATE usuarios SET nombre=?, telefono=?, direccion=?, avatar_url=? WHERE id=?", [nombre, telefono, direccion, avatar_url, req.user.id]);
    res.json({ success: true });
});

// DASHBOARD METRICAS REALES
app.get('/api/dashboard-data', auth, async (req, res) => {
    const cid = req.user.company_id;
    const [v] = await q("SELECT IFNULL(SUM(total),0) as t FROM ventas WHERE company_id=?", [cid]);
    const [b] = await q("SELECT IFNULL(SUM(base_caja),0) as t FROM turnos WHERE company_id=?", [cid]);
    const top = await q("SELECT nombre_producto, SUM(cantidad) as c FROM ventas WHERE company_id=? GROUP BY nombre_producto ORDER BY c DESC LIMIT 5", [cid]);
    const [l] = await q("SELECT COUNT(*) as c FROM productos WHERE stock <= min_stock AND company_id=?", [cid]);
    res.json({ cajaMayor: parseFloat(v.t) + parseFloat(b.t), topProducts: top, lowStock: l.c });
});

// MODULOS CRUD
app.get('/api/productos', auth, async (req, res) => res.json(await q("SELECT p.*, b.nombre as bodega_nombre FROM productos p LEFT JOIN bodegas b ON p.bodega_id=b.id WHERE p.company_id=?", [req.user.company_id])));
app.post('/api/productos', auth, async (req, res) => {
    const { sku, nombre, fecha_vencimiento, costo_compra, costo_venta, stock, min_stock, bodega_id } = req.body;
    await q("INSERT INTO productos (company_id, sku, nombre, fecha_vencimiento, costo_compra, costo_venta, stock, min_stock, bodega_id) VALUES (?,?,?,?,?,?,?,?,?)", [req.user.company_id, sku, nombre, fecha_vencimiento, costo_compra, costo_venta, stock, min_stock, bodega_id]);
    res.json({ success: true });
});

app.get('/api/bodegas', auth, async (req, res) => res.json(await q("SELECT * FROM bodegas WHERE company_id=?", [req.user.company_id])));
app.post('/api/bodegas', auth, async (req, res) => {
    await q("INSERT INTO bodegas (company_id, nombre, detalles) VALUES (?,?,?)", [req.user.company_id, req.body.nombre, req.body.detalles]);
    res.json({ success: true });
});

app.get('/api/empleados', auth, async (req, res) => res.json(await q("SELECT * FROM empleados WHERE company_id=?", [req.user.company_id])));
app.post('/api/empleados', auth, async (req, res) => {
    const { nombre, documento, valor_dia, hire_date, eps, arl, pension } = req.body;
    await q("INSERT INTO empleados (company_id, nombre, documento, valor_dia, hire_date, eps, arl, pension) VALUES (?,?,?,?,?,?,?,?)", [req.user.company_id, nombre, documento, valor_dia, hire_date, eps, arl, pension]);
    res.json({ success: true });
});

// CAJA Y TURNOS
app.get('/api/turnos/activo/:id', auth, async (req, res) => {
    const r = await q("SELECT t.*, (SELECT IFNULL(SUM(total),0) FROM ventas WHERE turno_id=t.id) as total_vendido FROM turnos t WHERE usuario_id=? AND estado='Abierto'", [req.params.id]);
    res.json(r[0] || null);
});
app.post('/api/turnos/iniciar', auth, async (req, res) => {
    await q("INSERT INTO turnos (usuario_id, nombre_usuario, base_caja, company_id, estado) VALUES (?,?,?,?,'Abierto')", [req.user.id, req.user.nombre, req.body.base_caja, req.user.company_id]);
    res.json({ success: true });
});
app.put('/api/turnos/finalizar', auth, async (req, res) => {
    await q("UPDATE turnos SET estado='Cerrado' WHERE id=?", [req.body.turno_id]);
    res.json({ success: true });
});

// PRODUCCION
app.get('/api/produccion/ordenes', auth, async (req, res) => res.json(await q("SELECT o.*, r.nombre_kit FROM ordenes_produccion o LEFT JOIN recetas r ON o.receta_id=r.id WHERE o.company_id=?", [req.user.company_id])));
app.get('/api/produccion/recetas', auth, async (req, res) => res.json(await q("SELECT * FROM recetas WHERE company_id=?", [req.user.company_id])));
app.post('/api/produccion/recetas', auth, async (req, res) => {
    await q("INSERT INTO recetas (company_id, nombre_kit, descripcion) VALUES (?,?,?)", [req.user.company_id, req.body.nombre, req.body.descripcion]);
    res.json({ success: true });
});
app.post('/api/produccion/ordenes', auth, async (req, res) => {
    await q("INSERT INTO ordenes_produccion (company_id, numero_orden, receta_id, cantidad_requerida, usuario_monta) VALUES (?,?,?,?,?)", [req.user.company_id, 'OP-'+Date.now(), req.body.receta_id, req.body.cantidad, req.user.nombre]);
    res.json({ success: true });
});

// PAGOS
app.get('/api/pagos', auth, async (req, res) => res.json(await q("SELECT * FROM pagos_gastos WHERE company_id=?", [req.user.company_id])));
app.post('/api/pagos', auth, async (req, res) => {
    const { beneficiario, monto, descripcion, categoria } = req.body;
    await q("INSERT INTO pagos_gastos (company_id, beneficiario, monto, descripcion, categoria) VALUES (?,?,?,?,?)", [req.user.company_id, beneficiario, monto, descripcion, categoria]);
    res.json({ success: true });
});

module.exports = app;