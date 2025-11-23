"use client";

import { useState } from "react";
import { ClientsTable } from "@/components/crm/ClientsTable";
import { LeadsTable } from "@/components/crm/LeadsTable";


export default function ConsultantCrmPage() {
  const [tab, setTab] = useState<"clients" | "leads">("clients");

  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-xl mt-6 mb-6 px-6 sm:px-8 md:px-10 lg:px-12 py-6 min-h-[80vh] lg:min-h-[90vh]">
      <h1 className="text-2xl font-semibold text-blue-700">CRM</h1>
      <p className="text-sm text-slate-500 mt-1">Zarządzaj swoimi klientami i leadami.</p>

      <div className="mt-6">
        <div className="flex gap-2">
        <button
          onClick={() => setTab("clients")}
          className={[
            "rounded-md px-3 py-1.5 text-sm",
            tab === "clients" ? "bg-blue-600 text-white" : "border border-slate-300 bg-white",
          ].join(" ")}
        >
          Twoi klienci
        </button>
        <button
          onClick={() => setTab("leads")}
          className={[
            "rounded-md px-3 py-1.5 text-sm",
            tab === "leads" ? "bg-blue-600 text-white" : "border border-slate-300 bg-white",
          ].join(" ")}
        >
          Leady
        </button>
        </div>

        {tab === "clients" ? <ClientsTable /> : <LeadsTable />}
      </div>
    </div>
  );
}
