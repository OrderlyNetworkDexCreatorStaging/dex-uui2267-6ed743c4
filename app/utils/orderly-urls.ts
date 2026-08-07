import { API_URLS, type URLS } from "@orderly.network/core";
import type { NetworkId } from "@orderly.network/types";

export type DeploymentEnv = "qa" | "staging" | "prod";

const QA_URLS: URLS = {
  apiBaseUrl: "https://api.qa.orderly-i.network",
  publicWsUrl: "wss://ws.qa.orderly-i.network",
  privateWsUrl: "wss://ws-private.qa.orderly-i.network",
  operatorUrl: {
    EVM: "https://operator.qa.orderly-i.network",
    SOL: "https://sol-operator.qa.orderly-i.network",
  },
};

const STAGING_URLS = API_URLS.testnet;
const PROD_URLS = API_URLS.mainnet;

export function normalizeDeploymentEnv(value: unknown): DeploymentEnv {
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "qa") return "qa";
  if (normalized === "staging" || normalized === "testnet") return "staging";
  return "prod";
}

export function getDeploymentNetworkId(env: DeploymentEnv): NetworkId {
  return env === "prod" ? "mainnet" : "testnet";
}

export function getEnvironmentUrls(
  env: DeploymentEnv,
  networkId: NetworkId,
): URLS {
  if (networkId === "mainnet") return PROD_URLS;
  return env === "qa" ? QA_URLS : STAGING_URLS;
}

export function getDeploymentApiBaseUrl(value: unknown): string {
  const env = normalizeDeploymentEnv(value);
  const networkId = getDeploymentNetworkId(env);
  return getEnvironmentUrls(env, networkId).apiBaseUrl;
}
