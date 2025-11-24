import { useMutation } from "@tanstack/react-query";
import { api } from "../api";

export type CreateLeadPayload = {
  storeSlug?: string;
  consultantEmail?: string;
  clientId: number;
};

export function useCreateLead() {
  return useMutation({
    mutationFn: async (payload: CreateLeadPayload) => {
      const res = await api.post<{ relation: { id: number } }>("/relations/lead", payload);
      return res.data.relation;
    },
  });
}


