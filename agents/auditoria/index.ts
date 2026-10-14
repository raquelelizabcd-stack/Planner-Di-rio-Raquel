import { createClient } from "@supabase/supabase-js";

export class AgenteAuditoria {
  private supabase;
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
  }
  async logAction(agentName: string, action: string, details: object) {
    try {
      await this.supabase.from("audit_logs").insert({
        agent_name: agentName,
        action,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("AgenteAuditoria: logAction falhou ou offline", e);
    }
  }
}
