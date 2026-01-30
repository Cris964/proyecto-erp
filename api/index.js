/* eslint-disable */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const app = express();

const SECRET_KEY = process.env.JWT_SECRET || 'AccuCloud_Secret_2026_!#';

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

// --- HELPER PARA CONSULTAS ---
const q = async (sql, params) => {
    try { 
        const [rows] = await pool.query(sql, params); 
        return rows; 
    } catch (e) { 
        console.error("Error SQL:", e.message); 
        throw e; 
    }
};

// --- MIDDLEWARES ---
const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Token requerido" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Token inválido" });
        req.user = decoded;
        next();
    });
};

const verificarRol = (rolesPermitidos) => (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.cargo)) {
        return res.status(403).json({ error: "No tienes permiso para esta acción" });
    }
    next();
};

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/login', async (req, res) => {
    try {
        const rows = await q("SELECT id, nombre, email, cargo, company_id FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]);
        if (rows && rows.length > 0) {
            const user = rows[0];
            const token = jwt.sign({ id: user.id, company_id: user.company_id, cargo: user.cargo, nombre: user.nombre }, SECRET_KEY, { expiresIn: '24h' });
            res.json({ success: true, user, token });
        } else {
            res.json({ success: false, message: "Credenciales inválidas" });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/turnos/verificar-maestra', verificarToken, async (req, res) => {
    const rows = await q("SELECT master_password FROM usuarios WHERE company_id = ? AND cargo = 'Admin' LIMIT 1", [req.user.company_id]);
    if (rows && rows.length > 0 && rows[0].master_password === req.body.password) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// --- USUARIOS (ADMIN) ---
app.get('/api/admin/usuarios', verificarToken, verificarRol(['Admin']), async (req, res) => {
    const rows = await q("SELECT id, nombre, email, cargo FROM usuarios WHERE company_id = ?", [req.user.company_id]);
    res.json(rows);
});

app.post('/api/admin/usuarios', verificarToken, verificarRol(['Admin']), async (req, res) => {
    const { nombre, email, password, cargo } = req.body;
    await q("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,?)", [nombre, email, password, cargo, req.user.company_id]);
    res.json({ success: true });
});

app.put('/api/admin/usuarios/:id', verificarToken, verificarRol(['Admin']), async (req, res) => {
    const { nombre, email, cargo, password } = req.body;
    if (password) {
        await q("UPDATE usuarios SET nombre=?, email=?, cargo=?, password=? WHERE id=? AND company_id=?", [nombre, email, cargo, password, req.params.id, req.user.company_id]);
    } else {
        await q("UPDATE usuarios SET nombre=?, email=?, cargo=? WHERE id=? AND company_id=?", [nombre, email, cargo, req.params.id, req.user.company_id]);
    }
    res.json({ success: true });
});

app.delete('/api/admin/usuarios/:id', verificarToken, verificarRol(['Admin']), async (req, res) => {
    await q("DELETE FROM usuarios WHERE id = ? AND company_id = ?", [req.params.id, req.user.company_id]);
    res.json({ success: true });
});

// --- INVENTARIO Y BODEGAS ---
app.get('/api/productos', verificarToken, async (req, res) => {
    const rows = await q("SELECT p.*, b.nombre as bodega_nombre FROM productos p LEFT JOIN bodegas b ON p.bodega_id = b.id WHERE p.company_id = ?", [req.user.company_id]);
    res.json(rows);
});

app.post('/api/productos', verificarToken, verificarRol(['Admin', 'Bodeguero']), async (req, res) => {
    const { nombre, sku, precio, stock, bodega_id, min_stock } = req.body;
    await q("INSERT INTO productos (nombre, sku, precio, stock, bodega_id, min_stock, company_id) VALUES (?,?,?,?,?,?,?)", [nombre, sku, precio, stock, bodega_id || null, min_stock || 5, req.user.company_id]);
    res.json({ success: true });
});

app.get('/api/bodegas', verificarToken, async (req, res) => {
    const rows = await q("SELECT * FROM bodegas WHERE company_id = ?", [req.user.company_id]);
    res.json(rows);
});

app.post('/api/bodegas', verificarToken, verificarRol(['Admin', 'Bodeguero']), async (req, res) => {
    await q("INSERT INTO bodegas (nombre, company_id) VALUES (?,?)", [req.body.nombre, req.user.company_id]);
    res.json({ success: true });
});

// --- PRODUCCIÓN ---
app.get('/api/produccion/materia', verificarToken, async (req, res) => {
    const rows = await q("SELECT * FROM materia_prima WHERE company_id = ?", [req.user.company_id]);
    res.json(rows);
});

app.post('/api/produccion/materia', verificarToken, verificarRol(['Admin', 'Prealistador']), async (req, res) => {
    const { nombre, unidad_medida, cantidad, proposito, costo } = req.body;
    await q("INSERT INTO materia_prima (nombre, unidad_medida, cantidad, proposito, costo, company_id) VALUES (?,?,?,?,?,?)", [nombre, unidad_medida, cantidad, proposito, costo, req.user.company_id]);
    res.json({ success: true });
});

// --- NÓMINA ---
app.get('/api/empleados', verificarToken, async (req, res) => {
    const rows = await q("SELECT * FROM empleados WHERE company_id = ?", [req.user.company_id]);
    res.json(rows);
});

app.post('/api/empleados', verificarToken, verificarRol(['Admin', 'Nomina']), async (req, res) => {
    const { nombre, documento, cargo, salario, email, eps, arl, pension } = req.body;
    await q("INSERT INTO empleados (nombre, documento, cargo, salario, email, eps, arl, pension, company_id) VALUES (?,?,?,?,?,?,?,?,?)", [nombre, documento, cargo, salario, email, eps, arl, pension, req.user.company_id]);
    res.json({ success: true });
});

// --- CAJA ---
app.get('/api/turnos/activo/:id', verificarToken, async (req, res) => {
    const rows = await q("SELECT t.*, (SELECT IFNULL(SUM(total),0) FROM ventas WHERE turno_id = t.id) as total_vendido FROM turnos t WHERE usuario_id = ? AND estado = 'Abierto' AND company_id = ?", [req.params.id, req.user.company_id]);
    res.json(rows[0] || null);
});

app.post('/api/turnos/iniciar', verificarToken, async (req, res) => {
    await q("INSERT INTO turnos (usuario_id, nombre_usuario, base_caja, company_id, estado) VALUES (?,?,?,?,'Abierto')", [req.user.id, req.user.nombre, req.body.base_caja, req.user.company_id]);
    res.json({ success: true });
});

app.get('/api/turnos/historial', verificarToken, async (req, res) => {
    const rows = await q("SELECT * FROM turnos WHERE company_id = ? ORDER BY id DESC", [req.user.company_id]);
    res.json(rows);
});

// --- VENTAS ---
app.post('/api/ventas', verificarToken, async (req, res) => {
    const { productos, turno_id, metodo_pago, pago_recibido, cambio } = req.body;
    for (const p of productos) {
        await q("INSERT INTO ventas (producto_id, nombre_producto, cantidad, total, responsable, turno_id, company_id, metodo_pago, pago_recibido, cambio) VALUES (?,?,?,?,?,?,?,?,?,?)", [p.id, p.nombre, p.cantidad, p.precio * p.cantidad, req.user.nombre, turno_id, req.user.company_id, metodo_pago, pago_recibido, cambio]);
        await q("UPDATE productos SET stock = stock - ? WHERE id = ?", [p.cantidad, p.id]);
    }
    res.json({ success: true });
});

// --- DASHBOARD DATA ---
app.get('/api/dashboard-data', verificarToken, async (req, res) => {
    const cid = req.user.company_id;
    const v = await q("SELECT IFNULL(SUM(total),0) as total FROM ventas WHERE company_id = ?", [cid]);
    const p = await q("SELECT IFNULL(SUM(precio * stock),0) as valor FROM productos WHERE company_id = ?", [cid]);
    const c = await q("SELECT COUNT(*) as low FROM productos WHERE stock <= min_stock AND company_id = ?", [cid]);
    const rs = await q("SELECT nombre_producto, total FROM ventas WHERE company_id = ? ORDER BY id DESC LIMIT 5", [cid]);
    
    res.json({ 
        cajaMayor: v[0]?.total || 0, 
        valorInventario: p[0]?.valor || 0, 
        lowStock: c[0]?.low || 0,
        recentSales: rs
    });
});

// --- CONTABILIDAD ---
app.get('/api/contabilidad/ventas', verificarToken, async (req, res) => {
    const rows = await q("SELECT id, fecha_venta as fecha, nombre_producto, total FROM ventas WHERE company_id = ? ORDER BY id DESC", [req.user.company_id]);
    res.json(rows);
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));

module.exports = app;