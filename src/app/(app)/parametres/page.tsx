import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { CompanyForm } from "./CompanyForm";
import { UsersManager } from "./UsersManager";
import { PasswordForm } from "./PasswordForm";
import { UserRole } from "@/generated/prisma/enums";

export default async function ParametresPage() {
  const session = await auth();
  const companyId = session!.user.companyId;

  const [company, users] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.user.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
  ]);

  const isAdmin = session!.user.role === UserRole.ADMIN;

  return (
    <div>
      <PageHeader title="Paramètres" />

      <section className="mb-10">
        <h2 className="mb-3 text-base font-semibold text-[var(--color-text)]">Entreprise</h2>
        {isAdmin ? (
          <CompanyForm name={company.name} />
        ) : (
          <p className="text-sm text-[var(--color-text)]">{company.name}</p>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-base font-semibold text-[var(--color-text)]">Utilisateurs</h2>
        <UsersManager users={users} currentUserId={session!.user.id} canManage={isAdmin} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-[var(--color-text)]">Mon compte</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
