"use client";

import { useCurrentUser } from "@/entities/user/useCurrentUser";
import { useCreateLead } from "@/entities/relation/useCreateLead";
import { useConsultants } from "@/entities/relation/useConsultants";
import { useUpcomingClientEvents } from "@/entities/event/useUpcomingClientEvents";
import { useMyRecordings } from "@/entities/call/useMyRecordings";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { encodeRoomId } from "@/lib/roomCode";

export function ClientPanel() {
	const user = useCurrentUser();
	const router = useRouter();
	const [showInvite, setShowInvite] = useState(false);
	const [consultantEmail, setConsultantEmail] = useState("");
	const createLead = useCreateLead();
	const { current: clients, pending: sentInvites } = useConsultants();
	const upcoming = useUpcomingClientEvents(1);
	const myRecordings = useMyRecordings();
	const [previewId, setPreviewId] = useState<number | null>(null);

	// Debug: loguj stan nagrań i ewentualne błędy
	useEffect(() => {
		console.log("[ClientPanel] recordings loading:", myRecordings.isLoading);
		console.log("[ClientPanel] recordings count:", (myRecordings.data ?? []).length);
		if (myRecordings.data) {
			console.log("[ClientPanel] recordings sample:", myRecordings.data.slice(0, 3));
		}
	}, [myRecordings.isLoading, myRecordings.data]);

	useEffect(() => {
		if ((myRecordings as any).isError) {
			console.error("[ClientPanel] recordings error:", (myRecordings as any).error);
		}
	}, [(myRecordings as any).isError, (myRecordings as any).error]);

	// Debug: loguj URL podglądu, kiedy użytkownik wybierze nagranie
	useEffect(() => {
		if (previewId) {
			const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/recordings/${previewId}`;
			console.log("[ClientPanel] preview url:", url);
		}
	}, [previewId]);

	const userEmail = useMemo(() => user?.email ?? "...", [user?.email]);

	function openInvite() {
		setShowInvite(true);
	}

	async function submitInvite(e: React.FormEvent) {
		e.preventDefault();
		if (!consultantEmail.trim()) return;
		try {
			await createLead.mutateAsync({
				consultantEmail: consultantEmail.trim(),
				clientId: user?.id as number,
			});
			setShowInvite(false);
			setConsultantEmail("");
		} catch {
		}
	}

	return (
		<div className="h-screen w-screen overflow-hidden bg-white text-slate-900">
			<main className="bg-dots h-full max-h-screen overflow-y-auto p-6 sm:p-8 md:p-10">
				<div className="mx-auto max-w-6xl">
					<header className="mb-6">
						<h1 className="text-2xl font-semibold tracking-tight">Panel klienta</h1>
						<p className="text-sm text-slate-600 mt-1">Zalogowano jako {userEmail}</p>
					</header>

					<div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
						<div className="space-y-6">
							<div className="rounded-2xl border border-slate-200 bg-white shadow-md">
								<div className="p-5 border-b border-slate-100">
									<h2 className="text-base font-semibold tracking-tight">Najbliższe konsultacje</h2>
								</div>
								<div className="p-5 text-sm">
									{upcoming.isLoading && <p className="text-slate-600">Ładowanie…</p>}
									{!upcoming.isLoading && (upcoming.data ?? []).length === 0 && <p className="text-slate-600">Brak zaplanowanych konsultacji.</p>}
									{!upcoming.isLoading && (upcoming.data ?? []).length === 1 && (() => {
										const e = upcoming.data![0];
										const s = new Date(e.start);
										const eEnd = new Date(e.end);
										const now = new Date();
										const date = s.toLocaleDateString("pl-PL", { weekday: "long", day: "2-digit", month: "long" });
										const time = s.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
										const timeEnd = eEnd.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
										const name = [e.consultant.firstName, e.consultant.lastName].filter(Boolean).join(" ").trim() || e.consultant.email;
										const inProgress = now >= s && now < eEnd;
										return (
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">{date} • {time}–{timeEnd}</p>
													<p className="text-slate-600">{name}</p>
													{inProgress && <p className="text-xs text-emerald-700 mt-1">Trwa teraz</p>}
												</div>
												{inProgress ? (
													<button
														onClick={() => router.push(`/call/${encodeRoomId(e.relationId)}`)}
														className="rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-blue-700"
													>
														Dołącz do rozmowy
													</button>
												) : (
													<a href={`mailto:${e.consultant.email}`} className="text-blue-700 hover:underline">
														Napisz
													</a>
												)}
											</div>
										);
									})()}
								</div>
							</div>

							<div className="rounded-2xl border border-slate-200 bg-white shadow-md">
								<div className="p-5 flex items-center justify-between gap-3 border-b border-slate-100">
									<h2 className="text-base font-semibold tracking-tight">Moi konsultanci</h2>
									<button
										onClick={openInvite}
										className="whitespace-nowrap rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-blue-700"
									>
										Wyślij zaproszenie
									</button>
								</div>
								<ul className="p-5 divide-y divide-slate-100">
									{clients.map((r) => {
										const name = [r.consultant.firstName, r.consultant.lastName].filter(Boolean).join(" ").trim();
										return (
											<li key={`client-${r.relationId}`} className="py-3">
												<div>
													<p className="font-medium">{name || r.consultant.email}</p>
													<p className="text-sm text-slate-600">{r.consultant.phone ? r.consultant.phone : "Brak numeru telefonu"}</p>
												</div>
											</li>
										);
									})}
									{sentInvites.map((r) => {
										const name = [r.consultant.firstName, r.consultant.lastName].filter(Boolean).join(" ").trim();
										return (
											<li key={`invite-${r.relationId}`} className="py-3 flex items-center justify-between">
												<div>
													<p className="font-medium">{name || r.consultant.email}</p>
													<p className="text-sm text-slate-600">{r.consultant.phone || r.consultant.email}</p>
												</div>
												<span className="text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded px-2 py-1">
													Zaproszenie wysłane
												</span>
											</li>
										);
									})}
									{clients.length + sentInvites.length === 0 && (
										<li key="no-consultants" className="py-4 text-sm text-slate-600">Brak przypisanych konsultantów.</li>
									)}
								</ul>
							</div>
							
						</div>

						<div className="rounded-2xl border border-slate-200 bg-white shadow-md min-h-[520px]">
							<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
								<h2 className="text-lg font-semibold tracking-tight">Moje nagrania</h2>
							</div>
							<ul className="divide-y divide-slate-100">
								{myRecordings.isLoading && <li key="loading-recs" className="px-6 py-4 text-sm">Ładowanie…</li>}
								{!myRecordings.isLoading && (myRecordings.data ?? []).length === 0 && (
									<li key="empty-recs" className="px-6 py-4 text-sm text-slate-600">Brak nagrań.</li>
								)}
								{(myRecordings.data ?? []).map((r) => {
									const d = new Date(r.createdAt);
									const when = d.toLocaleString("pl-PL", {
										year: "numeric",
										month: "2-digit",
										day: "2-digit",
										hour: "2-digit",
										minute: "2-digit",
									});
									const name = [r.consultant?.firstName, r.consultant?.lastName].filter(Boolean).join(" ").trim() || r.consultant?.email || "Konsultant";
									const mins = Math.max(1, Math.round((r.durationMs ?? 0) / 60000));
									return (
										<li key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
											<div className="min-w-0">
												<p className="font-medium truncate">{name}</p>
												<p className="text-sm text-slate-600">{when} • ok. {mins} min</p>
											</div>
											<div className="flex items-center gap-2 shrink-0">
												<button
													onClick={() => setPreviewId(r.id)}
													className="rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700"
												>
													Odtwórz
												</button>
												<a
													href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/recordings/${r.id}`}
													target="_blank"
													rel="noreferrer"
													className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
												>
													Pobierz
												</a>
											</div>
										</li>
									);
								})}
							</ul>
						</div>
					</div>

					{showInvite && (
						<div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
							<div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
								<div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
									<h3 className="text-base font-semibold">Wyślij zaproszenie</h3>
									<button onClick={() => setShowInvite(false)} className="text-slate-500 hover:text-slate-700">✕</button>
								</div>
								<form onSubmit={submitInvite} className="p-5 grid gap-4">
									<div className="grid gap-1.5">
										<label className="text-sm font-medium text-slate-700">E-mail konsultanta</label>
										<input
											type="email"
											value={consultantEmail}
											onChange={(e) => setConsultantEmail(e.target.value)}
											required
											className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
											placeholder="konsultant@example.com"
										/>
									</div>
									<div className="flex items-center justify-end gap-2">
										<button type="button" onClick={() => setShowInvite(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm">
											Anuluj
										</button>
										<button
											type="submit"
											disabled={false}
											className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
										>
											Wyślij
										</button>
									</div>
								</form>
							</div>
						</div>
					)}

					{previewId && (
						<div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
							<div className="w-full max-w-3xl bg-black rounded-xl overflow-hidden shadow-2xl">
								<div className="flex items-center justify-between px-4 py-3 bg-slate-900">
									<h3 className="text-white text-sm">Podgląd nagrania</h3>
									<button onClick={() => setPreviewId(null)} className="text-slate-300 hover:text-white">✕</button>
								</div>
								<div className="bg-black">
									<video
										controls
										className="w-full h-[60vh] bg-black"
										src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/recordings/${previewId}`}
									/>
								</div>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
