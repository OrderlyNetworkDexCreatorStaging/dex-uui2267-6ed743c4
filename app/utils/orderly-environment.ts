import type { ConfigKey } from "@orderly.network/core";
import { ExtendedConfigStore } from "@orderly.network/hooks";
import type { NetworkId } from "@orderly.network/types";
import { getEnvironmentUrls, type DeploymentEnv } from "./orderly-urls";

export {
  getDeploymentNetworkId,
  getEnvironmentUrls,
  normalizeDeploymentEnv,
  type DeploymentEnv,
} from "./orderly-urls";

export class CustomConfigStore extends ExtendedConfigStore {
  constructor(init: {
    brokerId: string;
    brokerName?: string;
    env: DeploymentEnv;
    networkId: NetworkId;
  }) {
    super(init);

    const urls = getEnvironmentUrls(init.env, init.networkId);
    const entries: Array<[ConfigKey, unknown]> = [
      ["env", init.env],
      ["networkId", init.networkId],
      ["apiBaseUrl", urls.apiBaseUrl],
      ["publicWsUrl", urls.publicWsUrl],
      ["privateWsUrl", urls.privateWsUrl],
      ["operatorUrl", urls.operatorUrl],
    ];

    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }
}
