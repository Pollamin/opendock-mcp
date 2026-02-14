import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api/client.js";

export function registerLoadTypeTools(server: McpServer, api: ApiClient) {
  server.tool(
    "list_load_types",
    "List load types with optional filters",
    {
      warehouseId: z.string().optional().describe("Filter by warehouse ID"),
      page: z.number().optional().describe("Page number"),
      limit: z.number().optional().describe("Items per page"),
    },
    async (params) => {
      const data = await api.request({
        path: "/loadtype",
        query: params as Record<string, string | number | undefined>,
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_load_type",
    "Get details for a specific load type",
    {
      id: z.string().describe("Load type ID"),
    },
    async ({ id }) => {
      const data = await api.request({ path: `/loadtype/${id}` });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_load_type_availability",
    "Get available appointment slots for a load type",
    {
      id: z.string().describe("Load type ID"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
    },
    async ({ id, startDate, endDate }) => {
      const data = await api.request({
        method: "POST",
        path: `/loadtype/${id}/get-availability`,
        body: { startDate, endDate },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
