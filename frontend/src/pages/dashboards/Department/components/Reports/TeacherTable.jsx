import React from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const TeacherTable = ({ data }) => {
  if (!data) return null;

  return (
    <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Detailed Teacher Performance</Typography>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                <TableCell>Teacher Name</TableCell>
                <TableCell align="right">Course</TableCell>
                <TableCell align="right">Evaluations</TableCell>
                <TableCell align="right">Score (Avg)</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.name}
                  </TableCell>
                  <TableCell align="right">{row.course}</TableCell>
                  <TableCell align="right">{row.evaluations}</TableCell>
                  <TableCell align="right">
                    <span style={{ 
                      backgroundColor: row.score >= 4.0 ? '#dcfce7' : row.score >= 3.0 ? '#fef9c3' : '#fee2e2',
                      color: row.score >= 4.0 ? '#166534' : row.score >= 3.0 ? '#854d0e' : '#991b1b',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      {row.score}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <span style={{ 
                      color: row.evaluations > 30 ? '#166534' : '#9ca3af',
                      fontSize: '0.875rem'
                    }}>
                      {row.evaluations > 30 ? 'Completed' : 'In Progress'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default TeacherTable;
