/** @jsxImportSource frog/jsx */

import { CountryCode, countryCodeToName } from "@/lib/consts";
import { getMatchInfo, predict } from "@/lib/data/db";
import logger from "@/lib/logger";
import { Button, FrameResponse, Frog } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { pinata } from "frog/hubs";
//

const app = new Frog({
  assetsPath: "/",
  basePath: "/api/frame",
  browserLocation: "/",
  hub: pinata(),
});

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

const errorResponse = function (err: string): FrameResponse {
  return {
    imageOptions: { width: 955, height: 500, format: "png" },
    image: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100vw",
          height: "100vh",
          position: "relative",
          backgroundColor: "blue",
        }}
      >
        <h1>{err}</h1>
      </div>
    ),
    intents: [],
  };
};

app.frame("m/:home/:away/", async (c) => {
  const { home, away } = c.req.param();

  // check if there is a match with this combination
  const matchInfo = await getMatchInfo(home, away);
  if (!matchInfo) {
    return c.res(
      errorResponse(
        `Wrong Teams are selected, couldn't find ${home} or ${away}.`
      )
    );
  } else {
    const { match_id, match_date } = matchInfo;
    logger.info(
      `Kickoff date is: ${new Date(match_date).toLocaleString("en-us")} UTC.`
    );
    if (Date.now() < Date.parse(match_date)) {
      // get flag info
      return c.res({
        action: "/predict",
        imageOptions: { width: 955, height: 500, format: "png" },
        image: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100vw",
              height: "100vh",
              position: "relative",
              backgroundColor: "white",
            }}
          >
            <img
              src={`/eurocaster_assets/bg/1.png`}
              alt="Background"
              style={{
                position: "absolute",
                top: -1,
                left: -1,
                width: "101vw",
                height: "101vh",
                zIndex: -1,
              }}
            />
            <img
              src={`/eurocaster_assets/avatars/${home}.png`}
              alt="Home Team"
              style={{
                width: "40%",
                zIndex: 1,
                position: "absolute",
                bottom: 0,
                left: "1%",
              }}
            />
            <img
              src={`/eurocaster_assets/avatars/${away}.png`}
              alt="Away Team"
              style={{
                position: "absolute",
                bottom: 0,
                right: "1%",
                width: "40%",
                zIndex: 1,
              }}
            />
          </div>
        ),
        intents: [
          <Button value={`${match_id}/${home}`}>
            {countryCodeToName(home as CountryCode)}
          </Button>,
          <Button value={`${match_id}/0`}>DRAW</Button>,
          <Button value={`${match_id}/${away}`}>
            {countryCodeToName(away as CountryCode)}
          </Button>,
        ],
      });
    } else {
      return c.res(
        errorResponse(
          `Kickoff time has passed, Kickoff date is: ${new Date(
            match_date
          ).toLocaleString("en-us")} UTC.`
        )
      );
    }
  }
});

app.frame("/predict", async (c) => {
  const { frameData, buttonValue } = c;
  const values = buttonValue?.split("/");
  console.log(values);
  const id = values![0];
  const prediction = values![1];
  const predictResult = await predict({
    fid: frameData!.fid,
    match_id: id,
    prediction: prediction,
    x: "",
  });
  if (!predictResult || predictResult.has_error) {
    return c.error({ message: predictResult.error_message! });
  } else {
    if (prediction === "0") {
      // it is a draw
      return c.res({
        action: `/leaderboard/1`,
        imageOptions: { width: 955, height: 500, format: "png" },
        image: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100vw",
              height: "100vh",
              position: "relative",
              backgroundColor: "white",
            }}
          >
            <img
              src={`/eurocaster_assets/bgn/1.png`}
              alt="Background"
              style={{
                position: "absolute",
                top: -1,
                left: -1,
                width: "101vw",
                height: "101vh",
                zIndex: -1,
              }}
            />
            <h1
              style={{
                position: "absolute",
                color: "white",
                fontSize: "40vh",
                lineHeight: "1",
                left: "40%",
                textAlign: "center",
                zIndex: 1,
              }}
            >
              DRAW
            </h1>
          </div>
        ),
        intents: [
          <Button.Link href="https://eurocaster.vercel.app/?tab=leaderboard">
            Check Leaderboard
          </Button.Link>,
          <Button.Link href="https://eurocaster.vercel.app/?tab=toc">
            Terms and Conditions
          </Button.Link>,
        ],
      });
    } else {
      return c.res({
        action: `/leaderboard/1`,
        imageOptions: { width: 955, height: 500, format: "png" },
        image: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100vw",
              height: "100vh",
              position: "relative",
              backgroundColor: "white",
            }}
          >
            <img
              src={`/eurocaster_assets/pbg.png`}
              alt="Background"
              style={{
                position: "absolute",
                top: -1,
                left: -1,
                width: "101vw",
                height: "101vh",
                zIndex: -1,
              }}
            />
            <img
              src={`/eurocaster_assets/avatars/${prediction}.png`}
              alt="Home Team"
              style={{
                position: "absolute",
                bottom: "0%",
                left: "33%",
                width: "36%",
                zIndex: 1,
              }}
            />
          </div>
        ),
        intents: [
          <Button.Link href="https://eurocaster.vercel.app/?tab=leaderboard">
            Check Leaderboard
          </Button.Link>,
          <Button.Link href="https://eurocaster.vercel.app/?tab=toc">
            Terms and Conditions
          </Button.Link>,
        ],
        // <Button value="">Check Leaderboard</Button>],
      });
    }
  }
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
