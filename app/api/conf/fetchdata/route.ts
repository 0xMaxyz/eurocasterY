import axios from "axios";
import dotenv from "dotenv";
import axiosRetry from "axios-retry";
import logger from "@/lib/logger";
import { Match, MatchWithResult } from "@/lib/uefa";
import { NextRequest } from "next/server";
import { addOrUpdateMatches } from "@/lib/data/db";
import { createMatchDto } from "@/lib/data/dtos";
import { HEADERS } from "@/lib/consts";

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

      // convert to createMatchDto
      const nm = matches.filter(
        (m) => !m.homeTeam.isPlaceHolder && !m.awayTeam.isPlaceHolder
      );
      console.log(nm.length);
      matches
        .filter((m) => !m.homeTeam.isPlaceHolder && !m.awayTeam.isPlaceHolder)
        .forEach((match) => {
          if ((match as MatchWithResult).winner) {
            const m = match as MatchWithResult;
            let winner = "0";
            // find who is winner
            if (!m.winner.match.reason.includes("DRAW")) {
              winner = m.winner.match.team.countryCode;
            }
            matchDtos.push({
              awayTeam_short: m.awayTeam.countryCode,
              homeTeam_short: m.homeTeam.countryCode,
              match_date: m.kickOffTime.dateTime,
              status: m.status,
              match_number: m.matchNumber,
              winner,
            });
          } else {
            matchDtos.push({
              awayTeam_short: match.awayTeam.countryCode,
              homeTeam_short: match.homeTeam.countryCode,
              match_date: match.kickOffTime.dateTime,
              status: match.status,
              match_number: match.matchNumber,
              winner: null,
            });
          }
        });

      const mappedMatches = matchDtos?.map((team) => {
        const {
          awayTeam_short,
          homeTeam_short,
          match_date,
          status,
          match_number,
          winner,
        } = team;
        if (winner !== null) {
          return team;
        } else {
          return {
            awayTeam_short,
            homeTeam_short,
            match_date,
            status,
            match_number,
          };
        }
      });

      if (mappedMatches.length > 0) {
        await addOrUpdateMatches(matchDtos);
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
