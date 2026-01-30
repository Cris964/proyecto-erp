/* eslint-disable */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken'); // <--- 1. IMPORTAR JWT
const app = express();

const SECRET_KEY = process.env.JWT_SECRET || 'AccuCloud_Secret_2026_!#'; // <--- CLAVE MAESTRA

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
    catch (e) { console.error("Error:", e.message); throw e; }
};

// --- 2. MIDDLEWARE DE SEGURIDAD (EL GUARDIÁN) ---
const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "No autorizado" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Token inválido o expirado" });
        req.user = decoded; // Aquí guardamos el ID y el COMPANY_ID del usuario
        next();
    });
};

// --- AUTH & USUARIOS ---
app.post('/api/login', async (req, res) => {
    const rows = await q("SELECT * FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]);
    if (rows.length > 0) {
        const user = rows[0];
        // 3. GENERAR EL TOKEN CON EL COMPANY_ID ADENTRO
        const token = jwt.sign(
            { id: user.id, company_id: user.company_id, cargo: user.cargo }, 
            SECRET_KEY, 
            { expiresIn: '24h' }
        );
        res.json({ success: true, user, token });
    } else {
        res.json({ success: false });
    }
});

// --- RUTAS PROTEGIDAS (Añadimos 'verificarToken') ---

app.get('/api/admin/usuarios', verificarToken, async (req, res) => {
    // Usamos req.user.company_id del token, no del query del frontend
    const rows = await q("SELECT * FROM usuarios WHERE company_id = ?", [req.user.company_id]);
    res.json(rows);
});

app.post('/api/admin/usuarios', verificarToken, async (req, res) => {
    const { nombre, email, password, cargo } = req.body;
    await q("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,?)", 
        [nombre, email, password, cargo, req.user.company_id]);
    res.json({ success: true });
});

// --- INVENTARIO & BODEGAS ---
app.get('/api/productos', verificarToken, async (req, res) => {
    const rows = await q("SELECT * FROM productos WHERE company_id = ?", [req.user.company_id]);
    res.json(rows);
});

app.post('/api/productos', verificarToken, async (req, res) => {
    const { nombre, sku, precio, stock, bodega_id } = req.body;
    await q("INSERT INTO productos (nombre, sku, precio, stock, bodega_id, company_id) VALUES (?,?,?,?,?,?)", 
        [nombre, sku, precio, stock, bodega_id, req.user.company_id]);
    res.json({ success: true });
});

// --- CAJA ---
app.get('/api/turnos/activo/:id', verificarToken, async (req, res) => {
    const rows = await q("SELECT t.*, (SELECT IFNULL(SUM(total),0) FROM ventas WHERE turno_id = t.id) as total_vendido FROM turnos t WHERE usuario_id = ? AND estado = 'Abierto' AND company_id = ?", 
        [req.params.id, req.user.company_id]);
    res.json(rows[0] || null);
});

app.post('/api/turnos/iniciar', verificarToken, async (req, res) => {
    await q("INSERT INTO turnos (usuario_id, nombre_usuario, base_caja, company_id, estado) VALUES (?,?,?,?,'Abierto')", 
        [req.user.id, req.body.nombre_usuario, req.body.base_caja, req.user.company_id]);
    res.json({ success: true });
});

// --- VENTAS ---
app.post('/api/ventas', verificarToken, async (req, res) => {
    const { productos, responsable, turno_id } = req.body;
    for (const p of productos) {
        await q("INSERT INTO ventas (producto_id, nombre_producto, cantidad, total, responsable, turno_id, company_id) VALUES (?,?,?,?,?,?,?)", 
            [p.id, p.nombre, p.cantidad, p.precio * p.cantidad, responsable, turno_id, req.user.company_id]);
        await q("UPDATE productos SET stock = stock - ? WHERE id = ? AND company_id = ?", [p.cantidad, p.id, req.user.company_id]);
    }
    res.json({ success: true });
});

// --- DASHBOARD ---
app.get('/api/dashboard-data', verificarToken, async (req, res) => {
    const cid = req.user.company_id;
    const v = await q("SELECT IFNULL(SUM(total),0) as total FROM ventas WHERE company_id = ?", [cid]);
    const p = await q("SELECT IFNULL(SUM(precio * stock),0) as valor FROM productos WHERE company_id = ?", [cid]);
    const c = await q("SELECT COUNT(*) as low FROM productos WHERE stock <= 5 AND company_id = ?", [cid]);
    res.json({ cajaMayor: v[0].total, valorInventario: p[0].valor, lowStock: c[0].low });
});

// Servir estáticos de React
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));

module.exports = app;