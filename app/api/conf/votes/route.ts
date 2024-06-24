import { HEADERS } from "@/lib/consts";
import { getAllMatches, getUserVotes, userVoteDto } from "@/lib/data/db";
import { NextRequest } from "next/server";

export const GET = async function (request: NextRequest) {
  // get fid
  const url = new URL(request.url);
  const fid = url.searchParams.get("fid");
  const x = url.searchParams.get("x");

  console.log("fid", fid, "x", x);

  if (fid || x) {
    const userVotes = await getUserVotes(Number.parseInt(fid ?? "0"), x ?? "");
    return new Response(JSON.stringify(userVotes), {
      status: 200,
      headers: HEADERS,
    });
  } else {
    return new Response("Invalid fid", {
      status: 404,
      headers: HEADERS,
    });
  }
};
