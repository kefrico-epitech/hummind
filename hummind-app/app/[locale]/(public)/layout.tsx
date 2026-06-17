import type { ReactNode } from "react";
import { SupportChatWidget } from "../../../src/components/landing/SupportChatWidget";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SupportChatWidget />
    </>
  );
}
