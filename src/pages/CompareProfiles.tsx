import React, { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { userHandleState } from '../state/atoms';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ReferenceArea
} from 'recharts';
import { api } from '../services/api';
import type { User, Submission, RatingChange } from '../types';

// Rating colors matching Codeforces table exactly
const RATING_COLORS = {
  DARK_RED: '#AA0000',  // 3000+ Legendary Grandmaster
  RED: '#FF0000',       // 2300-2999 Grandmaster
  ORANGE: '#FF8C00',    // 2100-2299 Master
  PURPLE: '#800080',    // 1900-2099 Candidate Master
  BLUE: '#0000FF',      // 1600-1899 Expert
  CYAN: '#03A89E',      // 1400-1599 Specialist
  GREEN: '#008000',     // 1200-1399 Pupil
  GRAY: '#808080'       // 0-1199 Newbie
};

const getRatingColor = (rating: number): string => {
  if (!rating || rating === 0) return '#000000';  // Black for unrated users
  if (rating >= 3000) return RATING_COLORS.DARK_RED;  // Legendary Grandmaster
  if (rating >= 2300) return RATING_COLORS.RED;       // Grandmaster
  if (rating >= 2100) return RATING_COLORS.ORANGE;    // Master
  if (rating >= 1900) return RATING_COLORS.PURPLE;    // Candidate Master
  if (rating >= 1600) return RATING_COLORS.BLUE;      // Expert
  if (rating >= 1400) return RATING_COLORS.CYAN;      // Specialist
  if (rating >= 1200) return RATING_COLORS.GREEN;     // Pupil
  return RATING_COLORS.GRAY;                          // Newbie
};

interface ComparisonData {
  handle: string;
  user: User;
  submissions: Submission[];
  ratingHistory: RatingChange[];
  stats: {
    totalProblems: number;
    maxRating: number;
    averageRating: number;
    acceptanceRate: number;
    totalContests: number;
    recentAverage: number; // New field for 45-day average
    problemsByRating: { [key: string]: number };
    problemsByTags: { [key: string]: number };
  };
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow">
        <p className="font-bold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.stroke }}>
            {entry.dataKey}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CompareProfiles: React.FC = () => {
  const currentUserHandle = useRecoilValue(userHandleState);
  const [handle1, setHandle1] = useState('');
  const [handle2, setHandle2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);

  useEffect(() => {
    if (currentUserHandle && !handle1) {
      setHandle1(currentUserHandle);
    }
  }, [currentUserHandle]);

  const calculateStats = (submissions: Submission[], ratingHistory: RatingChange[]) => {
    // Get successful submissions only
    const successfulSubmissions = submissions.filter(sub => sub.verdict === 'OK');

    // Calculate unique problems solved - ensuring we count all problems including those without contestId
    const uniqueProblems = new Set(
      successfulSubmissions
        .map(sub => {
          // For regular contest problems
          if (sub.problem.contestId && sub.problem.index) {
            return `${sub.problem.contestId}-${sub.problem.index}`;
          }
          // For gym problems
          if (sub.problem.contestId && sub.problem.contestId > 10000) {
            return `${sub.problem.contestId}-${sub.problem.index || sub.problem.name}`;
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
          // Fallback for any other case
          return `${sub.problem.contestId || 'unknown'}-${sub.problem.index || 'unknown'}-${sub.problem.name || 'unknown'}-${sub.problem.rating || 0}`;
        })
    );

    // Calculate problems by rating and tags
    const problemsByRating: { [key: string]: number } = {};
    const problemsByTags: { [key: string]: number } = {};
    const seenProblems = new Set<string>();

    successfulSubmissions.forEach(sub => {
      const problemKey = sub.problem.contestId && sub.problem.index
        ? `${sub.problem.contestId}-${sub.problem.index}`
        : sub.problem.contestId && sub.problem.contestId > 10000
          ? `${sub.problem.contestId}-${sub.problem.index || sub.problem.name}`
          : sub.problem.contestId
            ? `${sub.problem.contestId}-${sub.problem.name || sub.problem.index || 'unknown'}`
            : sub.problem.index
              ? `${sub.problem.index}-${sub.problem.name || 'unknown'}`
              : sub.problem.name
                ? `${sub.problem.name}-${sub.problem.rating || 0}`
                : `${sub.problem.contestId || 'unknown'}-${sub.problem.index || 'unknown'}-${sub.problem.name || 'unknown'}-${sub.problem.rating || 0}`;

      if (!seenProblems.has(problemKey)) {
        // Count problem rating
        if (sub.problem.rating) {
          const rating = sub.problem.rating.toString();
          problemsByRating[rating] = (problemsByRating[rating] || 0) + 1;
        }

        // Count problem tags
        sub.problem.tags.forEach(tag => {
          problemsByTags[tag] = (problemsByTags[tag] || 0) + 1;
        });

        seenProblems.add(problemKey);
      }
    });

    // Calculate recent problems (last 45 days)
    const now = Date.now();
    const days45 = 45 * 24 * 60 * 60 * 1000;
    const recentProblems = new Set(
      successfulSubmissions
        .filter(sub => {
          const submissionTime = sub.creationTimeSeconds * 1000;
          return now - submissionTime <= days45;
        })
        .map(sub => sub.problem.contestId && sub.problem.index
          ? `${sub.problem.contestId}-${sub.problem.index}`
          : `${sub.problem.name}-${sub.problem.rating || 0}`)
    );

    return {
      totalProblems: uniqueProblems.size,
      maxRating: Math.max(...Object.keys(problemsByRating).map(Number).filter(n => !isNaN(n))),
      averageRating: Math.round(
        Object.entries(problemsByRating)
          .filter(([rating]) => !isNaN(Number(rating)))
          .reduce((acc, [rating, count]) => acc + Number(rating) * count, 0) /
        Object.entries(problemsByRating)
          .filter(([rating]) => !isNaN(Number(rating)))
          .reduce((acc, [_, count]) => acc + count, 0)
      ),
      acceptanceRate: Math.round((uniqueProblems.size / submissions.length) * 100),
      totalContests: ratingHistory.length,
      recentAverage: Math.round(recentProblems.size / 45 * 100) / 100,
      problemsByRating,
      problemsByTags
    };
  };

  const compareUsers = async () => {
    if (!handle1 || !handle2) {
      setError('Please enter both handles');
      return;
    }

    if (handle1 === handle2) {
      setError('Please enter different handles to compare');
      return;
    }

    setLoading(true);
    setError('');
    setComparisonData([]);

    try {
      // First verify both users exist
      const handles = [handle1, handle2];
      console.log('Verifying users exist...');
      
      try {
        const users = await Promise.all(
          handles.map(async (handle) => {
            try {
              return await api.getUser(handle);
            } catch (err: any) {
              setError(`User '${handle}' not found on Codeforces`);
              throw new Error(`User '${handle}' not found on Codeforces`);
            }
          })
        );
        
        console.log('Both users exist, proceeding with data fetch');
        await api.logVisit('COMPARE', [handle1, handle2], '/compare');
        
        const comparison = [];
        
        // Now fetch data for each user
        for (const user of users) {
          const [submissions, ratingHistory] = await Promise.all([
            api.getUserSubmissions(user.handle),
            api.getRatingHistory(user.handle)
          ]);
          console.log(`Successfully fetched all data for ${user.handle}`);

          comparison.push({
            handle: user.handle,
            user,
            submissions: submissions || [],
            ratingHistory: ratingHistory || [],
            stats: calculateStats(submissions || [], ratingHistory || [])
          });
        }

        if (comparison.length === 2) {
          setComparisonData(comparison);
        } else {
          setError('Failed to fetch data for both users');
        }
      } catch (err: any) {
        console.error('Error verifying users:', err);
        setError(err.message);
        return;
      }
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.message || 'Failed to fetch comparison data');
    } finally {
      setLoading(false);
    }
  };

  const renderComparisonSection = () => {
    if (!comparisonData.length) return null;

    // Prepare contest rating data
    const allContestTimes = new Set([
      ...comparisonData[0].ratingHistory.map(r => r.ratingUpdateTimeSeconds),
      ...comparisonData[1].ratingHistory.map(r => r.ratingUpdateTimeSeconds)
    ]);

    const contestRatingData = Array.from(allContestTimes)
      .sort((a, b) => a - b)
      .map(timeSeconds => {
        const date = new Date(timeSeconds * 1000).toLocaleDateString();
        const user1Rating = comparisonData[0].ratingHistory.find(
          r => r.ratingUpdateTimeSeconds === timeSeconds
        );
        const user2Rating = comparisonData[1].ratingHistory.find(
          r => r.ratingUpdateTimeSeconds === timeSeconds
        );
        
        return {
          date,
          contestName: user1Rating?.contestName || user2Rating?.contestName,
          [comparisonData[0].handle]: user1Rating?.newRating,
          [comparisonData[1].handle]: user2Rating?.newRating
        };
      });

    // Prepare rating distribution data
    const ratingData = Array.from(
      new Set(
        comparisonData.flatMap(data => 
          Object.keys(data.stats.problemsByRating)
        )
      )
    ).sort((a, b) => Number(a) - Number(b))
    .map(rating => ({
      rating: Number(rating),
      [comparisonData[0].handle]: comparisonData[0].stats.problemsByRating[rating] || 0,
      [comparisonData[1].handle]: comparisonData[1].stats.problemsByRating[rating] || 0
    }));

    // Prepare tag distribution data
    const tagData = Array.from(
      new Set(
        comparisonData.flatMap(data => 
          Object.keys(data.stats.problemsByTags)
        )
      )
    ).map(tag => ({
      tag,
      [comparisonData[0].handle]: comparisonData[0].stats.problemsByTags[tag] || 0,
      [comparisonData[1].handle]: comparisonData[1].stats.problemsByTags[tag] || 0
    }));

    return (
      <div className="mt-8 space-y-8">
        <div className="grid grid-cols-2 gap-8">
          {comparisonData.map(data => (
            <div key={data.handle} className="p-6 bg-white rounded-lg shadow-lg">
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src={data.user.titlePhoto}
                  alt={`${data.handle}'s profile`}
                  className="w-24 h-24 rounded-full border-2 border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://codeforces.org/sites/default/files/userpic/default.jpg';
                  }}
                />
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: getRatingColor(data.user.rating) }}>
                    {data.handle}
                  </h3>
                  <p style={{ color: getRatingColor(data.user.rating), fontWeight: 600 }}>
                    {data.user.rank}
                  </p>
                  <p className="text-sm text-gray-500">Contribution: {data.user.contribution}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Current Rating</p>
                  <div style={{ color: getRatingColor(data.user.rating) }}>
                    <p className="text-xl font-bold">{data.user.rating}</p>
                    <p className="font-semibold">#{data.user.rank}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Max Rating</p>
                  <div style={{ color: getRatingColor(data.user.maxRating) }}>
                    <p className="text-xl font-bold">{data.user.maxRating}</p>
                    <p className="font-semibold">#{data.user.maxRank}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Total Contests</p>
                  <p className="text-xl font-bold">{data.stats.totalContests}</p>
                  <p className="font-semibold" style={{ color: getRatingColor(data.user.rating) }}>
                    #{data.user.rank}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Best Rank</p>
                  <p className="text-xl font-bold" style={{ color: getRatingColor(data.user.maxRating) }}>
                    #{data.user.maxRank}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Problems Solved</p>
                  <p className="text-xl font-bold">{data.stats.totalProblems}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Acceptance Rate</p>
                  <p className="text-xl font-bold">{data.stats.acceptanceRate}%</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Avg. Problems/Day (45d)</p>
                  <p className="text-xl font-bold">{data.stats.recentAverage}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Last Contest</p>
                  <p className="text-xl font-bold">
                    {data.ratingHistory.length > 0 
                      ? new Date(data.ratingHistory[data.ratingHistory.length - 1].ratingUpdateTimeSeconds * 1000).toLocaleDateString()
                      : 'No contests yet'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rating Difference Warning */}
        {Math.abs(comparisonData[0].user.rating - comparisonData[1].user.rating) > 1200 && (
          <div className="my-8 p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center justify-center space-x-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Divine Presence Detected! 🌟</h3>
                <p className="text-lg">
                  You are comparing a mortal with a coding deity! The rating gap of {Math.abs(comparisonData[0].user.rating - comparisonData[1].user.rating)} 
                  points suggests you're witnessing the presence of a programming god!
                </p>
                <p className="text-md mt-2 text-yellow-200">
                  The rating difference is too vast to display a meaningful comparison graph.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contest Rating Progress Graph */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4">Contest Rating Progress</h3>
          <ResponsiveContainer width="100%" height={700}>
            <LineChart 
              data={contestRatingData}
              margin={{ top: 5, right: 30, left: 50, bottom: 25 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#CCCCCC"
                horizontal={true}
                vertical={true}
              />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={60}
                interval={Math.ceil(contestRatingData.length / 8)}
                tick={{ fontSize: 12, fill: '#000000' }}
                stroke="#000000"
                tickMargin={15}
              />
              <YAxis
                domain={[
                  Math.min(...contestRatingData.map(d => Math.min(Number(d[comparisonData[0].handle]) || Infinity, Number(d[comparisonData[1].handle]) || Infinity))) - 100,
                  Math.max(...contestRatingData.map(d => Math.max(Number(d[comparisonData[0].handle]) || 0, Number(d[comparisonData[1].handle]) || 0))) + 100
                ]}
                tick={{ fontSize: 12, fill: '#000000' }}
                stroke="#000000"
                axisLine={true}
                tickLine={true}
                width={50}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-300 shadow-lg">
                        <p className="font-bold text-base">{data.contestName}</p>
                        <p className="text-sm text-gray-600">{label}</p>
                        {payload.map((entry: any, index: number) => (
                          <p key={index} className="text-base" style={{ color: entry.stroke }}>
                            {entry.dataKey}: {entry.value}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: '#000000', strokeWidth: 1 }}
              />
              <Legend 
                verticalAlign="top"
                align="right"
                height={36}
                iconType="circle"
              />
              {comparisonData.map((data, index) => (
                <Line
                  key={data.handle}
                  type="linear"
                  dataKey={data.handle}
                  stroke={index === 0 ? "#FF0000" : "#0000FF"}
                  strokeWidth={2}
                  dot={{ r: 4, fill: index === 0 ? "#FF0000" : "#0000FF", strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: index === 0 ? "#FF0000" : "#0000FF", strokeWidth: 0 }}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4">Problem Ratings Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={comparisonData[0].handle} fill="#FF4444" />
              <Bar dataKey={comparisonData[1].handle} fill="#4444FF" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4">Problem Tags Comparison</h3>
          <ResponsiveContainer width="100%" height={600}>
            <BarChart data={tagData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="tag" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey={comparisonData[0].handle} fill="#FF4444" />
              <Bar dataKey={comparisonData[1].handle} fill="#4444FF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Compare Profiles</h1>
      
      <div className="flex space-x-4 mb-8">
        <input
          type="text"
          value={handle1}
          onChange={(e) => setHandle1(e.target.value)}
          placeholder="Enter first handle"
          className="flex-1 p-2 border rounded"
        />
        <input
          type="text"
          value={handle2}
          onChange={(e) => setHandle2(e.target.value)}
          placeholder="Enter second handle"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={compareUsers}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-8 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {renderComparisonSection()}
      {/* Footer */}
      <div className="text-center py-4 text-gray-600">
        <p>Copyright © 2025 Sachin</p>
      </div>
    </div>
  );
};

export default CompareProfiles; 