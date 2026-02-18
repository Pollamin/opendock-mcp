import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    "book-appointment",
    {
      description: "Guide for booking a new appointment at a warehouse. Walks through selecting a dock, load type, and available time slot.",
      argsSchema: {
        warehouseId: z.string().describe("Warehouse ID to book at"),
        date: z.string().optional().describe("Preferred date (YYYY-MM-DD). Finds next available if not provided."),
      },
    },
    ({ warehouseId, date }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `I need to book an appointment at warehouse ${warehouseId}${date ? ` for ${date}` : ""}.

Please help me:
1. Use list_docks to find available docks for warehouse ${warehouseId}
2. Use list_load_types to find the applicable load types for this warehouse
3. Use find_and_book_appointment (or get_first_available_appointment + create_appointment) to find and book an open slot
4. Confirm the booked appointment details when done

Start by listing the docks and load types for this warehouse.`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "daily-schedule",
    {
      description: "Fetch and summarize all appointments at a warehouse for a specific day.",
      argsSchema: {
        warehouseId: z.string().describe("Warehouse ID"),
        date: z.string().describe("Date to check (YYYY-MM-DD)"),
      },
    },
    ({ warehouseId, date }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Show me the appointment schedule for warehouse ${warehouseId} on ${date}.

Use list_appointments with warehouseId="${warehouseId}", startDate="${date}", endDate="${date}", and join=["user||email,companyId","user.company||name"] to include carrier details.

Summarize the schedule grouped by dock, showing start/end times, carrier, load type, and status for each appointment.`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "reschedule-appointment",
    {
      description: "Guide for rescheduling an existing appointment to a new time slot.",
      argsSchema: {
        appointmentId: z.string().describe("ID of the appointment to reschedule"),
      },
    },
    ({ appointmentId }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `I need to reschedule appointment ${appointmentId}.

Please:
1. Use get_appointment to fetch the current appointment details (dock, load type, current time)
2. Use get_dock_availability or get_load_type_availability to find alternative open slots
3. Present the available options to me
4. Use update_appointment to apply the change once I confirm the new time

Start by fetching the current appointment details.`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "carrier-performance",
    {
      description: "Analyze carrier performance metrics including appointment volumes, on-time rates, and status breakdowns.",
      argsSchema: {},
    },
    () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Give me an overview of carrier performance.

Use these tools to build a complete picture:
1. get_appointment_volume_by_carrier — appointment counts per carrier
2. get_carrier_status_percentages — status breakdown (on-time, late, etc.) per carrier
3. get_appointment_avg_duration_by_status — average dwell times by status

Summarize the top performers and flag any carriers with concerning patterns (high late rates, long dwell times, etc.).`,
          },
        },
      ],
    })
  );
}
