import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { EventDto } from "./useEvents";

type Payload = {
  title: string;
  start: string;
  end: string;
  relationId: number;
  source?: "MANUAL" | "AUTO";
  weekly?: boolean;
  eventGroupId?: number | null;
};

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Payload) => {
      const res = await api.post<EventDto>("/events", body);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", "my"] });
    },
  });
}


