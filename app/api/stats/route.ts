import logger from "@/lib/logger";
import { NextRequest } from "next/server";
import { HEADERS } from "@/lib/consts";
import { sql } from "@vercel/postgres";

interface Users {
  provider?: string;
  date?: Date;
  count: number;
}

interface Predictions {
  date?: Date;
  predictions: number;
}

const totalUsersPerProvider = async function () {
  try {
    const resp = await sql`
SELECT
    lp.provider_name AS provider,
    DATE(u.created_at) AS date,
    COUNT(*) AS count
FROM
    login_providers lp
JOIN
    users u ON lp.user_id = u.user_id
GROUP BY
    lp.provider_name,
    DATE(u.created_at)
ORDER BY
    lp.provider_name,
    DATE(u.created_at);


        `;
    if (resp.rowCount > 0) {
      return resp.rows as Users[];
    }
    throw new Error("No Item found");
  } catch (error) {
    return [];
  }
};

const usersPerProvider = async function () {
  try {
    const resp = await sql`
SELECT
    provider_name as provider,
    COUNT(DISTINCT user_id) AS count
FROM
    login_providers
GROUP BY
    provider_name;

        `;
    if (resp.rowCount > 0) {
      return resp.rows as Users[];
    }
    throw new Error("No Item found");
  } catch (error) {
    return [];
  }
};

const totalUsersPerDay = async function () {
  try {
    const resp = await sql`
SELECT
    DATE(created_at) AS date,
    COUNT(*) AS count
FROM
    users
GROUP BY
    DATE(created_at)
ORDER BY
    DATE(created_at);


        `;
    if (resp.rowCount > 0) {
      return resp.rows as Users[];
    }
    throw new Error("No Item found");
  } catch (error) {
    return [];
  }
};

const totalUsers = async function () {
  try {
    const resp = await sql`
SELECT
    COUNT(*) AS total_users
FROM
    users;
        `;
    if (resp.rowCount > 0) {
      return { totalUsers: resp.rows[0].total_users };
    }
    throw new Error("No Item found");
  } catch (error) {
    return 0;
  }
};

const predictionsPerDay = async function () {
  try {
    const resp = await sql`
SELECT
    DATE(predicted_at) AS date,
    COUNT(*) AS predictions
FROM
    predictions
GROUP BY
    DATE(predicted_at)
ORDER BY
    DATE(predicted_at);

        `;
    if (resp.rowCount > 0) {
      return resp.rows as Predictions[];
    }
    throw new Error("No Item found");
  } catch (error) {
    return 0;
  }
};

const totalPredictions = async function () {
  try {
    const resp = await sql`
SELECT
    COUNT(*) AS total_predictions
FROM
    predictions;
        `;
    if (resp.rowCount > 0) {
      return { totalPredictions: resp.rows[0].total_predictions };
    }
    throw new Error("No Item found");
  } catch (error) {
    return 0;
  }
};

const predictionsByProvider = async function (
  provider: "farcaster" | "wallet" | "twitter"
) {
  try {
    const resp = await sql`
SELECT
    COUNT(*) AS predictions
FROM
    predictions p
JOIN
    login_providers lp ON p.user_id = lp.user_id
WHERE
    lp.provider_name = ${provider};

        `;
    if (resp.rowCount > 0) {
      return { provider: provider, data: resp.rows as Predictions[] };
    }
    throw new Error("No Item found");
  } catch (error) {
    return 0;
  }
};

const totalPredictionsByProvider = async function (
  provider: "farcaster" | "wallet" | "twitter"
) {
  try {
    const resp = await sql`
SELECT
    DATE(p.predicted_at) AS date,
    COUNT(*) AS predictions
FROM
    predictions p
JOIN
    login_providers lp ON p.user_id = lp.user_id
WHERE
    lp.provider_name = ${provider}
GROUP BY
    DATE(p.predicted_at)
ORDER BY
    DATE(p.predicted_at);

        `;
    if (resp.rowCount > 0) {
      return { provider: provider, data: resp.rows as Predictions[] };
    }
    throw new Error("No Item found");
  } catch (error) {
    return 0;
  }
};

const createStats = async function () {
  const d1 = await totalUsersPerProvider();
  const d2 = await usersPerProvider();
  const d3 = await totalUsersPerDay();
  const d4 = await totalUsers();
  const d5 = await predictionsPerDay();
  const d6 = await totalPredictions();
  const d7 = await predictionsByProvider("farcaster");
  const d8 = await predictionsByProvider("twitter");
  const d9 = await predictionsByProvider("wallet");
  const d10 = await totalPredictionsByProvider("farcaster");
  const d11 = await totalPredictionsByProvider("twitter");
  const d12 = await totalPredictionsByProvider("wallet");
  return {
    totalUsersPerProvider: d1,
    usersPerProvider: d2,
    totalUsersPerDay: d3,
    totalUsers: d4,
    predictionsPerDay: d5,
    totalPredictions: d6,
    farcasterPredictions: d7,
    twitterPredictions: d8,
    walletPredictions: d9,
    totalFarcasterPredictions: d10,
    totalTwitterPredictions: d11,
    totalWalletPredictions: d12,
  };
};

export const GET = async function (request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.STATS_SECRET}`) {
    logger.error(`Cron Job:: Unathorised access prevented, ip: ${request.ip}`);
    return new Response("Unauthorized stats access", {
      status: 401,
    });
  }
  logger.info("Stats called");
  const stats = await createStats();
  logger.info("Stats created");
  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: HEADERS,
  });
};
