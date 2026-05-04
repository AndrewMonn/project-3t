"use client";

import { useState } from "react";

interface JefeHogar {
    nombre: string;
    cedula: string;
    telefono: string;
}

interface Direccion {
    calle: string;
    nroCasa: string;
    referencia?: string;
}

interface Sector {
    _id: string;
    name: string;
    calles?: string[];
}

interface Familia {
    _id: string;
    jefeDeHogar: JefeHogar;
    direccion: Direccion;
    sector: Sector;
    esVulnerable: boolean;
    condicionesEspeciales?: string;
}

interface Jornada {
    _id: string;
    tipo: string;
    fechaJornada: string;
    costo: number;
    estado: string;
}

interface Entrega {
    _id: string;
    familiaId: { _id: string; jefeDeHogar: { nombre: string; cedula: string } };
    jornadaId: Jornada;
    estadoPago: "pendiente" | "pagado" | "verificado";
    montoPagado: number;
    fechaPago?: string;
    observaciones?: string;
    createdAt: string;
}

export default function ConsultasPage() {
    const [cedula, setCedula] = useState("");
    const [familia, setFamilia] = useState<Familia | null>(null);
    const [entregas, setEntregas] = useState<Entrega[]>([]);
    const [tipo, setTipo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function buscar() {
        setFamilia(null);
        setEntregas([]);
        setTipo("");
        setError(null);

        if (!cedula.trim()) {
            setError("Ingrese una cédula");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(
                `/api/public/familias?q=${encodeURIComponent(cedula)}`,
            );
            const json = await res.json();

            if (!res.ok || !json.success) {
                setError(json.message || "Error al buscar familia");
                return;
            }

            if (json.data.familias.length === 0) {
                setError("No se encontró ninguna familia con esa cédula");
                return;
            }

            const foundFamilia = json.data.familias[0] as Familia;
            setFamilia(foundFamilia);

            const resEntregas = await fetch(
                `/api/public/entregas?familiaId=${foundFamilia._id}`,
            );
            const jsonEntregas = await resEntregas.json();

            if (jsonEntregas.success) {
                setEntregas(jsonEntregas.data.entregas as Entrega[]);
            }
        } catch {
            setError("Error de conexión. Intente nuevamente.");
        } finally {
            setLoading(false);
        }
    }

    const tiposDisponibles = Array.from(
        new Set(entregas.map((e) => e.jornadaId.tipo)),
    );

    const entregasFiltradas = tipo
        ? entregas.filter((e) => e.jornadaId.tipo === tipo)
        : entregas;

    const coloresEstatus: Record<string, string> = {
        pendiente: "text-amber-400",
        pagado: "text-emerald-400",
        verificado: "text-cyan-400",
    };

    const fondosEstatus: Record<string, string> = {
        pendiente: "bg-amber-500/15 border-amber-500/30",
        pagado: "bg-emerald-500/15 border-emerald-500/30",
        verificado: "bg-cyan-500/15 border-cyan-500/30",
    };

    return (
        <div className="min-w-2/5 flex flex-col gap-6 py-6 overflow-y-auto">
            <section className="max-w-3xl mx-auto w-full px-4">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        Estatus de Solicitudes
                    </h1>
                    <div className="h-1 w-24 mx-auto bg-linear-to-r from-cyan-400 to-blue-500 rounded-full mt-3 mb-4" />
                    <p className="text-taupe-200">
                        Consulte el estado de sus beneficios comunales
                    </p>
                </header>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
                    {/* Búsqueda */}
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                        Buscar beneficiario
                    </h2>
                    <div className="flex gap-2 mb-6">
                        <input
                            value={cedula}
                            onChange={(e) => setCedula(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && buscar()}
                            className="flex-1 p-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-taupe-200 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 outline-none transition-all"
                            placeholder="Cédula del Jefe de Familia"
                        />
                        <button
                            onClick={buscar}
                            disabled={loading}
                            className="px-6 py-2.5 bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-lg hover:bg-white/15 hover:text-cyan-200 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? "..." : "Buscar"}
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Familia encontrada */}
                    {familia && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                            <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider mb-1">
                                Beneficiario encontrado
                            </p>
                            <p className="text-lg text-white font-medium">
                                {familia.jefeDeHogar.nombre}
                            </p>
                            <p className="text-sm text-zinc-400 mt-1">
                                {familia.jefeDeHogar.cedula} — Sector{" "}
                                {familia.sector?.name}
                            </p>
                        </div>
                    )}

                    {/* Filtro por tipo */}
                    {tiposDisponibles.length > 0 && (
                        <div className="space-y-3 mb-4">
                            <label className="text-sm font-medium text-zinc-400">
                                Tipo de Beneficio
                            </label>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                            >
                                <option value="">Todos los beneficios</option>
                                {tiposDisponibles.map((t) => (
                                    <option
                                        key={t}
                                        value={t}
                                        className="bg-zinc-900"
                                    >
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Entregas */}
                    {entregasFiltradas.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <h3 className="text-white font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                                Historial:{" "}
                                {tipo ||
                                    `${entregasFiltradas.length} beneficios`}
                            </h3>

                            {entregasFiltradas.map((entrega) => (
                                <div
                                    key={entrega._id}
                                    className={`p-4 rounded-xl border backdrop-blur-md ${fondosEstatus[entrega.estadoPago] || "bg-white/5 border-white/10"}`}
                                >
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase font-bold">
                                                Beneficio
                                            </p>
                                            <p className="text-sm text-zinc-200 font-medium">
                                                {entrega.jornadaId?.tipo}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase font-bold">
                                                Estado
                                            </p>
                                            <p
                                                className={`text-sm font-semibold ${coloresEstatus[entrega.estadoPago] || "text-zinc-400"}`}
                                            >
                                                {entrega.estadoPago.toUpperCase()}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase font-bold">
                                                Fecha
                                            </p>
                                            <p className="text-sm text-zinc-300">
                                                {entrega.fechaPago
                                                    ? new Date(
                                                          entrega.fechaPago,
                                                      ).toLocaleDateString(
                                                          "es-VE",
                                                      )
                                                    : "—"}
                                            </p>
                                        </div>

                                        {entrega.montoPagado > 0 && (
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase font-bold">
                                                    Monto
                                                </p>
                                                <p className="text-sm text-zinc-300">
                                                    Bs.{" "}
                                                    {entrega.montoPagado.toLocaleString(
                                                        "es-VE",
                                                    )}
                                                </p>
                                            </div>
                                        )}

                                        {entrega.observaciones && (
                                            <div className="col-span-2 sm:col-span-3 mt-1 pt-2 border-t border-white/10">
                                                <p className="text-xs text-zinc-500 uppercase font-bold">
                                                    Observaciones
                                                </p>
                                                <p className="text-sm text-zinc-400 italic">
                                                    {entrega.observaciones}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Sin entregas */}
                    {familia && entregas.length === 0 && (
                        <div className="text-center py-8 text-zinc-500">
                            <p>Esta familia no tiene entregas registradas</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
