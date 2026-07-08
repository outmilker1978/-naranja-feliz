"use client";

import dynamic from "next/dynamic";

const ToolsPanelInner = dynamic(() => import("@/components/tools-panel"), { ssr: false });

export default function ToolsPanelWrapper() {
  return <ToolsPanelInner />;
}
