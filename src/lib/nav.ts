// Structure unique du menu principal. Toute nouvelle page doit s'intégrer
// dans un de ces groupes plutôt que d'en créer un nouveau.
export type NavItem = {
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Accueil",
    items: [{ label: "Tableau de bord", href: "/" }],
  },
  {
    label: "Gestion",
    items: [
      { label: "Clients", href: "/clients" },
      { label: "Sites", href: "/sites" },
      { label: "Installations", href: "/installations" },
      { label: "Équipements", href: "/equipements" },
    ],
  },
  {
    label: "Opérations",
    items: [
      { label: "Chantiers", href: "/chantiers" },
      { label: "Maintenance", href: "/maintenance" },
      { label: "Nettoyage", href: "/nettoyage" },
      { label: "Planning", href: "/planning" },
    ],
  },
  {
    label: "Données",
    items: [
      { label: "Production", href: "/production" },
      { label: "Météo / Irradiation", href: "/meteo" },
      { label: "Documents", href: "/documents" },
    ],
  },
  {
    label: "Tâches",
    items: [{ label: "To-Do", href: "/todo" }],
  },
  {
    label: "Cartographie",
    items: [{ label: "Carte mondiale", href: "/carte" }],
  },
  {
    label: "Administration",
    items: [
      { label: "Rapports", href: "/rapports" },
      { label: "Import / Export", href: "/import-export" },
      { label: "Paramètres", href: "/parametres" },
    ],
  },
];
