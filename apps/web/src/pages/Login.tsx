import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Login.css";

export default function Login() {
  const { login, register } = useAuth();
  const nav = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const isLogin = mode === "login";

  const [email, setEmail] = useState("test@email.com");
  const [password, setPassword] = useState("password123");
  const [showPw, setShowPw] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = isLogin ? "Welcome back" : "Create your account";
  const subtitle = isLogin
    ? "Log in to track meals and macros."
    : "Register to start tracking meals and macros.";

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0 && !loading;
  }, [email, password, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) await login(email, password);
      else await register(email, password);

      nav("/", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? (isLogin ? "Login failed" : "Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    
    <div className="loginPage">
      <div className="loginBg" aria-hidden="true" />
      <main className="loginWrap">
        <div className="loginBrand">
          <div className="brand">
            <img src="/logo.svg" alt="CaloRight logo" className="logo" />
          </div>
          <div className="loginBrandText">
            <div className="loginBrandName">CaloRight</div>
            <div className="loginBrandSub">Meal tracking made simple.</div>
          </div>
        </div>

        <section className="loginCard" aria-label={isLogin ? "Login form" : "Registration form"}>
          <header className="loginHeader">
            <h1 className="loginTitle">{title}</h1>
            <p className="loginSub">{subtitle}</p>
          </header>

          {error ? (
            <div className="loginAlert" role="alert">
              {error}
            </div>
          ) : null}

          <form className="loginForm" onSubmit={onSubmit}>
            <label className="loginField">
              <span className="loginLabel">Email</span>
              <input
                className="loginInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="you@email.com"
              />
            </label>

            <label className="loginField">
              <span className="loginLabel">Password</span>

              <div className="pwRow">
                <input
                  className="loginInput"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? "text" : "password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="pwToggle"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>

              <span className="loginHint">
                {isLogin ? "Use your existing password." : "Use something you’ll remember."}
              </span>
            </label>

            <button className="loginBtn" disabled={!canSubmit} type="submit">
              {loading ? "Please wait…" : isLogin ? "Login" : "Create account"}
            </button>
          </form>

          <div className="loginFooter">
            {isLogin ? (
              <>
                <span className="loginFooterText">New here?</span>
                <button
                  className="loginLink"
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("register");
                  }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                <span className="loginFooterText">Already have an account?</span>
                <button
                  className="loginLink"
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("login");
                  }}
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </section>
        <div className="loginNote">
        </div>
      </main>
    </div>
  );
}
