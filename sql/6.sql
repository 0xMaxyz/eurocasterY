CREATE OR REPLACE PROCEDURE public.update_leaderboard
()
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
    user_rec RECORD;
    pred_rec RECORD;
    user_points INTEGER;
    current_points INTEGER;
BEGIN
    -- Step 1: Clear existing awards
    UPDATE public.leaderboard
    SET award = 0;

    -- Step 2: Create a temporary table to accumulate points
    CREATE TEMP TABLE temp_leaderboard
    (
        user_id UUID PRIMARY KEY,
        points INTEGER
    );

-- Iterate over each user with uncounted predictions
FOR user_rec IN
(SELECT DISTINCT user_id
FROM predictions
WHERE counted = false)
LOOP
-- Retrieve current points for the user
SELECT points
INTO current_points
FROM leaderboard
WHERE user_id = user_rec.user_id;

IF current_points IS NULL THEN
            current_points := 1;
-- Start with 1 point if the user is not in the leaderboard
END
IF;

        -- Iterate over each prediction for the user in order of matchNumber
        FOR pred_rec IN
(
            SELECT p.prediction_id, p.user_id, p.prediction, m.winner_id, p.predicted_at, m.match_date
FROM predictions p
    JOIN matches m ON p.match_id = m.match_id
WHERE p.user_id = user_rec.user_id
    AND p.counted = false
    AND m.winner_id != -1
ORDER BY m.matchNumber
) LOOP
IF pred_rec.prediction = pred_rec.winner_id THEN
                current_points := current_points * 2;  -- Multiply points by 2 for a correct prediction
            ELSE
                current_points := 1;
-- Reset points to 1 for a wrong prediction
END
IF;

            -- Mark the prediction as counted
            UPDATE predictions
            SET counted = true
            WHERE prediction_id = pred_rec.prediction_id;
END LOOP;

-- Insert or update the temporary leaderboard for the user
INSERT INTO temp_leaderboard
    (user_id, points)
VALUES
    (user_rec.user_id, current_points)
ON CONFLICT
(user_id) DO
UPDATE
        SET points = EXCLUDED.points;
END LOOP;

-- Bulk update the leaderboard with accumulated points from the temporary table
UPDATE leaderboard lb
SET points
= tl.points
    FROM temp_leaderboard tl
    WHERE lb.user_id = tl.user_id;

-- Update leaderboard with average prediction time difference
WITH
    avg_prediction_time_diff
    AS
    (
        SELECT
            p.user_id,
            AVG(EXTRACT(EPOCH FROM (m.match_date - p.predicted_at))) AS avg_time_diff
        FROM
            predictions p
            JOIN matches m ON p.match_id = m.match_id
        WHERE
            p.counted = true
            AND (
                (p.prediction = 0 AND m.winner_id = 0)
            OR p.prediction = m.winner_id          
            )
        GROUP BY
            p.user_id
    )
    UPDATE leaderboard lb
SET avg_time_diff
= ap.avg_time_diff
    FROM avg_prediction_time_diff ap
    WHERE lb.user_id = ap.user_id;

-- Update awards based on points and average prediction time difference
WITH
    ranked_leaderboard
    AS
    (
        SELECT user_id, points, avg_time_diff,
            ROW_NUMBER() OVER (ORDER BY points DESC, avg_time_diff DESC) AS rank
        FROM public.leaderboard
    )
    UPDATE public.leaderboard lb
SET
award = CASE
                   WHEN rl.rank = 1 THEN 100000
                   WHEN rl.rank = 2 THEN 50000
                   WHEN rl.rank = 3 THEN 30000
                   WHEN rl.rank BETWEEN 4 AND 10 THEN 10000
                   ELSE 0
END
    FROM ranked_leaderboard rl
    WHERE lb.user_id = rl.user_id;

-- Drop the temporary table
DROP TABLE temp_leaderboard;

END;
$BODY$;
ALTER PROCEDURE public.update_leaderboard()
    OWNER TO "default";
