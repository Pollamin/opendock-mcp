import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api/client.js";
import { jsonResponse } from "./index.js";

export function registerCarrierTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_carriers",
    "List carriers with optional filters",
    {
      page: z.number().optional().describe("Page number"),
      limit: z.number().optional().describe("Items per page"),
      name: z.string().optional().describe("Filter by carrier name"),
    },
    async (params) => {
      const data = await api.request({
        path: "/carrier",
        query: params as Record<string, string | number | undefined>,
      });
      return jsonResponse(data);
    }
  );

  server.tool(
    "get_carrier",
    "Get details for a specific carrier",
    {
      id: z.string().describe("Carrier ID"),
    },
    async ({ id }) => {
      const data = await api.request({ path: `/carrier/${id}` });
      return jsonResponse(data);
    }
  );
}
