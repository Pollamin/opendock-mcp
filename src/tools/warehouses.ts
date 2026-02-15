import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api/client.js";
import { jsonResponse } from "./index.js";

export function registerWarehouseTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_warehouses",
    {
      description: "List warehouses with optional filters and pagination",
      inputSchema: {
        page: z.number().optional().describe("Page number"),
        limit: z.number().optional().describe("Items per page"),
        name: z.string().optional().describe("Filter by warehouse name"),
        city: z.string().optional().describe("Filter by city"),
        state: z.string().optional().describe("Filter by state"),
        zip: z.string().optional().describe("Filter by zip code"),
      },
    },
    async (params) => {
      const data = await api.request({
        path: "/warehouse",
        query: params as Record<string, string | number | undefined>,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_warehouse",
    {
      description: "Get details for a specific warehouse",
      inputSchema: {
        id: z.string().describe("Warehouse ID"),
      },
    },
    async ({ id }) => {
      const data = await api.request({ path: `/warehouse/${id}` });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_warehouse_hours",
    {
      description: "Get hours of operation for a warehouse's docks",
      inputSchema: {
        id: z.string().describe("Warehouse ID"),
        startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      },
    },
    async ({ id, ...body }) => {
      const data = await api.request({
        method: "POST",
        path: `/warehouse/${id}/get-hours-of-operation`,
        body: Object.keys(body).length > 0 ? body : undefined,
      });
      return jsonResponse(data);
    }
  );
}
