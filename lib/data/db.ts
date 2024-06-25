import { sql } from "@vercel/postgres";
import logger from "../logger";
import {
  LeaderboardData,
  MatchAndTeamInfo,
  createMatchDto,
  createTeamDTO,
  predictDto,
  predictResponseDto,
} from "./dtos";

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
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
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
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
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
    UNIQUE (user_id),
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
    );
`;
    logger.info("Db:: Tables created.");
  } catch (error) {
    logger.error(`Db:: Can't create tables, ${error}`);
  }
};

// export const addGroups = async function () {
//   try {
//     const resp = await sql`
//     INSERT INTO groups (group_name) VALUES
//     ('A'),
//     ('B'),
//     ('C'),
//     ('D'),
//     ('E'),
//     ('F');
//     `;
//     logger.info(`Db:: Groups are added.`);
//   } catch (error) {
//     logger.error(`Db:: Can't add groups, ${error}`);
//   }
// };

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
}

export const getLeaderboardData = async function (
  fid: number | null,
  x: string
): Promise<LeaderboardDataWithRanks | null> {
  try {
    const resp1 = await sql`
    WITH ranked_users AS (
    SELECT u.fid, u.x, l.points, l.award,
    RANK() OVER (ORDER BY l.points DESC) AS rank
    FROM users u
    JOIN leaderboard l ON u.user_id = l.user_id
    )
    SELECT *
    FROM ranked_users
    ORDER BY award DESC 
    LIMIT 20;
    `;
    let topUsers: LeaderboardData[] = [];
    let currentUser: LeaderboardData = {
      fid: -1,
      points: -1,
      award: -1,
      rank: -1,
      x: "",
    };
    if (resp1.rowCount > 0) {
      topUsers = resp1.rows.map((u) => {
        const { fid, points, award, rank, x } = u;
        return { fid, points, award, rank, x };
      });
    }
    if (fid) {
      const resp2 = await sql`
      WITH ranked_users AS (
      SELECT u.user_id, u.fid, u.x, l.points, l.award,
      RANK() OVER (ORDER BY l.points DESC) AS rank
      FROM users u
      JOIN leaderboard l ON u.user_id = l.user_id
      )
      SELECT *
      FROM ranked_users
      WHERE user_id = (SELECT user_id FROM users WHERE fid = ${fid})
      `;

      if (resp2.rowCount > 0) {
        const { fid, points, award, rank, x } = resp2.rows[0];
        currentUser = { fid, points, award, rank, x };
      }
    } else if (x) {
      const resp2 = await sql`
      WITH ranked_users AS (
      SELECT u.user_id, u.fid, u.x, l.points, l.award,
      RANK() OVER (ORDER BY l.points DESC) AS rank
      FROM users u
      JOIN leaderboard l ON u.user_id = l.user_id
      )
      SELECT *
      FROM ranked_users
      WHERE user_id = (SELECT user_id FROM users WHERE x = ${x})
      `;

      if (resp2.rowCount > 0) {
        const { fid, points, award, rank, x } = resp2.rows[0];
        currentUser = { fid, points, award, rank, x };
      }
    }
    return { topUsers: topUsers, currentUser: currentUser };
  } catch (error) {
    logger.error(`Db:: Error reading leaderboard, ${error}`);
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
  fid: number,
  x: string
): Promise<userVoteDto[]> {
  try {
    const query = `
    SELECT p.match_id, COALESCE(t.country_short, '0') as prediction
    FROM predictions p
    LEFT JOIN teams t ON p.prediction = t.team_id
    WHERE p.user_id = (SELECT user_id FROM users WHERE ${
      fid === 0 ? "x" : "fid"
    } = $1);
    `;

    console.log(query);
    const value = fid === 0 ? x : fid;
    console.log("value", value);

    const resp = await sql.query(query, [value]);

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
    logger.error(`Db:: No votes found for user with fid/x of ${fid}/${x}`);
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
    m.match_date >= NOW() AND m.status = 'UPCOMING'
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
    // Step 0: Get the user_id from the fid/x, or create a new user if not found
    const columnName = dto.fid === 0 ? "x" : "fid";
    const value = dto.fid === 0 ? dto.x : dto.fid;

    const query = `SELECT user_id FROM users WHERE ${columnName} = $1`;

    let userResult = await sql.query(query, [value]);
    let user_id;

    if (userResult.rows.length === 0) {
      console.log("User not found", dto);
      const createNewUserQuery = `
        INSERT INTO users (username, email, password, fid, x)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING user_id
      `;
      const fid = dto.fid === 0 ? await negFid() : dto.fid; // if fid=0, then get the next negative number from the database, otherwise use the fid
      const values = [
        dto.fid === 0 ? dto.x : dto.fid, // use x handle when account is created with X, otherwise use FID
        dto.fid === 0 ? dto.x : dto.fid, // use x handle when account is created with X, otherwise use FID
        dto.fid === 0 ? dto.x : dto.fid, // use x handle when account is created with X, otherwise use FID
        fid,
        dto.x,
      ];
      const newUserResult = await sql.query(createNewUserQuery, values);

      user_id = newUserResult.rows[0].user_id;
      logger.info(`Db:: New user created, id: ${user_id}`);
    } else {
      console.log("user found");
      user_id = userResult.rows[0].user_id;
    }

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
    await sql`
      CALL update_leaderboard();
    `;
    logger.info("Db:: Prediction points updated");
  } catch (error) {
    logger.error(
      `Db:: error hapened when trying to calculate new points, ${error}`
    );
  }
};
