import logger from "../logger";

export function parsePayload(
  body: any
): FarcasterPayload | TwitterPayload | WalletPayload | SmartWalletPayload {
  if (body.data.verifiedCredentials[0].oauthProvider === "farcaster") {
    logger.info("Found Farcaster Payload");
    return body as FarcasterPayload;
  }
  if (body.data.verifiedCredentials[0].oauthProvider === "twitter") {
    logger.info("Found Twitter Payload");

    return body as TwitterPayload;
  }
  if (
    body.data.verifiedCredentials[0].format === "blockchain" &&
    body.data.verifiedCredentials[0].walletProvider === "browserExtension"
  ) {
    logger.info("Found Wallet Payload");

    return body as WalletPayload;
  }
  if (
    body.data.verifiedCredentials[0].format === "blockchain" &&
    body.data.verifiedCredentials[0].walletProvider === "custodialService"
  ) {
    logger.info("Found Smart Wallet Payload");

    return body as SmartWalletPayload;
  }
  logger.error("No known payload found");

  throw new Error("Unknown payload type");
}
