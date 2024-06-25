import { HEADERS } from "@/lib/consts";
import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { Webhooks } from "@octokit/webhooks";
import { isEventProcessed, saveNewEvent } from "@/lib/data/db";
import {
  saveFarcasterData,
  saveSmartWalletData,
  saveTwitterData,
  saveWalletData,
} from "@/lib/dynamic/db";
import { parsePayload } from "@/lib/dynamic/helpers";

const webhooks = new Webhooks({
  secret: process.env.DYNAMICS_SECRET as string,
});

export const POST = async function (request: NextRequest) {
  try {
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
    const body = JSON.parse(bodyText);
    const payload = parsePayload(body);
    logger.info(`Payload: ${JSON.stringify(payload)}`);
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

    // Process the event based on its type
    if ("oauthProvider" in payload.data.verifiedCredentials[0]) {
      if (payload.data.verifiedCredentials[0].oauthProvider === "farcaster") {
        logger.info("Farcaster Account found");

        await saveFarcasterData(payload as FarcasterPayload);
      } else if (
        payload.data.verifiedCredentials[0].oauthProvider === "twitter"
      ) {
        logger.info("Twitter Account found");
        await saveTwitterData(payload as TwitterPayload);
      }
    } else if ("walletProvider" in payload.data.verifiedCredentials[0]) {
      logger.info("wallet Account found");
      await saveWalletData(payload as WalletPayload);
    }

    await saveNewEvent(messageId);

    return new Response(JSON.stringify("Done"), {
      status: 200,
      headers: HEADERS,
    });
  } catch (error) {
    logger.error(`Webhook:: ${error}`);
    return new Response(JSON.stringify("something went wrong."), {
      status: 500,
      headers: HEADERS,
    });
  }
};
