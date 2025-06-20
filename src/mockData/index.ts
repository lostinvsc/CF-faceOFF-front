import { User, Contest, Submission, Problem } from '../types';

export const mockUser: User = {
  handle: "tourist",
  rating: 3779,
  maxRating: 3783,
  rank: "legendary grandmaster",
  maxRank: "legendary grandmaster",
  contribution: 164,
  friendOfCount: 12424,
  lastOnlineTimeSeconds: 1709743454,
  registrationTimeSeconds: 1269352444
};

export const mockContests: Contest[] = [
  {
    id: 1,
    name: "Codeforces Round #900",
    type: "CF",
    phase: "FINISHED",
    frozen: false,
    durationSeconds: 7200,
    startTimeSeconds: 1709743454,
    relativeTimeSeconds: -1
  },
  // Add more mock contests...
];

export const mockSubmissions: Submission[] = [
  {
    id: 1,
    contestId: 1,
    creationTimeSeconds: 1709743454,
    relativeTimeSeconds: 3600,
    problem: {
      contestId: 1,
      problemsetName: "PRACTICE",
      index: "A",
      name: "Beautiful Matrix",
      type: "PROGRAMMING",
      points: 1000,
      rating: 800,
      tags: ["implementation", "math"]
    },
    author: {
      contestId: 1,
      members: [{ handle: "tourist" }],
      participantType: "CONTESTANT",
      ghost: false,
      startTimeSeconds: 1709743454
    },
    programmingLanguage: "C++",
    verdict: "OK",
    testset: "TESTS",
    passedTestCount: 10,
    timeConsumedMillis: 15,
    memoryConsumedBytes: 262144
  },
  // Add more mock submissions...
];

export const mockProblems: Problem[] = [
  {
    contestId: 1,
    problemsetName: "PRACTICE",
    index: "A",
    name: "Beautiful Matrix",
    type: "PROGRAMMING",
    points: 1000,
    rating: 800,
    tags: ["implementation", "math"]
  },
  // Add more mock problems...
];