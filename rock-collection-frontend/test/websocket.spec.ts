import { test, expect } from "@playwright/test";

test("WebSocket notification updates UI with rocks collected", async ({
  page,
  context,
}) => {
  // Intercept WebSocket and mock the message
  await page.routeWebSocket("ws://localhost:8080/api/random-rocks/ws", (ws) => {
    ws.send("{\"rocks\":101}");
  });

  await page.goto("http://localhost:3000");
  await expect(page.getByRole('status')).toHaveText("Rocks collected so far: 101");
});
