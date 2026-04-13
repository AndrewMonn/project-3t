// app/lib/db.ts
import Database from "better-sqlite3";

const db = new Database("comunidad_data.db");

// Inicialización + seed
export function initDB() {
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

    // Insertar datos de prueba si no existen
    const count = db
        .prepare("SELECT COUNT(*) as total FROM beneficiarios")
        .get() as any;

    if (count.total === 0) {
        const insert = db.prepare(`
            INSERT INTO beneficiarios 
            (cedula, nombre_completo, carga_familiar, sector, recibe_clap, recibe_gas, deuda_pendiente)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        insert.run("V-12345678", "Juan Pérez", 4, "Caujaro", 1, 1, 0);
        insert.run("V-87654321", "María González", 3, "Caujaro", 1, 1, 10);
        insert.run("V-11223344", "Carlos Rodríguez", 5, "Caujaro", 1, 0, 0);
    }
}

export default db;
