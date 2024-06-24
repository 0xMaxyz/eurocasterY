import dotenv from "dotenv";
import { NextRequest } from "next/server";
import { predict } from "@/lib/data/db";
import { HEADERS } from "@/lib/consts";
import { predictDto, predictResponseDto } from "@/lib/data/dtos";
import logger from "@/lib/logger";

dotenv.config();

export const GET = async function (request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jsonString = Array.from(searchParams.keys())[0];
  const pr: predictDto = JSON.parse(jsonString);
  if (pr) {
    try {
      logger.info("Input Predict", pr);
      const resp = await predict(pr);

      return new Response(JSON.stringify(resp), {
        status: 200,
        headers: HEADERS,
      });
    } catch (error) {
      return new Response(JSON.stringify(error), {
        status: 500,
        headers: HEADERS,
      });
    }
  } else {
    return new Response(JSON.stringify("Invalid predict input"), {
      status: 400,
      headers: HEADERS,
    });
  }
};
