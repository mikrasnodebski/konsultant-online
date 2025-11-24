import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Offer } from "./types";

export function useMyOffer() {
  return useQuery({
    queryKey: ["offer", "me"],
    queryFn: async (): Promise<Offer | null> => {
      try {
        const res = await api.get<{ offer: Offer }>("/offers/me");
        return res.data.offer;
      } catch {
        return null;
      }
    },
  });
}


