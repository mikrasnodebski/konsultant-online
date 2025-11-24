"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConsultantClients, type ConsultantClient } from "@/entities/relation/useConsultantClients";
import { useUpdateRelationNotes } from "@/entities/relation/useUpdateRelationNotes";
import { useDeleteClientRelation } from "@/entities/relation/useDeleteClientRelation";
import { RecordingsModal } from "./RecordingsModal";

export function ClientsTable() {
  const { data: clients, isLoading } = useConsultantClients();
  const [selected, setSelected] = useState<ConsultantClient | null>(null);
  const [notes, setNotes] = useState<string>("");
  const updater = useUpdateRelationNotes();
  const selectedId = selected?.id;
  const deleteRelation = useDeleteClientRelation();
  const [recFor, setRecFor] = useState<ConsultantClient | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (selected) setNotes(selected.notes ?? "");
    else setNotes("");
  }, [selected]);

  useEffect(() => {
    if (!selectedId) return;
    const handle = setTimeout(() => {
      updater.mutate({ relationId: selectedId, notes });
    }, 600);
    return () => clearTimeout(handle);
  }, [notes, selectedId, updater]);

  return (
    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
      <div className="hidden sm:grid grid-cols-[1fr_1fr_auto] gap-3 items-center bg-slate-50 text-slate-600 text-sm px-4 py-2">
        <div>Imię i nazwisko</div>
        <div>Najbliższa konsultacja</div>
        <div className="text-right">Akcje</div>
      </div>
      <ul className="divide-y divide-slate-200">
        {isLoading && <li className="px-4 py-3 text-sm">Ładowanie…</li>}
        {(clients ?? []).map((r) => {
          const fullName = [r.client.firstName, r.client.lastName].filter(Boolean).join(" ").trim();
          const initials =
            (r.client.firstName?.[0] || r.client.email?.[0] || "?").toUpperCase() +
            (r.client.lastName?.[0] || "").toUpperCase();
          return (
            <li key={r.id} className="px-4 py-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-slate-200 grid place-items-center text-slate-700 text-sm font-semibold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{fullName || r.client.email}</div>
                  </div>
                </div>
                <div className="text-sm text-slate-700">
                  {r.nextEvent ? (
                    (() => {
                      const s = new Date(r.nextEvent!.start as unknown as string);
                      const e = new Date(r.nextEvent!.end as unknown as string);
                      const dateText = s.toLocaleDateString("pl-PL", { weekday: "long", day: "2-digit", month: "long" });
                      const time = s.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
                      const timeEnd = e.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
                      return <span className="text-slate-700">{dateText} • {time}–{timeEnd}</span>;
                    })()
                  ) : (
                    <>
                      <span className="text-slate-500">Zaplanuj konsultację • </span>
                      <Link href="/panel/consultant/calendar" className="text-blue-700 hover:underline">
                        Przejdź do kalendarza
                      </Link>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => router.push(`/panel/call/${r.id}`)}
                    aria-label="Połączenie telefoniczne"
                    title="Połączenie telefoniczne"
                    className="rounded-md border border-slate-300 bg-white w-8 h-8 grid place-items-center hover:bg-slate-50"
                  >
                    ☎️
                  </button>
                  <button
                    onClick={() => setRecFor(r)}
                    aria-label="Nagrania wideo"
                    title="Nagrania wideo"
                    className="rounded-md border border-slate-300 bg-white w-8 h-8 grid place-items-center hover:bg-slate-50"
                  >
                    🎥
                  </button>
                  <button
                    aria-label="Więcej"
                    title="Więcej"
                    onClick={() => setSelected(r)}
                    className="rounded-md border border-slate-300 bg-white w-8 h-8 grid place-items-center hover:bg-slate-50"
                  >
                    ⋮
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {!isLoading && (clients?.length ?? 0) === 0 && (
          <li className="px-4 py-3 text-sm text-slate-600">Brak klientów.</li>
        )}
      </ul>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-xl border-l border-slate-200 bg-white shadow-xl overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Szczegóły klienta</h3>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <div className="p-6 grid gap-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-200 grid place-items-center text-slate-700 font-semibold">
                  {(selected.client.firstName?.[0] || selected.client.email[0]).toUpperCase()}
                </div>
                <div>
                  <div className="text-base font-medium">
                    {[selected.client.firstName, selected.client.lastName].filter(Boolean).join(" ") || selected.client.email}
                  </div>
                  <div className="text-sm text-slate-600">{selected.client.email}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700">Dane kontaktowe</h4>
                <div className="mt-2 grid sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Email</div>
                    <div className="text-sm">{selected.client.email}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Telefon</div>
                    <div className="text-sm">{selected.client.phone || "Brak"}</div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700">Notatki</h4>
                <textarea
                  className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Dodaj krótką notatkę…"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-between gap-2">
              <button
                onClick={() => {
                  if (!selectedId) return;
                  deleteRelation.mutate(selectedId, {
                    onSuccess: () => setSelected(null),
                  });
                }}
                className="rounded-md bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-60"
                disabled={!selectedId}
              >
                Usuń klienta
              </button>
              <button onClick={() => setSelected(null)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm">Zamknij</button>
            </div>
          </div>
        </div>
      )}

      {recFor && <RecordingsModal relationId={recFor.id} onClose={() => setRecFor(null)} />}
    </div>
  );
}


