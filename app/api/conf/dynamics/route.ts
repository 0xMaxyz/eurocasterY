import { HEADERS } from "@/lib/consts";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";

export const POST = async function (request: NextRequest) {
  const body = await request.json();

  logger.info(body);
  return new Response(JSON.stringify("Done"), {
    status: 200,
    headers: HEADERS,
  });
};
