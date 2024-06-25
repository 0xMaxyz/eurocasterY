import { HEADERS } from "@/lib/consts";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { Webhooks } from "@octokit/webhooks";

const webhooks = new Webhooks({
  secret: process.env.DYNAMICS_SECRET as string,
});

export const POST = async function (request: NextRequest) {
  // Validate signature
  const signature = request.headers.get("x-dynamic-signature-256") as string;
  const body = await request.json();
  if (!(await webhooks.verify(body, signature))) {
    return new Response(JSON.stringify("Unauthorized"), {
      status: 401,
      headers: HEADERS,
    });
  }
  //
  logger.info(request.headers);
  logger.info(body);
  logger.info(body.verifiedCredentials);
  return new Response(JSON.stringify("Done"), {
    status: 200,
    headers: HEADERS,
  });
};
