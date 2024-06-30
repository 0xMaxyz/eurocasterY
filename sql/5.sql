CREATE INDEX idx_predictions_user_id ON predictions (user_id);
CREATE INDEX idx_predictions_match_id ON predictions (match_id);
CREATE INDEX idx_predictions_counted ON predictions (counted);
CREATE INDEX idx_predictions_user_id_counted_match_id ON predictions (user_id, counted, match_id);

CREATE INDEX idx_matches_awayTeam_id ON matches (awayTeam_id);
CREATE INDEX idx_matches_homeTeam_id ON matches (homeTeam_id);
CREATE INDEX idx_matches_winner_id ON matches (winner_id);
CREATE INDEX idx_matches_matchNumber ON matches (matchNumber);
