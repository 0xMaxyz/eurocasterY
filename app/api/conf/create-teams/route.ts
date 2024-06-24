import axios from "axios";
import dotenv from "dotenv";
import axiosRetry from "axios-retry";
import logger from "@/lib/logger";
import { Match, MatchWithResult } from "@/lib/uefa";
import { NextRequest } from "next/server";
import { addOrUpdateMatches, addTeam } from "@/lib/data/db";
import { createMatchDto } from "@/lib/data/dtos";
import { HEADERS } from "@/lib/consts";
import { getUniqueObjectsInArray } from "@/lib/functions";

dotenv.config();

const ax = axios.create({
  baseURL: `https://match.uefa.com`,
  timeout: 10000,
});
axiosRetry(ax, {
  retries: 5,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  },
  retryDelay: (retryCount) => {
    return retryCount * 1000;
  },
});

export const GET = async function (request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }
  logger.info("Cron Job:: Fetch data called.");
  {
    try {
      const resp = await ax.get(
        `/v5/matches?competitionId=3&fromDate=2024-06-14&limit=55&offset=0&order=ASC&phase=ALL&seasonYear=2024&toDate=2024-07-14&utcOffset=0`
      );
      const matches: Match[] = resp.data as Match[];
      logger.info(`Cron Job:: Number of received Matches ${matches.length}`);

      let matchDtos: createMatchDto[] = [];

      const teams = getUniqueObjectsInArray(
        matches
          .filter((m) => !m.homeTeam.isPlaceHolder && !m.awayTeam.isPlaceHolder)
          .flatMap((team) => [team.awayTeam, team.homeTeam])
      )
        .map((team) => {
          const { internationalName, countryCode, id, bigLogoUrl } = team;
          return {
            country: internationalName,
            country_short: countryCode,
            uefa_id: Number.parseInt(id),
            logo: bigLogoUrl,
          };
        })
        .sort((a, b) => a.uefa_id - b.uefa_id);

      for (let i = 0; i < teams.length; i++) {
        await addTeam(teams[i]);
      }

      return new Response(
        // JSON.stringify(mappedMatches),
        JSON.stringify(`"Number of received Matches", ${matches.length}`),
        {
          status: 200,
          headers: HEADERS,
        }
      );
    } catch (error) {
      const er = `Cron Job:: error receiving data: ${error}`;
      logger.error(er);
      return new Response(JSON.stringify(er), {
        status: 400,
        headers: HEADERS,
      });
    }
  }
};
