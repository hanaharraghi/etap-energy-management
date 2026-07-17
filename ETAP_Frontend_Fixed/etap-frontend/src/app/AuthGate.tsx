import { useEffect, useState } from "react";
import keycloak, { scheduleTokenRefresh } from "../lib/keycloak";

/**
 * Replaces the old fake LoginPage. Keycloak's own hosted login page handles
 * credentials entirely — this component only waits for `init()` to resolve
 * (silent SSO check, or a real redirect if the user isn't authenticated yet)
 * before rendering the app's routes.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    keycloak
      .init({
        onLoad: "login-required",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then((authenticated) => {
        if (cancelled) return;
        if (!authenticated) {
          keycloak.login();
          return;
        }
        scheduleTokenRefresh();
        setReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Keycloak initialization failed", err);
        setError(
          "Impossible de contacter le serveur d'authentification Keycloak. Vérifiez VITE_KEYCLOAK_URL dans votre .env et que Keycloak est démarré."
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001f3f] px-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            !
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Connexion à Keycloak impossible
          </h1>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001f3f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/70 text-sm">Connexion en cours…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
