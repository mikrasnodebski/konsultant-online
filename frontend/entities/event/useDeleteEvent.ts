import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete<{ id: number; deleted: true }>(`/events/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", "my"] });
    },
  });
}


