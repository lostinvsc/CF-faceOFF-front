export interface User {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  contribution: number;
  friendOfCount: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  titlePhoto: string;
  avatar: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  organization: string;
  title: string;
}

export interface Contest {
  id: number;
  name: string;
  type: string;
  phase: string;
  frozen: boolean;
  durationSeconds: number;
  startTimeSeconds: number;
  relativeTimeSeconds: number;
}

export interface Submission {
  id: number;
  contestId: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: {
    contestId: number;
    index: string;
    name: string;
    type: string;
    points: number;
    rating: number;
    tags: string[];
  };
  author: {
    contestId: number;
    members: string[];
    participantType: string;
    ghost: boolean;
    startTimeSeconds: number;
  };
  programmingLanguage: string;
  verdict: string;
  testset: string;
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
}

export interface Problem {
  contestId: number;
  index: string;
  name: string;
  type: string;
  rating?: number;
  tags: string[];
}

export interface RatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface ApiService {
  getUser: (handle: string) => Promise<User>;
  getUserSubmissions: (handle: string) => Promise<Submission[]>;
  getRatingHistory: (handle: string) => Promise<RatingChange[]>;
  getUsers: (handles: string[]) => Promise<User[]>;
  getUsersSubmissions: (handles: string[]) => Promise<{ [key: string]: Submission[] }>;
  logVisit: (action: 'SEARCH' | 'COMPARE', handles: string[], path: string) => Promise<void>;
  getVisitorStats: () => Promise<{
    totalVisits: number;
    dailyVisits: number;
    weeklyVisits: number;
    monthlyVisits: number;
    uniqueVisitors: number;
    topSearchedHandles: Array<{ _id: string; count: number }>;
    topComparedHandles: Array<{ _id: string; count: number }>;
  }>;
}