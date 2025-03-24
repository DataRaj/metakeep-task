import { MetaKeep } from "metakeep";

export const metakeep = new MetaKeep({
  appId: process.env.METAKEEP_ID!,
  chainId: 1,
  rpcNodeUrls: {
    1: "https://mainnet.infura.io/v3/your-infura-project-id",
  },
});
