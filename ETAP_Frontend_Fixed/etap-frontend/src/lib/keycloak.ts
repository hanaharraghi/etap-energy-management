import Keycloak from "keycloak-js";

// Real OpenID Connect client — no mock login, no fake timers.
// Configure via .env (see .env.example): VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM,
// VITE_KEYCLOAK_CLIENT_ID must match keycloak/realm-export.json from the infra scaffold.
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8085",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "etap",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "react-client",
});

export type AppRole = "ADMIN" | "AGENT" | "RESPONSABLE_REGIONAL";

export function getRealmRoles(): AppRole[] {
  const roles = keycloak.tokenParsed?.realm_access?.roles ?? [];
  return roles.filter((r): r is AppRole =>
    ["ADMIN", "AGENT", "RESPONSABLE_REGIONAL"].includes(r)
  );
}

export function hasRole(role: AppRole): boolean {
  return getRealmRoles().includes(role);
}

export function getCurrentUser() {
  const t = keycloak.tokenParsed;
  if (!t) return null;
  return {
    keycloakId: t.sub as string,
    email: (t.email as string) ?? "",
    firstName: (t.given_name as string) ?? "",
    lastName: (t.family_name as string) ?? "",
    fullName: (t.name as string) ?? t.preferred_username ?? "",
    roles: getRealmRoles(),
  };
}

/**
 * Keeps the access token fresh. Call once after a successful init and let it
 * run for the app's lifetime; the API client relies on keycloak.token always
 * being valid for the next call.
 */
export function scheduleTokenRefresh() {
  setInterval(() => {
    keycloak.updateToken(30).catch(() => {
      // Refresh token expired or invalid — force a fresh login.
      keycloak.login();
    });
  }, 20_000);
}

export default keycloak;
