const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- SERVIR FRONTEND ---
app.use(express.static(path.join(__dirname, '../frontend/build')));

const dbConfig = {
    host: process.env.DB_HOST || 'mysql-14f55f3e-cristiancaicedo68-cf3e.h.aivencloud.com',
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD || 'hzdq dzzk fooa ocdk', // La del icono del ojo
    database: process.env.DB_NAME || 'defaultdb',
    port: process.env.DB_PORT || 14489,
    ssl: { rejectUnauthorized: false } // <--- ESTO ES VITAL PARA AIVEN
};
const pool = mysql.createPool(dbConfig);

// CONFIGURACIÓN CORREO (NODEMAILER)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true para el puerto 465
    auth: {
        user: 'crisplusplay@gmail.com', 
        pass: 'hzdq dzzk fooa ocdk' // <--- ASEGÚRATE QUE SEA LA DE 16 LETRAS DE GOOGLE
    }
});

// ================= RUTAS DE LA API =================

// Registro de nuevos usuarios (EMPRESAS)
app.post('/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
        }
        const sql = "INSERT INTO usuarios (nombre, email, password, cargo) VALUES (?, ?, ?, ?)";
        await pool.query(sql, [nombre, email, password, 'Admin']);
        res.json({ success: true, message: "Usuario registrado con éxito" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: "Correo ya registrado" });
        res.status(500).json({ success: false, message: err.message });
    }
});

// Login
app.post('/login', async (req, res) => {
    try { 
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [req.body.email, req.body.password]); 
        res.json(rows.length > 0 ? { success: true, user: rows[0] } : { success: false, message: "Datos incorrectos" }); 
    } catch (err) { res.status(500).send(err.message); }
});

// Dashboard Data
app.get('/dashboard-data', async (req, res) => {
    try {
        const [mayor] = await pool.query("SELECT IFNULL(SUM(total), 0) as total FROM ventas");
        const [bases] = await pool.query("SELECT IFNULL(SUM(base_caja), 0) as total FROM turnos WHERE estado = 'Abierto'");
        const [ventasTurno] = await pool.query("SELECT IFNULL(SUM(v.total), 0) as total FROM ventas v JOIN turnos t ON v.turno_id = t.id WHERE t.estado = 'Abierto'");
        const [prod] = await pool.query("SELECT COUNT(*) as total, IFNULL(SUM(precio * stock), 0) as valor, IFNULL(SUM(CASE WHEN stock <= min_stock THEN 1 ELSE 0 END), 0) as low FROM productos");
        const [recent] = await pool.query("SELECT * FROM ventas ORDER BY fecha DESC LIMIT 5");
        res.json({ 
            cajaMayor: Number(mayor[0].total), 
            cajaMenor: Number(bases[0].total) + Number(ventasTurno[0].total), 
            totalProductos: Number(prod[0].total), 
            valorInventario: Number(prod[0].valor), 
            lowStock: Number(prod[0].low), 
            recentSales: recent 
        });
    } catch (e) { res.status(500).send(e.message); }
});

// Empleados
app.get('/empleados', async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM empleados");
    res.json(rows);
});

app.post('/empleados', async (req, res) => {
    try {
        const { nombre, documento, cargo, salario, email, eps, arl, pension } = req.body;
        await pool.query(
            "INSERT INTO empleados (nombre, documento, cargo, salario, email, eps, arl, pension_fund) VALUES (?,?,?,?,?,?,?,?)",
            [nombre, documento, cargo, salario, email, eps || 'N/A', arl || 'N/A', pension || 'N/A']
        );
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

// Nómina Liquidar (Lógica de Descuentos de Ley Colombia)
app.post('/nomina/liquidar', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { empleado_id, dias, extras, tipo_extra, responsable, metodo_pago, banco, cuenta } = req.body;
        
        const [empRows] = await connection.query("SELECT * FROM empleados WHERE id = ?", [empleado_id]);
        const emp = empRows[0];

        // --- VALORES LEGALES COLOMBIA 2026 ---
        const SMLV_2026 = 1750905;
        const AUX_TRANS_2026 = 249095; 
        const SALARIO_EMPLEADO = parseFloat(emp.salario);

        const sueldoBasico = Math.round((SALARIO_EMPLEADO / 30) * dias);
        const auxilio = (SALARIO_EMPLEADO <= (SMLV_2026 * 2)) ? Math.round((AUX_TRANS_2026 / 30) * dias) : 0;
        
        const valorHora = SALARIO_EMPLEADO / 240;
        let factor = 1.25; 
        if (tipo_extra === 'Nocturno') factor = 1.75;
        if (tipo_extra === 'Dominical') factor = 1.75;
        if (tipo_extra === 'Recargo_Nocturno') factor = 0.35;
        
        const valorExtras = Math.round((valorHora * factor) * parseFloat(extras || 0));
        const totalDevengado = sueldoBasico + auxilio + valorExtras;

        const ibc = sueldoBasico + (tipo_extra === 'Recargo_Nocturno' ? 0 : valorExtras); 
        const salud = Math.round(ibc * 0.04);
        const pension = Math.round(ibc * 0.04);
        const neto = totalDevengado - (salud + pension);

        await connection.query(
            `INSERT INTO nominas (empleado_id, nombre_empleado, dias_trabajados, salario_base, total_devengado, total_deducido, neto_pagar, responsable, metodo_pago, banco, nro_cuenta, salud, pension, horas_extras) 
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [emp.id, emp.nombre, dias, SALARIO_EMPLEADO, totalDevengado, (salud + pension), neto, responsable, metodo_pago, banco || 'Efectivo', cuenta || 'N/A', salud, pension, valorExtras]
        );

        const [comp] = await connection.query("INSERT INTO comprobantes (tipo, descripcion, responsable, total) VALUES (?,?,?,?)", 
            ['Pago Nómina', `Nómina 2026 - ${emp.nombre} (${tipo_extra})`, responsable, neto]);
        
        const compId = comp.insertId;
        await connection.query("INSERT INTO asientos (comprobante_id, cuenta_codigo, debito, credito) VALUES (?,? ,?,?)", [compId, '5105', totalDevengado, 0]);
        await connection.query("INSERT INTO asientos (comprobante_id, cuenta_codigo, debito, credito) VALUES (?,? ,?,?)", [compId, '2370', 0, (salud + pension)]);
        const cuentaSalida = metodo_pago === 'Efectivo' ? '1105' : '1110';
        await connection.query("INSERT INTO asientos (comprobante_id, cuenta_codigo, debito, credito) VALUES (?,? ,?,?)", [compId, cuentaSalida, 0, neto]);

        try {
            await transporter.sendMail({
                from: '"AccuCloud Nómina" <crisplusplay@gmail.com>',
                to: emp.email,
                subject: `Comprobante Nómina Electrónica - ${emp.nombre}`,
                html: `<div style="font-family: 'Helvetica', sans-serif; max-width: 550px; margin: auto; border: 1px solid #f0f0f0; border-radius: 40px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05);">
                        <div style="background: #0f172a; padding: 50px 40px; text-align: center; color: white;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1.5px;">AccuCloud <span style="color: #3b82f6;">.</span></h1>
                            <p style="opacity: 0.6; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin-top: 10px;">Recibo de Pago Oficial 2026</p>
                        </div>
                        <div style="padding: 40px; background: white;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h2 style="margin: 0; color: #1e293b; font-size: 22px;">${emp.nombre}</h2>
                                <p style="color: #64748b; font-size: 14px;">Identificación: ${emp.documento}</p>
                            </div>
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <tr><td style="padding: 12px 0; color: #64748b;">Sueldo Básico (${dias}d)</td><td style="text-align: right; font-weight: bold; color: #1e293b;">$${parseInt(sueldoBasico).toLocaleString()}</td></tr>
                                <tr><td style="padding: 12px 0; color: #64748b;">Auxilio Transporte</td><td style="text-align: right; font-weight: bold; color: #1e293b;">$${parseInt(auxilio).toLocaleString()}</td></tr>
                                <tr><td style="padding: 12px 0; color: #64748b;">Horas (${tipo_extra})</td><td style="text-align: right; font-weight: bold; color: #1e293b;">$${parseInt(valorExtras).toLocaleString()}</td></tr>
                                <tr style="color: #ef4444;"><td style="padding: 12px 0; border-top: 1px solid #f1f5f9;">Salud/Pensión (8%)</td><td style="text-align: right; font-weight: bold; border-top: 1px solid #f1f5f9;">-$${parseInt(salud + pension).toLocaleString()}</td></tr>
                                <tr><td style="padding: 30px 0 10px 0; font-size: 18px; font-weight: 900; color: #1e293b;">NETO PAGADO</td><td style="padding: 30px 0 10px 0; text-align: right; font-size: 28px; font-weight: 900; color: #3b82f6;">$${parseInt(neto).toLocaleString()}</td></tr>
                            </table>
                            <div style="margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 20px; font-size: 12px; color: #64748b;">
                                <p style="margin: 0;"><b>Canal:</b> ${metodo_pago} - ${banco || 'Caja'}</p>
                                <p style="margin: 5px 0 0 0;"><b>Cuenta:</b> ${cuenta || 'Efectivo'}</p>
                            </div>
                        </div>
                    </div>`
            });
            console.log("✅ Correo enviado");
        } catch (mailError) {
            console.error("❌ El correo falló, pero la nómina se guardó:", mailError.message);
        }

        await connection.commit();
        res.json({ success: true, message: "Liquidado con éxito" });

    } catch (e) { 
        await connection.rollback(); 
        console.error("❌ Error fatal:", e.message);
        res.status(500).json({ success: false, message: e.message }); 
    } finally { connection.release(); }
}); // <--- AQUÍ FALTABA ESTO

// ================= RUTAS DE CONTABILIDAD PROFESIONAL =================

app.get('/contabilidad/diario', async (req, res) => {
    try {
        const sql = `SELECT c.id as comprobante_id, c.fecha, c.tipo as tipo_doc, c.descripcion, a.cuenta_codigo, p.nombre as cuenta_nombre, a.debito, a.credito
            FROM comprobantes c JOIN asientos a ON c.id = a.comprobante_id JOIN plan_cuentas p ON a.cuenta_codigo = p.codigo ORDER BY c.fecha DESC, c.id DESC`;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/contabilidad/balance', async (req, res) => {
    try {
        const sql = `SELECT p.codigo, p.nombre, p.tipo, IFNULL(SUM(a.debito), 0) as total_debito, IFNULL(SUM(a.credito), 0) as total_credito, (IFNULL(SUM(a.debito), 0) - IFNULL(SUM(a.credito), 0)) as saldo
            FROM plan_cuentas p LEFT JOIN asientos a ON p.codigo = a.cuenta_codigo GROUP BY p.codigo HAVING total_debito > 0 OR total_credito > 0 ORDER BY p.codigo ASC`;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (e) { res.status(500).send(e.message); }
});

// Ventas
app.get('/ventas', async(r,s)=>{const[d]=await pool.query("SELECT * FROM ventas ORDER BY fecha DESC");s.json(d)});
app.post('/ventas', async (r, s) => {
    const c = await pool.getConnection();
    try {
        await c.beginTransaction();
        const { producto_id, nombre_producto, cantidad, precio_unitario, responsable, turno_id, metodo_pago, es_electronica, cliente, pago_recibido, cambio } = r.body;
        const tot = cantidad * precio_unitario;
        const [resVenta] = await c.query(
            "INSERT INTO ventas (producto_id, nombre_producto, cantidad, total, estado, responsable, turno_id, metodo_pago, dinero_recibido, cambio) VALUES (?,?,?,?,?,?,?,?,?,?)",
            [producto_id, nombre_producto, cantidad, tot, 'Pagada', responsable, turno_id, metodo_pago, pago_recibido || tot, cambio || 0]
        );

        if (es_electronica && cliente && cliente.email) {
            try {
                await transporter.sendMail({
                    from: '"Facturación AccuCloud" <crisplusplay@gmail.com>',
                    to: cliente.email,
                    subject: `Factura POS-${resVenta.insertId}`,
                    html: `<h1>Gracias por tu compra</h1><p>Total: $${tot.toLocaleString()}</p>`
                });
            } catch (mailError) { console.error("Error correo venta:", mailError.message); }
        }
        await c.commit();
        s.json({ success: true, id: resVenta.insertId });
    } catch (e) { await c.rollback(); s.status(500).json({ success: false, message: e.message }); }
    finally { c.release(); }
});

app.post('/productos/importar', async (r, s) => {
    const c = await pool.getConnection();
    try {
        await c.beginTransaction();
        const { productos, responsable } = r.body;
        for (const p of productos) {
            await c.query(`INSERT INTO productos (nombre, sku, precio, stock, categoria, min_stock) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE stock = stock + VALUES(stock), precio = VALUES(precio)`, [p.nombre, p.sku, p.precio, p.stock, 'General', p.min_stock || 5]);
            await c.query("INSERT INTO movimientos (producto, tipo, cantidad, responsable) VALUES (?,?,?,?)", [p.nombre, 'Carga Masiva', p.stock, responsable || 'Sistema']);
        }
        await c.commit();
        s.json({ success: true });
    } catch (e) { await c.rollback(); s.status(500).send(e.message); }
    finally { c.release(); }
});

app.get('/turnos/activo/:id', async(r,s)=>{const[d]=await pool.query("SELECT * FROM turnos WHERE usuario_id=? AND estado='Abierto'",[r.params.id]);s.json(d[0]||null)});
app.post('/turnos/iniciar', async(r,s)=>{try{const{usuario_id,nombre_usuario,base_caja}=r.body;await pool.query("INSERT INTO turnos (usuario_id,nombre_usuario,base_caja) VALUES (?,?,?)",[usuario_id,nombre_usuario,base_caja||0]);s.json({success:true});}catch(e){s.status(500).send(e.message)}});
app.put('/turnos/finalizar', async(r,s)=>{try{const{turno_id}=r.body;const[v]=await pool.query("SELECT IFNULL(SUM(total),0) as total FROM ventas WHERE turno_id=?",[turno_id]);await pool.query("UPDATE turnos SET fecha_fin=NOW(),estado='Cerrado',total_vendido=? WHERE id=?",[v[0].total,turno_id]);s.json({success:true,message:"Cerrado"});}catch(e){s.status(500).send(e.message)}});

app.get('/productos', async(r,s)=>{const[d]=await pool.query("SELECT * FROM productos");s.json(d)});
app.post('/productos', async(r,s)=>{try{const{nombre,sku,precio,stock,categoria,min_stock}=r.body;await pool.query("INSERT INTO productos (nombre,sku,precio,stock,categoria,min_stock) VALUES (?,?,?,?,?,?)",[nombre,sku,precio,stock,categoria,min_stock||5]);s.json("Ok");}catch(e){s.status(500).send(e.message)}});

app.get('/nomina/historial', async (req, res) => { const [r] = await pool.query("SELECT * FROM nominas ORDER BY fecha_pago DESC"); res.json(r); });

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(3001, () => console.log("🚀 Servidor UNIFICADO Listo en Puerto 3001"));