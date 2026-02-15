import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api/client.js";
import { jsonResponse } from "./index.js";

export function registerAuditLogTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "get_audit_log",
    {
      description: "Get the audit log for an object (warehouse, dock, appointment, etc.)",
      inputSchema: {
        objectId: z.string().describe("ID of the object to get audit history for"),
      },
    },
    async ({ objectId }) => {
      const data = await api.request({ path: `/audit-log/${objectId}` });
      return jsonResponse(data);
    }
  );
}
