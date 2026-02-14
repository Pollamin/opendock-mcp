import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api/client.js";

export function registerDockTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_docks",
    "List docks with optional filters",
    {
      warehouseId: z.string().optional().describe("Filter by warehouse ID"),
      page: z.number().optional().describe("Page number"),
      limit: z.number().optional().describe("Items per page"),
    },
    async (params) => {
      const data = await api.request({
        path: "/dock",
        query: params as Record<string, string | number | undefined>,
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_dock",
    "Get details for a specific dock",
    {
      id: z.string().describe("Dock ID"),
    },
    async ({ id }) => {
      const data = await api.request({ path: `/dock/${id}` });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
