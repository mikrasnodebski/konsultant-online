import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import SimplePeer from "simple-peer";

type UseWebRTCOptions = {
  roomId: string;
  serverUrl: string;
};

export function useWebRTC({ roomId, serverUrl }: UseWebRTCOptions) {
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<any | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const recordTimerRef = useRef<any>(null);
  const recordMsRef = useRef(0);

  useEffect(() => {
    const socket = io(serverUrl, { withCredentials: true, transports: ["websocket"] });
    socketRef.current = socket;

    let initiator = false;
    let created = false;

    async function getLocalMedia() {
      if (!localStreamRef.current) {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
        });
        setLocalStream(localStreamRef.current);
        try {
          const list = await navigator.mediaDevices.enumerateDevices();
          const cams = list.filter((d) => d.kind === "videoinput");
          setCameras(cams);
          const currentTrack = localStreamRef.current.getVideoTracks()[0];
          const deviceId = (currentTrack?.getSettings?.().deviceId || cams[0]?.deviceId) as string | undefined;
          if (deviceId && !selectedCameraId) setSelectedCameraId(deviceId);
        } catch {
        }
      }
      return localStreamRef.current;
    }

    function createPeer(init: boolean) {
      if (created) return;
      created = true;
      initiator = init;
      const peer = new SimplePeer({
        initiator: init,
        trickle: true,
        stream: localStreamRef.current || undefined,
      });
      peerRef.current = peer;

      peer.on("signal", (data: any) => {
        socket.emit("signal", { roomId, payload: data });
      });
      peer.on("connect", () => setConnected(true));
      peer.on("close", () => setConnected(false));
      peer.on("error", () => setConnected(false));
      peer.on("stream", (stream: MediaStream) => {
        setRemoteStream(stream);
      });
    }

    socket.on("connect", async () => {
      await getLocalMedia();
      socket.emit("join", { roomId });
      setTimeout(() => {
        if (!initiator && !created) createPeer(false);
      }, 500);
    });

    socket.on("room:full", () => {
      // Pokój pełny – zatrzymaj próbę tworzenia połączenia
      created = true;
      setConnected(false);
      try {
        socket.disconnect();
      } catch {}
      // Prosta komunikacja dla użytkownika
      if (typeof window !== "undefined") {
        try {
          // nie blokujemy UX jeśli alert zablokowany
          window.alert?.("Pokój jest pełny. Maksymalnie 2 uczestników.");
        } catch {}
      }
    });

    socket.on("peer:joined", () => {
      if (!peerRef.current) {
        createPeer(true);
      }
    });

    socket.on("signal", async (payload: any) => {
      const peer = peerRef.current;
      if (!peer) return;
      peer.signal(payload);
    });

    return () => {
      if (peerRef.current) peerRef.current.destroy();
      if (socketRef.current) socketRef.current.emit("leave", { roomId });
      socketRef.current?.disconnect();
      setConnected(false);
      setRemoteStream(null);
    };
  }, [roomId, serverUrl]);

  async function shareScreen() {
    const display = await (navigator.mediaDevices as any).getDisplayMedia({
      video: true,
      audio: true,
    });
    const videoTrack = display.getVideoTracks()[0];
    const sender = peerRef.current
      ?.streams?.[0]
      ?.getVideoTracks?.()
      ?.length
      ? peerRef.current
          ?.streams?.[0]
          ?.getVideoTracks?.()
          ?.map((track: MediaStreamTrack) =>
            peerRef.current
              ?.['_pc'] // simple-peer private RTCPeerConnection
              ?.getSenders()
              ?.find((s: RTCRtpSender) => s.track === track),
          )[0]
      : null;

    const rtpSender =
      peerRef.current && "streams" in peerRef.current
        ? (peerRef.current as any)?._pc?.getSenders?.().find((s: RTCRtpSender) => s.track?.kind === "video")
        : null;

    if (rtpSender) {
      rtpSender.replaceTrack(videoTrack);
    }
    display.getVideoTracks()[0].addEventListener("ended", () => {
      if (localStreamRef.current) {
        const camTrack = localStreamRef.current.getVideoTracks()[0];
        if (camTrack) rtpSender?.replaceTrack(camTrack);
      }
    });
  }

  function setTrackEnabled(kind: "audio" | "video", enabled: boolean) {
    const ls = localStreamRef.current;
    if (ls) {
      const tracks = kind === "audio" ? ls.getAudioTracks() : ls.getVideoTracks();
      tracks.forEach((t) => (t.enabled = enabled));
    }
    const sender =
      (peerRef.current as any)?._pc?.getSenders?.().find(
        (s: RTCRtpSender) => s.track && s.track.kind === kind,
      ) || null;
    if (sender?.track) sender.track.enabled = enabled;
  }

  function toggleAudio() {
    const next = !audioEnabled;
    setAudioEnabled(next);
    setTrackEnabled("audio", next);
  }

  function toggleVideo() {
    const next = !videoEnabled;
    setVideoEnabled(next);
    setTrackEnabled("video", next);
  }

  async function refreshCameras() {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setCameras(list.filter((d) => d.kind === "videoinput"));
    } catch {
    }
  }

  async function switchCamera(deviceId: string) {
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false,
    });
    const newTrack = newStream.getVideoTracks()[0];
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0] as MediaStreamTrack);
      localStreamRef.current.addTrack(newTrack);
      setLocalStream(localStreamRef.current);
    }
    const sender = (peerRef.current as any)?._pc
      ?.getSenders?.()
      ?.find((s: RTCRtpSender) => s.track && s.track.kind === "video");
    await sender?.replaceTrack?.(newTrack);
    setSelectedCameraId(deviceId);
  }

  function buildRecordStream(): MediaStream | null {
    const tracks: MediaStreamTrack[] = [];
    if (localStreamRef.current) {
      tracks.push(...localStreamRef.current.getAudioTracks(), ...localStreamRef.current.getVideoTracks());
    }
    if (remoteStream) {
      tracks.push(...remoteStream.getAudioTracks(), ...remoteStream.getVideoTracks());
    }
    if (tracks.length === 0) return null;
    return new MediaStream(tracks);
  }

  function startRecording() {
    if (isRecording) return;
    const stream = buildRecordStream();
    if (!stream) return;
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9,opus",
    });
    recorderRef.current = recorder;
    recordedChunksRef.current = [];
    recorder.ondataavailable = (ev: BlobEvent) => {
      if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
    };
    recorder.onstop = () => {
      clearInterval(recordTimerRef.current);
    };
    recorder.start(1000);
    setIsRecording(true);
    setRecordMs(0);
    recordMsRef.current = 0;
    recordTimerRef.current = setInterval(() => {
      recordMsRef.current += 1000;
      setRecordMs(recordMsRef.current);
    }, 1000);
  }

  function stopRecording(): Promise<{ blob: Blob; durationMs: number } | null> {
    if (!isRecording) return Promise.resolve(null);
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) return resolve(null);
      recorder.onstop = () => {
        clearInterval(recordTimerRef.current);
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const dur = recordMsRef.current;
        setIsRecording(false);
        setRecordMs(0);
        recordMsRef.current = 0;
        recorderRef.current = null;
        resolve({ blob, durationMs: dur });
      };
      try {
        if (recorder.state !== "inactive") {
          recorder.requestData();
          recorder.stop();
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    });
  }

  return {
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
  };
}


