function parsePayload(
  body: any
): FarcasterPayload | TwitterPayload | WalletPayload | SmartWalletPayload {
  if (body.data.verifiedCredentials[0].oauthProvider === "farcaster") {
    return body as FarcasterPayload;
  }
  if (body.data.verifiedCredentials[0].oauthProvider === "twitter") {
    return body as TwitterPayload;
  }
  if (
    body.data.verifiedCredentials[0].format === "blockchain" &&
    body.data.verifiedCredentials[0].walletProvider === "browserExtension"
  ) {
    return body as WalletPayload;
  }
  if (
    body.data.verifiedCredentials[0].format === "blockchain" &&
    body.data.verifiedCredentials[0].walletProvider === "custodialService"
  ) {
    return body as SmartWalletPayload;
  }
  throw new Error("Unknown payload type");
}
