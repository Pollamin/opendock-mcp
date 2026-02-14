import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "../api/client.js";
import { registerWarehouseTools } from "./warehouses.js";
import { registerDockTools } from "./docks.js";
import { registerLoadTypeTools } from "./loadtypes.js";
import { registerAppointmentTools } from "./appointments.js";
import { registerCarrierTools } from "./carriers.js";

export function registerAllTools(server: McpServer, api: ApiClient) {
  // Auth
  server.tool(
    "get_profile",
    "Get the current authenticated user's profile",
    {},
    async () => {
      const data = await api.request({ path: "/auth/profile" });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  registerWarehouseTools(server, api);
  registerDockTools(server, api);
  registerLoadTypeTools(server, api);
  registerAppointmentTools(server, api);
  registerCarrierTools(server, api);
}
