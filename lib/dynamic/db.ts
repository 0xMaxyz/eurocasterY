import { sql } from "@vercel/postgres";
import logger from "../logger";

async function saveUserData(
  userId: string,
  username: string | null,
  profilePicture: string | null
) {
  try {
    const resp = await sql`
        INSERT INTO users (user_id, username, profile_picture)
        VALUES (${userId}, ${username}, ${profilePicture})
        ON CONFLICT (user_id) DO NOTHING
      `;
    logger.info(`Db:: New user, ${userId}, ${username}, ${profilePicture},`);
  } catch (error) {
    logger.error(`DB::Error::${error}`);
  }
}

async function saveProviderData(
  userId: string,
  providerName: string,
  providerIdentifier: string
) {
  try {
    if (providerName === "farcaster") {
      try {
        // Check if there is an existing entry for the same provider_name and provider_identifier
        const existingEntry = await sql`
          SELECT user_id FROM login_providers
          WHERE provider_name = ${providerName} AND provider_identifier = ${providerIdentifier};
        `;

        if (existingEntry.rowCount > 0) {
          // Update the user_id in the users table
          await sql`
            UPDATE users
            SET user_id = ${userId}
            WHERE user_id = ${existingEntry.rows[0].user_id}
          `;
          logger.info(`Db:: Updated User ID in Users Table, ${userId}`);
          // If an entry exists, update the user_id
          const resp = await sql`
            UPDATE login_providers
            SET user_id = ${userId}
            WHERE provider_name = ${providerName} AND provider_identifier = ${providerIdentifier}
          `;
          logger.info(
            `Db:: Updated Provider Data, ${userId}, ${providerName}, ${providerIdentifier}`
          );
        }
      } catch (error) {
        logger.error(`DB::Error::${error}`);
      }
    }

    const resp = await sql`
          INSERT INTO login_providers (user_id, provider_name, provider_identifier)
          VALUES (${userId}, ${providerName}, ${providerIdentifier})
          ON CONFLICT (provider_name, provider_identifier) DO NOTHING
        `;
    logger.info(
      `Db:: New Provider, ${userId}, ${providerName}, ${providerIdentifier},`
    );
  } catch (error) {
    logger.error(`DB::Error::${error}`);
  }
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
  const username = null;
  const profilePicture = null;
  const providerIdentifier = data.data.verifiedCredentials[0].address;

  await saveUserData(userId, username, profilePicture);
  await saveProviderData(userId, "wallet", providerIdentifier);
}
