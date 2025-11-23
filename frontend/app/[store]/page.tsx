"use client";

import { useOffer } from "@/entities/offer/useOffer";
import { useParams } from "next/navigation";

type PublicOffer = {
  title: string;
  descriptionHtml: string;
  pricePln: number | string;
  primaryColor?: string;
  secondaryColor?: string;
};

export default function StorePublicPage() {
  const params = useParams<{ store: string }>();
  const store = (params?.store as string) ?? "";
  const { data: offer, isLoading } = useOffer(store);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <p className="text-slate-600">Ładowanie…</p>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Sklep {store}</h1>
          <p className="mt-2 text-slate-600">Brak opublikowanej oferty.</p>
        </div>
      </div>
    );
  }

  const o = offer as PublicOffer;
  const primary = o.primaryColor || "#2563eb";
  const secondary = o.secondaryColor || "#0ea5e9";

  return (
    <div
      className="min-h-screen px-6 sm:px-10 md:px-14 lg:px-20 py-12"
      style={{
        background: `
          linear-gradient(0deg, rgba(255,255,255,0.18), rgba(255,255,255,0.18)),
          radial-gradient(1200px 600px at 30% 30%, ${primary} 0%, ${primary} 60%, rgba(255,255,255,0) 70%),
          radial-gradient(1000px 500px at 80% 60%, ${secondary} 0%, ${secondary} 45%, rgba(255,255,255,0) 65%),
          linear-gradient(135deg, ${primary} 0%, ${primary} 45%, ${secondary} 55%, ${secondary} 100%)
        `,
      }}
    >
      <div className="relative overflow-hidden max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-slate-900">
        <svg className="pointer-events-none absolute -top-24 -right-24 opacity-20" width="350" height="350" viewBox="0 0 350 350" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="175" cy="175" r="175" fill={primary} />
        </svg>
        <svg className="pointer-events-none absolute -bottom-28 -left-28 opacity-10" width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="200" cy="200" r="200" fill={primary} />
        </svg>
        <svg className="pointer-events-none absolute top-32 -left-20 opacity-10" width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="100" cy="100" r="100" fill={secondary} />
        </svg>
        <div className="relative overflow-hidden rounded-xl mb-4 p-4 sm:p-6">
          <div
            className="absolute inset-0 opacity-15"
            style={{ background: secondary }}
            aria-hidden="true"
          />
          <svg
            className="pointer-events-none absolute -top-6 -right-8 opacity-50"
            width="260"
            height="160"
            viewBox="0 0 260 160"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {Array.from({ length: 4 }).map((_, row) =>
              Array.from({ length: 7 }).map((__, col) => {
                const x = 220 - col * 32;
                const y = 20 + row * 32;
                const r = 10;
                const isRing = (row + col) % 3 === 0;
                return isRing ? (
                  <circle key={`ring-${row}-${col}`} cx={x} cy={y} r={r} fill="none" stroke="white" strokeWidth="3" />
                ) : (
                  <circle key={`dot-${row}-${col}`} cx={x} cy={y} r={r} fill="white" />
                );
              }),
            )}
          </svg>
          <div className="relative flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-semibold" style={{ color: "#000" }}>{offer.title}</h1>
            </div>
            {(() => {
              const raw = (o.pricePln);
              const priceNum = typeof raw === "number" ? raw : Number(raw);
              const display = isNaN(priceNum) ? String(raw) : priceNum.toFixed(2);
              return <div className="text-2xl font-bold" style={{ color: "#000" }}>{display} PLN</div>;
            })()}
          </div>
        </div>

        <div className="prose prose-slate mt-6" dangerouslySetInnerHTML={{ __html: offer.descriptionHtml }} />

        <div className="mt-8 flex justify-center">
          <a
            href={`/register?role=CLIENT&store=${encodeURIComponent(store)}`}
            className="inline-flex items-center rounded-md text-white px-5 py-3 text-sm font-medium"
            style={{ backgroundColor: "#2563eb" }}
          >
            Wyślij zaproszenie
          </a>
        </div>
      </div>
    </div>
  );
}


