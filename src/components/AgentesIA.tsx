import React from 'react';
import EscritorioVirtualAgentes from "@/components/EscritorioVirtualAgentes";
import AgentesTab from "./AgentesTab";

interface AgentesIAProps {
  accentColor?: string;
  borderRadius?: number;
}

export default function AgentesIA({ accentColor = '#6a5acd', borderRadius = 24 }: AgentesIAProps) {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Componente Principal da Aba de Agentes */}
      <AgentesTab accentColor={accentColor} borderRadius={borderRadius} />
    </div>
  );
}

export { EscritorioVirtualAgentes };
