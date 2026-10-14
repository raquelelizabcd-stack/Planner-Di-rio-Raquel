import React from 'react';
import EscritorioVirtualAgentes from "@/components/EscritorioVirtualAgentes";
import AgentesTab from "./AgentesTab";

export default function AgentesIAPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      <AgentesTab />
    </div>
  );
}

export { EscritorioVirtualAgentes };
