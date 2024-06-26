CREATE OR REPLACE PROCEDURE public.update_leaderboard()
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
    user_rec RECORD;
    pred_rec RECORD;
    user_points INTEGER;
BEGIN
    -- Start a transaction
    BEGIN
        -- Lock the tables to ensure consistency
        LOCK TABLE public.leaderboard IN EXCLUSIVE MODE;
        LOCK TABLE public.predictions IN SHARE ROW EXCLUSIVE MODE;
        LOCK TABLE public.matches IN SHARE ROW EXCLUSIVE MODE;

        -- Step 1: Clear existing awards
        UPDATE public.leaderboard
        SET award = 0;

        -- Iterate over each user
        FOR user_rec IN (SELECT DISTINCT user_id FROM predictions WHERE counted = false) LOOP
            user_points := 1;  -- Reset points for the user

            -- Iterate over each prediction for the user in order of matchNumber
            FOR pred_rec IN (
                SELECT p.prediction_id, p.user_id, p.prediction, m.winner_id, p.predicted_at, m.match_date
                FROM predictions p
                JOIN matches m ON p.match_id = m.match_id
                WHERE p.user_id = user_rec.user_id
                AND p.counted = false
                AND m.winner_id != -1
                ORDER BY m.matchNumber
            ) LOOP
                IF pred_rec.prediction = pred_rec.winner_id THEN
                    user_points := user_points * 2;
                ELSE
                    user_points := 1;
                END IF;

                -- Insert or update the leaderboard for the user
                INSERT INTO leaderboard (user_id, points)
                VALUES (pred_rec.user_id, user_points)
                ON CONFLICT (user_id) DO UPDATE
                SET points = EXCLUDED.points;

                -- Mark the prediction as counted
                UPDATE predictions
                SET counted = true
                WHERE prediction_id = pred_rec.prediction_id;
            END LOOP;
        END LOOP;

        -- Step 2: Update leaderboard with average prediction time difference
        WITH avg_prediction_time_diff AS (
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
        SET avg_time_diff = ap.avg_time_diff
        FROM avg_prediction_time_diff ap
        WHERE lb.user_id = ap.user_id;

        -- Step 3: Update awards based on points and average prediction time difference
        WITH ranked_leaderboard AS (
            SELECT user_id, points, avg_time_diff,
                   ROW_NUMBER() OVER (ORDER BY points DESC, avg_time_diff DESC) AS rank
            FROM public.leaderboard
        )
        UPDATE public.leaderboard lb
        SET award = CASE
                       WHEN rl.rank = 1 THEN 100000
                       WHEN rl.rank = 2 THEN 50000
                       WHEN rl.rank = 3 THEN 30000
                       WHEN rl.rank BETWEEN 4 AND 10 THEN 10000
                       ELSE 0
                   END
        FROM ranked_leaderboard rl
        WHERE lb.user_id = rl.user_id;

        -- Commit the transaction
        COMMIT;
    EXCEPTION
        -- Rollback in case of error
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END;
END;
$BODY$;
ALTER PROCEDURE public.update_leaderboard()
    OWNER TO "default";
