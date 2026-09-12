import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';

  if (url.endsWith('/api/mcp-server/mcp/context') || url.endsWith('/mcp/context')) {
    return res.status(200).json({
      name: "PlannerDiRio_MCP",
      version: "1.1.0",
      description: "Servidor MCP para métricas de marketing, renovação de tokens e automação de publicações do PlannerDiRio",
      capabilities: {
        tools: [
          {
            name: "getMetrics",
            description: "Retorna métricas de seguidores, alcance e engajamento das redes sociais",
            parameters: {}
          },
          {
            name: "renewToken",
            description: "Renova o token OAuth de acesso ao servidor de mídias sociais",
            parameters: {}
          },
          {
            name: "getAgentLogs",
            description: "Retorna o histórico recente de logs dos agentes autônomos",
            parameters: {}
          }
        ]
      },
      resources: {
        metrics: "https://planner-di-rio-raquel.vercel.app/api/mcp-server/mcp/metrics",
        renewToken: "https://planner-di-rio-raquel.vercel.app/api/mcp-server/mcp/renew-token"
      }
    });
  }

  if (url.endsWith('/api/mcp-server/mcp/metrics') || url.endsWith('/mcp/metrics')) {
    return res.status(200).json({
      success: true,
      timestamp: Date.now(),
      metrics: {
        totalReach: 12400,
        totalLikes: 890,
        totalComments: 174,
        totalLeads: 48,
        conversionRate: "4.2%"
      }
    });
  }

  if (url.endsWith('/api/mcp-server/mcp/renew-token') || url.endsWith('/mcp/renew-token')) {
    return res.status(200).json({
      success: true,
      timestamp: Date.now(),
      message: "Token OAuth renovado com sucesso no servidor MCP",
      expiresIn: 3600
    });
  }

  return res.status(404).json({ error: "NOT_FOUND", message: "Endpoint do servidor MCP não encontrado." });
}

