import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function ConnexionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-white p-8 shadow-[var(--shadow-sm)]">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-[var(--color-text)]">GMAO</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Connectez-vous à votre espace
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
