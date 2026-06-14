import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.url?.endsWith('/api/mcp-server/mcp/context')) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      name: "PlannerDiRio_MCP",
      version: "1.0.0",
      description: "Servidor MCP para métricas de marketing do PlannerDiRio",
      capabilities: {
        commands: [
          {
            name: "getMetrics",
            description: "Retorna métricas de seguidores e engajamento das redes sociais",
            args: []
          }
        ]
      },
      resources: {
        metrics: "https://planner-di-rio-raquel.vercel.app/api/mcp-server/metrics"
      }
    });
  } else {
    res.status(404).json({ error: "NOT_FOUND" });
  }
}
