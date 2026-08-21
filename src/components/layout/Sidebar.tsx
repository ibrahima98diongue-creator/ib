import { NavList } from "@/components/layout/NavList";

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-white md:flex">
      <div className="flex h-14 items-center border-b border-[var(--color-border)] px-5">
        <span className="text-base font-semibold tracking-tight text-[var(--color-text)]">
          GMAO
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavList />
      </nav>
    </aside>
  );
}
