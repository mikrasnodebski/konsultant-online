"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useEvents } from "@/entities/event/useEvents";
import { useConsultantLeads } from "@/entities/relation/useConsultantLeads";
import { useConsultantClients } from "@/entities/relation/useConsultantClients";
import { useMyOffer } from "@/entities/offer/useMyOffer";

const monthNames = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

export default function ConsultantStatsPage() {
  const offerQuery = useMyOffer();
  const [adSpend, setAdSpend] = React.useState<string>("0");
  const leadsQuery = useConsultantLeads();
  const clientsQuery = useConsultantClients();
  const now = new Date();
  const [from, setFrom] = React.useState<string>(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  );
  const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [analyzed, setAnalyzed] = React.useState<boolean>(false);
  const selectedStart = React.useMemo(() => new Date(from), [from]);
  const selectedEnd = React.useMemo(() => {
    const d = new Date(to);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
    return end;
  }, [to]);
  const leadsCount = React.useMemo(() => {
    const leads = (leadsQuery.data ?? []) as any[];
    return leads.reduce((acc, l) => {
      const createdAt = new Date((l as any).createdAt);
      return createdAt >= selectedStart && createdAt < selectedEnd ? acc + 1 : acc;
    }, 0);
  }, [leadsQuery.data, selectedStart, selectedEnd]);
  const clientsCount = React.useMemo(() => {
    const clients = (clientsQuery.data ?? []) as any[];
    return clients.reduce((acc, c) => {
      const createdAt = new Date((c as any).createdAt);
      return createdAt >= selectedStart && createdAt < selectedEnd ? acc + 1 : acc;
    }, 0);
  }, [clientsQuery.data, selectedStart, selectedEnd]);

  const eventsQuery = useEvents();

  const pricePerConsult = offerQuery.data?.pricePln ?? 0;
  const avgConsultsPerClient = React.useMemo(() => {
    const events = (eventsQuery.data ?? []) as any[];
    const eventsWithClient = events.filter((e) => (e as any).clientId != null);
    const uniqueClientIds = new Set<number>();
    for (const ev of eventsWithClient) {
      if ((ev as any).clientId != null) uniqueClientIds.add((ev as any).clientId as number);
    }
    const numClients = uniqueClientIds.size;
    if (numClients === 0) return 0;
    return Number((eventsWithClient.length / numClients).toFixed(2));
  }, [eventsQuery.data]);

  const revenueData = React.useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const monthOffset = 5 - i;
      const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
      return { label: monthNames[date.getMonth()], start, end };
    });
    const events = eventsQuery.data ?? [];
    const price = Number(pricePerConsult || 0);
    return buckets.map((b) => {
      let paidCount = 0;
      let unpaidCount = 0;
      for (const ev of events) {
        const d = new Date(ev.start);
        if (d >= b.start && d < b.end) {
          if (ev.paymentStatus === "PAID") paidCount += 1;
          else unpaidCount += 1;
        }
      }
      return {
        name: b.label,
        paid: paidCount * price,
        unpaid: unpaidCount * price,
      };
    });
  }, [eventsQuery.data, pricePerConsult]);

  const clvPerClientNum = React.useMemo(
    () => Number(pricePerConsult || 0) * Number(avgConsultsPerClient || 0),
    [pricePerConsult, avgConsultsPerClient]
  );
  const clv =
    Number(pricePerConsult || 0) > 0 && Number(avgConsultsPerClient) > 0
      ? (Number(pricePerConsult || 0) * Number(avgConsultsPerClient)).toFixed(2)
      : "—";

  const cac =
    clientsCount > 0 ? (Number(adSpend || 0) / Number(clientsCount)).toFixed(2) : "—";
  const cacNum = React.useMemo(() => {
    const spend = Number(adSpend || 0);
    return clientsCount > 0 ? spend / clientsCount : null;
  }, [adSpend, clientsCount]);
  const valuePerZloty = React.useMemo(() => {
    const spend = Number(adSpend || 0);
    if (spend <= 0) return null;
    const totalLifetimeValue = clvPerClientNum * clientsCount;
    return totalLifetimeValue / spend;
  }, [adSpend, clvPerClientNum, clientsCount]);
  const consultationsData = React.useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const monthOffset = 5 - i;
      const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
      return { label: monthNames[date.getMonth()], start, end };
    });

    const events = eventsQuery.data ?? [];
    return buckets.map((b) => {
      const count = events.reduce((acc, ev) => {
        const d = new Date(ev.start);
        return d >= b.start && d < b.end ? acc + 1 : acc;
        }, 0);
      return { name: b.label, value: count };
    });
  }, [eventsQuery.data]);

  return (
    <div className="bg-dots h-full max-h-screen p-6 sm:p-8 md:p-10 lg:p-12 overflow-y-auto">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-xl px-6 sm:px-8 md:px-10 lg:px-12 py-6">
          <h1 className="text-2xl font-semibold text-blue-700">Statystyki</h1>
          <p className="text-sm text-slate-500 mt-1">Podsumowanie Twojej działalności i podstawowe statystyki.</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Liczba konsultacji (miesiąc)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consultationsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Przychód (PLN)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(v: number) => `${v} PLN`} />
                    <Bar dataKey="paid" stackId="rev" fill="#1f2937" name="Opłacone" />
                    <Bar dataKey="unpaid" stackId="rev" fill="#d1d5db" name="Potencjalne" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>




          <div className="mt-6 grid grid-cols-1 gap-6">
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">CLV – wartość życiowa klienta</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-slate-600">Kwota za konsultację (PLN)</span>
                  <input
                    type="text"
                    value={String(pricePerConsult ?? "")}
                    readOnly
                    className="mt-1 w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 outline-none"
                    placeholder="Brak oferty"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-slate-600">Średnia liczba konsultacji na klienta</span>
                  <input
                    type="text"
                    value={String(avgConsultsPerClient ?? "")}
                    readOnly
                    className="mt-1 w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 outline-none"
                    placeholder="Brak danych"
                  />
                </label>
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm text-slate-600">CLV (PLN / klient)</div>
                <div className="text-2xl font-semibold text-blue-700 mt-1">{clv}</div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                CLV liczone jako kwota za konsultację × średnia liczba konsultacji na klienta.
              </p>
            </div>
          </div>




          <div className="mt-6 grid grid-cols-1 gap-6">
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">CAC – koszt pozyskania klienta</h2>
              <div className="grid gap-3 md:grid-cols-5">
                <label className="text-sm">
                  <span className="text-slate-600">Okres od</span>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-slate-600">Okres do</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                  />
                </label>
                <label className="text-sm md:col-span-2">
                  <span className="text-slate-600">Budżet kampanii (PLN)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={adSpend}
                    onChange={(e) => setAdSpend(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    placeholder="np. 1500"
                  />
                </label>
                <div className="flex items-end">
                  <button
                    onClick={() => setAnalyzed(true)}
                    className="h-10 w-full rounded-md bg-blue-600 text-white px-4 py-2 text-sm"
                  >
                    Analizuj
                  </button>
                </div>
              </div>
              {analyzed && (
                <div className="mt-4 grid gap-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="text-sm text-slate-600">Klienci w okresie</div>
                      <div className="text-lg font-medium text-slate-800 mt-1">{clientsCount}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="text-sm text-slate-600">CAC (PLN / klient)</div>
                      <div className="text-2xl font-semibold text-blue-700 mt-1">{cac}</div>
                    </div>
                  </div>



                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="text-sm text-slate-600">CLV na klienta (PLN)</div>
                      <div className="text-lg font-medium text-slate-800 mt-1">
                        {clvPerClientNum.toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="text-sm text-slate-600">CAC na klienta (PLN)</div>
                      <div className="text-lg font-medium text-slate-800 mt-1">
                        {cacNum != null ? cacNum.toFixed(2) : "—"}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="text-sm text-slate-600">1 zł z budżetu przynosi (PLN)</div>
                      <div className="text-lg font-medium text-slate-800 mt-1">
                        {valuePerZloty != null ? valuePerZloty.toFixed(2) : "—"}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    CAC liczony jako budżet kampanii / liczba klientów w wybranym okresie.
                    CLV liczone jako cena konsultacji × średnia liczba konsultacji na klienta.
                  </p>
                </div>
              )}
            </div>
          </div>


      </div>
    </div>
  );
}


