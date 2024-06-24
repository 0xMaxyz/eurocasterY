import { HEADERS } from "@/lib/consts";
import { getAllMatches, getUserVotes, userVoteDto } from "@/lib/data/db";
import { NextRequest } from "next/server";

export const GET = async function (request: NextRequest) {
  const matches = await getAllMatches();
  if (!matches) {
    return new Response(JSON.stringify([]), {
      status: 404,
      headers: HEADERS,
    });
  } else {
    return new Response(JSON.stringify(matches), {
      status: 200,
      headers: HEADERS,
    });
  }
};
