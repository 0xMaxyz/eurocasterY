import { HEADERS } from "@/lib/consts";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { Webhooks } from "@octokit/webhooks";
import { isEventProcessed } from "@/lib/data/db";

const webhooks = new Webhooks({
  secret: process.env.DYNAMICS_SECRET as string,
});

export const POST = async function (request: NextRequest) {
  // Validate signature
  const signature = request.headers.get("x-dynamic-signature-256") as string;
  const bodyText = await request.text();
  if (!(await webhooks.verify(bodyText, signature))) {
    return new Response(JSON.stringify("Unauthorized"), {
      status: 401,
      headers: HEADERS,
    });
  }
  // extract required fields
  const body = await request.json();
  const { messageId } = body;

  // check for duplicate message id
  const duplicate = await isEventProcessed(messageId);
  if (duplicate) {
    logger.info(`Webhook:: Duplicate event received.`);
    return new Response(JSON.stringify("Duplicate event"), {
      status: 200,
      headers: HEADERS,
    });
  }

  logger.info(request.headers);
  logger.info(body);
  logger.info(body.verifiedCredentials);
  return new Response(JSON.stringify("Done"), {
    status: 200,
    headers: HEADERS,
  });
};
