import { Winner } from "../uefa";

export interface createMatchDto {
  awayTeam_short: string;
  homeTeam_short: string;
  match_date: string;
  status: string;
  match_number: number;
  winner: string | null;
}

export interface createGroupDTO {
  group_name: string;
}

export interface createTeamDTO {
  country: string;
  country_short: string;
  uefa_id: number;
  logo: string;
}

export interface predictDto {
  user_id: string;
  match_id: string;
  prediction: number | string;
}

export interface predictResponseDto {
  has_error: boolean;
  error_message: string | null;
  prediction_id: string | null;
}

export interface MatchAndTeamInfo {
  match_id: number;
  awayTeam_id: number;
  away_country: string;
  away_country_short: string;
  away_logo: string;
  homeTeam_id: number;
  home_country: string;
  home_country_short: string;
  home_logo: string;
  match_date: string;
  status: string;
  winner_id: number;
}

export interface LeaderboardData {
  user_id: string;
  username: string;
  profile_picture: string;
  points: number;
  award: number;
  rank: number;
  provider_name: string;
  provider_identifier: string;
}
