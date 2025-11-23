import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export type ConsultantClient = {
  id: number; // relation id
  createdAt: string;
  notes: string | null;
  client: { id: number; email: string; phone: string; firstName: string; lastName: string };
  nextEvent?: { id: number; start: string; end: string } | null;
};

type MyClientsResponse = { clients: ConsultantClient[] };

export function useConsultantClients() {
  return useQuery({
    queryKey: ["consultant-clients"],
    queryFn: async () => {
      const res = await api.get<MyClientsResponse>("/relations/my-clients");
      return res.data.clients;
    },
  });
}


