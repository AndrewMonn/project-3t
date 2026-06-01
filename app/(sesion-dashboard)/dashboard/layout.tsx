'use client';
// Layout del Dashboard — verifica autenticaci�n antes de renderizar contenido protegido

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  // Verifica existencia del token JWT en localStorage/sessionStorage
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      router.replace('/login'); // Redirige al login si no hay sesion
    } else {
      setAuthed(true);
    }
  }, [router]);

  if (!authed) {
    return (
      <div className="flex items-center justify-center h-full text-gray-300">
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          Verificando sesi&oacute;n...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
