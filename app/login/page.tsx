import Form from "next/form";
import Image from "next/image";

export default function Login() {
    return (
        <main className="flex items-center justify-center h-screen">
            {/* El componente Form de Next.js gestiona automáticamente la navegación 
        y la obtención de datos en el cliente.
      */}
            <Form action="/api/auth/login">
                <div className="bg-gray w-96 p-6 rounded-lg shadow-xl shadow-gray-500 backdrop-blur-lg">
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

                    {/* Sección de alertas (puedes condicionar esto con parámetros de búsqueda de la URL) */}
                    <div className="hidden bg-rose-500 px-3 py-2 mb-3 rounded text-gray-100 flex items-center justify-center">
                        <p>¡Usuario o Contraseña inválida!</p>
                    </div>

                    <label
                        htmlFor="usuario"
                        className="block text-gray-100 mx-2 py-2"
                    >
                        Usuario
                    </label>
                    <input
                        id="usuario"
                        name="username" // Crucial para que el formulario envíe el dato
                        className="w-full py-2 bg-gray-50 text-gray-500 px-3 outline-none mb-4 rounded-lg"
                        type="text"
                        placeholder="Usuario"
                        required // Verificación nativa
                        minLength={3}
                    />

                    <label
                        htmlFor="password"
                        className="block text-gray-100 mx-2 py-2"
                    >
                        Contraseña
                    </label>
                    <input
                        id="password"
                        name="password" // Crucial para que el formulario envíe el dato
                        className="w-full py-2 bg-gray-50 text-gray-500 px-3 outline-none mb-4 rounded-lg"
                        type="password"
                        placeholder="******"
                        required // Verificación nativa
                    />

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
                        className="bg-sky-500 w-full text-gray-100 py-2 rounded-lg hover:bg-indigo-500 transition-colors"
                    >
                        Inicio
                    </button>
                </div>
            </Form>
        </main>
    );
}
