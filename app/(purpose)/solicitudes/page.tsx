/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

export default function SolicitudesPage() {
    const [cedula, setCedula] = useState("");
    const [data, setData] = useState<any>(null);
    const [tipo, setTipo] = useState("CLAP");
    const [descripcion, setDescripcion] = useState("");
    const [loading, setLoading] = useState(false);

    async function buscar() {
        if (!cedula) return alert("Ingrese una cédula");
        setLoading(true);
        try {
            const res = await fetch(`/api/solicitudes?cedula=${cedula}`);
            const json = await res.json();
            setData(json);
        } catch {
            alert("Error al consultar");
        } finally {
            setLoading(false);
        }
    }

    async function enviarSolicitud() {
        if (!cedula || !descripcion) {
            return alert("Por favor, complete los campos");
        }

        try {
            const response = await fetch("/api/solicitudes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cedula,
                    tipo_solicitud: tipo,
                    descripcion,
                }),
            });

            if (response.ok) {
                alert("Solicitud enviada con éxito");

                // --- LIMPIEZA DEL FORMULARIO ---
                setCedula("");
                setData(null);
                setTipo("CLAP");
                setDescripcion("");
                // -------------------------------
            } else {
                alert("Hubo un problema al procesar la solicitud");
            }
        } catch {
            alert("Error al enviar");
        }
    }

    return (
        <main className="flex-1 flex items-center justify-center p-4">
            <section className="bg-gray-200/70 backdrop-blur-sm rounded-2xl shadow-2xl p-6 w-full max-w-3xl text-gray-800">
                <header className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-sky-700 italic">
                        Gestión de Solicitudes
                    </h1>
                </header>

                {/* Búsqueda de Beneficiario */}
                <div className="flex gap-2 mb-6">
                    <input
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                        className="w-full p-2 rounded-lg border focus:ring-2 focus:ring-sky-400 outline-none"
                        placeholder="Cédula del Jefe de Familia"
                    />
                    <button
                        onClick={buscar}
                        disabled={loading}
                        className="bg-sky-500 hover:bg-sky-600 text-white px-4 rounded-lg transition-colors disabled:bg-gray-400"
                    >
                        {loading ? "..." : "Buscar"}
                    </button>
                </div>

                {/* Información del Beneficiario (Si se encuentra) */}
                {data?.beneficiario && (
                    <div className="bg-white/80 p-4 rounded-lg mb-4 border border-sky-100 shadow-sm">
                        <p className="text-sm text-sky-800 font-semibold uppercase">
                            Beneficiario encontrado:
                        </p>
                        <p className="text-lg">
                            {data.beneficiario.nombre_completo}
                        </p>
                    </div>
                )}

                {/* Formulario de Solicitud */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-600">
                        Tipo de Beneficio
                    </label>
                    <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        className="w-full p-2 rounded-lg border bg-white"
                    >
                        <option value="CLAP">CLAP</option>
                        <option value="GAS">Gas Doméstico</option>
                    </select>

                    <label className="text-sm font-medium text-gray-600">
                        Descripción / Motivo
                    </label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        className="w-full p-2 rounded-lg border min-h-25 focus:ring-2 focus:ring-sky-400 outline-none"
                        placeholder="Escriba los detalles de su solicitud aquí..."
                    />

                    <button
                        type="button"
                        onClick={enviarSolicitud}
                        className="bg-sky-500 hover:bg-sky-600 w-full text-white py-3 rounded-lg font-bold shadow-lg transition-all active:scale-95"
                    >
                        Enviar Solicitud
                    </button>
                </div>
            </section>
        </main>
    );
}
