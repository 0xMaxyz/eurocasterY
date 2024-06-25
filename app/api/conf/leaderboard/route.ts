import { HEADERS } from "@/lib/consts";
import { getLeaderboardData } from "@/lib/data/db";
import { getFarcasterData, joinLeaderboardData } from "@/lib/functions";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";

export const GET = async function (request: NextRequest) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get("user_id");

    const resp = await getLeaderboardData(user_id);

    if (!resp) {
      throw new Error("No entry found in leaderboard table.");
    }

    return new Response(JSON.stringify(resp), {
      status: 200,
      headers: HEADERS,
    });
  } catch (error) {
    const er = `Can't process leaderboard: ${error}`;
    logger.error(er);
    return new Response(JSON.stringify(er), {
      status: 400,
      headers: HEADERS,
    });
  }
};
