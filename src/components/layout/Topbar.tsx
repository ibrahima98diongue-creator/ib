import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth";
import { roleLabels } from "@/lib/labels";
import { UserRole } from "@/generated/prisma/enums";
import { MobileNav } from "@/components/layout/MobileNav";

export async function Topbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <span className="text-sm font-medium text-[var(--color-text)]">
          {user?.companyName}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-[var(--color-text)]">{user.name}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {roleLabels[user.role as UserRole] ?? user.role}
            </p>
          </div>
        )}
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-md border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-text)] hover:bg-gray-50"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </header>
  );
}
