import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-8 py-3 text-sm font-medium hover:opacity-90 transition"
        >
          Zaloguj się
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-full border border-foreground/20 px-8 py-3 text-sm font-medium hover:bg-foreground/5 transition"
        >
          Zarejestruj
        </Link>
      </div>
    </div>
  );
}
