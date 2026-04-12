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
    title: "Login",
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
                className={`flex flex-col justify-around max-md:w-screen h-dvh ${geistSans.variable} ${geistMono.variable} antialiased box-content`}
            >
                <div className="absolute inset-0 bg-black opacity-40 -z-10 h-full w-full">
                    <div className="relative inset-0 bg-cover bg-center shape h-full w-full"></div>
                </div>
                {children}
            </body>
        </html>
    );
}
