"use client";

function toBase64Url(input: string): string {
  if (typeof btoa !== "undefined") {
    const b64 = btoa(input);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  // Fallback for non-browser (shouldn't be needed in our usage)
  const b64 = Buffer.from(input, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const full = b64 + pad;
  if (typeof atob !== "undefined") {
    return atob(full);
  }
  return Buffer.from(full, "base64").toString("utf8");
}

export function encodeRoomId(id: number | string): string {
  const raw = String(id);
  return toBase64Url(raw);
}

export function decodeRoomId(code: string): number | null {
  try {
    const raw = fromBase64Url(code);
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function canonicalizeRoomCode(input: string): { roomCode: string; relationId: number | null } {
  // If it's already base64url and decodes to a number, keep encoded canonical
  const decoded = decodeRoomId(input);
  if (decoded !== null) {
    return { roomCode: encodeRoomId(decoded), relationId: decoded };
  }
  // If it's a plain numeric string, encode it
  if (/^\d+$/.test(input)) {
    const n = Number(input);
    return { roomCode: encodeRoomId(n), relationId: n };
  }
  // Unknown format – return as-is without numeric relationId
  return { roomCode: input, relationId: null };
}


