\"use client\";

import { useParams, useRouter } from \"next/navigation\";
import { CallDrawer } from \"@/components/CallDrawer\";
import { useState } from \"react\";

export default function CallPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const roomId = String(params?.roomId || \"\");

  if (!open) {
    if (typeof window !== \"undefined\") router.back();
    return null;
  }

  return (
    <CallDrawer
      roomId={roomId}
      onClose={() => setOpen(false)}
      title={\"Rozmowa\"}
    />
  );
}


