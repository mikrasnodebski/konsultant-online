"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/entities/user/useCurrentUser";

const navItems = [
	{ key: "shop", label: "Moja oferta", href: "/panel/consultant" },
	{ key: "crm", label: "CRM", href: "/panel/consultant/crm" },
	{ key: "stats", label: "Statystyki", href: "/panel/consultant/stats" },
	{ key: "calendar", label: "Kalendarz", href: "/panel/consultant/calendar" },
];

export function ConsultantSidebar() {
	const user = useCurrentUser();
	const pathname = usePathname();

	const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
	const displayName = fullName || (user?.email ? user.email.split("@")[0] : "").trim() || "Użytkownik";
	const initial = (user?.email?.[0] || "U").toUpperCase();

	function logout() {
		try {
			document.cookie = "auth_token=; Max-Age=0; path=/";
			// Usuń nagłówek Authorization dla przyszłych żądań
			try {
				delete (api.defaults.headers.common as any)["Authorization"];
			} catch {}
		} catch {}
		window.location.href = "/login";
	}

	return (
		<aside className="h-full w-[240px] bg-blue-600 text-white flex flex-col">
			<div className="px-4 py-4">
				<div className="font-semibold tracking-tight">Konsultant Online</div>
			</div>
			<nav className="mt-2 flex-1">
				<ul className="space-y-1 px-2">
					{navItems.map((item) => {
						const isActive =
							item.href === "/panel/consultant"
								? pathname === item.href
								: pathname?.startsWith(item.href);
						return (
							<li key={item.key}>
								<Link
									href={item.href}
									className={[
										"flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
										isActive ? "bg-white text-blue-700 shadow-sm" : "hover:bg-blue-500/30",
									].join(" ")}
								>
									<span className="text-sm">{item.label}</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>

			<div className="mt-auto px-3 py-4 border-t border-white/20">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						<div className="h-10 w-10 rounded-full bg-orange-500 grid place-items-center text-white font-semibold">
							{initial}
						</div>
						<div className="min-w-0">
							<div className="text-sm font-medium wrap-break-word">{displayName || "Użytkownik"}</div>
							<div className="text-[11px] opacity-90 truncate">{user?.email ?? "—"}</div>
						</div>
					</div>
					<button
						onClick={logout}
						title="Wyloguj"
						aria-label="Wyloguj"
						className="h-9 w-9 grid place-items-center rounded-md hover:bg-white/10"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
							<path d="M13 3a1 1 0 1 0 0 2h4v14h-4a1 1 0 1 0 0 2h5a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-5z" />
							<path d="M10.293 7.293a1 1 0 0 1 1.414 1.414L9.414 11H17a1 1 0 1 1 0 2H9.414l2.293 2.293a1 1 0 0 1-1.414 1.414l-4-4a1 1 0 0 1 0-1.414l4-4z" />
						</svg>
					</button>
				</div>
			</div>
		</aside>
	);
}


