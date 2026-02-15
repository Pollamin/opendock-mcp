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
      description: `List and search appointments using NestJSX/Crud query syntax. Supports advanced filtering, field selection, joins, and sorting.

SEARCH (s=): JSON search with operators. When s= is provided, startDate/endDate/status/warehouseId/dockId convenience filters are ignored.
  Operators: $eq, $ne, $gt, $lt, $gte, $lte, $cont, $contL (case-insensitive contains), $starts, $ends, $in, $notin, $between, $isnull, $notnull
  Combinators: $and, $or
  Examples:
    Scheduled after a date: s='{"$and":[{"status":"Scheduled"},{"start":{"$gt":"2026-03-15T08:00:00.000-07:00"}}]}'
    Changed since a date: s='{"lastChangedDateTime":{"$gt":"2026-03-15T08:00:00.000Z"}}'
    Soft-deleted since a date: s='{"$and":[{"lastChangedDateTime":{"$gt":"2026-07-07T00:00:00.000Z"}},{"isActive":false}]}'
    Has tag "Late": s='{"tags":{"$contL":"Late"}}'
    Empty tags: s='{"tags":{"$or":{"$isnull":true,"$eq":"{}"}}}'

JOIN: Fetch related data in a single request. Each join is a separate array element.
  Examples:
    Get carrier info: join=["user","user.company"]
    Carrier email + company name only: join=["user||email,companyId","user.company||name"]

FIELDS: Comma-separated list of fields to return.
  Example: fields="refNumber,start,lastChangedDateTime,status"

SORT: Each sort is "field,direction". Use array for multi-sort.
  Examples: sort=["start,ASC"] or sort=["start,DESC","status,ASC"]`,
      inputSchema: {
        page: z.number().optional().describe("Page number"),
        limit: z.number().optional().describe("Items per page"),
        offset: z.number().optional().describe("Number of records to skip"),
        warehouseId: z.string().optional().describe("Filter by warehouse ID (convenience; ignored if s= is set)"),
        dockId: z.string().optional().describe("Filter by dock ID (convenience; ignored if s= is set)"),
        status: z.string().optional().describe("Filter by status (convenience; ignored if s= is set)"),
        startDate: z.string().optional().describe("Appointments starting on or after this date, YYYY-MM-DD (convenience; ignored if s= is set)"),
        endDate: z.string().optional().describe("Appointments starting on or before this date, YYYY-MM-DD (convenience; ignored if s= is set)"),
        s: z.string().optional().describe("NestJSX/Crud search JSON — see description for operators and examples"),
        fields: z.string().optional().describe("Comma-separated fields to return (e.g. 'refNumber,start,status')"),
        join: z.array(z.string()).optional().describe("Relations to join, each as 'relation' or 'relation||field1,field2' (e.g. ['user||email,companyId','user.company||name'])"),
        sort: z.array(z.string()).optional().describe("Sort directives, each as 'field,ASC' or 'field,DESC' (e.g. ['start,ASC'])"),
        cache: z.number().optional().describe("Set to 0 to bypass cache"),
      },
    },
    async (params) => {
      const { startDate, endDate, s, join, sort, ...rest } = params;
      const query: QueryParams = { ...rest };
      // Raw s= takes precedence; otherwise build from convenience filters
      query.s = s ?? buildDateSearch(startDate, endDate);
      if (join) query.join = join;
      if (sort) query.sort = sort;
      const data = await api.request({ path: "/appointment", query });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "search_appointments",
    {
      description: `Free-text search for appointments. Use this when searching by keyword across appointment fields. For structured filtering/querying, use list_appointments instead.`,
      inputSchema: {
        searchStr: z.string().optional().describe("Free-text search string (searches across appointment fields)"),
        scheduledStart: z.string().optional().describe("Start of date range for appointment start time (ISO 8601 datetime)"),
        scheduledEnd: z.string().optional().describe("End of date range for appointment start time (ISO 8601 datetime)"),
        statuses: z.array(z.string()).optional().describe("Filter by statuses (e.g. ['Scheduled','InProgress'])"),
        users: z.array(z.string()).optional().describe("Filter by user/carrier IDs"),
        refNumber: z.string().optional().describe("Filter by reference number"),
        tags: z.string().optional().describe("Filter by tag"),
        notes: z.string().optional().describe("Filter by notes content"),
        customFields: z.string().optional().describe("Filter by custom fields"),
        sortBy: z.string().optional().describe("Sort field (default: 'appointment.start')"),
        sortDesc: z.boolean().optional().describe("Sort descending (default: false)"),
        size: z.number().optional().describe("Page size (default: 10)"),
        from: z.number().optional().describe("Offset to start from (default: 0)"),
      },
    },
    async ({ sortBy, sortDesc, size, from, ...rest }) => {
      const body = {
        ...rest,
        sort: { sortBy: sortBy ?? "appointment.start", sortDesc: sortDesc ?? false },
        pagination: { size: size ?? 10, from: from ?? 0 },
      };
      const data = await api.request({
        method: "POST",
        path: "/search/appointments",
        body,
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
