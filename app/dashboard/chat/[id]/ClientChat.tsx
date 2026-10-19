"use client";

import ConsultChatPanel from "@/components/ConsultChatPanel";

export default function ClientChat({ id, open, names }: { id: string; open: boolean; names: { client: string; dietitian: string } }) {
  return (
    <ConsultChatPanel threadId={id} loadUrl={`/api/app/consult-chat/${id}`} me="client" canSend={open} names={names}
      closedText="This chat has closed. Book a new consultation to continue with your dietitian."
      send={(b) => fetch(`/api/app/consult-chat/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json().then((d) => ({ ok: r.ok, ...d })))} />
  );
}
