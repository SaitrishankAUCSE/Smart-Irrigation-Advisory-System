import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { auth } from '../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Target } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function WaterUsageDashboard() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [adherence, setAdherence] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentUser) return;
      try {
        const token = await auth.currentUser.getIdToken();
        const [usageRes, adRes] = await Promise.all([
          axios.get(`${API_BASE}/analytics/water-usage?id=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/analytics/adherence?id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setData(usageRes.data.data ? [] : usageRes.data); // empty check
        setAdherence(adRes.data.adherence_percent || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [id, currentUser]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center">
        <Link to={`/field/${id}`} className="mr-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Water Usage Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border col-span-1 flex flex-col justify-center items-center">
          <Target className="w-12 h-12 text-purple-600 mb-2" />
          <h2 className="text-lg font-medium text-gray-600">Adherence Score</h2>
          <p className="text-4xl font-extrabold text-gray-900 mt-2">{adherence}%</p>
          <p className="text-sm text-gray-500 mt-2 text-center">Followed system recommendations</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border col-span-1 md:col-span-2">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Water Usage Trend (mm)</h2>
          <div className="h-64">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <Line type="monotone" dataKey="actual_amount_mm" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} />
                  <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Not enough data yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
