import { describe, expect, it } from "vitest";
import { getDeploymentApiBaseUrl } from "./orderly-urls";

describe("build API environment", () => {
  it.each([
    ["qa", "https://api.qa.orderly-i.network"],
    ["staging", "https://testnet-api.orderly.org"],
    ["mainnet", "https://api.orderly.org"],
    [undefined, "https://api.orderly.org"],
  ])("maps %s to %s", (env, expected) => {
    expect(getDeploymentApiBaseUrl(env)).toBe(expected);
  });
});
