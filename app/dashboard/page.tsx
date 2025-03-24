"use client";

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TelemetryData {
  timestamp: string;
  count: number;
}

const home = () => {
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('hour'); // 'hour', 'day', 'week'

  useEffect(() => {
    fetchTelemetryData(timeRange);
  }, [timeRange]);

  const fetchTelemetryData = async (range: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/telemetry/stats?range=${range}`);
      if (!response.ok) {
        throw new Error('Failed to fetch telemetry data');
      }
      const data = await response.json();
      setTelemetryData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error fetching telemetry data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === 'hour') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === 'day') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Page Views Telemetry</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('hour')}
            className={`px-3 py-1.5 rounded-md ${
              timeRange === 'hour' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Hour
          </button>
          <button
            onClick={() => setTimeRange('day')}
            className={`px-3 py-1.5 rounded-md ${
              timeRange === 'day' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1.5 rounded-md ${
              timeRange === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">Loading telemetry data...</div>
        </div>
      ) : error ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      ) : telemetryData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">No telemetry data available</div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={telemetryData}
              margin={{ top: 5, right: 20, bottom: 20, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTimestamp}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: any) => [`${value} views`, 'Page Views']}
                labelFormatter={(label: string | number | Date) => new Date(label).toLocaleString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#4f46e5"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                name="Page Views"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-indigo-800">Current Rate</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {loading ? "..." : `${telemetryData[telemetryData.length - 1]?.count || 0}`}
            <span className="text-sm font-normal text-indigo-400 ml-1">views/min</span>
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-green-800">Average</h3>
          <p className="text-3xl font-bold text-green-600">
            {loading ? "..." : (
              telemetryData.length > 0 
                ? (telemetryData.reduce((sum, item) => sum + item.count, 0) / telemetryData.length).toFixed(1)
                : "0"
            )}
            <span className="text-sm font-normal text-green-400 ml-1">views/min</span>
          </p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800">Peak</h3>
          <p className="text-3xl font-bold text-blue-600">
            {loading ? "..." : (
              telemetryData.length > 0
                ? Math.max(...telemetryData.map(item => item.count))
                : "0"
            )}
            <span className="text-sm font-normal text-blue-400 ml-1">views/min</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default home;