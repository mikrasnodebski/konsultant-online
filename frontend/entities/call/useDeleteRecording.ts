import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export function useDeleteRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete<{ ok: true }>(`/recordings/${id}`);
      return res.data;
    },
    onSuccess: () => {
      // odśwież listy nagrań
      qc.invalidateQueries({ queryKey: ["recordings"] as any });
    },
  });
}


