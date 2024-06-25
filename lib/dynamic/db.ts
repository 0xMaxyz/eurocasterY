import { sql } from "@vercel/postgres";

async function saveUserData(
  userId: string,
  username: string,
  profilePicture: string | null
) {
  try {
    const resp = await sql`
        INSERT INTO users (user_id, username, profile_picture)
        VALUES (${userId}, ${username}, ${profilePicture})
        ON CONFLICT (user_id) DO NOTHING
      `;
  } catch (error) {}
}

async function saveProviderData(
  userId: string,
  providerName: string,
  providerIdentifier: string
) {
  try {
    const resp = await sql`
        INSERT INTO login_providers (user_id, provider_name, provider_identifier)
        VALUES (${userId}, ${providerName}, ${providerIdentifier})
        ON CONFLICT (provider_name, provider_identifier) DO NOTHING
      `;
  } catch (error) {}
}

export async function saveFarcasterData(data: FarcasterPayload) {
  const userId = data.userId;
  const username = data.data.verifiedCredentials[0].oauthUsername;
  const profilePicture =
    data.data.verifiedCredentials[0].oauthAccountPhotos[0] || null;
  const providerIdentifier = data.data.verifiedCredentials[0].fid;

  await saveUserData(userId, username, profilePicture);
  await saveProviderData(userId, "farcaster", providerIdentifier.toString());
}

export async function saveTwitterData(data: TwitterPayload) {
  const userId = data.userId;
  const username = data.data.verifiedCredentials[0].oauthUsername;
  const profilePicture =
    data.data.verifiedCredentials[0].oauthAccountPhotos[0] || null;
  const providerIdentifier = data.data.verifiedCredentials[0].oauthAccountId;

  await saveUserData(userId, username, profilePicture);
  await saveProviderData(userId, "twitter", providerIdentifier);
}

export async function saveWalletData(data: WalletPayload) {
  const userId = data.userId;
  const username = "";
  const profilePicture = null;
  const providerIdentifier = data.data.verifiedCredentials[0].address;

  await saveUserData(userId, username, profilePicture);
  await saveProviderData(userId, "wallet", providerIdentifier);
}

export async function saveSmartWalletData(data: SmartWalletPayload) {
  const userId = data.userId;
  const username = "";
  const profilePicture = null;
  const providerIdentifier = data.data.verifiedCredentials[0].address;

  await saveUserData(userId, username, profilePicture);
  await saveProviderData(userId, "smart_wallet", providerIdentifier);
}
