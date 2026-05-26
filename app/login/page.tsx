"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Monitor, Lock, User, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) { setError("Preencha usuário e senha."); return; }
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      username, password, redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Usuário ou senha incorretos.");
    } else {
      router.replace("/");
    }
  }

  if (status === "loading") return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ color: "var(--text2)", fontSize: 13 }}>Verificando sessão...</div>
    </div>
  );

  return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)",
      backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(245,158,11,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.04) 0%, transparent 60%)",
    }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 20px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            boxShadow: "0 0 40px rgba(245,158,11,0.25)",
          }}>
            <Monitor size={28} color="#0a0c10" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", letterSpacing: -0.5 }}>POTENZA</div>
          <div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 3, marginTop: 2 }}>INVENTÁRIO TI</div>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
        }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>Entrar no sistema</h2>
          <p style={{ margin: "0 0 24px", fontSize: 12, color: "var(--text2)" }}>Acesso restrito — credenciais obrigatórias</p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Username */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                Usuário
              </label>
              <div style={{ position: "relative" }}>
                <User size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text2)", pointerEvents: "none" }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: 36 }}
                  type="text"
                  placeholder="seu.usuario"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text2)", pointerEvents: "none" }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text2)", cursor: "pointer", padding: 4 }}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#ef4444",
              }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 14, marginTop: 4 }}
              disabled={loading}
            >
              {loading ? "Autenticando..." : "Entrar"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "var(--text2)" }}>
          Acesso não autorizado é proibido e registrado.
        </div>
      </div>
    </div>
  );
}
