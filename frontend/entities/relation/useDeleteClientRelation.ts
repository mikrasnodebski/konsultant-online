import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export function useDeleteClientRelation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (relationId: number) => {
      await api.delete(`/relations/clients/${relationId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultant-clients"] });
    },
  });
}


