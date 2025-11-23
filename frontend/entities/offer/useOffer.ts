import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Offer } from "./types";

export function useOffer(storeSlug: string | null | undefined) {
  return useQuery({
    queryKey: ["offer", storeSlug],
    enabled: !!storeSlug,
    queryFn: async (): Promise<Offer | null> => {
      try {
        const res = await api.get<{ offer: Offer }>(`/offers/${storeSlug}`);
        return res.data.offer;
      } catch {
        return null;
      }
    },
  });
}


