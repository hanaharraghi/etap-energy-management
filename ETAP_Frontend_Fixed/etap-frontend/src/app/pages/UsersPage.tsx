import { useState } from "react";
import { motion } from "motion/react";
import { Search, ExternalLink, Clock, Edit } from "lucide-react";
import { Card, Button, Input, Avatar, Badge, StatusBadge } from "../components/shared";
import { DemoBanner } from "../components/DemoBanner";
import { useApiData } from "../../hooks/useApiData";
import { listUtilisateurs } from "../../lib/api";
import { demoUtilisateurs } from "../../data/demoData";
import type { RoleType } from "../../types/models";

function UsersPage() {
  const [search, setSearch] = useState("");
  const { data: users, isDemo } = useApiData(listUtilisateurs, demoUtilisateurs);

  const roleColors: Record<RoleType, string> = {
    ADMIN: "#005BAC", RESPONSABLE_REGIONAL: "#22C55E", AGENT: "#8B5CF6",
  };
  const roleLabels: Record<RoleType, string> = {
    ADMIN: "Administrateur", RESPONSABLE_REGIONAL: "Responsable régional", AGENT: "Agent",
  };

  const filtered = users.filter(u =>
    `${u.prenom} ${u.nom}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const keycloakAdminUrl = `${import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8085"}/admin/master/console/#/${import.meta.env.VITE_KEYCLOAK_REALM || "etap"}/users`;

  return (
    <div className="space-y-5">
      <DemoBanner show={isDemo} />
      <div className="flex items-center gap-3">
        <Input placeholder="Rechercher un utilisateur..." value={search} onChange={setSearch}
          icon={<Search size={14} />} className="w-64" />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<ExternalLink size={13} />}
            onClick={() => window.open(keycloakAdminUrl, "_blank")}>
            Gérer dans Keycloak
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        Les comptes (création, mots de passe, rôles) sont gérés dans la console d'administration Keycloak — cette page affiche les profils applicatifs synchronisés.
      </p>

      <Card className="p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Utilisateur", "Rôle", "Service", "Statut", "Dernière connexion", ""].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => (
              <motion.tr key={user.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={user.avatar} size="sm" color={roleColors[user.role] || "#64748B"} />
                    <div>
                      <div className="text-sm font-medium text-foreground">{user.prenom} {user.nom}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg text-white"
                    style={{ backgroundColor: roleColors[user.role] || "#64748B" }}>
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{user.dept}</td>
                <td className="px-4 py-3"><StatusBadge status={user.actif ? "active" : "inactive"} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={11} />{user.lastLogin}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" icon={<Edit size={12} />}
                      onClick={() => window.open(`${keycloakAdminUrl}/${user.keycloakId}/settings`, "_blank")} />
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export { UsersPage };
