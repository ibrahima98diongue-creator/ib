export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-md bg-[var(--color-critical-bg)] px-3 py-2 text-sm text-[var(--color-critical)]">
      {message}
    </p>
  );
}
