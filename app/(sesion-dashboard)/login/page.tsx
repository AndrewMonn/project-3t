"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface FieldErrors {
    email: string;
    password: string;
}

export default function Login() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
        email: "",
        password: "",
    });
    const [values, setValues] = useState({ email: "", password: "" });

    function validateEmail(email: string): string {
        if (!email.trim()) return "El correo es obligatorio";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return "Formato de correo inválido";
        return "";
    }

    function validatePassword(password: string): string {
        if (!password) return "La contraseña es obligatoria";
        if (password.length < 6) return "Mínimo 6 caracteres";
        return "";
    }

    function handleBlur(e: ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setFieldErrors((prev) => ({
            ...prev,
            [name]:
                name === "email"
                    ? validateEmail(value)
                    : validatePassword(value),
        }));
    }

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        // Limpia error del campo mientras escribe
        setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const email = values.email.toLowerCase().trim();
        const password = values.password;

        const emailErr = validateEmail(email);
        const passErr = validatePassword(password);

        if (emailErr || passErr) {
            setFieldErrors({ email: emailErr, password: passErr });
            return;
        }

        setLoading(true);
        const form = e.currentTarget;

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.message || "Credenciales inválidas");
                return;
            }

            if (!json.data?.token) {
                throw new Error(json.message || 'Respuesta inválida del servidor');
            }

            const remember = (
                form.elements.namedItem(
                    "remember",
                ) as HTMLInputElement
            )?.checked;
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem("token", json.data.token);
            storage.setItem("user", JSON.stringify(json.data.user));

            router.push("/dashboard");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error de conexión. Intente nuevamente.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex items-center justify-center">
            <form
                onSubmit={handleSubmit}
                className="bg-gray w-96 p-6 rounded-lg shadow-xl shadow-gray-500 backdrop-blur-lg"
            >
                <div className="flex items-center justify-center mb-4">
                    <h2 className="font-semibold text-3xl italic">
                        Iniciar Sesión
                    </h2>
                </div>

                <div className="relative mx-9 my-3 w-60 h-40">
                    <Image
                        src="/images/pngegg.png"
                        alt="Logo"
                        fill
                        sizes="(max-width: 60px), (max-width: 60px)"
                        className="object-contain"
                        priority
                    />
                </div>

                {error && (
                    <div className="bg-rose-500 px-3 py-2 mb-3 rounded text-gray-100 flex items-center justify-center">
                        <p>{error}</p>
                    </div>
                )}

                <label
                    htmlFor="email"
                    className="block text-gray-100 mx-2 py-2"
                >
                    Correo
                </label>
                <input
                    id="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full py-2 bg-gray-50 text-gray-500 px-3 outline-none mb-1 rounded-lg ${fieldErrors.email ? "border-2 border-rose-500" : ""}`}
                    type="email"
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                />
                {fieldErrors.email && (
                    <p className="text-rose-400 text-sm mx-2 mb-3">
                        {fieldErrors.email}
                    </p>
                )}

                <label
                    htmlFor="password"
                    className="block text-gray-100 mx-2 py-2"
                >
                    Contraseña
                </label>
                <input
                    id="password"
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full py-2 bg-gray-50 text-gray-500 px-3 outline-none mb-1 rounded-lg ${fieldErrors.password ? "border-2 border-rose-500" : ""}`}
                    type="password"
                    placeholder="******"
                    autoComplete="current-password"
                />
                {fieldErrors.password && (
                    <p className="text-rose-400 text-sm mx-2 mb-3">
                        {fieldErrors.password}
                    </p>
                )}

                <div className="my-2 flex items-center">
                    <input
                        id="recuerdame"
                        name="remember"
                        className="mb-4 mx-1 rounded-xl"
                        type="checkbox"
                    />
                    <label
                        htmlFor="recuerdame"
                        className="text-gray-100 mb-4 cursor-pointer"
                    >
                        Recuérdame
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-sky-500 w-full text-gray-100 py-2 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Entrando..." : "Inicio"}
                </button>
            </form>
        </main>
    );
}
