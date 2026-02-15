import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient, QueryParams } from "../api/client.js";
import { jsonResponse } from "./index.js";

export function registerLoadTypeTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_load_types",
    {
      description: "List load types with optional filters",
      inputSchema: {
        warehouseId: z.string().optional().describe("Filter by warehouse ID"),
        page: z.number().optional().describe("Page number"),
        limit: z.number().optional().describe("Items per page"),
      },
    },
    async (params) => {
      const data = await api.request({
        path: "/loadtype",
        query: params as QueryParams,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_load_type",
    {
      description: "Get details for a specific load type",
      inputSchema: {
        id: z.string().describe("Load type ID"),
      },
    },
    async ({ id }) => {
      const data = await api.request({ path: `/loadtype/${id}` });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_load_type_availability",
    {
      description: "Get available appointment slots for a load type",
      inputSchema: {
        id: z.string().describe("Load type ID"),
        startDate: z.string().describe("Start date (YYYY-MM-DD)"),
        endDate: z.string().describe("End date (YYYY-MM-DD)"),
      },
    },
    async ({ id, startDate, endDate }) => {
      const data = await api.request({
        method: "POST",
        path: `/loadtype/${id}/get-availability`,
        body: { startDate, endDate },
      });
      return jsonResponse(data);
    }
  );
}
