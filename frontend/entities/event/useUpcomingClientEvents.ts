import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export type UpcomingClientEvent = {
  id: number;
  title: string;
  start: string;
  end: string;
  relationId: number;
  consultant: { id: number; email: string; phone: string | null; firstName: string; lastName: string };
};

export function useUpcomingClientEvents(limit = 5) {
  return useQuery({
    queryKey: ["events", "client-upcoming", limit],
    queryFn: async (): Promise<UpcomingClientEvent[]> => {
      const res = await api.get<UpcomingClientEvent[]>("/events/my-upcoming-client");
      return res.data.slice(0, limit);
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}


