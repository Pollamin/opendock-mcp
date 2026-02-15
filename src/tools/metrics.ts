import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient, QueryParams } from "../api/client.js";
import { jsonResponse } from "./index.js";

const SIMPLE_GET_TOOLS: Array<[string, string, string]> = [
  ["get_appointment_volume_by_date", "Appointment volume by date", "/metrics/appointment-volume/date"],
  ["get_appointment_volume_by_carrier", "Appointment volume by carrier", "/metrics/appointment-volume/carrier"],
  ["get_appointment_volume_by_load_type", "Appointment volume by load type and week day", "/metrics/appointment-volume/load-type"],
  ["get_appointment_volume_by_time_of_day", "Appointment volume by time of day", "/metrics/appointment-volume/time-of-day"],
  ["get_appointment_volume_by_day_of_week", "Appointment duration average by dock and day of week", "/metrics/appointment-volume/day-of-week"],
  ["get_appointment_avg_duration_by_load_type", "Appointment duration average by load type", "/metrics/appointment-volume/average-duration-by-load-type"],
  ["get_appointment_avg_duration_by_status", "Appointment duration average by status", "/metrics/appointment-volume/status"],
  ["get_appointment_avg_duration_by_dock_and_status", "Appointment duration average by dock and status", "/metrics/appointment-volume/status-by-dock"],
  ["get_appointment_count_by_status_for_carrier", "Appointment count by status for current carrier", "/metrics/counts/appointment-count-for-carrier/status"],
  ["get_carrier_status_percentages", "Retrieve carrier insights data with each status percentage", "/metrics/carrier/status-percentages"],
];

const SIMPLE_POST_TOOLS: Array<[string, string, string]> = [
  ["get_appointment_status_times", "The average time spent in each appointment status", "/metrics/appointments/status-times"],
  ["get_first_available_appointment", "Finds the next available appointment time for each dock and loadtype, starting from the current date and time onward", "/metrics/loadtype/first-avail-appt"],
  ["get_warehouse_insights", "Retrieve warehouse insights", "/metrics/warehouse"],
  ["export_yard_data_excel", "Retrieve file link with the yard data list as XLSX. The link points to an external file.", "/metrics/yard/excel"],
];

export function registerMetricsTools(server: McpServer, api: ApiClient): void {
  for (const [name, description, path] of SIMPLE_GET_TOOLS) {
    server.registerTool(name, { description, inputSchema: {} }, async () => {
      const data = await api.request({ path });
      return jsonResponse(data);
    });
  }

  for (const [name, description, path] of SIMPLE_POST_TOOLS) {
    server.registerTool(name, { description, inputSchema: {} }, async () => {
      const data = await api.request({ method: "POST", path, body: {} });
      return jsonResponse(data);
    });
  }

  // --- Tools with unique input schemas ---

  server.registerTool(
    "get_appointment_count_for_carrier",
    {
      description: "Appointment count per carrier",
      inputSchema: {
        carrierId: z.string().describe("Carrier ID"),
      },
    },
    async ({ carrierId }) => {
      const data = await api.request({
        path: "/metrics/counts/appointment-count-for-carrier",
        query: { carrierId },
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_appointment_count_for_docks",
    {
      description: "Appointment count per dock",
      inputSchema: {
        dockIds: z.array(z.string()).describe("Dock IDs array"),
      },
    },
    async ({ dockIds }) => {
      const data = await api.request({
        path: "/metrics/counts/appointment-count-for-docks",
        query: { dockIds },
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_reserve_count_for_user",
    {
      description: "Reserve count for user",
      inputSchema: {
        userId: z.string().optional().describe("User ID"),
      },
    },
    async ({ userId }) => {
      const data = await api.request({
        path: "/metrics/counts/reserve-count-for-user",
        query: { userId } as QueryParams,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_dock_dwell_time",
    {
      description: "Retrieve dock metrics of dwell time by day of week",
      inputSchema: {
        fromDate: z.string().optional().describe("From date to filter"),
        toDate: z.string().optional().describe("To date to filter"),
        warehouseId: z.string().optional().describe("Warehouse ID to filter"),
        dockId: z.string().optional().describe("Dock ID to filter"),
      },
    },
    async (params) => {
      const data = await api.request({
        path: "/metrics/dock/dwell-time",
        query: params as QueryParams,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "list_appointment_metrics",
    {
      description: "Retrieve an appointment list that matches the criteria described in the request body",
      inputSchema: {
        dockIds: z.array(z.string()).optional().describe("Dock IDs to filter"),
        loadTypeIds: z.array(z.string()).optional().describe("Load type IDs to filter"),
        carrierIds: z.array(z.string()).optional().describe("Carrier IDs to filter"),
        tags: z.array(z.string()).optional().describe("Tags to filter"),
        dateField: z.record(z.unknown()).optional().describe("Date field filter object"),
        appointmentTypes: z.array(z.string()).optional().describe("Appointment types to filter"),
        allCarriers: z.boolean().optional().describe("Include all carriers"),
        exportFields: z.array(z.string()).optional().describe("Fields to include in export"),
        skipCustomFields: z.boolean().optional().describe("Skip custom fields"),
      },
    },
    async (params) => {
      const data = await api.request({
        method: "POST",
        path: "/metrics-v2/appointments",
        body: params,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "export_appointment_metrics_excel",
    {
      description: "Retrieve file link with the appointment list as XLSX. The link points to an external file.",
      inputSchema: {
        emailCCs: z.array(z.string()).describe("CC email addresses"),
        dockIds: z.array(z.string()).optional().describe("Dock IDs to filter"),
        loadTypeIds: z.array(z.string()).optional().describe("Load type IDs to filter"),
        carrierIds: z.array(z.string()).optional().describe("Carrier IDs to filter"),
        tags: z.array(z.string()).optional().describe("Tags to filter"),
        dateField: z.record(z.unknown()).optional().describe("Date field filter object"),
        appointmentTypes: z.array(z.string()).optional().describe("Appointment types to filter"),
        allCarriers: z.boolean().optional().describe("Include all carriers"),
        exportFields: z.array(z.string()).optional().describe("Fields to include in export"),
        skipCustomFields: z.boolean().optional().describe("Skip custom fields"),
      },
    },
    async ({ emailCCs, ...body }) => {
      const data = await api.request({
        method: "POST",
        path: "/metrics/appointments/excel",
        query: { emailCCs },
        body,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_warehouse_capacity_usage",
    {
      description: "Retrieve warehouse dock capacity usage information per warehouse",
      inputSchema: {
        dockIds: z.array(z.string()).optional().describe("Dock IDs to filter"),
      },
    },
    async (params) => {
      const data = await api.request({
        method: "POST",
        path: "/metrics/warehouse/capacity-usage",
        body: params,
      });
      return jsonResponse(data);
    }
  );
}
