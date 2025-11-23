import { useEffect, useRef } from "react";
import { useWebRTC } from "@/entities/call/useWebRTC";
import { useCreateEvent } from "@/entities/event/useCreateEvent";
import { useUploadRecording } from "@/entities/call/useUploadRecording";

type Props = {
  roomId: string;
  onClose: () => void;
  title?: string;
};

export function CallDrawer({ roomId, onClose, title }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const {
    localStreamRef,
    localStream,
    remoteStream,
    connected,
    shareScreen,
    audioEnabled,
    videoEnabled,
    toggleAudio,
    toggleVideo,
    cameras,
    selectedCameraId,
    switchCamera,
    refreshCameras,
    isRecording,
    recordMs,
    startRecording,
    stopRecording,
  } = useWebRTC({
    roomId,
    serverUrl: apiUrl,
  });
  const createEvent = useCreateEvent();
  const meetingStartRef = useRef<Date | null>(null);
  const recordingIdRef = useRef<number | null>(null);
  const eventIdRef = useRef<number | null>(null);
  useEffect(() => {
    meetingStartRef.current = new Date();
    (async () => {
      try {
        const start = meetingStartRef.current!;
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const relationId = Number(roomId);
        if (!Number.isFinite(relationId)) return;
        const created = await createEvent.mutateAsync({
          title: title || "Rozmowa",
          start: start.toISOString(),
          end: end.toISOString(),
          relationId,
          source: "AUTO",
        });
        if (created?.id) eventIdRef.current = Number(created.id);
      } catch {}
    })();
    return () => {
      try {
        const start = meetingStartRef.current;
        if (!start) return;
        const end = new Date();
        const durationMs = end.getTime() - start.getTime();
        if (durationMs < 10 * 1000) return;
        const id = eventIdRef.current;
        if (id) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/events/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ end: end.toISOString(), recordingId: recordingIdRef.current ?? null }),
          }).catch(() => {});
        }
      } catch {
      }
    };
  }, []);
  const uploader = useUploadRecording();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = localVideoRef.current;
    if (v && (localStreamRef.current || localStream)) {
      v.srcObject = localStreamRef.current || localStream || null;
      v.muted = true;
      v.play().catch(() => {});
    }
  }, [localStream, localStreamRef]);

  useEffect(() => {
    const v = remoteVideoRef.current;
    if (v && remoteStream) {
      v.srcObject = remoteStream;
      v.play().catch(() => {});
    }
  }, [remoteStream]);

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="h-full w-full flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Połączenie wideo</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>
        <div className="flex-1 p-6 grid gap-4 place-items-center">
          <div className="w-full max-w-6xl grid md:grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video">
              <video ref={localVideoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video">
              <video ref={remoteVideoRef} className="w-full h-full object-cover" playsInline autoPlay />
            </div>
          </div>
          <div className="w-full max-w-6xl flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Status: <span className={connected ? "text-green-600" : "text-slate-500"}>{connected ? "Połączono" : "Oczekiwanie..."}</span>
              {isRecording ? (
                <span className="ml-4 text-red-600">Nagrywanie • {(recordMs / 1000).toFixed(0)}s</span>
              ) : null}
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm"
                  value={selectedCameraId || ""}
                  onChange={(e) => switchCamera(e.target.value)}
                  onClick={refreshCameras}
                  title="Wybierz kamerę"
                >
                  {(cameras.length ? cameras : [{ deviceId: "", label: "Kamera" }]).map((c: { deviceId?: string; label?: string }) => (
                    <option key={c.deviceId || "none"} value={c.deviceId || ""}>
                      {c.label || `Kamera (${c.deviceId?.slice(-4)})`}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={toggleAudio}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                aria-label="Przełącz mikrofon"
                title="Przełącz mikrofon"
              >
                {audioEnabled ? "Wycisz mikrofon" : "Włącz mikrofon"}
              </button>
              <button
                onClick={toggleVideo}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                aria-label="Przełącz kamerę"
                title="Przełącz kamerę"
              >
                {videoEnabled ? "Wyłącz kamerę" : "Włącz kamerę"}
              </button>
              <button onClick={shareScreen} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50">
                Udostępnij ekran
              </button>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                  title="Rozpocznij nagrywanie"
                >
                  Rozpocznij nagrywanie
                </button>
              ) : (
                <button
                  onClick={async () => {
                    const result = await stopRecording();
                    if (!result || !result.blob || result.blob.size === 0) return;
                    try {
                      const id = await uploader.mutateAsync({
                        blob: result.blob,
                        durationMs: result.durationMs,
                        mimeType: result.blob.type,
                        relationId: Number.isFinite(Number(roomId)) ? Number(roomId) : undefined,
                      });
                      if (typeof id === "number") recordingIdRef.current = id;
                    } catch {
                    }
                  }}
                  className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
                  title="Zatrzymaj i zapisz"
                >
                  Zatrzymaj i zapisz
                </button>
              )}
              <button onClick={onClose} className="rounded-md bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700">
                Zakończ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


