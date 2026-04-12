import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Acerca de",
    description: "Información sobre el proyecto",
};

export default function AcercaDe() {
    return (
        <main className="box-content flex-1 flex flex-col items-center justify-center">
            <section className="bg-gray-200/70 backdrop-blur-sm rounded-2xl shadow-2xl p-2 md:p-6 max-w-3/4 w-full h-auto text-gray-800">
                {/* Encabezado */}
                <header className="border-sky-200 pb-4 mb-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-sky-700 italic">
                        Sobre el Proyecto
                    </h1>
                    <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest">
                        Comuna Una Sola Fuerza - Reina La Cruz
                    </p>
                </header>

                {/* Contenido Principal */}
                <div className="space-y-6 text-justify">
                    <div>
                        <h2 className="text-xl font-semibold text-sky-800 mb-2">
                            ¿Qué es este sistema?
                        </h2>
                        <p className="leading-relaxed">
                            Es un sistema web diseñado para la gestión
                            automatizada de beneficios comunitarios (como CLAP y
                            gas doméstico) en el sector Caujaro, Parroquia
                            Antímano. Nuestra misión es transformar procesos
                            manuales en una gestión digital transparente,
                            eficiente y auditable para las familias de la
                            comunidad.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
                            <h3 className="font-bold text-sky-700 mb-2">
                                Objetivos Clave
                            </h3>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                <li>Automatizar registros.</li>
                                <li>Garantizar equidad en la distribución.</li>
                                <li>Mejora del tiempo administrativo.</li>
                                <li>Fortalecer el control social.</li>
                            </ul>
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <h3 className="font-bold text-indigo-700 mb-2">
                                Tecnología Utilizada
                            </h3>
                            <p className="text-sm">
                                Desarrollado con el <strong>Stack MERN</strong>{" "}
                                (MongoDB, Express, React/Next.js y Node.js),
                                asegurando una arquitectura moderna, escalable y
                                de alto rendimiento.
                            </p>
                        </div>
                    </div>

                    {/* Sección de Participantes */}
                    <footer className="pt-4 border-t border-gray-100">
                        <h3 className="text-center font-bold text-gray-700 mb-4">
                            Equipo de Desarrollo (Equipo 9)
                        </h3>
                        <div className="flex flex-wrap justify-center gap-4 text-xs md:text-sm font-medium">
                            <span className="bg-white px-3 py-1 rounded-full shadow-sm">
                                Andrés Luna
                            </span>
                            <span className="bg-white px-3 py-1 rounded-full shadow-sm">
                                Franklin Hernández
                            </span>
                            <span className="bg-white px-3 py-1 rounded-full shadow-sm">
                                Kilmer Hernández
                            </span>
                            <span className="bg-white px-3 py-1 rounded-full shadow-sm">
                                Mariam Ortiz
                            </span>
                        </div>
                        <p className="text-center text-xs mt-4 font-bold italic">
                            Asesoría Académica: Prof. María Herrera (UNETI).
                        </p>
                    </footer>
                </div>
            </section>
        </main>
    );
}
