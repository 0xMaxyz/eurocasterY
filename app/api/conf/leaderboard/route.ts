import { HEADERS } from "@/lib/consts";
import { getLeaderboardData } from "@/lib/data/db";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";

export const GET = async function (request: NextRequest) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get("user_id");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

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
