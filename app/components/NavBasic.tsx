"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function NavBasic() {
    const pathname = usePathname();
    const links = [
        { name: "Inicio", href: "/" },
        { name: "Blog", href: "/blog" },
        { name: "Solicitudes", href: "/solicitudes" },
        { name: "Consultas", href: "/consultas" },
    ];
    return (
        <nav
            className="max-md:hidden flex justify-center space-x-4 box-content"
            id="NavBasic"
        >
            {links.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={`hover:underline ${
                        pathname === link.href ? "text-blue-500" : "text-white"
                    }`}
                >
                    {link.name}
                </Link>
            ))}
        </nav>
    );
}
