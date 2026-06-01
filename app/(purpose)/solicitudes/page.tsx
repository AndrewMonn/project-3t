"use client";

// @docs: Otras Solicitudes — dropdown option "+ Otras Solicitudes" shows asunto text input
// @docs: Duplicate confirmation — checks existing entregas before submit, asks user to confirm
import { useState } from "react";

interface JefeHogar {
    nombre: string;
    cedula: string;
    telefono: string;
}

interface Sector {
    _id: string;
    name: string;
}

interface Familia {
    _id: string;
    jefeDeHogar: JefeHogar;
    sector: Sector;
    esVulnerable: boolean;
}

interface Jornada {
    _id: string;
    tipo: string;
    fechaJornada: string;
    costo: number;
    estado: string;
}

const OTRAS_SOLICITUDES_VALUE = "__otras__";

export default function SolicitudesPage() {
    const [cedula, setCedula] = useState("");
    const [familia, setFamilia] = useState<Familia | null>(null);
    const [jornadas, setJornadas] = useState<Jornada[]>([]);
    const [selectedValue, setSelectedValue] = useState("");
    const [asunto, setAsunto] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showDuplicadoConfirm, setShowDuplicadoConfirm] = useState(false);

    const esOtraSolicitud = selectedValue === OTRAS_SOLICITUDES_VALUE;

    function resetForm() {
        setSelectedValue("");
        setAsunto("");
        setObservaciones("");
        setError(null);
        setSuccess(null);
        setShowDuplicadoConfirm(false);
    }

    async function buscar() {
        setFamilia(null);
        setJornadas([]);
        resetForm();

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

            const resJornadas = await fetch(
                "/api/public/jornadas?estado=activo",
            );
            const jsonJornadas = await resJornadas.json();

            if (jsonJornadas.success) {
                setJornadas(jsonJornadas.data.jornadas as Jornada[]);
            }
        } catch {
            setError("Error de conexión. Intente nuevamente.");
        } finally {
            setLoading(false);
        }
    }

    async function checkDuplicado(): Promise<boolean> {
        if (esOtraSolicitud || !selectedValue || !familia) return false;
        try {
            const res = await fetch(
                `/api/public/entregas?familiaId=${familia._id}&jornadaId=${selectedValue}`,
            );
            const json = await res.json();
            if (json.success && json.data.entregas.length > 0) return true;
        } catch {
            // If check fails, proceed without confirmation
        }
        return false;
    }

    async function enviarSolicitud() {
        setError(null);
        setSuccess(null);

        if (!familia) {
            setError("Busque una familia primero");
            return;
        }

        if (esOtraSolicitud) {
            if (!asunto.trim()) {
                setError("Ingrese el asunto de la solicitud");
                return;
            }
        } else {
            if (!selectedValue) {
                setError("Seleccione una jornada");
                return;
            }
        }

        // Check for duplicates only for benefit-type (not "Otras")
        if (!esOtraSolicitud && !showDuplicadoConfirm) {
            const esDuplicado = await checkDuplicado();
            if (esDuplicado) {
                setShowDuplicadoConfirm(true);
                return;
            }
        }

        setSending(true);
        try {
            const body: Record<string, any> = {
                familiaId: familia._id,
                observaciones: observaciones.trim() || undefined,
            };

            if (esOtraSolicitud) {
                body.tipoSolicitud = "otra";
                body.asunto = asunto.trim();
            } else {
                body.tipoSolicitud = "beneficio";
                body.jornadaId = selectedValue;
            }

            const res = await fetch("/api/public/entregas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                setError(json.message || "Error al registrar la solicitud");
                return;
            }

            setSuccess("Solicitud enviada con éxito");
            setShowDuplicadoConfirm(false);
            setSelectedValue("");
            setAsunto("");
            setObservaciones("");
        } catch {
            setError("Error de conexión. Intente nuevamente.");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="min-w-2/5 flex flex-col gap-6 py-6 overflow-y-auto">
            <section className="max-w-3xl mx-auto w-full px-4">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        Gestión de Solicitudes
                    </h1>
                    <div className="h-1 w-24 mx-auto bg-linear-to-r from-cyan-400 to-blue-500 rounded-full mt-3 mb-4" />
                    <p className="text-taupe-200">
                        Registre nuevas solicitudes para las familias beneficiarias
                    </p>
                </header>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                    {/* Búsqueda */}
                    <div>
                        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                            Buscar beneficiario
                        </h2>
                        <div className="flex gap-2">
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
                    </div>

                    {/* Error / Éxito */}
                    {error && (
                        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm">
                            {success}
                        </div>
                    )}

                    {/* Confirmación de duplicado */}
                    {showDuplicadoConfirm && (
                        <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
                            <p className="text-amber-300 text-sm font-medium mb-3">
                                Esta familia ya tiene una solicitud registrada para este beneficio. ¿Desea crear una nueva solicitud duplicada?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDuplicadoConfirm(false)}
                                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm hover:bg-white/15 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDuplicadoConfirm(false);
                                        enviarSolicitud();
                                    }}
                                    className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm hover:bg-amber-500/30 transition-all"
                                >
                                    Confirmar y enviar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Familia encontrada */}
                    {familia && !showDuplicadoConfirm && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider mb-1">
                                Beneficiario
                            </p>
                            <p className="text-lg text-white font-medium">
                                {familia.jefeDeHogar.nombre}
                            </p>
                            <p className="text-sm text-zinc-400 mt-1">
                                {familia.jefeDeHogar.cedula} — Sector{" "}
                                {familia.sector?.name}
                            </p>
                            {familia.esVulnerable && (
                                <span className="inline-block mt-2 text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                                    Familia vulnerable
                                </span>
                            )}
                        </div>
                    )}

                    {/* Formulario de solicitud */}
                    {familia && !showDuplicadoConfirm && (
                        <div className="space-y-4">
                            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                                Nueva solicitud
                            </h2>

                            <div>
                                <label className="text-sm font-medium text-zinc-400 mb-1 block">
                                    Tipo de solicitud
                                </label>
                                <select
                                    value={selectedValue}
                                    onChange={(e) => {
                                        setSelectedValue(e.target.value);
                                        setError(null);
                                    }}
                                    className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                                >
                                    <option value="">
                                        Seleccione un tipo...
                                    </option>
                                    {jornadas.map((j) => (
                                        <option
                                            key={j._id}
                                            value={j._id}
                                            className="bg-zinc-900"
                                        >
                                            {j.tipo} —{" "}
                                            {new Date(
                                                j.fechaJornada,
                                            ).toLocaleDateString("es-VE")}{" "}
                                            (Bs.{" "}
                                            {j.costo.toLocaleString("es-VE")})
                                        </option>
                                    ))}
                                    <option
                                        value={OTRAS_SOLICITUDES_VALUE}
                                        className="bg-zinc-900 text-cyan-300"
                                    >
                                        + Otras Solicitudes
                                    </option>
                                </select>
                            </div>

                            {jornadas.length === 0 && !esOtraSolicitud && (
                                <p className="text-sm text-zinc-500 italic">
                                    No hay jornadas activas disponibles
                                </p>
                            )}

                            {/* Asunto para Otras Solicitudes */}
                            {esOtraSolicitud && (
                                <div>
                                    <label className="text-sm font-medium text-zinc-400 mb-1 block">
                                        Asunto de la Solicitud
                                    </label>
                                    <input
                                        value={asunto}
                                        onChange={(e) =>
                                            setAsunto(e.target.value)
                                        }
                                        className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                                        placeholder="Ej: Solicitud de beca estudiantil"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-zinc-400 mb-1 block">
                                    Descripción {!esOtraSolicitud && "(opcional)"}
                                </label>
                                <textarea
                                    value={observaciones}
                                    onChange={(e) =>
                                        setObservaciones(e.target.value)
                                    }
                                    className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all min-h-24 resize-y"
                                    placeholder={
                                        esOtraSolicitud
                                            ? "Describa detalladamente su solicitud..."
                                            : "Detalles adicionales..."
                                    }
                                />
                            </div>

                            <button
                                type="button"
                                onClick={enviarSolicitud}
                                disabled={sending}
                                className="w-full py-3 bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-lg font-semibold hover:bg-white/15 hover:text-cyan-200 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                {sending ? "Enviando..." : "Enviar Solicitud"}
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
