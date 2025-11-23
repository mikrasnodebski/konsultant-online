import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export type EventDto = {
  id: number;
  title: string;
  start: string;
  end: string;
  clientId?: number | null;
  paymentStatus: "PAID" | "UNPAID";
  source?: "MANUAL" | "AUTO";
  eventGroupId?: number | null;
};

export function useEvents() {
  return useQuery({
    queryKey: ["events", "my"],
    queryFn: async () => {
      const res = await api.get<EventDto[]>("/events/my");
      return res.data;
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });
}


