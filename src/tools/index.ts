import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "../api/client.js";
import { registerWarehouseTools } from "./warehouses.js";
import { registerDockTools } from "./docks.js";
import { registerLoadTypeTools } from "./loadtypes.js";
import { registerAppointmentTools } from "./appointments.js";
import { registerCarrierTools } from "./carriers.js";
import { registerOrgTools } from "./orgs.js";
import { registerAuditLogTools } from "./audit-log.js";

export function jsonResponse(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function textResponse(message: string) {
  return { content: [{ type: "text" as const, text: message }] };
}

export function registerAllTools(server: McpServer, api: ApiClient, version: string) {
  server.registerTool(
    "get_version",
    { description: "Get the opendock-mcp server version" },
    async () => jsonResponse({ version })
  );

  // Auth
  server.registerTool(
    "get_profile",
    { description: "Get the current authenticated user's profile" },
    async () => {
      const data = await api.request({ path: "/auth/profile" });
      return jsonResponse(data);
    }
  );

  registerWarehouseTools(server, api);
  registerDockTools(server, api);
  registerLoadTypeTools(server, api);
  registerAppointmentTools(server, api);
  registerCarrierTools(server, api);
  registerOrgTools(server, api);
  registerAuditLogTools(server, api);
}
