import React from 'react';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import { TrendingUp, School, People, Star } from '@mui/icons-material';

const KPICards = ({ data }) => {
  const cards = [
    {
      title: 'Total Evaluations',
      value: data?.total_evaluations || 0,
      icon: <School sx={{ fontSize: 40, color: '#3b82f6' }} />,
      color: '#eff6ff'
    },
    {
      title: 'Average Score',
      value: data?.avg_score || 0,
      icon: <Star sx={{ fontSize: 40, color: '#eab308' }} />,
      color: '#fef9c3'
    },
    {
      title: 'Participation Rate',
      value: `${data?.participation_rate || 0}%`,
      icon: <People sx={{ fontSize: 40, color: '#22c55e' }} />,
      color: '#dcfce7'
    },
    {
      title: 'Top Teacher',
      value: data?.top_teacher || 'N/A',
      icon: <TrendingUp sx={{ fontSize: 40, color: '#8b5cf6' }} />,
      color: '#f3e8ff'
    }
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ height: '100%', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="subtitle2">
                    {card.title}
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {card.value}
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    backgroundColor: card.color, 
                    borderRadius: '50%', 
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default KPICards;
