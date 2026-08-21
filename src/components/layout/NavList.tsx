"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { navGroups } from "@/lib/nav";

// Rendu des groupes de menu, partagé entre la barre latérale (desktop)
// et le menu mobile — même structure, même comportement d'état actif.
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {navGroups.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={clsx(
                      "block rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-[var(--color-primary-bg)] font-medium text-[var(--color-primary)]"
                        : "text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-text)]",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
