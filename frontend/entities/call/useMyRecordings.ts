import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export type ClientRecordingItem = {
  id: number;
  mimeType: string;
  durationMs: number;
  createdAt: string;
  consultant: { id: number; email: string; phone?: string | null; firstName: string; lastName: string } | null;
};

export function useMyRecordings() {
  return useQuery({
    queryKey: ["recordings", "my-client"],
    queryFn: async (): Promise<ClientRecordingItem[]> => {
      const res = await api.get<ClientRecordingItem[]>("/recordings/my-client");
      return res.data;
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}


