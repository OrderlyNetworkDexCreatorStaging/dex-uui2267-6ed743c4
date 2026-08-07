import { describe, expect, it } from "vitest";
import {
  CustomConfigStore,
  getDeploymentNetworkId,
  getEnvironmentUrls,
  normalizeDeploymentEnv,
} from "./orderly-environment";

describe("Orderly environment config", () => {
  it.each([
    ["qa", "qa", "testnet"],
    ["staging", "staging", "testnet"],
    ["testnet", "staging", "testnet"],
    ["mainnet", "prod", "mainnet"],
    [undefined, "prod", "mainnet"],
  ] as const)("maps %s to %s and %s", (input, env, networkId) => {
    const resolvedEnv = normalizeDeploymentEnv(input);
    expect(resolvedEnv).toBe(env);
    expect(getDeploymentNetworkId(resolvedEnv)).toBe(networkId);
  });

  it("uses QA endpoints", () => {
    const store = new CustomConfigStore({
      brokerId: "demo",
      env: "qa",
      networkId: "testnet",
    });

    expect(store.get("env")).toBe("qa");
    expect(store.get("networkId")).toBe("testnet");
    expect(store.get("apiBaseUrl")).toBe("https://api.qa.orderly-i.network");
    expect(store.get("publicWsUrl")).toBe("wss://ws.qa.orderly-i.network");
    expect(store.get("privateWsUrl")).toBe(
      "wss://ws-private.qa.orderly-i.network",
    );
    expect(store.get("operatorUrl")).toBe(
      "https://operator.qa.orderly-i.network",
    );
  });

  it("uses staging endpoints", () => {
    const urls = getEnvironmentUrls("staging", "testnet");
    expect(urls.apiBaseUrl).toBe("https://testnet-api.orderly.org");
    expect(urls.publicWsUrl).toBe("wss://testnet-ws-evm.orderly.org");
    expect(urls.privateWsUrl).toBe("wss://testnet-ws-private-evm.orderly.org");
  });

  it("uses production endpoints for mainnet", () => {
    const urls = getEnvironmentUrls("prod", "mainnet");
    expect(urls.apiBaseUrl).toBe("https://api.orderly.org");
    expect(urls.publicWsUrl).toBe("wss://ws-evm.orderly.org");
    expect(urls.privateWsUrl).toBe("wss://ws-private-evm.orderly.org");
  });
});
