import { useState } from "react";
import { LogIn, Loader2, AlertCircle, GraduationCap } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

export default function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const lookupRes = await fetch(`${BASE}api/auth/student-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!lookupRes.ok) {
        const data = await lookupRes.json();
        setError(data.error || "Usuario no encontrado");
        setLoading(false);
        return;
      }

      const { database } = await lookupRes.json();

      const authRes = await fetch(`${BASE}web/session/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            db: database,
            login: username.trim(),
            password: password,
          },
        }),
        credentials: "include",
      });

      const authData = await authRes.json();

      if (authData.result && authData.result.uid) {
        window.location.href = `/web#action=menu`;
      } else {
        const odooError = authData.error?.data?.message || authData.result?.message;
        setError(odooError || "Contraseña incorrecta. Inténtalo de nuevo.");
      }
    } catch (err: any) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Acceso Alumnos</h3>
            <p className="text-xs text-slate-500">Entra a tu empresa en Odoo</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="student-user" className="block text-sm font-medium text-slate-700 mb-1.5">
              Usuario
            </label>
            <input
              id="student-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="alumno01"
              required
              autoComplete="username"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="student-pass" className="block text-sm font-medium text-slate-700 mb-1.5">
              Contraseña
            </label>
            <input
              id="student-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar a mi empresa
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-xs text-center text-slate-400">
          Tu profesor te proporcionará el usuario y contraseña
        </p>
      </div>
    </div>
  );
}
