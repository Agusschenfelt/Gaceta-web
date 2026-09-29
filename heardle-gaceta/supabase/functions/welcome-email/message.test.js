import { describe, expect, it } from "vitest";
import { isDeliverableAddress, welcomeMessage } from "./message.js";

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
