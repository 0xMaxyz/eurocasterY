-- PROCEDURE: public.upsert_matches(jsonb)

-- DROP PROCEDURE IF EXISTS public.upsert_matches(jsonb);

CREATE OR REPLACE PROCEDURE public.upsert_matches(
	IN matches jsonb)
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
    match jsonb;
    p_away_country_short VARCHAR(3);
    p_home_country_short VARCHAR(3);
    p_match_date TIMESTAMP;
    p_status VARCHAR;
    p_winner VARCHAR;
    p_matchNumber INT;
    v_awayTeam_id INT;
    v_homeTeam_id INT;
    v_winner_id INT := -1; -- default value if winner_id is not provided
BEGIN
    FOR match IN SELECT * FROM jsonb_array_elements(matches) LOOP
        p_away_country_short := match->>'awayTeam_short';
        p_home_country_short := match->>'homeTeam_short';
        p_match_date := (match->>'match_date')::TIMESTAMP;
        p_status := match->>'status';
        p_matchNumber := (match->>'match_number')::INT;
        p_winner := match->>'winner';

        -- Get the team IDs based on the country short codes
        SELECT team_id INTO v_awayTeam_id
        FROM teams
        WHERE country_short = p_away_country_short;

        SELECT team_id INTO v_homeTeam_id
        FROM teams
        WHERE country_short = p_home_country_short;

        -- Check if the team IDs were found
        IF v_awayTeam_id IS NULL THEN
            RAISE EXCEPTION 'awayTeam_id for country short "%" not found', p_away_country_short;
        END IF;
        
        IF v_homeTeam_id IS NULL THEN
            RAISE EXCEPTION 'homeTeam_id for country short "%" not found', p_home_country_short;
        END IF;

        -- Determine the winner_id based on input
        IF p_winner IS NOT NULL THEN
            IF p_winner ~ '^[0-9]+$' THEN
                v_winner_id := p_winner::INT;
            ELSIF LENGTH(p_winner) = 3 THEN
                SELECT team_id INTO v_winner_id
                FROM teams
                WHERE country_short = p_winner;

                IF v_winner_id IS NULL THEN
                    RAISE EXCEPTION 'winner_id for country short "%" not found', p_winner;
                END IF;
            ELSE
                RAISE EXCEPTION 'Invalid winner format: %', p_winner;
            END IF;
        ELSE
            v_winner_id := -1; -- default if winner_id is not provided
        END IF;

        INSERT INTO matches (awayTeam_id, homeTeam_id, match_date, status, winner_id, matchNumber)
        VALUES (v_awayTeam_id, v_homeTeam_id, p_match_date, p_status, v_winner_id, p_matchNumber)
        ON CONFLICT (matchNumber) DO UPDATE
        SET awayTeam_id = EXCLUDED.awayTeam_id,
            homeTeam_id = EXCLUDED.homeTeam_id,
            match_date = EXCLUDED.match_date,
            status = EXCLUDED.status,
            winner_id = EXCLUDED.winner_id;
    END LOOP;
END;
$BODY$;
ALTER PROCEDURE public.upsert_matches(jsonb)
    OWNER TO "default";
