import { describe, it, expect, beforeEach } from "vitest";
import { createLocalAdapter } from "./localAdapter.js";
import { installLocalStorage } from "../test-utils/localStorage.js";

let api;
beforeEach(() => {
  installLocalStorage();
  api = createLocalAdapter();
});

describe("localAdapter", () => {
  it("stores an email once", async () => {
    await api.subscribeEmail("a@b.com", "p1");
    await api.subscribeEmail("a@b.com", "p1");
    expect(JSON.parse(localStorage.getItem("heardle:local:emails"))).toHaveLength(1);
  });

  it("keeps entries from different players separate", async () => {
    await api.subscribeEmail("a@b.com", "p1");
    await api.subscribeEmail("b@b.com", "p2");
    expect(JSON.parse(localStorage.getItem("heardle:local:emails"))).toHaveLength(2);
  });
});
