import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Login - Aplicación Web Comunal",
    description:
        "Aplicación web para la comunidad Reina la Cruz por parte del estudiantado de la UNETI PNFII S6A Equipo 9",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body
                className={`flex flex-col justify-around max-md:w-screen h-dvh ${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <div className="absolute inset-0 bg-black opacity-40 -z-10">
                    <div className="absolute inset-0 bg-cover bg-center shape"></div>
                </div>
                {children}
                <footer className="flex-col justify-end w-full text-white py-4">
                    <p className="fixed bottom-2 w-full text-center text-sm">
                        © 2026 UNETI PNFII 6A Equipo 9 - Derechos Reservados.
                    </p>
                </footer>
            </body>
        </html>
    );
}
