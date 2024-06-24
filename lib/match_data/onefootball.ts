interface OneFootballData {
  id: number;
  kickoff: string;
  score_home: number;
  score_away: number;
  team_home: OFTeam;
  team_away: OFTeam;
  competition: {
    id: number;
    name: string;
    images: OFImage[];
  };
  season: {
    id: number;
  };
  matchday: {
    id: number;
    name: string;
    number: number;
    type: number;
  };
  group_name: string;
  minute: number;
  minute_display: number;
  period: string;
  score_home_first_half: number;
  score_away_first_half: number;
  coverage: {
    has_live_scores: boolean;
    has_minute: boolean;
  };
}

interface OFImage {
  width: number;
  height: number;
  url: string;
}

interface OFTeam {
  id: number;
  name: string;
  is_national: boolean;
  images: OFImage[];
}
