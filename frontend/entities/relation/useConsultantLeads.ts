import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export type ConsultantLead = {
  id: number;
  createdAt: string;
  client: { id: number; email: string; phone?: string | null; firstName: string; lastName: string } | null;
};

type MyLeadsResponse = { leads: ConsultantLead[] };

export function useConsultantLeads() {
  return useQuery({
    queryKey: ["consultant-leads"],
    queryFn: async () => {
      const res = await api.get<MyLeadsResponse>("/relations/my-leads");
      return res.data.leads;
    },
  });
}

export function useAcceptLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/relations/leads/${id}/accept`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultant-leads"] });
      qc.invalidateQueries({ queryKey: ["consultant-clients"] });
    },
  });
}

export function useRejectLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/relations/leads/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultant-leads"] });
    },
  });
}


