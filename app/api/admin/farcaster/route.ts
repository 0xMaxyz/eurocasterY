import dotenv from "dotenv";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { HEADERS } from "@/lib/consts";
import { sql } from "@vercel/postgres";
import { getFarcasterData } from "@/lib/functions";

dotenv.config();

const updateFarcasterUserData = async function () {
  let count: number = 0;
  const resp = await sql`
    SELECT u.user_id, lp.provider_identifier AS fid
    FROM users u
    JOIN login_providers lp ON u.user_id = lp.user_id
    WHERE lp.provider_name = 'farcaster' AND (u.username IS NULL OR u.profile_picture IS NULL);
    `;
  count = resp.rowCount;
  if (resp.rowCount > 0) {
    // Then there are some entries that do not have pfp or username
    let fids: string = "";
    for (let i = 0; i < resp.rowCount; i++) {
      fids += `"${resp.rows[i].fid}",`;
    }
    console.log(fids);
    // get from airstack
    const farcasterData = await getFarcasterData(fids);
    if (farcasterData) {
      for (const profile of farcasterData) {
        const { profileName, profileImage, userId } = profile;
        if (profileName && profileImage) {
          logger.info(`Updating ${userId},${profileName},${profileImage}`);
          await sql.query(
            `UPDATE users
           SET username = $1, profile_picture = $2
           WHERE user_id = (
             SELECT user_id FROM login_providers
             WHERE provider_identifier = $3 AND provider_name = 'farcaster'
           )`,
            [profileName, profileImage, userId]
          );
        }
      }
    }
  }
  return count;
};

export const GET = async function (request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.error(`ADMIN:: Unathorised access prevented, ip: ${request.ip}`);
      return new Response("Unauthorized", {
        status: 401,
      });
    }
    logger.info("ADMIN::Update farcaster user data called");
    const num = await updateFarcasterUserData();
    logger.info("ADMIN::Update farcaster user data finished");
    return new Response(JSON.stringify(`${num} user data updated.`), {
      status: 200,
      headers: HEADERS,
    });
  } catch (error) {
    return new Response(
      JSON.stringify(`Error processing the request: ${error}`),
      {
        status: 500,
        headers: HEADERS,
      }
    );
  }
};
