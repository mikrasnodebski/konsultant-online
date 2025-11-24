import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Offer } from "./types";

export type SaveOfferPayload = {
  storeSlug: string;
  title: string;
  descriptionHtml: string;
  pricePln: number;
  primaryColor?: string | null;
  secondaryColor?: string | null;
};

export function useSaveOffer() {
  const qc = useQueryClient();
  return useMutation<Offer, Error, SaveOfferPayload>({
    mutationFn: async (payload) => {
      const res = await api.post<{ offer: Offer }>("/offers", payload);
      return res.data.offer;
    },
    onSuccess: (offer) => {
      qc.invalidateQueries({ queryKey: ["offer", offer.storeSlug] });
      qc.invalidateQueries({ queryKey: ["offer", "me"] });
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        const el = document.createElement("div");
        el.setAttribute(
          "class",
          "fixed bottom-6 right-6 z-1000 rounded-lg border border-green-200 bg-white px-4 py-3 shadow-lg"
        );
        el.innerHTML = `<p class="text-sm font-medium" style="color:#16a34a">Oferta została zapisana.</p>`;
        document.body.appendChild(el);
        window.setTimeout(() => {
          el.remove();
        }, 3000);
      }
    },
    onError: (err) => {
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        const el = document.createElement("div");
        el.setAttribute(
          "class",
          "fixed bottom-6 right-6 z-1000 rounded-lg border border-red-200 bg-white px-4 py-3 shadow-lg"
        );
        const msg = err instanceof Error ? err.message : "Nie udało się zapisać oferty.";
        el.innerHTML = `<p class="text-sm font-medium" style="color:#dc2626">${msg}</p>`;
        document.body.appendChild(el);
        window.setTimeout(() => {
          el.remove();
        }, 3500);
      }
    },
  });
}


