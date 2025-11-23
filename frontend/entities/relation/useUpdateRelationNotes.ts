import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export function useUpdateRelationNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { relationId: number; notes: string }) => {
      await api.patch(`/relations/${args.relationId}/notes`, { notes: args.notes });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultant-clients"] });
    },
  });
}


