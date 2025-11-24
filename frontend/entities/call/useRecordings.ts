import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export type RecordingListItem = {
  id: number;
  mimeType: string;
  durationMs: number;
  createdAt: string;
};

export function useRecordingsByRelation(relationId: number | null | undefined) {
  return useQuery({
    queryKey: ["recordings", { relationId }],
    enabled: Boolean(relationId),
    queryFn: async () => {
      const res = await api.get<RecordingListItem[]>("/recordings", {
        params: { relationId },
      });
      return res.data;
    },
  });
}


