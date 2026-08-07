import { ReactNode, useCallback, lazy, Suspense, useMemo } from "react";
import { OrderlyAppProvider } from "@orderly.network/react-app";
import type { NetworkId } from "@orderly.network/types";
import { DemoGraduationChecker } from "@/components/DemoGraduationChecker";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useOrderlyConfig } from "@/utils/config";
import {
  CustomConfigStore,
  getDeploymentNetworkId,
  normalizeDeploymentEnv,
} from "@/utils/orderly-environment";
import {
  getRuntimeConfigBoolean,
  getRuntimeConfigArray,
  getRuntimeConfig,
} from "@/utils/runtime-config";
import { createSymbolDataAdapter } from "@/utils/symbol-filter";
import { resolveDexThemeConfig } from "@/utils/theme-config";
import ServiceDisclaimerDialog from "./ServiceDisclaimerDialog";
import { OrderlyLocaleProvider } from "./orderlyLocaleProvider";

const getNetworkId = (): NetworkId => {
  const env = normalizeDeploymentEnv(getRuntimeConfig("VITE_DEPLOYMENT_ENV"));
  if (env !== "prod") return getDeploymentNetworkId(env);
  if (typeof window === "undefined") return "mainnet";

  const disableMainnet = getRuntimeConfigBoolean("VITE_DISABLE_MAINNET");
  const disableTestnet = getRuntimeConfigBoolean("VITE_DISABLE_TESTNET");

  if (disableMainnet && !disableTestnet) {
    return "testnet";
  }

  if (disableTestnet && !disableMainnet) {
    return "mainnet";
  }

  return (localStorage.getItem("orderly_network_id") as NetworkId) || "mainnet";
};

const setNetworkId = (networkId: NetworkId) => {
  const env = normalizeDeploymentEnv(getRuntimeConfig("VITE_DEPLOYMENT_ENV"));
  if (env === "prod" && typeof window !== "undefined") {
    localStorage.setItem("orderly_network_id", networkId);
  }
};

const PrivyConnector = lazy(
  () => import("@/components/orderlyProvider/privyConnector"),
);
const WalletConnector = lazy(
  () => import("@/components/orderlyProvider/walletConnector"),
);

const OrderlyProvider = (props: { children: ReactNode }) => {
  const config = useOrderlyConfig();
  const deploymentEnv = normalizeDeploymentEnv(
    getRuntimeConfig("VITE_DEPLOYMENT_ENV"),
  );
  const networkId = getNetworkId();
  const configStore = useMemo(
    () =>
      new CustomConfigStore({
        brokerId: getRuntimeConfig("VITE_ORDERLY_BROKER_ID") || "demo",
        brokerName: getRuntimeConfig("VITE_ORDERLY_BROKER_NAME"),
        env: deploymentEnv,
        networkId,
      }),
    [deploymentEnv, networkId],
  );
  const themes = useMemo(() => resolveDexThemeConfig().themes, []);

  const privyAppId = getRuntimeConfig("VITE_PRIVY_APP_ID");
  const usePrivy = !!privyAppId;

  const parseChainIds = (
    envVar: string | undefined,
  ): Array<{ id: number }> | undefined => {
    if (!envVar) return undefined;
    return envVar
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id)
      .map((id) => ({ id: parseInt(id, 10) }))
      .filter((chain) => !isNaN(chain.id));
  };

  const parseDefaultChain = (
    envVar: string | undefined,
  ): { mainnet: { id: number } } | undefined => {
    if (!envVar) return undefined;

    const chainId = parseInt(envVar.trim(), 10);
    return !isNaN(chainId) ? { mainnet: { id: chainId } } : undefined;
  };

  const disableMainnet = getRuntimeConfigBoolean("VITE_DISABLE_MAINNET");
  const mainnetChains = disableMainnet
    ? []
    : parseChainIds(getRuntimeConfig("VITE_ORDERLY_MAINNET_CHAINS"));
  const disableTestnet = getRuntimeConfigBoolean("VITE_DISABLE_TESTNET");
  const testnetChains = disableTestnet
    ? []
    : parseChainIds(getRuntimeConfig("VITE_ORDERLY_TESTNET_CHAINS"));

  const chainFilter =
    mainnetChains || testnetChains
      ? {
          ...(mainnetChains && { mainnet: mainnetChains }),
          ...(testnetChains && { testnet: testnetChains }),
        }
      : undefined;

  const defaultChain = parseDefaultChain(
    getRuntimeConfig("VITE_DEFAULT_CHAIN"),
  );

  const dataAdapter = createSymbolDataAdapter();

  const onChainChanged = useCallback(
    (_chainId: number, { isTestnet }: { isTestnet: boolean }) => {
      if (deploymentEnv !== "prod") return;
      const currentNetworkId = getNetworkId();
      if (
        (isTestnet && currentNetworkId === "mainnet") ||
        (!isTestnet && currentNetworkId === "testnet")
      ) {
        const newNetworkId: NetworkId = isTestnet ? "testnet" : "mainnet";
        setNetworkId(newNetworkId);

        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    },
    [deploymentEnv],
  );

  const appProvider = (
    <OrderlyAppProvider
      configStore={configStore}
      themes={themes}
      onChainChanged={onChainChanged}
      appIcons={config.orderlyAppProvider.appIcons}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(chainFilter && ({ chainFilter } as any))}
      defaultChain={defaultChain}
      dataAdapter={dataAdapter}
      restrictedInfo={{
        customRestrictedRegions: getRuntimeConfigArray(
          "VITE_RESTRICTED_REGIONS",
        ),
      }}
    >
      <DemoGraduationChecker />
      <ServiceDisclaimerDialog />
      {props.children}
    </OrderlyAppProvider>
  );

  const walletConnector = usePrivy ? (
    <PrivyConnector networkId={networkId}>{appProvider}</PrivyConnector>
  ) : (
    <WalletConnector networkId={networkId}>{appProvider}</WalletConnector>
  );

  return (
    <OrderlyLocaleProvider>
      <Suspense fallback={<LoadingSpinner />}>{walletConnector}</Suspense>
    </OrderlyLocaleProvider>
  );
};

export default OrderlyProvider;
