import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient, QueryParams } from "../api/client.js";
import { jsonResponse, textResponse } from "./index.js";

const directionEnum = z.enum(["Inbound", "Outbound", "Inbound/Outbound"]);
const operationSchema = z.enum(["Live", "Drop", "Other"]).optional().describe("Operation type");
const equipmentTypeSchema = z.enum(["Dry Van", "Flatbed", "Reefer", "Other"]).optional().describe("Equipment type");
const transportationModeSchema = z.enum(["FTL", "PTL", "Other"]).optional().describe("Transportation mode");

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

  server.registerTool(
    "create_load_type",
    {
      description: "Create a new load type",
      inputSchema: {
        warehouseId: z.string().optional().describe("Warehouse ID"),
        orgId: z.string().optional().describe("Organization ID"),
        name: z.string().optional().describe("Load type name"),
        direction: directionEnum.describe("Load direction"),
        operation: operationSchema,
        equipmentType: equipmentTypeSchema,
        transportationMode: transportationModeSchema,
        allowCarrierScheduling: z.boolean().optional().describe("Allow carriers to self-schedule"),
        duration_min: z.number().optional().describe("Duration in minutes"),
        description: z.string().optional().describe("Load type description"),
      },
    },
    async (params) => {
      const data = await api.request({
        method: "POST",
        path: "/loadtype",
        body: params,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "update_load_type",
    {
      description: "Update a load type",
      inputSchema: {
        id: z.string().describe("Load type ID"),
        name: z.string().optional().describe("Load type name"),
        direction: directionEnum.optional().describe("Load direction"),
        operation: operationSchema,
        equipmentType: equipmentTypeSchema,
        transportationMode: transportationModeSchema,
        allowCarrierScheduling: z.boolean().optional().describe("Allow carriers to self-schedule"),
        duration_min: z.number().optional().describe("Duration in minutes"),
        description: z.string().optional().describe("Load type description"),
      },
    },
    async ({ id, ...body }) => {
      const data = await api.request({
        method: "PATCH",
        path: `/loadtype/${id}`,
        body,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "delete_load_type",
    {
      description: "Delete a load type",
      inputSchema: {
        id: z.string().describe("Load type ID"),
      },
    },
    async ({ id }) => {
      await api.request({
        method: "DELETE",
        path: `/loadtype/${id}`,
      });
      return textResponse(`Load type ${id} deleted successfully.`);
    }
  );
}
