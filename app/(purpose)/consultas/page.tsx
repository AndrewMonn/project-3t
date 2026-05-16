"use client";

// @docs: Added inline comprobante upload form for pendiente-type entregas
// @docs: Shows "+ Cargar Comprobante de Pago" button, expands to date/reference/file form
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
    tipoSolicitud?: "beneficio" | "otra";
    asunto?: string;
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
    const [uploadForm, setUploadForm] = useState<Record<string, boolean>>({});
    const [uploadData, setUploadData] = useState<Record<string, { fechaPago: string; referencia: string; archivo: File | null }>>({});
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const [uploadMsg, setUploadMsg] = useState<Record<string, { ok: boolean; text: string }>>({});

    async function buscar() {
        setFamilia(null);
        setEntregas([]);
        setTipo("");
        setError(null);
        setUploadForm({});
        setUploadData({});
        setUploadMsg({});

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

    function toggleUpload(entregaId: string) {
        setUploadForm((prev) => ({ ...prev, [entregaId]: !prev[entregaId] }));
        if (!uploadData[entregaId]) {
            setUploadData((prev) => ({
                ...prev,
                [entregaId]: { fechaPago: "", referencia: "", archivo: null },
            }));
        }
        setUploadMsg((prev) => {
            const next = { ...prev };
            delete next[entregaId];
            return next;
        });
    }

    async function enviarComprobante(entregaId: string) {
        const data = uploadData[entregaId];
        if (!data?.fechaPago || !data?.referencia.trim() || !data?.archivo) {
            setUploadMsg((prev) => ({ ...prev, [entregaId]: { ok: false, text: "Fecha, referencia y archivo son obligatorios" } }));
            return;
        }

        const entrega = entregas.find((e) => e._id === entregaId);
        if (!entrega) return;

        setUploading((prev) => ({ ...prev, [entregaId]: true }));
        try {
            const formData = new FormData();
            formData.append("familiaId", entrega.familiaId._id);
            formData.append("jornadaId", entrega.jornadaId._id);
            formData.append("fechaPago", data.fechaPago);
            formData.append("referencia", data.referencia.trim());
            formData.append("comprobante", data.archivo);

            const res = await fetch("/api/comprobantes", {
                method: "POST",
                body: formData,
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                if (res.status === 401) {
                    setUploadMsg((prev) => ({ ...prev, [entregaId]: { ok: false, text: "Debe iniciar sesión para cargar comprobantes" } }));
                } else {
                    setUploadMsg((prev) => ({ ...prev, [entregaId]: { ok: false, text: json.message || "Error al subir comprobante" } }));
                }
                return;
            }

            setUploadMsg((prev) => ({ ...prev, [entregaId]: { ok: true, text: "Comprobante subido exitosamente" } }));
            setUploadForm((prev) => ({ ...prev, [entregaId]: false }));

            // Refresh entregas
            const resEntregas = await fetch(
                `/api/public/entregas?familiaId=${entrega.familiaId._id}`,
            );
            const jsonEntregas = await resEntregas.json();
            if (jsonEntregas.success) {
                setEntregas(jsonEntregas.data.entregas as Entrega[]);
            }
        } catch {
            setUploadMsg((prev) => ({ ...prev, [entregaId]: { ok: false, text: "Error de conexión" } }));
        } finally {
            setUploading((prev) => ({ ...prev, [entregaId]: false }));
        }
    }

    const tiposDisponibles = Array.from(
        new Set(entregas.map((e) => e.jornadaId?.tipo || e.asunto || "Otras")),
    );

    const entregasFiltradas = tipo
        ? entregas.filter((e) => (e.jornadaId?.tipo || e.asunto || "Otras") === tipo)
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
                                Tipo de Solicitud
                            </label>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                            >
                                <option value="">Todas las solicitudes</option>
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
                                    `${entregasFiltradas.length} solicitudes`}
                            </h3>

                            {entregasFiltradas.map((entrega) => (
                                <div
                                    key={entrega._id}
                                    className={`p-4 rounded-xl border backdrop-blur-md ${fondosEstatus[entrega.estadoPago] || "bg-white/5 border-white/10"}`}
                                >
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase font-bold">
                                                {entrega.tipoSolicitud === "otra" ? "Asunto" : "Beneficio"}
                                            </p>
                                            <p className="text-sm text-zinc-200 font-medium">
                                                {entrega.asunto || entrega.jornadaId?.tipo || "—"}
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

                                    {/* Upload comprobante button + form */}
                                    <div className="mt-3 pt-3 border-t border-white/10">
                                        {entrega.estadoPago === "pendiente" && !uploadForm[entrega._id] && (
                                            <button
                                                onClick={() => toggleUpload(entrega._id)}
                                                className="text-xs px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-all"
                                            >
                                                + Cargar Comprobante de Pago
                                            </button>
                                        )}

                                        {uploadForm[entrega._id] && (
                                            <div className="space-y-3 mt-2">
                                                <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">
                                                    Registrar comprobante de pago
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="text-xs text-zinc-500 mb-1 block">
                                                            Fecha de pago
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={uploadData[entrega._id]?.fechaPago || ""}
                                                            onChange={(e) =>
                                                                setUploadData((prev) => ({
                                                                    ...prev,
                                                                    [entrega._id]: { ...prev[entrega._id], fechaPago: e.target.value },
                                                                }))
                                                            }
                                                            className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-zinc-500 mb-1 block">
                                                            Referencia
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={uploadData[entrega._id]?.referencia || ""}
                                                            onChange={(e) =>
                                                                setUploadData((prev) => ({
                                                                    ...prev,
                                                                    [entrega._id]: { ...prev[entrega._id], referencia: e.target.value },
                                                                }))
                                                            }
                                                            className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                                                            placeholder="Nro. de referencia"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-zinc-500 mb-1 block">
                                                            Archivo
                                                        </label>
                                                        <input
                                                            type="file"
                                                            accept="image/jpeg,image/png,image/webp"
                                                            onChange={(e) =>
                                                                setUploadData((prev) => ({
                                                                    ...prev,
                                                                    [entrega._id]: { ...prev[entrega._id], archivo: e.target.files?.[0] || null },
                                                                }))
                                                            }
                                                            className="w-full text-sm text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-white/10 file:text-white hover:file:bg-white/15 transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                {uploadMsg[entrega._id] && (
                                                    <div className={`p-2 rounded-lg text-xs ${uploadMsg[entrega._id].ok ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border border-rose-500/30 text-rose-300"}`}>
                                                        {uploadMsg[entrega._id].text}
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => toggleUpload(entrega._id)}
                                                        className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-xs hover:bg-white/15 transition-all"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={() => enviarComprobante(entrega._id)}
                                                        disabled={uploading[entrega._id]}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs hover:bg-emerald-500/30 transition-all disabled:opacity-40"
                                                    >
                                                        {uploading[entrega._id] ? "Subiendo..." : "Subir Comprobante"}
                                                    </button>
                                                </div>
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
                            <p>Esta familia no tiene solicitudes registradas</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
