'use client';
// @panel Gesti\u00f3n de Usuarios — tabla + modal registro. GET /api/users, POST /api/auth/register

import { useState, useEffect } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'administrador' | 'vocero';
  createdAt: string;
}

export default function UsersPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setUsers(json.data.users);
    } catch (e: any) {
      setError(e.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">Gesti&oacute;n de Usuarios</h2>
        <button
          onClick={() => setShowRegister(true)}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          + Registrar Nuevo Usuario
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-300">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mr-3" />
          Cargando usuarios...
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl">{error}</div>
      )}
      {!loading && !error && users.length === 0 && (
        <div className="text-center py-16 text-gray-400">No hay usuarios registrados</div>
      )}
      {!loading && !error && users.length > 0 && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Rol</th>
                  <th className="text-left px-4 py-3 font-medium">Registro</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-gray-300">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'administrador' ? 'bg-sky-500/15 text-sky-400' : 'bg-white/10 text-gray-300'
                      }`}>
                        {u.role === 'administrador' ? 'Administrador' : 'Vocero'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => { setShowRegister(false); fetchUsers(); }}
        />
      )}
    </div>
  );
}

function RegisterModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'vocero' | 'administrador'>('vocero');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError('Todos los campos son obligatorios'); return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres'); return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, role }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-xl backdrop-blur-lg">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Registrar Nuevo Usuario</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-2 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Nombre completo</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500"
              placeholder="Nombre y apellido" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Correo electr&oacute;nico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500"
              placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Contrase&ntilde;a</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500"
              placeholder="M&iacute;nimo 6 caracteres" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'vocero' | 'administrador')}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors">
              <option value="vocero" className="bg-gray-800">Vocero</option>
              <option value="administrador" className="bg-gray-800">Administrador</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-gray-300 rounded-xl text-sm hover:bg-white/20 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
