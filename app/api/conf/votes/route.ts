import { HEADERS } from "@/lib/consts";
import { getAllMatches, getUserVotes, userVoteDto } from "@/lib/data/db";
import { NextRequest } from "next/server";

export const GET = async function (request: NextRequest) {
  // get user_id
  const url = new URL(request.url);
  const user_id = url.searchParams.get("user_id");

  if (user_id) {
    const userVotes = await getUserVotes(user_id);
    return new Response(JSON.stringify(userVotes), {
      status: 200,
      headers: HEADERS,
    });
  } else {
    return new Response("Invalid user_id", {
      status: 404,
      headers: HEADERS,
    });
  }
};
