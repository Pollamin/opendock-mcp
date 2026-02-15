import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient, QueryParams } from "../api/client.js";
import { jsonResponse, textResponse } from "./index.js";

/**
 * Build a NestJSX/Crud `s=` search JSON string from startDate/endDate.
 * Filters on the appointment `start` field.
 */
function buildDateSearch(startDate?: string, endDate?: string): string | undefined {
  if (!startDate && !endDate) return undefined;
  const conditions: object[] = [];
  if (startDate) conditions.push({ start: { $gte: `${startDate}T00:00:00.000Z` } });
  if (endDate) conditions.push({ start: { $lte: `${endDate}T23:59:59.999Z` } });
  return JSON.stringify(conditions.length === 1 ? conditions[0] : { $and: conditions });
}

export function registerAppointmentTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_appointments",
    {
      description: "List appointments with optional filters and pagination. Uses NestJSX/Crud search syntax.",
      inputSchema: {
        page: z.number().optional().describe("Page number"),
        limit: z.number().optional().describe("Items per page"),
        warehouseId: z.string().optional().describe("Filter by warehouse ID"),
        dockId: z.string().optional().describe("Filter by dock ID"),
        status: z.string().optional().describe("Filter by status"),
        startDate: z.string().optional().describe("Filter appointments starting on or after this date (YYYY-MM-DD)"),
        endDate: z.string().optional().describe("Filter appointments starting on or before this date (YYYY-MM-DD)"),
        s: z.string().optional().describe("Raw NestJSX/Crud search JSON (e.g. '{\"status\":\"Scheduled\",\"start\":{\"$gte\":\"2026-01-01T00:00:00.000Z\"}}')"),
      },
    },
    async (params) => {
      const { startDate, endDate, s, ...rest } = params;
      const query: QueryParams = { ...rest };
      // Raw s= takes precedence; otherwise build from startDate/endDate
      query.s = s ?? buildDateSearch(startDate, endDate);
      const data = await api.request({ path: "/appointment", query });
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
      return textResponse(`Appointment ${id} deleted successfully.`);
    }
  );

  server.registerTool(
    "get_public_appointment",
    {
      description: "Get public appointment details (no auth required)",
      inputSchema: {
        id: z.string().describe("Appointment ID"),
      },
    },
    async ({ id }) => {
      const data = await api.request({ path: `/appointment/public/${id}` });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "undo_appointment_status",
    {
      description: "Undo the latest status change for an appointment",
      inputSchema: {
        id: z.string().describe("Appointment ID"),
      },
    },
    async ({ id }) => {
      await api.request({
        method: "PATCH",
        path: `/appointment/${id}/undo-latest-status`,
      });
      return textResponse(`Undid latest status change for appointment ${id}.`);
    }
  );

  server.registerTool(
    "create_recurring_appointments",
    {
      description: "Create a recurring appointment series from an existing appointment",
      inputSchema: {
        id: z.string().describe("Original appointment ID"),
        numWeeks: z.number().describe("Number of weeks to repeat pattern"),
        weekDays: z.array(z.enum(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]))
          .describe("Days of the week to create appointments"),
        copyFields: z.array(z.enum(["refNumber", "customFields", "notes", "tags"]))
          .describe("Fields to copy from the original appointment to the series"),
      },
    },
    async ({ id, ...body }) => {
      const data = await api.request({
        method: "POST",
        path: `/appointment/${id}/recurring`,
        body,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "delete_recurring_appointments",
    {
      description: "Delete all recurring appointments in a series (excludes the original)",
      inputSchema: {
        id: z.string().describe("Original appointment ID"),
      },
    },
    async ({ id }) => {
      await api.request({
        method: "DELETE",
        path: `/appointment/${id}/recurring`,
      });
      return textResponse(`Deleted recurring series for appointment ${id}.`);
    }
  );

  server.registerTool(
    "add_appointment_tag",
    {
      description: "Add a tag to an appointment",
      inputSchema: {
        id: z.string().describe("Appointment ID"),
        tag: z.string().describe("Tag to add (e.g. 'Damaged')"),
      },
    },
    async ({ id, tag }) => {
      const data = await api.request({
        method: "POST",
        path: `/appointment/${id}/tag`,
        body: { tag },
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "remove_appointment_tag",
    {
      description: "Remove a tag from an appointment",
      inputSchema: {
        id: z.string().describe("Appointment ID"),
        tag: z.string().describe("Tag to remove"),
      },
    },
    async ({ id, tag }) => {
      await api.request({
        method: "DELETE",
        path: `/appointment/${id}/tag`,
        body: { tag },
      });
      return textResponse(`Removed tag '${tag}' from appointment ${id}.`);
    }
  );
}
