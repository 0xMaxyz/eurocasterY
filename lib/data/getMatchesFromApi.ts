import axios from "axios";
import dotenv from "dotenv";
import axiosRetry from "axios-retry";
import logger from "../logger";
import { Match } from "../uefa";

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

export const getDataFromUefa = async function (
  from: number = 1,
  to: number = 26
) {
  if (from > 0 && to <= 30) {
    try {
      const resp = await ax.get(
        `/v5/matches?competitionId=3&fromDate=2024-06-${from
          .toString()
          .padStart(
            2,
            "0"
          )}&limit=55&offset=0&order=ASC&phase=ALL&seasonYear=2024&toDate=2024-06-${to
          .toString()
          .padStart(2, "0")}&utcOffset=0`
      );
      const matches: Match[] = resp.data as Match[];
      console.log("Num Match", matches.length);
    } catch (error) {
      logger.error(`API:: error receiving data: ${error}`);
    }
  }
  logger.error("API:: day range is wrong 1<=day<=30");
};

export default getDataFromUefa(1, 26);
