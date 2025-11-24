"use client";

import { useConsultantLeads, useAcceptLead, useRejectLead } from "@/entities/relation/useConsultantLeads";

export function LeadsTable() {
  const { data: leads, isLoading } = useConsultantLeads();
  const accept = useAcceptLead();
  const rejectM = useRejectLead();

  return (
    <div className="mt-4 overflow-x-auto border border-slate-200 rounded-xl">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="text-left px-4 py-2">Imię i nazwisko</th>
            <th className="text-left px-4 py-2">Email</th>
            <th className="text-left px-4 py-2">Telefon</th>
            <th className="px-4 py-2 w-40" />
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td className="px-4 py-3" colSpan={4}>Ładowanie…</td>
            </tr>
          )}
          {(leads ?? []).map((r) => {
            const name = [r.client?.firstName, r.client?.lastName].filter(Boolean).join(" ").trim();
            const email = r.client?.email ?? "— (oczekuje na rejestrację)";
            const phone = r.client?.phone ?? "—";
            const canAccept = Boolean(r.client?.id);
            return (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{name || email}</td>
                <td className="px-4 py-2">{email}</td>
                <td className="px-4 py-2">{phone}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-3 justify-end">
                    <button
                      disabled={!canAccept}
                      onClick={() => accept.mutate(r.id)}
                      className="text-blue-700 hover:underline disabled:text-slate-400 disabled:no-underline"
                    >
                      Akceptuj
                    </button>
                    <button
                      disabled={false}
                      onClick={() => rejectM.mutate(r.id)}
                      className="text-slate-600 hover:underline disabled:text-slate-400 disabled:no-underline"
                    >
                      Odrzuć
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!isLoading && (leads?.length ?? 0) === 0 && (
            <tr>
              <td className="px-4 py-3 text-slate-600" colSpan={3}>Brak leadów.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


