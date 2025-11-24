import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export function useUpdateEventPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "PAID" | "UNPAID" }) => {
      const res = await api.patch<{ id: number; paymentStatus: "PAID" | "UNPAID" }>(`/events/${id}/payment`, {
        status,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", "my"] });
    },
  });
}


