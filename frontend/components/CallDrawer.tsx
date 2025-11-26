import { useEffect, useMemo, useRef } from "react";
import { useWebRTC } from "@/entities/call/useWebRTC";
import { useCreateEvent } from "@/entities/event/useCreateEvent";
import { canonicalizeRoomCode } from "@/lib/roomCode";
import { useUploadRecording } from "@/entities/call/useUploadRecording";
import { useCurrentUser } from "@/entities/user/useCurrentUser";
import { useConsultantClients } from "@/entities/relation/useConsultantClients";
import { useMyRelations } from "@/entities/relation/useMyRelations";
import { useEvents } from "@/entities/event/useEvents";
import { useUpcomingClientEvents } from "@/entities/event/useUpcomingClientEvents";

type Props = {
  roomId: string;
  onClose: () => void;
  title?: string;
};

export function CallDrawer({ roomId, onClose, title }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const canonical = canonicalizeRoomCode(roomId);
  const me = useCurrentUser();
  const myClients = useConsultantClients();
  const myRelations = useMyRelations();
  const myCalendar = useEvents();
  const clientUpcoming = useUpcomingClientEvents();
  const decodedRelationId = useMemo(() => (Number.isFinite(canonical.relationId as any) ? Number(canonical.relationId) : null), [canonical.relationId]);
  const counterpartyDisplayName = useMemo(() => {
    // Dla konsultanta pokazujemy nazwę klienta
    if (me?.role === "CONSULTANT") {
      if (decodedRelationId && (myClients.data ?? []).length > 0) {
        const item = (myClients.data ?? []).find((c) => c.id === decodedRelationId);
        const display = [item?.client.firstName, item?.client.lastName].filter(Boolean).join(" ").trim();
        return display || item?.client.email || "";
      }
      return "";
    }
    // Dla klienta pokazujemy nazwę konsultanta (z relacji klienta)
    if (me?.role === "CLIENT") {
      const rels = myRelations.data ?? [];
      if (decodedRelationId && rels.length > 0) {
        const rel = rels.find((r) => r.id === decodedRelationId);
        const display = [rel?.consultant.firstName, rel?.consultant.lastName].filter(Boolean).join(" ").trim();
        return display || rel?.consultant.email || "";
      }
      return "";
    }
    return "";
  }, [
    me?.role,
    decodedRelationId,
    myClients.data,
    myRelations.data,
  ]);

  const skipAutoCreate = useMemo(() => {
    const now = new Date();

    if (me?.role === "CONSULTANT") {
      const list = (myCalendar.data ?? []);
      return list.some((e) => {
        const s = new Date(e.start);
        const eend = new Date(e.end ?? e.start);
        return now.getTime() >= s.getTime() && now.getTime() <= eend.getTime();
      });
    }
    if (me?.role === "CLIENT") {
      const list = (clientUpcoming.data ?? []);
      return list.some((e) => {
        const s = new Date(e.start);
        const eend = new Date(e.end ?? e.start);
        return now.getTime() >= s.getTime() && now.getTime() <= eend.getTime();
      });
    }
    return false;
  }, [me?.role, myCalendar.data, clientUpcoming.data]);
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
    roomId: canonical.roomCode,
    serverUrl: apiUrl,
  });
  const createEvent = useCreateEvent();
  const meetingStartRef = useRef<Date | null>(null);
  const recordingIdRef = useRef<number | null>(null);
  const eventIdRef = useRef<number | null>(null);
  const createdOnceRef = useRef(false);
  useEffect(() => {
    // Czekaj aż znane będą: relationId, użytkownik oraz (dla konsultanta) lista klientów
    const relationIdDecoded = canonical.relationId;
    const userKnown = me !== null;
    const clientsReady = me?.role !== "CONSULTANT" || myClients.isLoading === false;
    const eventsReady =
      me?.role === "CONSULTANT" ? myCalendar.isLoading === false : clientUpcoming.isLoading === false;
    if (createdOnceRef.current) return;
    if (!Number.isFinite(relationIdDecoded as number)) return;
    if (!userKnown || !clientsReady || !eventsReady) return;
    if (skipAutoCreate) return;

    createdOnceRef.current = true;
    meetingStartRef.current = new Date();
    (async () => {
      try {
        const start = meetingStartRef.current!;
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const created = await createEvent.mutateAsync({
          title: title || counterpartyDisplayName || "Konsultacja",
          start: start.toISOString(),
          end: end.toISOString(),
          relationId: Number(relationIdDecoded),
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
            body: JSON.stringify({
              end: end.toISOString(),
              recordingId: recordingIdRef.current ?? null,
              // Jeżeli znamy lepszy tytuł, zaktualizuj go przy zamykaniu spotkania
              ...(counterpartyDisplayName ? { title: counterpartyDisplayName } : {}),
            }),
          }).catch(() => {});
        }
      } catch {}
    };
  }, [canonical.relationId, me, myClients.isLoading, counterpartyDisplayName, title, createEvent, myCalendar.isLoading, clientUpcoming.isLoading, skipAutoCreate]);
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
    <div className="fixed inset-0 z-50 bg-slate-950 text-white">
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="h-10 w-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Zamknij"
          title="Zamknij"
        >
          ✕
        </button>
      </div>

      <div className="h-full w-full flex flex-col items-center">
        <div className="w-full flex-1 grid place-items-center p-4 sm:p-8">
          <div className="w-full max-w-6xl grid gap-4 md:grid-cols-2">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl">
              <video ref={localVideoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
              <div className="absolute left-3 bottom-3 text-xs px-2 py-1 rounded-md bg-white/10 backdrop-blur">
                {videoEnabled ? "Kamera włączona" : "Kamera wyłączona"}
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl">
              <video ref={remoteVideoRef} className="w-full h-full object-cover" playsInline autoPlay />
              {!connected && (
                <div className="absolute inset-0 grid place-items-center text-sm text-white/80">Oczekiwanie na drugą osobę…</div>
              )}
            </div>
          </div>
        </div>

        <div className="pointer-events-none relative w-full pb-8">
          <div className="pointer-events-auto mx-auto w-full max-w-3xl rounded-full bg-black/60 backdrop-blur px-4 py-3 flex items-center justify-center gap-3 shadow-2xl">
            <select
              className="hidden sm:block rounded-full bg-white/10 hover:bg-white/20 text-sm px-3 py-2 outline-none"
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

            <button
              onClick={toggleAudio}
              className={`h-11 w-11 rounded-full grid place-items-center ${audioEnabled ? "bg-white/10 hover:bg-white/20" : "bg-amber-600 hover:bg-amber-700"} transition-colors`}
              title={audioEnabled ? "Wycisz mikrofon" : "Włącz mikrofon"}
              aria-label="Przełącz mikrofon"
            >
              {audioEnabled ? "🎙️" : "🔇"}
            </button>
            <button
              onClick={toggleVideo}
              className={`h-11 w-11 rounded-full grid place-items-center ${videoEnabled ? "bg-white/10 hover:bg-white/20" : "bg-amber-600 hover:bg-amber-700"} transition-colors`}
              title={videoEnabled ? "Wyłącz kamerę" : "Włącz kamerę"}
              aria-label="Przełącz kamerę"
            >
              {videoEnabled ? "📷" : "🚫"}
            </button>
            <button
              onClick={shareScreen}
              className="h-11 w-11 rounded-full grid place-items-center bg-white/10 hover:bg-white/20 transition-colors"
              title="Udostępnij ekran"
            >
              🖥️
            </button>

            {!isRecording ? (
              <button
                onClick={startRecording}
                className="h-11 px-4 rounded-full bg-white/10 hover:bg-white/20 text-sm transition-colors"
                title="Rozpocznij nagrywanie"
              >
                Nagraj
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
                      relationId: decodedRelationId ?? undefined,
                    });
                    if (typeof id === "number") recordingIdRef.current = id;
                  } catch {}
                }}
                className="h-11 px-4 rounded-full bg-red-600 hover:bg-red-700 text-sm transition-colors"
                title="Zatrzymaj i zapisz"
              >
                Stop
              </button>
            )}

            <button
              onClick={onClose}
              className="h-11 w-11 rounded-full grid place-items-center bg-red-600 hover:bg-red-700 transition-colors ml-1"
              title="Zakończ"
              aria-label="Zakończ"
            >
              ⛔
            </button>
          </div>

          <div className="mt-3 text-center text-xs text-white/70">
            {connected ? "Połączono" : "Oczekiwanie…"} {isRecording ? `• Nagrywanie ${Math.floor(recordMs / 1000)}s` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}


