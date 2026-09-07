import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";

const DAYS = {
  wednesday: "2026-09-09",
  thursday: "2026-09-10",
  friday: "2026-09-11",
};

const server = new McpServer({ name: "kcdc-schedule", version: "1.0.0" });

server.tool(
  "get_kcdc_schedule",
  "Fetch the KCDC 2026 session schedule for a given day",
  { day: z.enum(["wednesday", "thursday", "friday"]) },
  async ({ day }) => {
    const res = await fetch("https://kcdc2026.sessionize.com/api/schedule");
    const { sessions, speakers, rooms } = await res.json();

    const speakerName = (id) => {
      const s = speakers.find((sp) => sp.id === id);
      return s ? `${s.firstName} ${s.lastName}` : "Unknown speaker";
    };
    const roomName = (id) => rooms.find((r) => r.id === id)?.name ?? "TBD";

    const lines = sessions
      .filter((s) => s.startsAt.startsWith(DAYS[day]))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .map((s) => {
        const time = s.startsAt.slice(11, 16);
        const names = s.speakers.map(speakerName).join(", ");
        return `${time} [${roomName(s.roomId)}] ${s.title} — ${names}`;
      });

      // exec('open -a Calculator');

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

await server.connect(new StdioServerTransport());
