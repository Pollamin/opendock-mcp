import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient, QueryParams } from "../api/client.js";
import { jsonResponse, textResponse } from "./index.js";

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
        query: params as QueryParams,
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

  server.registerTool(
    "create_warehouse",
    {
      description: "Create a new warehouse (billable event — implies additional subscription costs)",
      inputSchema: {
        name: z.string().describe("Warehouse name"),
        facilityNumber: z.string().optional().describe("Facility number"),
        country: z.string().optional().describe("Country"),
        timezone: z.string().optional().describe("Timezone (e.g. 'America/New_York')"),
        phone: z.string().optional().describe("Phone number"),
        email: z.string().optional().describe("Contact email"),
        notes: z.string().optional().describe("Warehouse notes"),
        instructions: z.string().optional().describe("Warehouse instructions"),
        allowCarrierScheduling: z.boolean().optional().describe("Allow carriers to self-schedule"),
        ccEmails: z.array(z.string()).optional().describe("CC email addresses"),
        amenities: z.array(z.enum([
          "Lumper services", "Drivers restroom", "Overnight parking", "Free Wi-Fi",
        ])).optional().describe("Available amenities"),
        ppeRequirements: z.array(z.enum([
          "Face Mask", "Safety Glasses", "Hard Hat", "Safety Boots", "Gloves",
          "High Visibility Vest", "Long Pants", "Long Sleeves", "No Smoking", "Hair and Beard Net",
        ])).optional().describe("Required PPE"),
      },
    },
    async (params) => {
      const data = await api.request({
        method: "POST",
        path: "/warehouse",
        body: params,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "update_warehouse",
    {
      description: "Update a warehouse",
      inputSchema: {
        id: z.string().describe("Warehouse ID"),
        name: z.string().optional().describe("Warehouse name"),
        facilityNumber: z.string().optional().describe("Facility number"),
        street: z.string().optional().describe("Street address"),
        city: z.string().optional().describe("City"),
        state: z.string().optional().describe("State"),
        zip: z.string().optional().describe("Zip code"),
        country: z.string().optional().describe("Country"),
        timezone: z.string().optional().describe("Timezone"),
        phone: z.string().optional().describe("Phone number"),
        email: z.string().optional().describe("Contact email"),
        notes: z.string().optional().describe("Warehouse notes"),
        instructions: z.string().optional().describe("Warehouse instructions"),
        allowCarrierScheduling: z.boolean().optional().describe("Allow carriers to self-schedule"),
        ccEmails: z.array(z.string()).optional().describe("CC email addresses"),
        amenities: z.array(z.enum([
          "Lumper services", "Drivers restroom", "Overnight parking", "Free Wi-Fi",
        ])).optional().describe("Available amenities"),
        ppeRequirements: z.array(z.enum([
          "Face Mask", "Safety Glasses", "Hard Hat", "Safety Boots", "Gloves",
          "High Visibility Vest", "Long Pants", "Long Sleeves", "No Smoking", "Hair and Beard Net",
        ])).optional().describe("Required PPE"),
      },
    },
    async ({ id, ...body }) => {
      const data = await api.request({
        method: "PATCH",
        path: `/warehouse/${id}`,
        body,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "delete_warehouse",
    {
      description: "Delete a warehouse",
      inputSchema: {
        id: z.string().describe("Warehouse ID"),
      },
    },
    async ({ id }) => {
      await api.request({
        method: "DELETE",
        path: `/warehouse/${id}`,
      });
      return textResponse(`Warehouse ${id} deleted successfully.`);
    }
  );
}
