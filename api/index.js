/* eslint-disable */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentado para soportar importación de Excel pesados

// CONFIGURACIÓN DE CONEXIÓN A AIVEN
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: { rejectUnauthorized: false },
    connectTimeout: 35000
};
const pool = mysql.createPool(dbConfig);

// CONFIGURACIÓN DE CORREO (Para Nómina)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// ==========================================
// 1. SEGURIDAD Y AUTENTICACIÓN
// ==========================================

// Login Corporativo
app.post('/api/login', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]);
        if (rows.length > 0) res.json({ success: true, user: rows[0] });
        else res.json({ success: false, message: "Credenciales inválidas" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Verificación de Clave Maestra (Apertura de Caja)
app.post('/api/turnos/verificar-maestra', async (req, res) => {
    try {
        const { company_id, password } = req.body;
        const [rows] = await pool.query("SELECT master_password FROM companies WHERE id = ?", [company_id]);
        res.json({ success: rows.length > 0 && rows[0].master_password === password });
    } catch (e) { res.status(500).send(e.message); }
});

// ==========================================
// 2. ADMINISTRACIÓN DE USUARIOS (CRUD FULL)
// ==========================================

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

// ==========================================
// 3. INVENTARIO, BODEGAS Y EXCEL
// ==========================================

app.get('/api/productos', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM productos WHERE company_id = ?", [req.query.company_id]);
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/productos', async (req, res) => {
    try {
        const { nombre, sku, precio, stock, bodega_id, company_id } = req.body;
        await pool.query("INSERT INTO productos (nombre, sku, precio, stock, bodega_id, company_id, min_stock) VALUES (?,?,?,?,?,?,5)", [nombre, sku, precio, stock, bodega_id, company_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/productos/importar', async (req, res) => {
    try {
        const { productos, company_id } = req.body;
        for (const p of productos) {
            await pool.query("INSERT INTO productos (nombre, sku, precio, stock, company_id, min_stock) VALUES (?,?,?,?,?,5) ON DUPLICATE KEY UPDATE stock = stock + ?", [p.nombre, p.sku, p.precio, p.stock, company_id, p.stock]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/bodegas', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM bodegas WHERE company_id = ?", [req.query.company_id]);
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/bodegas', async (req, res) => {
    try {
        await pool.query("INSERT INTO bodegas (nombre, company_id) VALUES (?,?)", [req.body.nombre, req.body.company_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

// ==========================================
// 4. PRODUCCIÓN INDUSTRIAL (MATERIA Y OP)
// ==========================================

// Obtener el siguiente número de orden 0001, 0002...
app.get('/api/produccion/siguiente-numero', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) as total FROM ordenes_produccion WHERE company_id = ?", [req.query.company_id]);
        const num = (rows[0].total + 1).toString().padStart(4, '0');
        res.json({ numero: num });
    } catch (e) { res.json({ numero: "0001" }); }
});

app.get('/api/produccion/materia', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM materia_prima WHERE company_id = ?", [req.query.company_id]);
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/produccion/materia', async (req, res) => {
    try {
        const { nombre, unidad_medida, cantidad, costo, company_id } = req.body;
        await pool.query("INSERT INTO materia_prima (nombre, unidad_medida, cantidad, costo, company_id) VALUES (?,?,?,?,?)", [nombre, unidad_medida, cantidad, costo, company_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/produccion/ordenes', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM ordenes_produccion WHERE company_id = ?", [req.query.company_id]);
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/produccion/ordenes', async (req, res) => {
    try {
        const { numero_orden, nombre_producto, cantidad, company_id } = req.body;
        await pool.query("INSERT INTO ordenes_produccion (numero_orden, nombre_producto, cantidad_producir, company_id, estado) VALUES (?,?,?,?, 'Prealistamiento')", [numero_orden, nombre_producto, cantidad, company_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.put('/api/produccion/ordenes/:id', async (req, res) => {
    try {
        const { estado, datos_logistica } = req.body;
        await pool.query("UPDATE ordenes_produccion SET estado=?, datos_logistica=? WHERE id=?", [estado, JSON.stringify(datos_logistica), req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

// ==========================================
// 5. NÓMINA PRO 2026
// ==========================================

app.get('/api/empleados', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM empleados WHERE company_id = ?", [req.query.company_id]);
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/empleados', async (req, res) => {
    try {
        const { nombre, email, salario, eps, arl, pension, company_id } = req.body;
        await pool.query("INSERT INTO empleados (nombre, email, salario, eps, arl, pension, company_id) VALUES (?,?,?,?,?,?,?)", [nombre, email, salario, eps, arl, pension, company_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/nomina/liquidar', async (req, res) => {
    const { email, nombre, neto, aux, salud, pension } = req.body;
    try {
        await transporter.sendMail({
            from: '"AccuCloud Nómina" <no-reply@accucloud.com>',
            to: email,
            subject: "Comprobante de Pago de Nómina 2026",
            html: `<h3>Hola ${nombre},</h3><p>Tu pago ha sido procesado:</p>
                   <ul><li>Sueldo Base: ${neto}</li><li>Auxilio: ${aux}</li></ul>`
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Error al enviar correo" }); }
});

// ==========================================
// 6. DASHBOARD Y CONTABILIDAD
// ==========================================

app.get('/api/dashboard-data', async (req, res) => {
    try {
        const { company_id } = req.query;
        const [v] = await pool.query("SELECT IFNULL(SUM(total),0) as total FROM ventas WHERE company_id = ?", [company_id]);
        const [p] = await pool.query("SELECT IFNULL(SUM(precio * stock),0) as valor FROM productos WHERE company_id = ?", [company_id]);
        const [c] = await pool.query("SELECT COUNT(*) as low FROM productos WHERE stock <= min_stock AND company_id = ?", [company_id]);
        res.json({ cajaMayor: v[0].total, valorInventario: p[0].valor, lowStock: c[0].low });
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/contabilidad/ventas', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM ventas WHERE company_id = ? ORDER BY fecha DESC", [req.query.company_id]);
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

// CAJA: Obtener turno activo
app.get('/api/turnos/activo/:id', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT t.*, (SELECT IFNULL(SUM(total),0) FROM ventas WHERE turno_id = t.id) as total_vendido FROM turnos t WHERE usuario_id = ? AND estado = 'Abierto'", [req.params.id]);
        res.json(rows[0] || null);
    } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/turnos/iniciar', async (req, res) => {
    try {
        const { usuario_id, nombre_usuario, base_caja, company_id } = req.body;
        await pool.query("INSERT INTO turnos (usuario_id, nombre_usuario, base_caja, company_id, estado) VALUES (?,?,?,?,'Abierto')", [usuario_id, nombre_usuario, base_caja, company_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

app.put('/api/turnos/finalizar', async (req, res) => {
    try {
        await pool.query("UPDATE turnos SET estado = 'Cerrado' WHERE id = ?", [req.body.turno_id]);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

// SERVIR EL FRONTEND
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

module.exports = app;