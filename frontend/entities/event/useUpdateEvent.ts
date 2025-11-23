import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { EventDto } from "./useEvents";

export type UpdateEventPayload = {
  id: number;
  start?: string;
  end: string;
  title?: string;
};

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation<EventDto, Error, UpdateEventPayload>({
    mutationFn: async (payload) => {
      const res = await api.patch<EventDto>(`/events/${payload.id}`, {
        start: payload.start,
        end: payload.end,
        title: payload.title,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}


