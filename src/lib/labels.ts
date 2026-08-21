import type { Tone } from "@/components/ui/Badge";
import {
  SiteStatus,
  EquipementStatus,
  UserRole,
  Priority,
  ChantierStatus,
  MaintenanceStatus,
  MaintenanceType,
  TaskStatus,
} from "@/generated/prisma/enums";

// Source unique des libellés et couleurs affichés dans toute l'application.
// Toute nouvelle page doit réutiliser ces constantes plutôt qu'en inventer de nouvelles.

export const siteStatusLabels: Record<SiteStatus, { label: string; tone: Tone }> = {
  ACTIF: { label: "Actif", tone: "low" },
  EN_CONSTRUCTION: { label: "En construction", tone: "medium" },
  INACTIF: { label: "Inactif", tone: "neutral" },
};

export const equipementStatusLabels: Record<EquipementStatus, { label: string; tone: Tone }> = {
  EN_SERVICE: { label: "En service", tone: "low" },
  EN_MAINTENANCE: { label: "En maintenance", tone: "medium" },
  HORS_SERVICE: { label: "Hors service", tone: "critical" },
};

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  TECHNICIEN: "Technicien",
  VIEWER: "Lecture seule",
};

// Échelle de priorité unique, réutilisée par Chantiers, Maintenance et (plus
// tard) les Tâches — mêmes 4 niveaux, mêmes couleurs partout.
export const priorityLabels: Record<Priority, { label: string; tone: Tone }> = {
  CRITIQUE: { label: "Critique", tone: "critical" },
  HAUTE: { label: "Haute", tone: "high" },
  MOYENNE: { label: "Moyenne", tone: "medium" },
  FAIBLE: { label: "Faible", tone: "low" },
};

export const chantierStatusLabels: Record<ChantierStatus, { label: string; tone: Tone }> = {
  A_PLANIFIER: { label: "À planifier", tone: "neutral" },
  PLANIFIE: { label: "Planifié", tone: "info" },
  EN_COURS: { label: "En cours", tone: "medium" },
  EN_ATTENTE: { label: "En attente", tone: "high" },
  TERMINE: { label: "Terminé", tone: "low" },
};

export const maintenanceStatusLabels: Record<MaintenanceStatus, { label: string; tone: Tone }> = {
  A_PLANIFIER: { label: "À planifier", tone: "neutral" },
  PLANIFIEE: { label: "Planifiée", tone: "info" },
  EN_COURS: { label: "En cours", tone: "medium" },
  EN_ATTENTE: { label: "En attente", tone: "high" },
  TERMINEE: { label: "Terminée", tone: "low" },
};

export const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  PREVENTIVE: "Préventive",
  CORRECTIVE: "Corrective",
};

export const taskStatusLabels: Record<TaskStatus, { label: string; tone: Tone }> = {
  A_FAIRE: { label: "À faire", tone: "neutral" },
  EN_COURS: { label: "En cours", tone: "medium" },
  EN_ATTENTE: { label: "En attente", tone: "high" },
  TERMINEE: { label: "Terminée", tone: "low" },
};
