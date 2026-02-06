/* eslint-disable */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const app = express();

const SECRET_KEY = 'AccuCloud_Ultimate_Security_2026';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// CONFIGURACIÓN DE POOL DE CONEXIONES (Para Aiven)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// HELPER PARA CONSULTAS
const q = async (sql, params) => {
    try {
        const [rows] = await pool.query(sql, params);
        return rows;
    } catch (e) {
        console.error("❌ Error en SQL:", e.message);
        throw e;
    }
};

// MIDDLEWARE DE AUTENTICACIÓN
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Token no proporcionado" });
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Sesión expirada" });
        req.user = decoded; // { id, company_id, cargo, nombre }
        next();
    });
};

// ==========================================
//           MÓDULO: AUTENTICACIÓN
// ==========================================
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const rows = await q("SELECT * FROM usuarios WHERE email = ? AND password = ?", [email, password]);
    if (rows.length > 0) {
        const u = rows[0];
        const token = jwt.sign({ 
            id: u.id, 
            company_id: u.company_id, 
            cargo: u.cargo, 
            nombre: u.nombre 
        }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ success: true, user: u, token });
    } else {
        res.json({ success: false, message: "Credenciales inválidas" });
    }
});

// ==========================================
//           MÓDULO: DASHBOARD (MÉTRICAS)
// ==========================================
app.get('/api/dashboard-data', auth, async (req, res) => {
    const cid = req.user.company_id;
    try {
        // Caja Mayor: Ventas totales + Bases de apertura de turnos
        const [v] = await q("SELECT IFNULL(SUM(total),0) as t FROM ventas WHERE company_id = ?", [cid]);
        const [b] = await q("SELECT IFNULL(SUM(base_caja),0) as t FROM turnos WHERE company_id = ?", [cid]);
        const cajaMayor = parseFloat(v.t) + parseFloat(b.t);

        // Top 5 Productos más vendidos
        const top = await q(`
            SELECT nombre_producto, SUM(cantidad) as total 
            FROM ventas 
            WHERE company_id = ? 
            GROUP BY nombre_producto 
            ORDER BY total DESC LIMIT 5
        `, [cid]);

        // Alertas de Stock
        const [low] = await q("SELECT COUNT(*) as c FROM productos WHERE stock <= min_stock AND company_id = ?", [cid]);

        res.json({ 
            cajaMayor, 
            topProducts: top, 
            lowStock: low.c 
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
//           MÓDULO: INVENTARIO PRO
// ==========================================
app.get('/api/productos', auth, async (req, res) => {
    const rows = await q(`
        SELECT p.*, b.nombre as bodega_nombre 
        FROM productos p 
        LEFT JOIN bodegas b ON p.bodega_id = b.id 
        WHERE p.company_id = ?
    `, [req.user.company_id]);
    res.json(rows);
});

app.post('/api/productos', auth, async (req, res) => {
    const { sku, nombre, fecha_vencimiento, costo_compra, costo_venta, stock, min_stock, bodega_id } = req.body;
    await q(`
        INSERT INTO productos 
        (company_id, sku, nombre, fecha_vencimiento, costo_compra, costo_venta, stock, min_stock, bodega_id) 
        VALUES (?,?,?,?,?,?,?,?,?)
    `, [req.user.company_id, sku, nombre, fecha_vencimiento, costo_compra, costo_venta, stock, min_stock, bodega_id || null]);
    res.json({ success: true });
});

app.get('/api/bodegas', auth, async (req, res) => {
    res.json(await q("SELECT * FROM bodegas WHERE company_id = ?", [req.user.company_id]));
});

app.post('/api/bodegas', auth, async (req, res) => {
    const { nombre, detalles } = req.body;
    await q("INSERT INTO bodegas (company_id, nombre, detalles) VALUES (?,?,?)", 
    [req.user.company_id, nombre, detalles]);
    res.json({ success: true });
});

// ==========================================
//           MÓDULO: PRODUCCIÓN (FLUJO)
// ==========================================
app.get('/api/produccion/recetas', auth, async (req, res) => {
    res.json(await q("SELECT * FROM recetas WHERE company_id = ?", [req.user.company_id]));
});

app.post('/api/produccion/recetas', auth, async (req, res) => {
    const { nombre_kit } = req.body;
    await q("INSERT INTO recetas (company_id, nombre_kit) VALUES (?,?)", [req.user.company_id, nombre_kit]);
    res.json({ success: true });
});

app.get('/api/produccion/ordenes', auth, async (req, res) => {
    const rows = await q(`
        SELECT o.*, r.nombre_kit 
        FROM ordenes_produccion o 
        JOIN recetas r ON o.receta_id = r.id 
        WHERE o.company_id = ? 
        ORDER BY o.fecha_creacion DESC
    `, [req.user.company_id]);
    res.json(rows);
});

app.post('/api/produccion/ordenes', auth, async (req, res) => {
    const { receta_id, cantidad } = req.body;
    await q(`
        INSERT INTO ordenes_produccion 
        (company_id, numero_orden, receta_id, cantidad_requerida, usuario_monta, estado) 
        VALUES (?,?,?,?,?, 'Montada')
    `, [req.user.company_id, 'OP-' + Date.now(), receta_id, cantidad, req.user.nombre]);
    res.json({ success: true });
});

app.put('/api/produccion/ordenes/:id/avanzar', auth, async (req, res) => {
    const { estado, cantidad_salida, observaciones } = req.body;
    let updateFields = "";
    let params = [];

    if (estado === 'Alistada') {
        updateFields = "estado = 'Alistada', usuario_bodeguero_alista = ?";
        params = [req.user.nombre, req.params.id];
    } else if (estado === 'Procesada') {
        updateFields = "estado = 'Procesada', usuario_produccion = ?, cantidad_salida = ?, observaciones = ?";
        params = [req.user.nombre, cantidad_salida, observaciones, req.params.id];
    } else if (estado === 'Terminada') {
        updateFields = "estado = 'Terminada', usuario_bodeguero_recibe = ?";
        params = [req.user.nombre, req.params.id];
    }

    await q(`UPDATE ordenes_produccion SET ${updateFields} WHERE id = ?`, params);
    res.json({ success: true });
});

// ==========================================
//           MÓDULO: NÓMINA CLOUD
// ==========================================
app.get('/api/empleados', auth, async (req, res) => {
    res.json(await q("SELECT * FROM empleados WHERE company_id = ?", [req.user.company_id]));
});

app.post('/api/empleados', auth, async (req, res) => {
    const { nombre, documento, salario, hire_date, eps, arl, pension } = req.body;
    await q(`
        INSERT INTO empleados 
        (company_id, nombre, documento, valor_dia, hire_date, eps, arl, pension, cargo) 
        VALUES (?,?,?,?,?,?,?,?, 'Operario')
    `, [req.user.company_id, nombre, documento, salario, hire_date, eps, arl, pension]);
    res.json({ success: true });
});

// ==========================================
//           MÓDULO: FINANZAS (CAJAS Y PAGOS)
// ==========================================
app.get('/api/caja-menor', auth, async (req, res) => {
    res.json(await q("SELECT * FROM caja_menor WHERE company_id = ? ORDER BY fecha DESC", [req.user.company_id]));
});

app.post('/api/caja-menor', auth, async (req, res) => {
    const { tipo, monto, descripcion, tarjeta } = req.body;
    await q(`
        INSERT INTO caja_menor 
        (company_id, tipo, detalle_tarjeta, monto, descripcion) 
        VALUES (?,?,?,?,?)
    `, [req.user.company_id, tipo, tarjeta || null, monto, descripcion]);
    
    // Registrar también en movimientos generales
    await q(`
        INSERT INTO caja_movimientos (company_id, tipo, monto, descripcion, detalle_tarjeta)
        VALUES (?, ?, ?, ?, ?)
    `, [req.user.company_id, tipo === 'Efectivo' ? 'Caja_Menor_Efectivo' : 'Caja_Menor_Tarjeta', -monto, descripcion, tarjeta]);
    
    res.json({ success: true });
});

app.get('/api/pagos', auth, async (req, res) => {
    res.json(await q("SELECT * FROM pagos WHERE company_id = ? ORDER BY fecha DESC", [req.user.company_id]));
});

app.post('/api/pagos', auth, async (req, res) => {
    const { beneficiario, monto, descripcion, categoria } = req.body;
    await q(`
        INSERT INTO pagos (company_id, beneficiario, monto, descripcion, categoria) 
        VALUES (?,?,?,?,?)
    `, [req.user.company_id, beneficiario, monto, descripcion, categoria]);
    res.json({ success: true });
});

// ==========================================
//           CAJA MAYOR (TURNOS)
// ==========================================
app.get('/api/turnos/activo/:id', auth, async (req, res) => {
    const rows = await q(`
        SELECT t.*, 
        (SELECT IFNULL(SUM(total),0) FROM ventas WHERE turno_id = t.id) as total_vendido 
        FROM turnos t 
        WHERE usuario_id = ? AND estado = 'Abierto'
    `, [req.params.id]);
    res.json(rows[0] || null);
});

app.post('/api/turnos/iniciar', auth, async (req, res) => {
    const { base_caja } = req.body;
    const resT = await q(`
        INSERT INTO turnos (usuario_id, nombre_usuario, base_caja, company_id, estado) 
        VALUES (?,?,?,?,'Abierto')
    `, [req.user.id, req.user.nombre, base_caja, req.user.company_id]);
    
    await q(`
        INSERT INTO caja_movimientos (company_id, tipo, monto, descripcion)
        VALUES (?, 'Base_Caja', ?, 'Apertura de turno')
    `, [req.user.company_id, base_caja]);

    res.json({ success: true });
});

app.put('/api/turnos/finalizar', auth, async (req, res) => {
    await q("UPDATE turnos SET estado = 'Cerrado' WHERE id = ? AND company_id = ?", [req.body.turno_id, req.user.company_id]);
    res.json({ success: true });
});

// ==========================================
//           MÓDULO: ADMIN USUARIOS
// ==========================================
app.get('/api/admin/usuarios', auth, async (req, res) => {
    res.json(await q("SELECT id, nombre, email, cargo FROM usuarios WHERE company_id = ?", [req.user.company_id]));
});

app.post('/api/admin/usuarios', auth, async (req, res) => {
    const { nombre, email, password, cargo } = req.body;
    await q("INSERT INTO usuarios (nombre, email, password, cargo, company_id) VALUES (?,?,?,?,?)", 
    [nombre, email, password, cargo, req.user.company_id]);
    res.json({ success: true });
});

// SERVIR FRONTEND
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get(/.*/, (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));

module.exports = app;