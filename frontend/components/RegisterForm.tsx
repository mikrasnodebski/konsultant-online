"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRegister } from "@/entities/user/useRegister";
import type { RegisterRequest, RoleApi } from "@/entities/user/types";
import { useSearchParams } from "next/navigation";

export function RegisterForm() {
	const [role, setRole] = useState<"consultant" | "client" | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const register = useRegister();
	const search = useSearchParams();

	useEffect(() => {
		const storeSlug = search.get("store");
		const roleParam = search.get("role");
		if (roleParam?.toUpperCase() === "CLIENT" || storeSlug) {
			setRole("client");
		}
	}, []);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!role) return;
		setSubmitting(true);
		setError(null);
		try {
			const form = new FormData(e.currentTarget);
			const firstName = String(form.get("firstName") || "");
			const lastName = String(form.get("lastName") || "");
			const phone = String(form.get("phone") || "");
			const email = String(form.get("email") || "");
			const password = String(form.get("password") || "");
			const confirm = String(form.get("confirm") || "");
			if (password !== confirm) {
				setError("Hasła nie są identyczne.");
				setSubmitting(false);
				return;
			}
			const mappedRole: RoleApi = role === "consultant" ? "CONSULTANT" : "CLIENT";
			const storeSlug = search.get("store");
			const payload: RegisterRequest = {
				role: mappedRole,
				firstName,
				lastName,
				phone,
				email,
				password,
				...(mappedRole === "CLIENT" && storeSlug ? { storeSlug } : {}),
			};
			await register.mutateAsync(payload);

			window.location.href = "/login";
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Wystąpił błąd podczas rejestracji.";
			setError(message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="w-full max-w-md rounded-2xl border border-white/10 p-6 bg-background/60 backdrop-blur">
			<h1 className="text-2xl font-semibold tracking-tight text-center">Rejestracja</h1>
			<div className="mt-6">
				<p className="text-sm font-medium">Wybierz typ konta</p>
				<div className="mt-3 grid grid-cols-2 gap-3">
					<button
						type="button"
						onClick={() => setRole("consultant")}
						className={[
							"rounded-xl border px-4 py-3 text-sm font-medium transition",
							role === "consultant"
								? "border-foreground/60 bg-foreground/5"
								: "border-foreground/20 hover:bg-foreground/5",
						].join(" ")}
					>
						Jako konsultant
					</button>
					<button
						type="button"
						onClick={() => setRole("client")}
						className={[
							"rounded-xl border px-4 py-3 text-sm font-medium transition",
							role === "client"
								? "border-foreground/60 bg-foreground/5"
								: "border-foreground/20 hover:bg-foreground/5",
						].join(" ")}
					>
						Jako klient
					</button>
				</div>
				<p className="mt-2 text-xs text-foreground/60">Wybór jest wymagany, aby utworzyć konto.</p>
			</div>

			<form className="mt-6 grid gap-4" onSubmit={onSubmit}>
				<input type="hidden" name="role" value={role ?? ""} />
				<div className="grid md:grid-cols-2 gap-3">
					<div className="grid gap-2">
						<label htmlFor="firstName" className="text-sm font-medium">
							Imię
						</label>
						<input
							id="firstName"
							name="firstName"
							type="text"
							required
							className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
							placeholder="Jan"
						/>
					</div>
					<div className="grid gap-2">
						<label htmlFor="lastName" className="text-sm font-medium">
							Nazwisko
						</label>
						<input
							id="lastName"
							name="lastName"
							type="text"
							required
							className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
							placeholder="Kowalski"
						/>
					</div>
				</div>
				<div className="grid gap-2">
					<label htmlFor="phone" className="text-sm font-medium">
						Numer telefonu
					</label>
					<input
						id="phone"
						name="phone"
						type="tel"
						required
						className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
						placeholder="+48 123 456 789"
						pattern="^[+0-9][0-9\s\-()]{6,}$"
					/>
				</div>
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
				<div className="grid gap-2">
					<label htmlFor="confirm" className="text-sm font-medium">
						Powtórz hasło
					</label>
					<input
						id="confirm"
						name="confirm"
						type="password"
						required
						className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
						placeholder="********"
					/>
				</div>
				{error ? <p className="text-sm text-red-500">{error}</p> : null}
				<button
					type="submit"
					disabled={!role || submitting}
					className={[
						"mt-2 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition",
						role && !submitting
							? "bg-foreground text-background hover:opacity-90"
							: "bg-foreground/30 text-background/70 cursor-not-allowed",
					].join(" ")}
				>
					{submitting ? "Przetwarzanie..." : "Zarejestruj się"}
				</button>
			</form>
			<p className="mt-4 text-center text-sm text-foreground/70">
				Masz już konto?{" "}
				<Link href="/login" className="underline underline-offset-4">
					Zaloguj się
				</Link>
			</p>
		</div>
	);
}


