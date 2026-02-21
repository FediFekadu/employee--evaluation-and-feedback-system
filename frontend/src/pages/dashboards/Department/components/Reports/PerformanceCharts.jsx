import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const PerformanceCharts = ({ data }) => {
  if (!data) return null;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card sx={{ height: 400, p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
          <Typography variant="h6" gutterBottom>Performance Trend</Typography>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data.performance_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" activeDot={{ r: 8 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ height: 400, p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
          <Typography variant="h6" gutterBottom>Rating Distribution</Typography>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={data.rating_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.rating_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Grid>
      
      {/* Section Breakdown Radar Chart */}
      {data.section_breakdown && data.section_breakdown.length > 0 && (
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400, p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            <Typography variant="h6" gutterBottom>Category Performance (Strengths & Weaknesses)</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.section_breakdown}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 5]} />
                <Radar name="Score" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      )}

      {/* Comparison Bar Chart (Student vs Peer vs Admin) */}
      {data.score_breakdown && data.score_breakdown.breakdown && (
         <Grid item xs={12} md={6}>
            <Card sx={{ height: 400, p: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
              <Typography variant="h6" gutterBottom>Evaluation Source Comparison</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={[
                    { name: 'Student', score: data.score_breakdown.breakdown.student?.raw_score || 0 },
                    { name: 'Peer', score: data.score_breakdown.breakdown.peer?.raw_score || 0 },
                    { name: 'Admin', score: data.score_breakdown.breakdown.admin?.raw_score || 0 },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#82ca9d" name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
         </Grid>
      )}
    </Grid>
  );
};

export default PerformanceCharts;
