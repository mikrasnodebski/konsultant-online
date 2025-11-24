"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLogin } from "@/entities/user/useLogin";

export function LoginForm() {
	const router = useRouter();
	const login = useLogin();
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			const form = new FormData(e.currentTarget);
			const email = String(form.get("email") || "");
			const password = String(form.get("password") || "");
			await login.mutateAsync({ email, password });
			router.push("/panel");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Nie udało się zalogować.";
			setError(message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="w-full max-w-md rounded-2xl border border-white/10 p-6 bg-background/60 backdrop-blur">
			<h1 className="text-2xl font-semibold tracking-tight text-center">Logowanie</h1>
			<form className="mt-6 grid gap-4" onSubmit={onSubmit}>
				<div className="grid gap-2">
					<label htmlFor="email" className="text-sm font-medium">
						Email
					</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
						placeholder="you@example.com"
					/>
				</div>
				<div className="grid gap-2">
					<label htmlFor="password" className="text-sm font-medium">
						Hasło
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
						placeholder="********"
					/>
				</div>
				{error ? <p className="text-sm text-red-500">{error}</p> : null}
				<button
					type="submit"
					disabled={submitting}
					className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-foreground text-background px-6 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
				>
					{submitting ? "Przetwarzanie..." : "Zaloguj się"}
				</button>
			</form>
			<p className="mt-4 text-center text-sm text-foreground/70">
				Nie masz konta?{" "}
				<Link href="/register" className="underline underline-offset-4">
					Zarejestruj się
				</Link>
			</p>
		</div>
	);
}


