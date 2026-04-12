"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function NavBasic() {
    const pathname = usePathname();

    return (
        <nav
            className="flex justify-center space-x-4 box-content"
            id="NavBasic"
        >
            <Link
                href="/"
                className={`hover:underline ${pathname === "/" ? "text-blue-500" : ""}`}
            >
                Inicio
            </Link>
            <Link
                href="/blog"
                className={`hover:underline ${pathname === "/blog" ? "text-blue-500" : ""}`}
            >
                Blog
            </Link>
            <Link
                href="/solicitudes"
                className={`hover:underline ${pathname === "/solicitudes" ? "text-blue-500" : ""}`}
            >
                Solicitudes
            </Link>
            <Link
                href="/consulta"
                className={`hover:underline ${pathname === "/consulta" ? "text-blue-500" : ""}`}
            >
                Consultas
            </Link>
        </nav>
    );
}
