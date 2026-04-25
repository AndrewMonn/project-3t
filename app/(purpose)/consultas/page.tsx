/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";

export default function ConsultasPage() {
    const [cedula, setCedula] = useState("");
    const [data, setData] = useState<any>(null);
    const [tipo, setTipo] = useState("");
    const [estatus, setEstatus] = useState("");
    const [loading, setLoading] = useState(false);

    async function buscar() {
        // --- LIMPIEZA DEL FORMULARIO ---
        setData(null);
        setTipo("");
        setEstatus("");
        if (!cedula) return alert("Ingrese una cédula");
        setLoading(true);
        try {
            const res = await fetch(`/api/solicitudes?cedula=${cedula}`);
            const json = await res.json();
            console.log("Respuesta del servidor:", json);
            setData(json);
        } catch (err) {
            console.error("Error en fetch:", err);
            alert("Error al consultar");
        } finally {
            setLoading(false);
        }
    }

    async function buscarSolicitud() {
        // 1. Validaciones previas
        if (!cedula || !tipo) {
            return alert("Por favor, seleccione un beneficio del listado");
        }

        // 2. Filtramos todas las solicitudes que coinciden con el tipo seleccionado
        const coincidencias = data?.solicitudes?.filter(
            (s: any) => s.tipo_solicitud === tipo,
        );

        // 3. Verificamos si hay al menos una
        if (coincidencias && coincidencias.length > 0) {
            // Guardamos un valor que indique que queremos mostrar los detalles
            // Puedes guardar el estatus de la primera o simplemente un flag "true"
            setEstatus("mostrando");
        } else {
            alert("No se encontró ninguna solicitud para este beneficio");
            setEstatus(""); // Esto ocultará el recuadro de detalles
        }
    }

    const coloresEstatus: Record<string, string> = {
        entregado: "text-green-600",
        pendiente: "text-amber-600",
        "en proceso": "text-blue-600",
        rechazado: "text-red-600",
    };

    return (
        <main className="flex-1 flex items-center justify-center p-4">
            <section className="bg-gray-200/70 backdrop-blur-sm rounded-2xl shadow-2xl p-6 w-full max-w-3xl text-gray-800">
                <header className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-sky-700 italic">
                        Estatus de Solicitudes
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
                {data?.beneficiario ? (
                    <div className="bg-white/80 p-4 rounded-lg mb-4 border border-sky-100 shadow-sm">
                        <p className="text-sm text-sky-800 font-semibold uppercase">
                            Beneficiario encontrado:
                        </p>
                        <p className="text-lg">
                            {data.beneficiario.nombre_completo}
                        </p>
                    </div>
                ) : (
                    /* Información del Beneficiario (Si no se encuentra) */
                    data !== null &&
                    !loading && (
                        <div className="p-4 border border-red-100 bg-red-50 rounded-lg">
                            <p className="text-red-600">
                                No se encontró ningún beneficiario con esa
                                cédula.
                            </p>
                        </div>
                    )
                )}
                {/* Formulario de Solicitud */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-600">
                        Tipo de Beneficio
                    </label>
                    <select
                        value={tipo}
                        onChange={(e) => {
                            setTipo(e.target.value);
                            setEstatus(""); // Oculta los detalles hasta que pulse "Buscar Solicitud" de nuevo
                        }}
                        className="w-full p-2 rounded-lg border bg-white disabled:bg-gray-100"
                        disabled={!data?.beneficiario}
                    >
                        <option value="" disabled hidden>
                            {data?.beneficiario
                                ? "Selecciona un Beneficio..."
                                : "Busca un beneficiario primero"}
                        </option>

                        {/* 1. Creamos el Set de valores únicos (Strings) */}
                        {Array.from(
                            new Set(
                                data?.solicitudes?.map(
                                    (s: any) => s.tipo_solicitud,
                                ),
                            ),
                        ).map((nombreTipo: any) => (
                            /* 2. 'nombreTipo' es el string directo, ej: "CLAP" */
                            <option key={nombreTipo} value={nombreTipo}>
                                {nombreTipo}
                            </option>
                        ))}
                    </select>

                    {/* Resultado de la búsqueda de solicitud específica */}
                    {estatus && (
                        <div className="mt-6 space-y-4">
                            <h3 className="text-sky-900 font-bold mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
                                Historial de Solicitudes: {tipo}
                            </h3>

                            {/* Filtramos todas las que coincidan con el tipo y las mapeamos */}
                            {data?.solicitudes
                                ?.filter((s: any) => s.tipo_solicitud === tipo)
                                .map((solicitud: any) => (
                                    <div
                                        key={solicitud.id}
                                        className="p-4 rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50 shadow-sm"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">
                                                    Estado Actual
                                                </p>
                                                <p
                                                    className={`text-sm font-semibold ${coloresEstatus[solicitud.estatus.toLowerCase()] || "text-gray-600"}`}
                                                >
                                                    {solicitud.estatus.toUpperCase()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">
                                                    Fecha de Registro
                                                </p>
                                                <p className="text-sm text-gray-700">
                                                    {
                                                        solicitud.created_at.split(
                                                            " ",
                                                        )[0]
                                                    }
                                                </p>
                                            </div>
                                            {solicitud.descripcion && (
                                                <div className="col-span-2 mt-2 pt-2 border-t border-sky-100">
                                                    <p className="text-xs text-gray-500 uppercase font-bold">
                                                        Descripción
                                                    </p>
                                                    <p className="text-sm text-gray-600 italic">
                                                        {solicitud.descripcion}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={buscarSolicitud}
                        className="bg-sky-500 hover:bg-sky-600 w-full text-white py-3 rounded-lg font-bold shadow-lg transition-all active:scale-95"
                    >
                        Buscar Solicitud
                    </button>
                </div>
            </section>
        </main>
    );
}
