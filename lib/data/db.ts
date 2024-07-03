import { sql } from "@vercel/postgres";
import { v4 as uuidv4 } from "uuid";
import logger from "../logger";
import {
  LeaderboardData,
  MatchAndTeamInfo,
  createMatchDto,
  createTeamDTO,
  predictDto,
  predictResponseDto,
} from "./dtos";
import { getFarcasterData } from "../functions";

export const createTables = async function () {
  try {
    await sql`
  CREATE TABLE processed_events (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

    // Create Teams Table
    await sql`
    CREATE TABLE IF NOT EXISTS teams (
    team_id SERIAL PRIMARY KEY,
    uefa_id INT NOT NULL,
    country VARCHAR NOT NULL UNIQUE,
    country_short VARCHAR(3) NOT NULL UNIQUE,
    logo VARCHAR
    );
`;

    // Create Matches Table
    await sql`
    CREATE TABLE IF NOT EXISTS matches (
    match_id SERIAL PRIMARY KEY,
    awayTeam_id INT NOT NULL,
    homeTeam_id INT NOT NULL,
    match_date TIMESTAMP NOT NULL,
    status VARCHAR NOT NULL,
    winner_id INT DEFAULT -1, -- -1 match is not played yet, 0 for draw,
    matchNumber INT NOT NULL UNIQUE,
    FOREIGN KEY (awayTeam_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (homeTeam_id) REFERENCES teams(team_id) ON DELETE CASCADE
    );
`;

    // Create Users Table
    await sql`
    CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
    username VARCHAR UNIQUE,
    profile_picture VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

    // Create Login Providers Table
    await sql`
    CREATE TABLE IF NOT EXISTS login_providers (
    provider_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    provider_name VARCHAR(50) NOT NULL,
    provider_identifier VARCHAR(255) NOT NULL,
    UNIQUE(provider_name, provider_identifier),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE
);
`;

    // Create Predictions Table
    await sql`
    CREATE TABLE IF NOT EXISTS predictions (
    prediction_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    match_id INT NOT NULL,
    prediction INT NOT NULL, -- 0 for draw, or team id for winner
    predicted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    counted BOOLEAN DEFAULT false,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
    );
`;

    // Create Leaderboard Table
    await sql`
    CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY, 
    user_id UUID NOT NULL, 
    points INT NOT NULL DEFAULT 0,
    award INT NOT NULL DEFAULT 0,
    avg_time_diff DOUBLE PRECISION DEFAULT 0.0,
    UNIQUE (user_id),
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE
    );
`;
    logger.info("Db:: Tables created.");
  } catch (error) {
    logger.error(`Db:: Can't create tables, ${error}`);
  }
};

export const addMatch = async function (
  dto: createMatchDto
): Promise<number | null> {
  try {
    const result = await sql`
    INSERT INTO matches (awayTeam_id, homeTeam_id, match_date, status, winner_id)
      VALUES (
        (SELECT team_id FROM teams WHERE country_short = ${dto.awayTeam_short}),
        (SELECT team_id FROM teams WHERE country_short = ${dto.homeTeam_short}),
        ${dto.match_date},
        ${dto.status.toString()},
        -1
      )
      RETURNING match_id;
  `;
    logger.info(`Db:: New Match added, id: ${result.rows[0].id}`);
    return result.rows[0].id as number;
  } catch (error) {
    logger.error(`Db:: Can't add a match, ${error}`);
    return null;
  }
};

export const addOrUpdateMatch = async function (match: createMatchDto) {
  try {
    await sql`
    CALL public.upsert_match(${match.awayTeam_short}, ${match.homeTeam_short}, ${match.match_date}, ${match.status}, ${match.match_number}, ${match.winner});
    `;
    logger.info(`Db:: Match upsert called.`);
  } catch (error) {
    logger.error(`Db:: Match upsert failed, ${error}`);
  }
};

export interface LeaderboardDataWithRanks {
  topUsers: LeaderboardData[];
  currentUser: LeaderboardData;
  totalItems: number;
}

export const getLeaderboardData = async function (
  user_id: string | null,
  page: number,
  pageSize: number
): Promise<LeaderboardDataWithRanks | null> {
  try {
    const offset = (page - 1) * pageSize;
    // Get top 20 users by points
    const resp1 = await sql`
    WITH ranked_users AS (
    SELECT
        u.user_id,
        u.username,
        u.profile_picture,
        l.points,
        l.award,
        lb.avg_time_diff,
        RANK() OVER (ORDER BY l.award DESC, l.points DESC, lb.avg_time_diff DESC) AS rank
    FROM
        users u
    JOIN leaderboard l ON u.user_id = l.user_id
    LEFT JOIN (
        SELECT user_id, avg_time_diff
        FROM leaderboard
    ) lb ON u.user_id = lb.user_id
)
SELECT
    ru.*,
    lp.provider_identifier,
    lp.provider_name
FROM
    ranked_users ru
JOIN
    login_providers lp ON ru.user_id = lp.user_id
ORDER BY
    ru.award DESC, ru.points DESC, ru.avg_time_diff DESC
    LIMIT ${pageSize} OFFSET ${offset};
    `;
    const totalUsers = await sql`
    SELECT COUNT(*) FROM leaderboard;
    `;
    const totalItems = parseInt(totalUsers.rows[0].count);

    let topUsers: LeaderboardData[] = [];
    let currentUser: LeaderboardData = {
      user_id: "",
      username: "",
      profile_picture: "",
      points: 0,
      award: 0,
      rank: 0,
      provider_identifier: "",
      provider_name: "",
    };

    if (resp1.rowCount > 0) {
      topUsers = resp1.rows.map((u) => {
        const {
          user_id,
          username,
          profile_picture,
          points,
          award,
          rank,
          provider_name,
          provider_identifier,
        } = u;
        return {
          user_id,
          username,
          profile_picture,
          points,
          award,
          rank,
          provider_name,
          provider_identifier,
        };
      });
    }

    if (user_id) {
      const resp2 = await sql`
      WITH ranked_users AS (
    SELECT
        u.user_id,
        u.username,
        u.profile_picture,
        l.points,
        l.award,
        lb.avg_time_diff,
        RANK() OVER (ORDER BY l.award DESC, l.points DESC, lb.avg_time_diff DESC) AS rank
    FROM
        users u
    JOIN leaderboard l ON u.user_id = l.user_id
    LEFT JOIN (
        SELECT user_id, avg_time_diff
        FROM leaderboard
    ) lb ON u.user_id = lb.user_id
)
    SELECT *
    FROM ranked_users
    WHERE user_id = ${user_id};
      `;

      if (resp2.rowCount > 0) {
        const { user_id, username, profile_picture, points, award, rank } =
          resp2.rows[0];
        currentUser = {
          user_id,
          username,
          profile_picture,
          points,
          award,
          rank,
          provider_identifier: "",
          provider_name: "",
        };
      }
    }
    //console.log("topUsers:", topUsers, "currentUser:", currentUser);
    return {
      topUsers: topUsers,
      currentUser: currentUser,
      totalItems: totalItems,
    };
  } catch (error) {
    console.error(`Db:: Error reading leaderboard, ${error}`);
    return null;
  }
};

export const isEventProcessed = async function (message_id: string) {
  try {
    const resp = await sql`
  SELECT message_id FROM processed_events WHERE message_id = ${message_id}
  `;
    return resp.rowCount != 0;
  } catch (error) {
    throw new Error(`Error reading from database, ${error}`);
  }
};

export const saveNewEvent = async function (message_id: string) {
  try {
    const resp = await sql`
      INSERT INTO processed_events (message_id) VALUES (${message_id}) 
  `;
  } catch (error) {
    throw new Error(`Error saving user create message id`);
  }
};

export const addOrUpdateMatches = async function (matches: createMatchDto[]) {
  const newMatches = matches.map((team) => {
    if (team.winner) {
      team;
    } else {
      {
        team.awayTeam_short,
          team.homeTeam_short,
          team.match_date,
          team.status,
          team.match_number;
      }
    }
  });
  try {
    await sql`
    CALL public.upsert_matches(${JSON.stringify(matches)});
    `;
    logger.info(`Db:: Batch Match upsert called.`);
  } catch (error) {
    logger.error(`Db:: Batch Match upsert failed, ${error}`);
  }
};

export const addTeam = async function (
  dto: createTeamDTO
): Promise<number | null> {
  try {
    const result = await sql`
    INSERT INTO teams (country, country_short, uefa_id, logo)
    VALUES (${dto.country}, ${dto.country_short}, ${dto.uefa_id}, ${dto.logo})
  RETURNING team_id;
  `;
    logger.info(`Db:: New Team added, id: ${result.rows[0].id}`);
    return result.rows[0].team_id as number;
  } catch (error) {
    logger.error(`Db:: Can't add a Team, ${error}`);
    return null;
  }
};

export interface userVoteDto {
  match_id: string;
  prediction: string;
}

export const getUserVotes = async function (
  user_id: string
): Promise<userVoteDto[]> {
  try {
    const query = `
    SELECT p.match_id, COALESCE(t.country_short, '0') as prediction
    FROM predictions p
    LEFT JOIN teams t ON p.prediction = t.team_id
    WHERE p.user_id = $1;
    `;

    console.log(query);
    console.log("value", user_id);

    const resp = await sql.query(query, [user_id]);

    if (resp.rowCount > 0) {
      console.log("votes found");
      const result: userVoteDto[] = resp.rows.map((row) => {
        return {
          match_id: row.match_id as string,
          prediction: row.prediction as string,
        };
      });
      return result;
    } else {
      return [];
    }
  } catch (error) {
    console.error(`Db:: No votes found for user with user_id of ${user_id}`);
    return [];
  }
};

export const getAllMatches = async function (): Promise<
  MatchAndTeamInfo[] | null
> {
  try {
    const resp = await sql`
  SELECT 
    m.match_id,
    m.awayTeam_id,
    away.country AS away_country,
    away.country_short AS away_country_short,
    away.logo AS away_logo,
    m.homeTeam_id,
    home.country AS home_country,
    home.country_short AS home_country_short,
    home.logo AS home_logo,
    m.match_date,
    m.status,
    m.winner_id
FROM 
    matches m
JOIN 
    teams away ON m.awayTeam_id = away.team_id
JOIN 
    teams home ON m.homeTeam_id = home.team_id
WHERE 
    m.status = 'UPCOMING'
ORDER BY 
    m.match_date ASC;
  `;
    if (resp.rowCount > 0) {
      let matches: MatchAndTeamInfo[] = [];
      for (let i = 0; i < resp.rowCount; i++) {
        matches.push({
          match_id: resp.rows[i].match_id,
          awayTeam_id: resp.rows[i].awayTeam_id,
          away_country: resp.rows[i].away_country,
          away_country_short: resp.rows[i].away_country_short,
          away_logo: resp.rows[i].away_logo,
          homeTeam_id: resp.rows[i].homeTeam_id,
          home_country: resp.rows[i].home_country,
          home_country_short: resp.rows[i].home_country_short,
          home_logo: resp.rows[i].home_logo,
          match_date: resp.rows[i].match_date,
          status: resp.rows[i].status,
          winner_id: resp.rows[i].winner_id,
        });
      }
      return matches;
    } else {
      return null;
    }
  } catch (error) {
    logger.error(`Db:: Can't get match  info, ${error}`);
    return null;
  }
};

export const getMatchInfo = async function (home: string, away: string) {
  if (home.length != 3 && away.length != 3) {
    logger.error(
      `Wrong input args for team names; home: ${home}, away: ${away}`
    );
    return null;
  }
  try {
    const resp = await sql`
  SELECT  
  m.match_date,
  m.match_id
  FROM matches m
  JOIN teams t1 ON m.homeTeam_id = t1.team_id
  JOIN teams t2 ON m.awayTeam_id = t2.team_id
  WHERE (t1.country_short = ${home.toUpperCase()} AND t2.country_short = ${away.toUpperCase()})
  OR (t1.country_short = ${away.toUpperCase()} AND t2.country_short = ${home.toUpperCase()})
  LIMIT 1;
  `;
    if (resp.rowCount > 0) {
      return {
        match_date: resp.rows[0].match_date,
        match_id: resp.rows[0].match_id,
      };
    } else {
      logger.error(`Db:: No match found`);
      return null;
    }
  } catch (error) {
    logger.error(`Db:: No match found, ${error}`);
    return null;
  }
};

const negFid = async function (): Promise<number> {
  try {
    const resp = await sql`
    select nextval('negative_fid_seq') as val;
    `;
    if (resp.rowCount > 0) {
      return resp.rows[0].val as number;
    } else {
      throw new Error("Error reading the next neg FID number from database.");
    }
  } catch (error) {
    throw error;
  }
};

export const predict = async function (
  dto: predictDto
): Promise<predictResponseDto> {
  try {
    const user_id = dto.user_id;

    // Step 1: Check if the current time is less than the match date
    const matchResult = await sql`
      SELECT match_date FROM matches WHERE match_id = ${dto.match_id}
    `;
    if (matchResult.rows.length === 0) {
      logger.error(`Match with id ${dto.match_id} not found`);
      return {
        has_error: true,
        error_message: `Match with id ${dto.match_id} not found`,
        prediction_id: null,
      };
    }
    const matchDate = new Date(matchResult.rows[0].match_date);
    const currentTime = new Date();
    const currentTimeUTC = new Date(
      currentTime.getTime() + currentTime.getTimezoneOffset() * 60000
    );

    if (currentTimeUTC >= matchDate) {
      logger.error(
        "Prediction unavailable for matches that have already begun or concluded."
      );
      return {
        has_error: true,
        error_message:
          "Prediction unavailable for matches that have already begun or concluded.",
        prediction_id: null,
      };
    }

    // Step 2: Determine the team_id or use 0 for a draw
    let team_id = 0;
    if (dto.prediction !== "0") {
      const teamResult = await sql`
        SELECT team_id FROM teams WHERE country_short = ${dto.prediction}
      `;
      if (teamResult.rows.length === 0) {
        logger.error(`Team with country_short ${dto.prediction} not found`);
        return {
          has_error: true,
          error_message: `Team with country_short ${dto.prediction} not found`,
          prediction_id: null,
        };
      }
      team_id = teamResult.rows[0].team_id;
    }

    // Step 3: Check if the user already has a prediction for the match
    const predictionResult = await sql`
      SELECT prediction_id FROM predictions WHERE user_id = ${user_id} AND match_id = ${dto.match_id}
    `;

    let prediction_id;
    if (predictionResult.rows.length > 0) {
      // Update the existing prediction
      prediction_id = predictionResult.rows[0].prediction_id;
      await sql`
        UPDATE predictions
        SET prediction = ${team_id}, predicted_at = NOW()
        WHERE prediction_id = ${prediction_id}
      `;
      logger.info(`Db:: Prediction updated, id: ${prediction_id}`);
    } else {
      // Insert a new prediction
      const newPredictionResult = await sql`
        INSERT INTO predictions (user_id, match_id, prediction)
        VALUES (${user_id}, ${dto.match_id}, ${team_id})
        RETURNING prediction_id
      `;
      prediction_id = newPredictionResult.rows[0].prediction_id;
      logger.info(`Db:: New prediction added, id: ${prediction_id}`);
    }

    return {
      has_error: false,
      error_message: null,
      prediction_id,
    };
  } catch (error) {
    logger.error(`Can't add prediction, ${error}`);
    return {
      has_error: true,
      error_message: `Can't add prediction, ${error}`,
      prediction_id: null,
    };
  }
};

export const updateLeaderboard = async function () {
  try {
    // await sql`
    //   UPDATE predictions SET counted = false;
    //   `;
    // await sql`
    //   DELETE FROM leaderboard;
    //   `;
    await sql`
      CALL update_leaderboard2();
    `;
    logger.info("Db:: Prediction points updated");
  } catch (error) {
    logger.error(
      `Db:: error hapened when trying to calculate new points, ${error}`
    );
  }
};

export async function getUserByProvider(
  providerName: string,
  providerIdentifier: string
): Promise<string | null> {
  try {
    const result = await sql`
      SELECT user_id FROM login_providers WHERE provider_name = ${providerName} AND provider_identifier = ${providerIdentifier}
    `;
    return result.rows.length > 0 ? result.rows[0].user_id : null;
  } catch (error) {
    logger.error(`Db:: Error executing getUserByProvider query, ${error}`);
    return null;
  }
}

export interface NewUser {
  user_id: string;
  username: string;
  profile_picture?: string;
}

async function createNewUser(fid: number): Promise<NewUser> {
  try {
    // get farcaster data
    let pfp: string = "";
    let username: string = "";

    try {
      const farcasterData = await getFarcasterData(`"${fid}"`);
      if (farcasterData && farcasterData.length > 0) {
        pfp = farcasterData[0].profileImage;
        username = farcasterData[0].profileName;
      }
    } catch {
      // use default null values for user_name and pfp if any error happens
    }

    // Generate a new UUID for the user
    const userId = uuidv4();

    // Insert into users table
    const userQuery = {
      text: "INSERT INTO users(user_id, created_at, username, profile_picture) VALUES($1, NOW(), $2, $3) RETURNING *",
      values: [userId, username, pfp],
    };

    const userResult = await sql.query(userQuery);
    const newUser = userResult.rows[0];

    // Insert into login_providers table
    const loginProviderQuery = {
      text: "INSERT INTO login_providers(user_id, provider_name, provider_identifier) VALUES($1, $2, $3)",
      values: [userId, "farcaster", fid.toString()],
    };

    await sql.query(loginProviderQuery);

    return {
      user_id: newUser.user_id,
      username: newUser.username,
      profile_picture: newUser.profile_picture,
    };
  } catch (error) {
    // Rollback transaction in case of error
    logger.error("Error executing createNewUser query:", error);
    throw error;
  }
}

export async function getUserOrCreate(fid: number): Promise<string> {
  try {
    const existingUserId = await getUserByProvider("farcaster", fid.toString());

    if (existingUserId) {
      return existingUserId;
    } else {
      const newUser = await createNewUser(fid);

      return newUser.user_id;
    }
  } catch (error) {
    console.error("Error in getUserOrCreate:", error);
    throw error;
  }
}
