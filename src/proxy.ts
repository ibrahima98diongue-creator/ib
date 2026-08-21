import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Le middleware tourne dans le runtime Edge : on utilise ici la config sans
// provider Credentials/Prisma (voir auth.config.ts), qui suffit à lire la
// session JWT existante.
const { auth } = NextAuth(authConfig);

// Protège toutes les pages de l'application : un utilisateur non connecté
// est redirigé vers /connexion. Les routes publiques (connexion, API auth,
// assets statiques) restent accessibles. Les autres routes API gèrent
// elles-mêmes leur réponse 401 : les rediriger vers la page HTML de
// connexion serait incorrect pour un appel programmatique (fetch, etc.).
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isApiRoute = req.nextUrl.pathname.startsWith("/api/");
  const isPublicRoute = req.nextUrl.pathname === "/connexion" || isApiRoute;

  if (!isLoggedIn && !isPublicRoute) {
    const url = new URL("/connexion", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && req.nextUrl.pathname === "/connexion") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
