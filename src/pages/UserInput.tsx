import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { userHandleState } from '../state/atoms';
import { api } from '../services/api';

const UserInput = () => {
  const [handle, setHandle] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setUserHandle = useSetRecoilState(userHandleState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      setError('Please enter a Codeforces handle');
      return;
    }
    try {
      await api.getUser(handle.trim());
      await api.logVisit('SEARCH', [handle.trim()], '/dashboard');
      setUserHandle(handle.trim());
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.comment || `User '${handle.trim()}' not found on Codeforces`;
      alert(errorMessage);
      setError('User not found');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Enter Codeforces Handle
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your Codeforces handle to view your statistics
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="handle" className="sr-only">
                Codeforces Handle
              </label>
              <input
                id="handle"
                name="handle"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your Codeforces handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Statistics
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserInput; 