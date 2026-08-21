import type { NextAuthConfig } from "next-auth";

// Configuration "sûre pour l'edge" : ne contient aucun provider qui touche
// la base de données (Prisma ne tourne pas dans le runtime Edge). Utilisée
// par le middleware pour vérifier la session ; le provider Credentials est
// ajouté séparément dans auth.ts pour les routes serveur classiques.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.companyId = user.companyId;
        token.companyName = user.companyName;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
        session.user.companyName = token.companyName as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
