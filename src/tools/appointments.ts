import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api/client.js";
import { jsonResponse } from "./index.js";

export function registerAppointmentTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_appointments",
    {
      description: "List appointments with optional filters and pagination",
      inputSchema: {
        page: z.number().optional().describe("Page number"),
        limit: z.number().optional().describe("Items per page"),
        warehouseId: z.string().optional().describe("Filter by warehouse ID"),
        dockId: z.string().optional().describe("Filter by dock ID"),
        status: z.string().optional().describe("Filter by status"),
        startDate: z.string().optional().describe("Filter by start date (YYYY-MM-DD)"),
        endDate: z.string().optional().describe("Filter by end date (YYYY-MM-DD)"),
      },
    },
    async (params) => {
      const data = await api.request({
        path: "/appointment",
        query: params as Record<string, string | number | undefined>,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "search_appointments",
    {
      description: "Advanced search for appointments by carrier, reference number, status, or date range",
      inputSchema: {
        carrierId: z.string().optional().describe("Filter by carrier ID"),
        referenceNumber: z.string().optional().describe("Search by reference number"),
        status: z.string().optional().describe("Filter by status"),
        startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
        warehouseId: z.string().optional().describe("Filter by warehouse ID"),
        page: z.number().optional().describe("Page number"),
        limit: z.number().optional().describe("Items per page"),
      },
    },
    async (params) => {
      const data = await api.request({
        method: "POST",
        path: "/search/appointments",
        body: params,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_appointment",
    {
      description: "Get details for a specific appointment",
      inputSchema: {
        id: z.string().describe("Appointment ID"),
      },
    },
    async ({ id }) => {
      const data = await api.request({ path: `/appointment/${id}` });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "create_appointment",
    {
      description: "Schedule a new appointment",
      inputSchema: {
        warehouseId: z.string().describe("Warehouse ID"),
        dockId: z.string().describe("Dock ID"),
        loadTypeId: z.string().describe("Load type ID"),
        startTime: z.string().describe("Start time (ISO 8601 datetime)"),
        endTime: z.string().describe("End time (ISO 8601 datetime)"),
        carrierId: z.string().optional().describe("Carrier ID"),
        referenceNumber: z.string().optional().describe("Reference number"),
        notes: z.string().optional().describe("Appointment notes"),
      },
    },
    async (params) => {
      const data = await api.request({
        method: "POST",
        path: "/appointment",
        body: params,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "update_appointment",
    {
      description: "Modify or reschedule an existing appointment",
      inputSchema: {
        id: z.string().describe("Appointment ID"),
        startTime: z.string().optional().describe("New start time (ISO 8601 datetime)"),
        endTime: z.string().optional().describe("New end time (ISO 8601 datetime)"),
        dockId: z.string().optional().describe("New dock ID"),
        loadTypeId: z.string().optional().describe("New load type ID"),
        carrierId: z.string().optional().describe("New carrier ID"),
        referenceNumber: z.string().optional().describe("New reference number"),
        notes: z.string().optional().describe("Updated notes"),
        status: z.string().optional().describe("New status"),
      },
    },
    async ({ id, ...body }) => {
      const data = await api.request({
        method: "PATCH",
        path: `/appointment/${id}`,
        body,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "delete_appointment",
    {
      description: "Cancel/delete an appointment",
      inputSchema: {
        id: z.string().describe("Appointment ID"),
      },
    },
    async ({ id }) => {
      await api.request({
        method: "DELETE",
        path: `/appointment/${id}`,
      });
      return { content: [{ type: "text" as const, text: `Appointment ${id} deleted successfully.` }] };
    }
  );
}
