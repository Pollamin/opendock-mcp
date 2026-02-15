import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient, QueryParams } from "../api/client.js";
import { jsonResponse } from "./index.js";

export function registerCarrierTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_carriers",
    {
      description: "List carriers with optional filters",
      inputSchema: {
        page: z.number().optional().describe("Page number"),
        limit: z.number().optional().describe("Items per page"),
        name: z.string().optional().describe("Filter by carrier name"),
      },
    },
    async (params) => {
      const data = await api.request({
        path: "/carrier",
        query: params as QueryParams,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_carrier",
    {
      description: "Get details for a specific carrier",
      inputSchema: {
        id: z.string().describe("Carrier ID"),
      },
    },
    async ({ id }) => {
      const data = await api.request({ path: `/carrier/${id}` });
      return jsonResponse(data);
    }
  );
}
