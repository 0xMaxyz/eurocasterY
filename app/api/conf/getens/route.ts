import dotenv from "dotenv";
import { NextRequest } from "next/server";
import { HEADERS } from "@/lib/consts";
import { getENS } from "@/lib/functions";
import logger from "@/lib/logger";

export const GET = async function (request: NextRequest) {
  try {
    const url = new URL(request.url);
    const wallet = url.searchParams.get("w");
    if (wallet) {
      const ens = await getENS(wallet);
      return new Response(JSON.stringify(ens), {
        status: 200,
        headers: HEADERS,
      });
    } else {
      logger.info("Wallet parameter missing");
      return new Response(
        JSON.stringify({ error: "Wallet parameter missing" }),
        {
          status: 400,
          headers: HEADERS,
        }
      );
    }
  } catch (error) {
    logger.error(`Error in ENS GET handler: ${error}`);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: HEADERS,
    });
  }
};
