import { HEADERS } from "@/lib/consts";
import { getLeaderboardData } from "@/lib/data/db";
import { getFarcasterData, joinLeaderboardData } from "@/lib/functions";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";

export const GET = async function (request: NextRequest) {
  try {
    const url = new URL(request.url);
    const fid = url.searchParams.get("fid");
    const x = url.searchParams.get("x");
    if (fid) {
      const resp = await getLeaderboardData(Number.parseInt(fid), "");

      if (!resp) {
        throw new Error("No entry found in leaderboard table.");
      } else {
        // get farcaster data
        let fids = "";
        if (resp.currentUser?.fid) {
          fids += `"${resp.currentUser?.fid}",`;
        }
        if (resp.topUsers && resp.topUsers.length > 0) {
          for (let i = 0; i < resp.topUsers.length; i++) {
            if (resp.topUsers[i].fid > 0) {
              fids += `"${resp.topUsers[i].fid}",`;
            }
          }
        }
        // send request
        const farcasterData = await getFarcasterData(fids);
        if (farcasterData && farcasterData.length > 0) {
          const finalData = joinLeaderboardData(farcasterData, resp);

          return new Response(JSON.stringify(finalData), {
            status: 200,
            headers: HEADERS,
          });
        }
        return new Response(JSON.stringify(resp), {
          status: 200,
          headers: HEADERS,
        });
      }
    } else if (x) {
      const resp = await getLeaderboardData(null, x);

      if (!resp) {
        throw new Error("No entry found in leaderboard table.");
      } else {
        // get farcaster data
        let fids = "";

        if (resp.topUsers && resp.topUsers.length > 0) {
          for (let i = 0; i < resp.topUsers.length; i++) {
            if (resp.topUsers[i].fid > 0) {
              fids += `"${resp.topUsers[i].fid}",`;
            }
          }
        }
        // send request
        const farcasterData = await getFarcasterData(fids);
        if (farcasterData && farcasterData.length > 0) {
          const finalData = joinLeaderboardData(farcasterData, resp);

          return new Response(JSON.stringify(finalData), {
            status: 200,
            headers: HEADERS,
          });
        }
        return new Response(JSON.stringify(resp), {
          status: 200,
          headers: HEADERS,
        });
      }
    } else {
      const resp = await getLeaderboardData(null, "");
      const finalData = joinLeaderboardData([], resp!);

      return new Response(JSON.stringify(finalData), {
        status: 200,
        headers: HEADERS,
      });
    }
  } catch (error) {
    const er = `Can't process leaderboard, ${error}`;
    logger.error(er);
    return new Response(JSON.stringify(er), {
      status: 400,
      headers: HEADERS,
    });
  }
};
