import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { userHandleState } from '../state/atoms';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, ResponsiveContainer,
  ComposedChart, Area
} from 'recharts';
import type { User, Submission, RatingChange } from '../types';

// Enhanced color palettes for different charts
const PIE_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
const VERDICT_COLORS = {
  OK: '#4CAF50',
  WRONG_ANSWER: '#FF5252',
  TIME_LIMIT_EXCEEDED: '#FFC107',
  MEMORY_LIMIT_EXCEEDED: '#FF9800',
  RUNTIME_ERROR: '#9C27B0',
  COMPILATION_ERROR: '#795548',
  PRESENTATION_ERROR: '#607D8B',
  IDLENESS_LIMIT_EXCEEDED: '#E91E63',
  CRASHED: '#D32F2F',
  PARTIAL: '#FF5722',
  CHALLENGED: '#F44336',
  SKIPPED: '#9E9E9E',
  TESTING: '#2196F3',
  REJECTED: '#FF1744',
  OTHER: '#757575'
};
const RATING_COLORS = {
  rating: '#FF6B6B',
  maxRating: '#4ECDC4'
};

// Rating colors matching Codeforces table exactly
const getRatingColor = (rating: number): string => {
  if (!rating || rating === 0) return '#000000';  // Black for unrated users
  if (rating >= 3000) return '#AA0000';  // Legendary Grandmaster
  if (rating >= 2300) return '#FF0000';  // Grandmaster
  if (rating >= 2100) return '#FF8C00';  // Master
  if (rating >= 1900) return '#800080';  // Candidate Master
  if (rating >= 1600) return '#0000FF';  // Expert
  if (rating >= 1400) return '#03A89E';  // Specialist
  if (rating >= 1200) return '#008000';  // Pupil
  return '#808080';                      // Newbie
};

const DIFFICULTY_COLORS = {
  '800': '#CCCCCC',   // Gray
  '900': '#CCCCCC',   // Gray
  '1000': '#CCCCCC',  // Gray
  '1100': '#CCCCCC',  // Gray
  '1200': '#77FF77',  // Light Green
  '1300': '#77FF77',  // Light Green
  '1400': '#77DDBB',  // Cyan
  '1500': '#77DDBB',  // Cyan
  '1600': '#AAAAFF',  // Light Blue
  '1700': '#AAAAFF',  // Light Blue
  '1800': '#AAAAFF',  // Light Blue
  '1900': '#FF88FF',  // Pink
  '2000': '#FF88FF',  // Pink
  '2100': '#FF88FF',  // Pink
  '2200': '#FFCC88',  // Orange
  '2300': '#FFCC88',  // Orange
  '2400': '#FFCC88',  // Orange
  '2500': '#FF7777',  // Red
  '2600': '#FF7777',  // Red
  '2700': '#FF7777',  // Red
  '2800': '#FF3333',  // Bright Red
  '2900': '#FF3333',  // Bright Red
  '3000': '#FF3333',  // Bright Red
  '3100': '#AA0000',  // Dark Red
  '3200': '#AA0000',  // Dark Red
  '3300': '#AA0000',  // Dark Red
  '3400': '#AA0000',  // Dark Red
  '3500': '#AA0000',  // Dark Red
};
const SCATTER_COLORS = {
  dots: '#FF6B6B',
  grid: '#E0E0E0'
};

interface DifficultyCount {
  difficulty: string;
  count: number;
}

interface DifficultyAccumulator {
  data: DifficultyCount[];
  problemKeys: Set<string>;
}

const Dashboard = () => {
  const userHandle = useRecoilValue(userHandleState);
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [contestRatingHistory, setContestRatingHistory] = useState<RatingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userHandle) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [userData, submissionsData, ratingHistoryData] = await Promise.all([
          api.getUser(userHandle),
          api.getUserSubmissions(userHandle),
          api.getRatingHistory(userHandle)
        ]);
        setUser(userData);
        setSubmissions(submissionsData);
        setContestRatingHistory(ratingHistoryData);
      } catch (err) {
        setError('Failed to fetch user data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userHandle, navigate]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">User not found</div>;
  }

  // Transform submissions data for charts
  const verdictData = submissions.reduce((acc: any[], sub) => {
    const verdict = sub.verdict;
    const existing = acc.find(v => v.name === verdict);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: verdict, value: 1 });
    }
    return acc;
  }, []);

  // Get successful submissions only
  const successfulSubmissions = submissions.filter(sub => sub.verdict === 'OK');

  // Calculate unique problems solved - ensuring we count all problems including those without contestId
  const uniqueProblemsSolved = new Set(
    successfulSubmissions
      .map(sub => {
        // For regular contest problems
        if (sub.problem.contestId && sub.problem.index) {
          return `${sub.problem.contestId}-${sub.problem.index}`;
        }
        // For gym problems (any contest with ID > 10000)
        if (sub.problem.contestId && sub.problem.contestId > 10000) {
          return `${sub.problem.contestId}-${sub.problem.index || sub.problem.name || 'unknown'}`;
        }
        // For problems with only contestId
        if (sub.problem.contestId) {
          return `${sub.problem.contestId}-${sub.problem.name || sub.problem.index || 'unknown'}`;
        }
        // For problems with only index
        if (sub.problem.index) {
          return `${sub.problem.index}-${sub.problem.name || 'unknown'}`;
        }
        // For problems with only name
        if (sub.problem.name) {
          return `${sub.problem.name}-${sub.problem.rating || 0}`;
        }
        // For problems with only rating
        if (sub.problem.rating) {
          return `rating-${sub.problem.rating}`;
        }
        // Fallback for any other case - use all available information
        return `${sub.problem.contestId || 'unknown'}-${sub.problem.index || 'unknown'}-${sub.problem.name || 'unknown'}-${sub.problem.rating || 0}`;
      })
  ).size;

  // Calculate highest rated problem solved
  const maxRating = Math.max(...successfulSubmissions.map(s => s.problem.rating || 0));

  // Calculate average rating of solved problems
  const avgRating = Math.round(
    successfulSubmissions.reduce((acc, curr) => acc + (curr.problem.rating || 0), 0) / successfulSubmissions.length
  );

  // Performance analytics data - Last 45 days of solved problems
  const performanceData = Array.from({ length: 45 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (44 - i));
    const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
    const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime();
    
    // Count total submissions for the day
    const totalSubmissions = submissions.filter(sub => {
      const submissionTime = sub.creationTimeSeconds * 1000;
      return submissionTime >= dayStart && submissionTime <= dayEnd;
    }).length;

    // Count unique problems solved for the day
    const solvedProblems = new Set(
      submissions
        .filter(sub => {
          const submissionTime = sub.creationTimeSeconds * 1000;
          return submissionTime >= dayStart && 
                 submissionTime <= dayEnd && 
                 sub.verdict === 'OK';
        })
        .map(sub => `${sub.problem.contestId}-${sub.problem.index}`)
    ).size;

    return {
      date: date.toLocaleDateString(),
      submissions: totalSubmissions,
      problemsSolved: solvedProblems
    };
  });

  // Problem difficulty distribution with exact ratings
  const problemDifficulty = submissions
    .filter(sub => sub.verdict === 'OK')
    .reduce<DifficultyAccumulator>((acc, sub) => {
      const rating = sub.problem.rating || 0;
      const problemKey = `${sub.problem.contestId}-${sub.problem.index}-${rating}`;
      
      if (!acc.problemKeys.has(problemKey)) {
        const roundedRating = Math.floor(rating / 100) * 100;
        // Only process if rating is within our display range
        if (roundedRating >= 800 && roundedRating <= 3500) {
          const difficulty = roundedRating.toString();
          const existing = acc.data.find(d => d.difficulty === difficulty);
          
          if (existing) {
            existing.count++;
          } else {
            acc.data.push({ difficulty, count: 1 });
          }
        }
        acc.problemKeys.add(problemKey);
      }
      
      return acc;
    }, { data: [], problemKeys: new Set() })
    .data
    .sort((a, b) => parseInt(a.difficulty) - parseInt(b.difficulty));

  // Ensure all ratings from 800 to 3500 are represented
  const allRatings = Array.from(
    { length: (3500 - 800) / 100 + 1 }, 
    (_, i) => (800 + i * 100).toString()
  );
  const completeData = allRatings.map(rating => {
    const existing = problemDifficulty.find(d => d.difficulty === rating);
    return existing || { difficulty: rating, count: 0 };
  });

  // Calculate success rate by problem type
  const successRateByType = successfulSubmissions.reduce((acc: any[], sub) => {
    const problemType = sub.problem.tags[0] || 'Unknown';
    const existing = acc.find(t => t.type === problemType);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ type: problemType, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.count - a.count).slice(0, 5);

  // Problem Tags Distribution - Show most common problem types
  const problemTags = successfulSubmissions.reduce((acc: any[], sub) => {
    // Get unique problems by their ID to avoid counting the same problem multiple times
    const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
    if (!acc.problemKeys?.has(problemKey)) {
      sub.problem.tags.forEach(tag => {
        const existing = acc.data?.find(t => t.name === tag);
        if (existing) {
          existing.value++;
        } else {
          acc.data = [...(acc.data || []), { name: tag, value: 1 }];
        }
      });
      acc.problemKeys = acc.problemKeys || new Set();
      acc.problemKeys.add(problemKey);
    }
    return acc;
  }, { data: [], problemKeys: new Set() })
  .data
  .sort((a, b) => b.value - a.value)
  .slice(0, 20); // Show top 20 problem types

  const problemRatingHistory = successfulSubmissions
    .filter(sub => sub.problem.rating) // Only include problems with ratings
    .map(sub => ({
      date: new Date(sub.creationTimeSeconds * 1000).toLocaleDateString(),
      rating: sub.problem.rating || 0,
      maxRating: user.maxRating
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const scatterData = Array.from({ length: 20 }, () => ({
    time: Math.floor(Math.random() * 50) + 10,
    accuracy: Math.floor(Math.random() * 30) + 70
  }));

  return (
    <div className="space-y-8">
      {/* User Info */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-4 mb-6">
          <img 
            src={user.titlePhoto} 
            alt={user.handle} 
            className="w-20 h-20 rounded-full border-4"
            style={{ borderColor: getRatingColor(user.rating) }}
          />
          <div>
            <h2 className="text-2xl font-bold" style={{ color: getRatingColor(user.rating) }}>{user.handle}</h2>
            <p style={{ color: getRatingColor(user.rating) }}>{user.rank}</p>
            <p className="text-sm text-gray-500">Contribution: {user.contribution}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rating Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Rating Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Rating</span>
                <span className="text-xl font-bold" style={{ color: getRatingColor(user.rating) }}>
                  {user.rating}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Max Rating</span>
                <span className="text-xl font-bold" style={{ color: getRatingColor(user.maxRating) }}>
                  {user.maxRating}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rating Rank</span>
                <span className="text-xl font-bold" style={{ color: getRatingColor(user.rating) }}>
                  #{user.rank}
                </span>
              </div>
            </div>
          </div>

          {/* Problem Solving Stats */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Problem Solving Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Solved</span>
                <span className="text-xl font-bold text-green-600">
                  {uniqueProblemsSolved}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Max Difficulty</span>
                <span className="text-xl font-bold text-orange-600">
                  {maxRating}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Difficulty</span>
                <span className="text-xl font-bold text-blue-600">
                  {avgRating}
                </span>
              </div>
            </div>
          </div>

          {/* Contest History */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Contest History</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Contests</span>
                <span className="text-xl font-bold" style={{ color: getRatingColor(user.rating) }}>
                  {contestRatingHistory.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Best Rank</span>
                <span className="text-xl font-bold" style={{ color: getRatingColor(user.maxRating) }}>
                  #{user.maxRank}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last Contest</span>
                <span className="text-xl font-bold text-gray-600">
                  {contestRatingHistory.length > 0 
                    ? new Date(contestRatingHistory[contestRatingHistory.length - 1].ratingUpdateTimeSeconds * 1000).toLocaleDateString() 
                    : 'No contests yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Activity Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Submissions</span>
                <span className="text-xl font-bold text-teal-600">
                  {submissions.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Accepted Rate</span>
                <span className="text-xl font-bold text-emerald-600">
                  {Math.round((successfulSubmissions.length / submissions.length) * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Friends</span>
                <span className="text-xl font-bold text-violet-600">
                  {user.friendOfCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Problems Solved (Last 45 Days)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Problems Solved</p>
            <p className="text-2xl font-bold text-blue-600">
              {performanceData.reduce((acc, curr) => acc + curr.problemsSolved, 0)}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Submissions</p>
            <p className="text-2xl font-bold text-green-600">
              {performanceData.reduce((acc, curr) => acc + curr.submissions, 0)}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Average Daily Problems</p>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(performanceData.reduce((acc, curr) => acc + curr.problemsSolved, 0) / 45)}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={3}
            />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="problemsSolved" 
              fill="#8884d8" 
              name="Problems Solved"
            />
            <Bar 
              dataKey="submissions" 
              fill="#82ca9d" 
              name="Total Submissions"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Submission Verdicts */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Submission Verdicts</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={verdictData.sort((a, b) => b.value - a.value)}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={100}
            />
            <Tooltip
              formatter={(value: number) => [`${value} submissions`, 'Count']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="value"
              name="Submissions"
            >
              {verdictData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={VERDICT_COLORS[entry.name as keyof typeof VERDICT_COLORS] || VERDICT_COLORS.OTHER}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Original Charts */}
      <div className="grid grid-cols-1 gap-8">
        {/* Problem Difficulty Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Problem Ratings</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={completeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis 
                dataKey="difficulty" 
                stroke="#666"
                tick={{ fill: '#666' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#666"
                tick={{ fill: '#666' }}
                domain={[0, 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                formatter={(value: number) => [`${value} problems`, 'Count']}
              />
              <Legend />
              <Bar dataKey="count" name="Problems Solved">
                {completeData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={DIFFICULTY_COLORS[entry.difficulty as keyof typeof DIFFICULTY_COLORS]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Problem Tags Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Problem Types Distribution</h3>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart 
              data={problemTags}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis type="number" />
              <YAxis 
                type="category"
                dataKey="name" 
                stroke="#666"
                tick={{ fill: '#666' }}
                width={140}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                formatter={(value: number) => [`${value} problems`, 'Count']}
              />
              <Legend />
              <Bar 
                dataKey="value"
                name="Problems Solved"
              >
                {problemTags.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Footer */}
      <div className="text-center py-4 text-gray-600">
        <p>Copyright © 2025 Sachin</p>
      </div>
    </div>
  );
};

export default Dashboard;