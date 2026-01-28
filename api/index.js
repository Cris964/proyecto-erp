/* api/index.js */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: { rejectUnauthorized: false },
    connectTimeout: 20000
};
const pool = mysql.createPool(dbConfig);

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true, 
    auth: { user: 'crisplusplay@gmail.com', pass: 'hzdq dzzk fooa ocdk' },
    tls: { rejectUnauthorized: false }
});

// --- AUTH & ADMIN ---
app.post('/api/register', async (req, res) => {
    const c = await pool.getConnection();
    try {
        await c.beginTransaction();
        const { nombre, email, password } = req.body;
        const [resCo] = await c.query("INSERT INTO companies (nombre_empresa) VALUES (?)", [nombre]);
        const companyId = resCo.insertId;
        await c.query("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?, ?, ?, ?, ?)", 
        ['Admin ' + nombre, email, password, 'Admin', companyId]);
        await c.commit();
        res.json({ success: true });
    } catch (err) { await c.rollback(); res.status(500).json({ success: false, message: err.message }); }
    finally { c.release(); }
});

app.post('/api/login', async (req, res) => {
    try { 
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]); 
        res.json(rows.length > 0 ? { success: true, user: rows[0] } : { success: false }); 
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/admin/usuarios', async (req, res) => {
    const [rows] = await pool.query("SELECT id, nombre, email, cargo FROM usuarios WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

app.put('/api/admin/usuarios/:id', async (req, res) => {
    const { nombre, email, password, cargo } = req.body;
    await pool.query("UPDATE usuarios SET nombre=?, email=?, password=?, cargo=? WHERE id=?", [nombre, email, password, cargo, req.params.id]);
    res.json({ success: true });
});

app.delete('/api/admin/usuarios/:id', async (req, res) => {
    await pool.query("DELETE FROM usuarios WHERE id = ?", [req.params.id]);
    res.json({ success: true });
});

// --- PRODUCCIÓN ---
app.get('/api/produccion/materia', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM materia_prima WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

app.post('/api/produccion/materia', async (req, res) => {
    const { nombre, unidad, cantidad, proposito, costo, company_id } = req.body;
    await pool.query("INSERT INTO materia_prima (nombre, unidad_medida, cantidad, proposito, costo, company_id) VALUES (?,?,?,?,?,?)", [nombre, unidad, cantidad, proposito, costo, company_id]);
    res.json({ success: true });
});

app.get('/api/produccion/ordenes', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM ordenes_produccion WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

app.post('/api/produccion/ordenes', async (req, res) => {
    const { nombre_producto, cantidad, company_id } = req.body;
    await pool.query("INSERT INTO ordenes_produccion (nombre_producto, cantidad_producir, company_id, estado) VALUES (?,?,?, 'Prealistamiento')", [nombre_producto, cantidad, company_id]);
    res.json({ success: true });
});

app.put('/api/produccion/ordenes/:id/estado', async (req, res) => {
    await pool.query("UPDATE ordenes_produccion SET estado = ? WHERE id = ?", [req.body.estado, req.params.id]);
    res.json({ success: true });
});

// --- CAJA & VENTAS ---
app.post('/api/turnos/verificar-maestra', async (req, res) => {
    const [co] = await pool.query("SELECT master_password FROM companies WHERE id = ?", [req.body.company_id]);
    res.json({ success: co[0].master_password === req.body.password });
});

app.get('/api/turnos/activo/:id', async (req, res) => {
    const [turno] = await pool.query("SELECT * FROM turnos WHERE usuario_id = ? AND estado = 'Abierto'", [req.params.id]);
    if (turno.length > 0) {
        const [v] = await pool.query("SELECT IFNULL(SUM(total), 0) as total FROM ventas WHERE turno_id = ?", [turno[0].id]);
        res.json({ ...turno[0], total_vendido: v[0].total });
    } else res.json(null);
});

app.post('/api/turnos/iniciar', async (req, res) => {
    await pool.query("INSERT INTO turnos (usuario_id, nombre_usuario, base_caja, company_id) VALUES (?,?,?,?)", [req.body.usuario_id, req.body.nombre_usuario, req.body.base_caja, req.body.company_id]);
    res.json({ success: true });
});

app.post('/api/ventas', async (req, res) => {
    const c = await pool.getConnection();
    try {
        await c.beginTransaction();
        const { productos, responsable, turno_id, metodo_pago, pago_recibido, cambio, company_id } = req.body;
        for (const p of productos) {
            await c.query("INSERT INTO ventas (producto_id, nombre_producto, cantidad, total, responsable, turno_id, metodo_pago, dinero_recibido, cambio, company_id) VALUES (?,?,?,?,?,?,?,?,?,?)", 
            [p.id, p.nombre, p.cantidad, p.precio * p.cantidad, responsable, turno_id, metodo_pago, pago_recibido, cambio, company_id]);
            await c.query("UPDATE productos SET stock = stock - ? WHERE id = ?", [p.cantidad, p.id]);
        }
        await c.commit(); res.json({ success: true });
    } catch (e) { await c.rollback(); res.status(500).json({ success: false, message: e.message }); }
    finally { c.release(); }
});

// --- INVENTARIO, NOMINA, CONTABILIDAD ---
app.get('/api/productos', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM productos WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

app.put('/api/productos/stock', async (req, res) => {
    await pool.query("UPDATE productos SET stock = stock + ? WHERE id = ?", [req.body.cantidad, req.body.id]);
    res.json({ success: true });
});

app.get('/api/empleados', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM empleados WHERE company_id = ?", [req.query.company_id]);
    res.json(rows);
});

app.get('/api/contabilidad/ventas', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM ventas WHERE company_id = ? ORDER BY fecha DESC", [req.query.company_id]);
    res.json(rows);
});

app.get(/.*/, (req, res) => { res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')); });

module.exports = app;