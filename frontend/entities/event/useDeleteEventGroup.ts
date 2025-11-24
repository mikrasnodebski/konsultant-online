import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

type Payload = { groupId: number; scope: "ALL" | "FROM"; from?: string };

export function useDeleteEventGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, scope, from }: Payload) => {
      const res = await api.delete(`/events/group/${groupId}`, { data: { scope, from } });
      return res.data as { deletedCount: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", "my"] });
    },
  });
}


