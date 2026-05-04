"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Autor {
    name: string;
}

interface Post {
    _id: string;
    titulo: string;
    contenido: string;
    autor: Autor;
    imagenPortada?: string;
    fechaPublicacion: string;
    tags: string[];
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface PostResponse {
    success: boolean;
    data: {
        posts: Post[];
        pagination: Pagination;
    };
    message: string;
}

function PostModal({ post, onClose }: { post: Post; onClose: () => void }) {
    function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) onClose();
    }

    useEffect(() => {
        function handleEsc(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleEsc);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={handleBackdrop}
        >
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
                {/* Hero banner */}
                {post.imagenPortada ? (
                    <div className="relative w-full h-64 sm:h-85 shrink-0">
                        <Image
                            src={post.imagenPortada}
                            alt={post.titulo}
                            fill
                            className="object-cover border rounded-2xl"
                            priority
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
                    </div>
                ) : (
                    <div className="h-32 bg-linear-to-r from-cyan-600 to-blue-600 shrink-0" />
                )}

                {/* Contenido scrolleable */}
                <div className="modal-content p-6 sm:p-8 -mt-8 relative overflow-y-auto flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className="text-xs bg-cyan-500/15 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-500/20"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                        {post.titulo}
                    </h2>

                    <div className="flex items-center gap-3 text-sm text-zinc-400 mb-6">
                        <span>{post.autor?.name}</span>
                        <span>•</span>
                        <span>
                            {new Date(post.fechaPublicacion).toLocaleDateString(
                                "es-VE",
                                {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                },
                            )}
                        </span>
                    </div>

                    <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {post.contenido}
                    </div>
                </div>

                {/* Cerrar */}
                <div className="px-6 sm:px-8 pb-6 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-white/5 backdrop-blur-md border border-white/10 text-zinc-300 rounded-xl hover:bg-white/10 hover:text-cyan-200 transition-all duration-300"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Blog() {
    // # Este mockPosts es solo para pruebas, debes eliminarlo y usar el estado real que se carga desde la API

    const mockPosts: Post[] = [
        {
            _id: "1",
            titulo: "Inauguración del Nuevo Parque Comunal 'La Esperanza'",
            contenido:
                "Hoy celebramos con orgullo la apertura de nuestro nuevo espacio recreativo. Este proyecto, que tomó más de seis meses de trabajo voluntario y gestión vecinal, cuenta con áreas verdes, juegos para niños y una zona de ejercicio al aire libre.\n\nDurante el evento, la directiva agradeció a todos los vecinos que aportaron su grano de arena. El parque estará abierto todos los días de 6:00 AM a 8:00 PM. ¡Cuidemos este espacio que es de todos!\n\nPróximamente estaremos instalando luminarias LED para mejorar la seguridad nocturna en los alrededores.",
            autor: { name: "Comité de Infraestructura" },
            imagenPortada:
                "https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=2072&auto=format&fit=crop",
            fechaPublicacion: new Date().toISOString(),
            tags: ["Comunidad", "Obras", "Recreación"],
        },
        {
            _id: "2",
            titulo: "Jornada de Vacunación y Salud Integral",
            contenido:
                "Se informa a todos los residentes que el próximo sábado 15 de mayo contaremos con una jornada especial de salud en el salón de usos múltiples. Se estarán aplicando vacunas de rutina, toma de tensión y consultas pediátricas gratuitas.\n\nEs indispensable traer la cédula de identidad y, en caso de niños, su tarjeta de control de vacunas. ¡La prevención es nuestra mejor herramienta!",
            autor: { name: "Mireya (Salud)" }, // Usando el nombre guardado en tu contexto
            imagenPortada:
                "https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=2070&auto=format&fit=crop",
            fechaPublicacion: new Date().toISOString(),
            tags: ["Salud", "Prevención"],
        },
    ];
    // # Hasta aquí el mockPosts, recuerda eliminarlo y usar el estado real que se carga desde la API

    /* const [posts, setPosts] = useState<Post[]>([]); */ /* Cambie el const solo para probar el mockup 
    asi que lo debes descomentar para usar el estado real */
    const [posts, setPosts] = useState<Post[]>(mockPosts);
    /*const [pagination, setPagination] = useState<Pagination | null>(null); */ /* Esta es la paginacion real descomentarla */
    // # Esta paginacion es solo para pruebas, debes eliminarlo y usar el estado real que se carga desde la API
    const [pagination, setPagination] = useState<Pagination | null>({
        page: 1,
        limit: 9,
        total: 2,
        totalPages: 1,
    });
    // Aqui termina la paginacion de prueba, recuerda eliminarla y usar el estado real que se carga desde la API

    const [loading, setLoading] =
        useState(false); /* Debe estar en true pero Puse el estado en 
        false para que no cargara el skeleton 
        y poder probar un mockup */
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [tag, setTag] = useState<string>("");
    const [allLoadedPosts, setAllLoadedPosts] = useState<Post[]>(() => posts);

    useEffect(() => {
        let cancelled = false;
        async function init() {
            setLoading(true);
            try {
                const params = new URLSearchParams({ page: "1", limit: "9" });
                const res = await fetch(`/api/blog?${params}`);
                const json: PostResponse = await res.json();
                if (!cancelled && json.success) {
                    setPosts(json.data.posts);
                    setAllLoadedPosts(json.data.posts);
                    setPagination(json.data.pagination);
                }
            } catch (err) {
                console.error("Error cargando posts:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        init();
        return () => {
            cancelled = true;
        };
    }, []);

    async function handleTagFilter(newTag: string) {
        setTag(newTag);
        if (allLoadedPosts.length === 0) return;

        const filtered = newTag
            ? allLoadedPosts.filter((p) => p.tags.includes(newTag))
            : allLoadedPosts;

        setPosts(filtered);
        if (pagination) {
            setPagination({
                ...pagination,
                total: filtered.length,
                totalPages: Math.ceil(filtered.length / pagination.limit),
            });
        }
    }

    async function handlePageChange(newPage: number) {
        if (allLoadedPosts.length === 0) return;

        const filtered = tag
            ? allLoadedPosts.filter((p) => p.tags.includes(tag))
            : allLoadedPosts;

        const start = (newPage - 1) * (pagination?.limit || 9);
        const pagePosts = filtered.slice(
            start,
            start + (pagination?.limit || 9),
        );

        setPosts(pagePosts);
        if (pagination) {
            setPagination({ ...pagination, page: newPage });
        }
    }

    // Recolectar todos los tags únicos
    const allTags = Array.from(
        new Set(allLoadedPosts.flatMap((p) => p.tags)),
    ).slice(0, 8);

    return (
        <div className="min-w-3/5  flex flex-col gap-6 py-6 overflow-y-auto">
            {/* Header */}
            <section className="relative text-center px-4 pt-8 pb-4">
                <div className="inline-block">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
                        Blog Comunal
                    </h1>
                    <div className="h-1 w-24 mx-auto bg-linear-to-r from-cyan-400 to-blue-500 rounded-full mb-4" />
                    <p className="text-zinc-300 text-base sm:text-lg max-w-xl mx-auto">
                        Noticias, comunicados y novedades de la comunidad
                    </p>
                </div>
            </section>

            {/* Filtro por tags */}
            {allTags.length > 0 && (
                <div className="px-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                        <button
                            onClick={() => handleTagFilter("")}
                            className={`text-sm px-4 py-1.5 rounded-full backdrop-blur-md border transition-all duration-300 ${
                                !tag
                                    ? "bg-white/15 border-cyan-400/50 text-cyan-200 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]"
                                    : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20"
                            }`}
                        >
                            Todos
                        </button>
                        {allTags.map((t) => (
                            <button
                                key={t}
                                onClick={() => handleTagFilter(t)}
                                className={`text-sm px-4 py-1.5 rounded-full backdrop-blur-md border transition-all duration-300 ${
                                    tag === t
                                        ? "bg-white/15 border-cyan-400/50 text-cyan-200 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]"
                                        : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20"
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid de cards */}
            <section className="max-w-6xl mx-auto px-4 pb-8 w-full">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl h-80 animate-pulse"
                            />
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 text-zinc-400">
                        <p className="text-xl">No hay publicaciones aún</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <article
                                key={post._id}
                                onClick={() => setSelectedPost(post)}
                                className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:-translate-y-1 active:scale-[0.98]"
                            >
                                {/* Imagen */}
                                <div className="relative w-full h-48 overflow-hidden">
                                    {post.imagenPortada ? (
                                        <Image
                                            src={post.imagenPortada}
                                            alt={post.titulo}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-linear-to-br from-cyan-600/80 to-blue-700/80" />
                                    )}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                                </div>

                                {/* Contenido */}
                                <div className="p-4">
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {post.tags.slice(0, 3).map((t) => (
                                            <span
                                                key={t}
                                                className="text-xs bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/20"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-cyan-200 transition-colors">
                                        {post.titulo}
                                    </h3>

                                    <p className="text-sm text-zinc-400 line-clamp-3 mb-3">
                                        {post.contenido}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-zinc-500">
                                        <span>{post.autor?.name}</span>
                                        <span>
                                            {new Date(
                                                post.fechaPublicacion,
                                            ).toLocaleDateString("es-VE")}
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* Paginación */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-10">
                        <button
                            onClick={() =>
                                handlePageChange(pagination.page - 1)
                            }
                            disabled={pagination.page === 1}
                            className="px-5 py-2 bg-white/5 backdrop-blur-md border border-white/10 text-zinc-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 hover:text-cyan-200 transition-all duration-300"
                        >
                            Anterior
                        </button>
                        <span className="px-4 py-2 text-zinc-400">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() =>
                                handlePageChange(pagination.page + 1)
                            }
                            disabled={pagination.page === pagination.totalPages}
                            className="px-5 py-2 bg-white/5 backdrop-blur-md border border-white/10 text-zinc-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 hover:text-cyan-200 transition-all duration-300"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </section>

            {/* Modal */}
            {selectedPost && (
                <PostModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                />
            )}
        </div>
    );
}
