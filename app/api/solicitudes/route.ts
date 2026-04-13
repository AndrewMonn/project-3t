// app/api/solicitudes/route.ts

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/app/lib/db";

export async function GET(req: NextRequest) {
    try {
        initDB();

        const cedula = req.nextUrl.searchParams.get("cedula");

        if (!cedula) {
            return NextResponse.json(
                { error: "Cédula requerida" },
                { status: 400 },
            );
        }

        const beneficiario = db
            .prepare("SELECT * FROM beneficiarios WHERE cedula = ?")
            .get(cedula);

        const solicitudes = db
            .prepare("SELECT * FROM solicitudes WHERE cedula = ?")
            .all(cedula);

        return NextResponse.json({
            beneficiario,
            solicitudes,
        });
    } catch (error) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        initDB();

        const { cedula, tipo_solicitud, descripcion } = await req.json();

        if (!cedula || !tipo_solicitud) {
            return NextResponse.json(
                { error: "Datos incompletos" },
                { status: 400 },
            );
        }

        db.prepare(
            `
            INSERT INTO solicitudes (cedula, tipo_solicitud, descripcion)
            VALUES (?, ?, ?)
        `,
        ).run(cedula, tipo_solicitud, descripcion);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
