import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Login",
    description:
        "Aplicación web para la comunidad Reina la Cruz por parte del estudiantado de la UNETI PNFII S6A Equipo 9",
};

export default function LoginLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <div className="fixed inset-0 bg-black opacity-40 -z-10 min-h-screen w-full">
                <div className="absolute inset-0 bg-cover bg-center shape w-full"></div>
            </div>
            <main>{children}</main>
        </>
    );
}
