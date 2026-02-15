import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient, QueryParams } from "../api/client.js";
import { jsonResponse, textResponse } from "./index.js";

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

  server.registerTool(
    "create_dock",
    {
      description: "Create a new dock",
      inputSchema: {
        warehouseId: z.string().describe("Warehouse ID to create the dock in"),
        name: z.string().optional().describe("Dock name"),
        doorNumber: z.string().optional().describe("Door number"),
        instructions: z.string().optional().describe("Dock instructions"),
        allowCarrierScheduling: z.boolean().optional().describe("Allow carriers to self-schedule"),
        allowOverBooking: z.boolean().optional().describe("Allow overbooking"),
        minCarrierLeadTime_hr: z.number().optional().describe("Minimum carrier lead time in hours"),
        maxCarrierLeadTime_hr: z.number().optional().describe("Maximum carrier lead time in hours"),
        ccEmails: z.array(z.string()).optional().describe("CC email addresses"),
        loadTypeIds: z.array(z.string()).optional().describe("Load type IDs to assign to this dock"),
      },
    },
    async ({ warehouseId, loadTypeIds, ...body }) => {
      const data = await api.request({
        method: "POST",
        path: "/dock",
        body: { ...body, warehouseId, loadTypeIds },
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "update_dock",
    {
      description: "Update a dock",
      inputSchema: {
        id: z.string().describe("Dock ID"),
        name: z.string().optional().describe("Dock name"),
        doorNumber: z.string().optional().describe("Door number"),
        instructions: z.string().optional().describe("Dock instructions"),
        allowCarrierScheduling: z.boolean().optional().describe("Allow carriers to self-schedule"),
        allowOverBooking: z.boolean().optional().describe("Allow overbooking"),
        minCarrierLeadTime_hr: z.number().optional().describe("Minimum carrier lead time in hours"),
        maxCarrierLeadTime_hr: z.number().optional().describe("Maximum carrier lead time in hours"),
        ccEmails: z.array(z.string()).optional().describe("CC email addresses"),
        loadTypeIds: z.array(z.string()).optional().describe("Load type IDs assigned to this dock"),
      },
    },
    async ({ id, ...body }) => {
      const data = await api.request({
        method: "PATCH",
        path: `/dock/${id}`,
        body,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "delete_dock",
    {
      description: "Delete a dock",
      inputSchema: {
        id: z.string().describe("Dock ID"),
        hardDelete: z.boolean().optional().describe("Permanently delete instead of soft delete"),
      },
    },
    async ({ id, ...body }) => {
      await api.request({
        method: "DELETE",
        path: `/dock/${id}`,
        body: Object.keys(body).length > 0 ? body : undefined,
      });
      return textResponse(`Dock ${id} deleted successfully.`);
    }
  );

  server.registerTool(
    "sort_docks",
    {
      description: "Save dock sort order",
      inputSchema: {
        docks: z.array(z.object({
          id: z.string().describe("Dock ID"),
          sortOrder: z.number().describe("Sort position"),
        })).describe("Array of dock IDs with their sort positions"),
      },
    },
    async ({ docks }) => {
      const data = await api.request({
        method: "POST",
        path: "/dock/sort",
        body: docks,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_dock_availability",
    {
      description: "Get availability for a specific dock",
      inputSchema: {
        id: z.string().describe("Dock ID"),
        startDate: z.string().describe("Start date (ISO 8601 datetime)"),
        endDate: z.string().describe("End date (ISO 8601 datetime)"),
      },
    },
    async ({ id, startDate, endDate }) => {
      const data = await api.request({
        method: "POST",
        path: `/dock/${id}/get-availability`,
        body: { start: startDate, end: endDate },
      });
      return jsonResponse(data);
    }
  );
}
