import { describe, expect, it } from "vitest";
import { idempotencyKey, isDeliverableAddress, welcomeMessage } from "./welcomeMessage.js";

describe("welcomeMessage", () => {
  const msg = welcomeMessage("fan@example.com");

  it("sets sender, reply-to, recipient and subject", () => {
    expect(msg.from).toBe("GACETA <bienvenida@esgaceta.com>");
    expect(msg.reply_to).toBe("contacto@gacetaplay.com");
    expect(msg.to).toEqual(["fan@example.com"]);
    expect(msg.subject).toBe("Gracias por sumarte a GACETA");
  });

  it("links the site and explains unsubscribing by reply in both bodies", () => {
    for (const body of [msg.html, msg.text]) {
      expect(body).toContain("esgaceta.com");
      expect(body).toContain("respondé a este mail");
    }
  });

  it("does not echo the address into the html", () => {
    expect(msg.html).not.toContain("fan@example.com");
  });

  it("uses the brand assets as absolute PNG urls with alt text", () => {
    // Mail clients need absolute urls; webp does not render in Outlook.
    for (const asset of ["gaceta-iso.png", "gaceta-word.png"]) {
      expect(msg.html).toContain(`https://heardle.esgaceta.com/email/${asset}`);
    }
    expect(msg.html).not.toMatch(/\.webp/);
    for (const img of msg.html.match(/<img\b[^>]*>/g)) expect(img).toMatch(/\salt="/);
  });

  it("leads with a play-again button to the game", () => {
    expect(msg.html).toMatch(/<a href="https:\/\/heardle\.esgaceta\.com"[^>]*>[^<]*Jugá otra ronda/);
    expect(msg.text).toContain("Jugá otra ronda: https://heardle.esgaceta.com");
  });
});

describe("isDeliverableAddress", () => {
  it("accepts ordinary addresses", () => {
    expect(isDeliverableAddress("fan@example.com")).toBe(true);
    expect(isDeliverableAddress("a.b+c@sub.example.co")).toBe(true);
  });

  it("rejects malformed, non-string and oversized input", () => {
    for (const bad of ["", "nope", "a@b", "a b@c.com", "@c.com", null, undefined, 42]) {
      expect(isDeliverableAddress(bad)).toBe(false);
    }
    expect(isDeliverableAddress(`${"a".repeat(250)}@b.co`)).toBe(false);
  });
});

describe("idempotencyKey", () => {
  it("is stable per address and differs between addresses", async () => {
    expect(await idempotencyKey("fan@example.com")).toBe(await idempotencyKey("fan@example.com"));
    expect(await idempotencyKey("fan@example.com")).not.toBe(await idempotencyKey("otro@example.com"));
  });

  it("stays short and ASCII for long and non-ASCII addresses", async () => {
    for (const email of [`${"a".repeat(240)}@example.com`, "músico@ñandú.com.ar"]) {
      const key = await idempotencyKey(email);
      expect(key).toMatch(/^welcome-[0-9a-f]{64}$/);
      expect(key.length).toBeLessThanOrEqual(256);
    }
  });
});
