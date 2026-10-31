import { publishCursor } from "./collaborative-cursor.ts";

const result = await publishCursor({
  sessionId: process.env.DEMO_SESSION_ID ?? "course-session",
  channel: "lesson-42-editor",
  accountId: "creator-17",
  x: 384,
  y: 216,
});

console.log(JSON.stringify({ channel: result.channel, presence: result.presence }, null, 2));
