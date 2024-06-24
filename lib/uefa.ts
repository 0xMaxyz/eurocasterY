export interface MatchWithoutResult {
  id: string;
  awayTeam: Team;
  behindClosedDoors: boolean;
  competition: any;
  group: Groups;
  homeTeam: Team;
  kickOffTime: {
    date: string;
    dateTime: string;
    utcOffsetInHours: number;
  };
  lineupStatus: any;
  matchNumber: number;
  matchday: any;
  referees: any;
  round: any;
  seasonYear: string;
  sessionNumber: number;
  stadium: Stadium;
  status: string;
  type: string;
}

export interface MatchWithResult extends MatchWithoutResult {
  fullTimeAt: string | null;
  matchAttendance: number | null;
  score: Score | ScoreWithPenalty | null;
  playerEvents: any;
  winner: Winner;
  condition: any;
}

export type Match = MatchWithoutResult | MatchWithResult;

export interface Winner {
  match: {
    reason: string;
    team: Team;
  };
}

export interface Team {
  associationId: string;
  associationLogoUrl: string;
  bigLogoUrl: string;
  confederationType: string;
  countryCode: string;
  id: string;
  idProvider: string;
  internationalName: string;
  isPlaceHolder: boolean;
  logoUrl: string;
  mediumLogoUrl: string;
  organizationId: string;
  teamCode: string;
  teamTypeDetail: string;
  translations: any;
  typeIsNational: boolean;
  typeTeam: string;
}

export interface Groups {
  competitionId: string;
  id: string;
  metaData: { groupName: string; groupShortName: string };
  order: number;
  phase: string;
  roundId: string;
  seasonYear: string;
  teams: string[];
  teamsQualifiedNumber: number;
  translations: any;
  type: string;
}

export interface Stadium {
  address: string;
  capacity: number;
  city: {
    countryCode: string;
    id: string;
    translations: any;
  };
  countryCode: string;
  geolocation: { latitude: number; longitude: number };
  id: string;
  images: {
    MEDIUM_WIDE: string;
    LARGE_ULTRA_WIDE: string;
  };
  openingDate: string;
  pitch: { length: number; width: number };
  translations: any;
}

export interface Score {
  regular: {
    away: number;
    home: number;
  };
  total: {
    away: number;
    home: number;
  };
}

export interface ScoreWithPenalty extends Score {
  penalty: {
    away: number;
    home: number;
  };
}
