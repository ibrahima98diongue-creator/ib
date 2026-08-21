# GMAO

Application de gestion de maintenance assistée par ordinateur (GMAO), pour le
suivi de sites photovoltaïques : clients, sites, installations, équipements,
chantiers, maintenance, nettoyage, planning, production, météo, documents,
tâches, carte mondiale, rapports, import/export et paramètres.

## État du projet

Tous les modules prévus au menu sont construits :

- authentification multi-entreprise (chaque entreprise ne voit que ses
  propres données) ;
- hiérarchie métier **Client → Site → Installation → Équipement**, en
  création/consultation/modification/suppression complètes ;
- **Chantiers**, **Maintenance** (préventive/corrective) et **Nettoyage**,
  rattachés à un site (et optionnellement un équipement pour la
  maintenance), avec statut et priorité communs (🔴 Critique, 🟠 Haute,
  🟡 Moyenne, 🟢 Faible) ;
- **Planning** (vues Jour / Semaine / Mois) listant chantiers, maintenances
  et nettoyages programmés, avec navigation précédent/suivant ;
- **Documents** : ajout direct depuis la fiche d'un client, site,
  installation, équipement, chantier ou maintenance (onglet « Documents »),
  et page dédiée pour rechercher/filtrer/télécharger/supprimer parmi tous
  les documents de l'entreprise. Stockage local sur disque, jamais exposé
  publiquement : chaque téléchargement passe par une vérification que le
  document appartient bien à l'entreprise de l'utilisateur connecté ;
- **Production** : relevés journaliers par site, totaux Aujourd'hui / Ce
  mois-ci / Cette année, graphique des 30 derniers jours (affiché uniquement
  si des données existent réellement) ;
- **Météo / Irradiation** : relevés par site (irradiation, GHI, DNI, DHI,
  température, vent, précipitations) ;
- **To-Do** : tâches simples (titre, responsable, échéance, priorité,
  statut, description), en trois vues — Liste, Kanban (glisser-déposer
  pour changer le statut) et Calendrier ;
- **Carte mondiale** : sites géolocalisés sur une carte interactive
  (OpenStreetMap), fiche résumée au clic (client, puissance, production de
  l'année, statut, prochaine maintenance) avec lien vers la fiche complète ;
- **Rapports** : vue d'ensemble chiffrée (gestion, opérations, production),
  exportable en CSV ;
- **Import / Export** : une seule page pour importer (Clients, Sites,
  Installations, Équipements, Productions, Météo) avec aperçu et détail des
  erreurs avant validation, et exporter (mêmes entités + Maintenances et
  Rapport) au format CSV ;
- **Paramètres** : nom de l'entreprise, gestion des utilisateurs (ajout,
  rôle, suppression — réservée aux administrateurs) et changement de son
  propre mot de passe ;
- navigation et design system communs à toute l'application ;
- tableau de bord simple, sans aucune donnée fictive (sites actifs,
  chantiers en cours, maintenances à venir, interventions urgentes, tâches
  à faire, prochaines interventions, production et irradiation moyenne
  quand des données existent).

## Stack technique

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Prisma](https://www.prisma.io) + PostgreSQL
- [Auth.js (NextAuth v5)](https://authjs.dev), identifiants email/mot de passe

## Démarrage

### 1. Base de données

Une base PostgreSQL est nécessaire. Copier `.env.example` vers `.env` et
renseigner `DATABASE_URL` et `AUTH_SECRET`.

```bash
cp .env.example .env
```

### 2. Installation et migration

```bash
npm install
npx prisma migrate dev
```

### 3. Créer le compte administrateur

Aucune donnée métier n'est générée automatiquement. Le seed crée uniquement
l'entreprise et le compte nécessaires pour se connecter :

```bash
npm run db:seed
```

Par défaut : `admin@demo.local` / `admin1234` (personnalisable via les
variables `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_COMPANY_NAME`).

### 4. Lancer l'application

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Stockage des documents

Les fichiers téléversés sont enregistrés localement dans `./storage/documents/<entreprise>/`
(dossier ignoré par Git — ce sont des données, pas du code). Chaque
téléchargement passe par la route `/api/documents/[id]`, qui vérifie que
l'utilisateur connecté appartient à l'entreprise propriétaire du document.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run start` — démarrer le build de production
- `npm run lint` — vérification ESLint
- `npm run db:seed` — créer le compte administrateur initial
