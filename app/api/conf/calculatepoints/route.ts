import dotenv from "dotenv";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { updateLeaderboard } from "@/lib/data/db";
import { HEADERS } from "@/lib/consts";

dotenv.config();

export const GET = async function (request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.error(`Cron Job:: Unathorised access prevented, ip: ${request.ip}`);
    return new Response("Unauthorized", {
      status: 401,
    });
  }
  logger.info("Cron Job::Update points job called");
  await updateLeaderboard();
  logger.info("Cron Job::Update points job finished");
  return new Response(JSON.stringify(`Update points job finished`), {
    status: 200,
    headers: HEADERS,
  });
};
