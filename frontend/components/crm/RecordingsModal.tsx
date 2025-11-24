"use client";

import { useEffect, useState } from "react";
import { useRecordingsByRelation } from "@/entities/call/useRecordings";
import { useDeleteRecording } from "@/entities/call/useDeleteRecording";

export function RecordingsModal({ relationId, onClose }: { relationId: number; onClose: () => void }) {
  const { data, isLoading } = useRecordingsByRelation(relationId);
  const del = useDeleteRecording();
  const [local, setLocal] = useState<typeof data>(undefined);
  useEffect(() => setLocal(data), [data]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [previewOpen, setPreviewOpen] = useState<Record<number, boolean>>({});

  const groups = (() => {
    const g: Record<string, typeof local> = {};
    for (const rec of local ?? []) {
      const d = new Date(rec.createdAt);
      const key = d.toLocaleDateString("pl-PL", { year: "numeric", month: "2-digit", day: "2-digit" });
      (g[key] ||= []).push(rec);
    }
    return Object.entries(g).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Nagrania</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>
        <div className="p-6">
          {isLoading && <div className="text-sm text-slate-600">Ładowanie…</div>}
          {!isLoading && (!local || local.length === 0) && (
            <div className="text-sm text-slate-600">Brak nagrań.</div>
          )}
          <div className="grid gap-4">
            {groups.map(([dateKey, recs]) => (
              <div key={dateKey} className="rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setExpanded((s) => ({ ...s, [dateKey]: !s[dateKey] }))}
                  className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 text-sm"
                >
                  <span className="font-medium">{dateKey}</span>
                  <span className="text-slate-500">{expanded[dateKey] ? "▾" : "▸"}</span>
                </button>
                {expanded[dateKey] && (
                  <div className="divide-y divide-slate-100">
                    {recs!.map((r) => {
                      const created = new Date(r.createdAt);
                      const time = created.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                      const dur = ((r.durationMs ?? 0) / 1000).toFixed(0);
                      const url = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/recordings/${r.id}`;
                      const isPreview = !!previewOpen[r.id];
                      return (
                        <div key={r.id} className="px-4 py-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="text-slate-700">
                              {time} • {dur}s
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={async () => {
                                  try {
                                    await del.mutateAsync(r.id);
                                    setLocal((curr) => (curr ?? []).filter((x) => x.id !== r.id));
                                  } catch {}
                                }}
                                className="text-red-600 hover:underline"
                              >
                                Usuń
                              </button>
                              <button
                                onClick={() => setPreviewOpen((p) => ({ ...p, [r.id]: !p[r.id] }))}
                                className="text-slate-700 hover:underline"
                              >
                                {isPreview ? "Ukryj podgląd" : "Podgląd"}
                              </button>
                              <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                                Otwórz w nowej karcie
                              </a>
                            </div>
                          </div>
                          {isPreview && (
                            <div className="mt-2">
                              <video controls className="w-full rounded-md bg-black" src={url} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


