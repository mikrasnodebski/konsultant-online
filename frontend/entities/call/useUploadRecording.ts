import { useMutation } from "@tanstack/react-query";
import { api } from "../api";

type Payload = {
  blob: Blob;
  relationId?: number;
  durationMs: number;
  mimeType?: string;
};

export function useUploadRecording() {
  return useMutation({
    mutationFn: async ({ blob, relationId, durationMs, mimeType }: Payload) => {
      const form = new FormData();
      form.append("recording", blob, "recording.webm");
      if (relationId !== undefined) form.append("relationId", String(relationId));
      form.append("durationMs", String(durationMs));
      form.append("mimeType", mimeType || blob.type || "video/webm");
      const res = await api.post<{ id: number }>("/recordings", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.id;
    },
  });
}


