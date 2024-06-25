import dotenv from "dotenv";
import { init, fetchQuery } from "@airstack/node";
import logger from "./logger";
import { LeaderboardDataWithRanks } from "./data/db";
import { LeaderboardData } from "./data/dtos";

dotenv.config();

init(process.env.AIRSTACK_API_KEY as string, "prod");

export async function timeoutHandler<T>(timeout: number, value: T): Promise<T> {
  return new Promise<T>((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, timeout);
  });
}

export interface FarcasterData {
  profileName: string;
  profileImage: string;
  userId: string;
}

export const getFarcasterData = async function (_fids: string) {
  // fids: "353308", "397610", "232017"
  try {
    const query = `query GetFarcasterProfiles {
      Socials(input: {filter: {dappName: {_eq: farcaster}, userId: {_in: [${_fids}]}}, blockchain: ethereum}) {
        Social {
          profileName
          profileImage
          userId
        }
      }
    }`;

    const { data, error } = await fetchQuery(query);

    if (error) {
      throw new Error(error);
    }

    if (data?.Socials.Social && Array.isArray(data.Socials.Social)) {
      const farcasterData: FarcasterData[] = data.Socials.Social;
      return farcasterData;
    } else {
      return [];
    }
  } catch (error) {
    logger.error(`Error reading farcaster data from airstack, ${error}`);
    return [];
  }
};

export const getUniqueObjectsInArray = function <T>(arr: T[]) {
  const uniqueMap = new Map<string, T>();

  arr.forEach((item) => {
    const key = JSON.stringify(item);
    uniqueMap.set(key, item);
  });

  return Array.from(uniqueMap.values());
};

export const checkIfKickoffPassed = function (timeinUtc: Date) {
  const currentTime = new Date();

  const currentTimeUtc = new Date(
    currentTime.getTime() + currentTime.getTimezoneOffset() * 60000
  );

  // Compare the kickoff time in UTC with the current time in UTC
  return timeinUtc <= currentTimeUtc;
};
