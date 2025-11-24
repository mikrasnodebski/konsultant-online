import { useMutation } from "@tanstack/react-query";
import { api } from "../api";

export type CreatePublicLeadPayload = {
  storeSlug?: string;
  consultantEmail?: string;
};

export function useCreatePublicLead() {
  return useMutation({
    mutationFn: async (payload: CreatePublicLeadPayload) => {
      const res = await api.post<{ relation: { id: number } }>(
        "/relations/lead-public",
        payload
      );
      return res.data.relation;
    },
  });
}


