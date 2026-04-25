/* eslint-disable @typescript-eslint/no-explicit-any */
// app/lib/db.ts
import Database from "better-sqlite3";

const db = new Database("comunidad_data.db");

export function initDB() {
    // 1. Crear tabla de beneficiarios
    db.prepare(
        `
        CREATE TABLE IF NOT EXISTS beneficiarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cedula TEXT UNIQUE,
            nombre_completo TEXT,
            carga_familiar INTEGER,
            sector TEXT,
            recibe_clap INTEGER,
            recibe_gas INTEGER,
            deuda_pendiente REAL,
            ultima_entrega TEXT
        )
    `,
    ).run();

    // 2. Crear tabla de solicitudes
    db.prepare(
        `
        CREATE TABLE IF NOT EXISTS solicitudes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cedula TEXT,
            tipo_solicitud TEXT,
            descripcion TEXT,
            estatus TEXT DEFAULT 'pendiente',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `,
    ).run();

    // --- SEED DE BENEFICIARIOS ---
    const countBeneficiarios = db
        .prepare("SELECT COUNT(*) as total FROM beneficiarios")
        .get() as any;

    if (countBeneficiarios.total === 0) {
        const insertB = db.prepare(`
            INSERT INTO beneficiarios 
            (cedula, nombre_completo, carga_familiar, sector, recibe_clap, recibe_gas, deuda_pendiente)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        insertB.run("V-12345678", "Juan Pérez", 4, "Caujaro", 1, 1, 0);
        insertB.run("V-87654321", "María González", 3, "Caujaro", 1, 1, 10);
        insertB.run("123", "Carlos Rodríguez", 5, "Caujaro", 1, 0, 0);
    }

    // --- SEED DE SOLICITUDES (NUEVO) ---
    const countSolicitudes = db
        .prepare("SELECT COUNT(*) as total FROM solicitudes")
        .get() as any;

    if (countSolicitudes.total === 0) {
        const insertS = db.prepare(`
            INSERT INTO solicitudes (cedula, tipo_solicitud, descripcion, estatus)
            VALUES (?, ?, ?, ?)
        `);

        // Beneficios para Juan Pérez (V-12345678)
        insertS.run(
            "V-12345678",
            "CLAP",
            "Solicitud de bolsa adicional por carga familiar",
            "entregado",
        );
        insertS.run("V-12345678", "GAS", "Bombona de 10kg", "pendiente");

        // Beneficios para Carlos (123)
        insertS.run("123", "CLAP", "Caja estándar mensual", "en proceso");
        insertS.run("123", "CLAP", "Caja mensual", "Entregado");
        insertS.run("123", "CLAP", "Caja 2 mensual", "Pendiente");

        console.log("Seed de solicitudes completado.");
    }
}

export default db;
