import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/entities/api";

type Payload = {
  groupId: number;
  fromOldStart: string;
  start: string;
  end: string;
};

export function useUpdateEventGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Payload) => {
      const { groupId, ...body } = payload;
      const res = await api.patch(`/events/group/${groupId}`, body, { withCredentials: true });
      return res.data as { updated: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
