import { describe, it, expect, beforeEach } from "vitest";
import { registerPrompts } from "./prompts.js";
import { mockServer } from "./test-utils.js";

describe("prompts", () => {
  let server: ReturnType<typeof mockServer>;

  beforeEach(() => {
    server = mockServer();
    registerPrompts(server as any);
  });

  it("registers 4 prompts", () => {
    expect(server.prompts.size).toBe(4);
  });

  it("book-appointment includes warehouse ID and tool names in message", async () => {
    const result = await server.callPrompt("book-appointment", { warehouseId: "w1", date: "2026-03-01" });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("user");
    const text = result.messages[0].content.text;
    expect(text).toContain("w1");
    expect(text).toContain("2026-03-01");
    expect(text).toContain("create_appointment");
    expect(text).toContain("list_docks");
  });

  it("book-appointment works without a date", async () => {
    const result = await server.callPrompt("book-appointment", { warehouseId: "w2" });
    expect(result.messages[0].content.text).toContain("w2");
    expect(result.messages[0].content.text).not.toContain("undefined");
  });

  it("daily-schedule includes warehouse and date in message", async () => {
    const result = await server.callPrompt("daily-schedule", { warehouseId: "w2", date: "2026-03-15" });
    const text = result.messages[0].content.text;
    expect(text).toContain("w2");
    expect(text).toContain("2026-03-15");
    expect(text).toContain("list_appointments");
  });

  it("reschedule-appointment includes appointment ID and tool names", async () => {
    const result = await server.callPrompt("reschedule-appointment", { appointmentId: "a99" });
    const text = result.messages[0].content.text;
    expect(text).toContain("a99");
    expect(text).toContain("get_appointment");
    expect(text).toContain("update_appointment");
  });

  it("carrier-performance includes analytics tool names", async () => {
    const result = await server.callPrompt("carrier-performance", {});
    const text = result.messages[0].content.text;
    expect(text).toContain("get_appointment_volume_by_carrier");
    expect(text).toContain("get_carrier_status_percentages");
    expect(text).toContain("get_appointment_avg_duration_by_status");
  });
});
