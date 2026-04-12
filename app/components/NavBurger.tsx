"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function NavBurger() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => setIsOpen(!isOpen);

    // Definimos las rutas
    const desktopLinks = [
        { name: "Inicio", href: "/" },
        { name: "Acerca de", href: "/acerca-de" },
        { name: "Cuentas", href: "/cuentas" }, // Cambiado según tu solicitud
    ];

    const mobileLinks = [
        { name: "Inicio", href: "/" },
        { name: "Blog", href: "/blog" },
        { name: "Solicitudes", href: "/solicitudes" },
        { name: "Consultas", href: "/consulta" },
        { name: "Acerca de", href: "/acerca-de" },
        { name: "Cuentas", href: "/cuentas" },
    ];

    // Clase común para el estilo "Liquid Glass" en botones
    const glassButtonStyle = `
    px-4 py-2 rounded-xl transition-all duration-300
    bg-white/10 backdrop-blur-md border border-white/20
    hover:bg-white/20 hover:border-white/40 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
    active:scale-95
  `;

    return (
        <header className="fixed top-0 left-0 w-full p-4 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center bg-black/40 backdrop-blur-lg border border-white/10 p-3 rounded-2xl shadow-2xl">
                {/* Logo */}
                <div className="text-xl font-bold px-2">
                    <Link
                        href="/"
                        className="hover:text-blue-400 transition-colors"
                    >
                        MiSitio
                    </Link>
                </div>

                {/* Desktop & Tablet Navigation (md y superior) */}
                <nav className="hidden md:flex space-x-4">
                    {desktopLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${glassButtonStyle} ${
                                pathname === link.href
                                    ? "bg-blue-500/30 border-blue-400/50 text-blue-300"
                                    : "text-white"
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                {/* Hamburger Button (Mobile only) */}
                <button
                    className="md:hidden p-2 text-white focus:outline-none z-[60]"
                    onClick={toggleMenu}
                    aria-label="Menu"
                >
                    <div className="relative w-6 h-6">
                        <span
                            className={`absolute block h-0.5 w-6 bg-white transform transition duration-300 ease-in-out ${isOpen ? "rotate-45 top-3" : "top-1"}`}
                        ></span>
                        <span
                            className={`absolute block h-0.5 w-6 bg-white transition duration-300 ease-in-out ${isOpen ? "opacity-0" : "top-3"}`}
                        ></span>
                        <span
                            className={`absolute block h-0.5 w-6 bg-white transform transition duration-300 ease-in-out ${isOpen ? "-rotate-45 top-3" : "top-5"}`}
                        ></span>
                    </div>
                </button>
            </div>

            {/* Mobile Menu Overlay - Estilo Full Screen con margen de 1.5rem */}
            <div
                className={`fixed inset-0 m-6 rounded-[2rem] bg-black/60 backdrop-blur-2xl border border-white/20 shadow-2xl z-50 transform transition-all duration-500 ease-in-out md:hidden ${
                    isOpen
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-[120%] opacity-0"
                }`}
            >
                <nav className="flex flex-col items-center justify-center h-full space-y-6 p-8">
                    {mobileLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={`text-2xl font-medium transition-all ${
                                pathname === link.href
                                    ? "text-blue-400 scale-110"
                                    : "text-white/80"
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {/* Botón de cierre decorativo dentro del modal */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="mt-8 text-white/40 hover:text-white uppercase text-xs tracking-widest transition-colors"
                    >
                        — Cerrar —
                    </button>
                </nav>
            </div>
        </header>
    );
}
