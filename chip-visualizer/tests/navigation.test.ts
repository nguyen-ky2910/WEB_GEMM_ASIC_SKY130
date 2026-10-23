import { describe, it, expect } from "vitest";
import { pageFromHash, pageNames } from "../src/app/navigation";
describe("GitHub Pages hash routing", () => {
  it("accepts every navigation destination as a reloadable hash route", () => {
    for (const page of pageNames) expect(pageFromHash(`#/${page}`)).toBe(page);
  });
  it("normalizes missing or unknown routes without constructing server paths", () => {
    expect(pageFromHash("")).toBe("explorer");
    expect(pageFromHash("#/missing")).toBe("explorer");
    expect(pageFromHash("#axi")).toBe("axi");
    expect(pageFromHash("#/../../secret")).toBe("explorer");
  });
});
