import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient, QueryParams } from "../api/client.js";
import { jsonResponse } from "./index.js";

export function registerDockTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_docks",
    {
      description: "List docks with optional filters",
      inputSchema: {
        warehouseId: z.string().optional().describe("Filter by warehouse ID"),
        page: z.number().optional().describe("Page number"),
        limit: z.number().optional().describe("Items per page"),
      },
    },
    async (params) => {
      const data = await api.request({
        path: "/dock",
        query: params as QueryParams,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_dock",
    {
      description: "Get details for a specific dock",
      inputSchema: {
        id: z.string().describe("Dock ID"),
      },
    },
    async ({ id }) => {
      const data = await api.request({ path: `/dock/${id}` });
      return jsonResponse(data);
    }
  );
}
