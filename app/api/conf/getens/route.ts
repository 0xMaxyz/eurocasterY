import dotenv from "dotenv";
import { NextRequest } from "next/server";
import { HEADERS } from "@/lib/consts";
import { getENS } from "@/lib/functions";

dotenv.config();

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
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: HEADERS,
    });
  } catch (error) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: HEADERS,
    });
  }
};
