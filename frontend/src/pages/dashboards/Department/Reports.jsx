import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import KPICards from './components/Reports/KPICards';
import PerformanceCharts from './components/Reports/PerformanceCharts';
import TeacherTable from './components/Reports/TeacherTable';
import LoadingSpinner from '../../../components/ErrorHandling/LoadingSpinner';

const Reports = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState(null);
  const [evaluationIds, setEvaluationIds] = useState([]);
  const [period, setPeriod] = useState('month'); // week, month, quarter, year

  useEffect(() => {
    fetchReports();
  }, [id, period]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching reports for department ${id}, period: ${period}`);
      
      const res = await api.get(`/departments/${id}/reports`, { 
        params: { 
          period,
          optimize: 0 // Use 0/1 for boolean compatibility with Laravel validation
        } 
      });
      
      console.log("Reports API Response:", res.data);
      
      if (res.data && res.data.success) {
        if (res.data.data.evaluations) {
          setEvaluationIds(res.data.data.evaluations.map(e => e.id));
        }
        
        try {
          const processed = processData(res.data.data);
          setData(processed);
        } catch (processErr) {
          console.error("Error processing data:", processErr);
          setError("Error processing reports data");
        }
      } else {
        console.error("API returned success: false", res.data);
        setError(res.data.message || "Failed to load data");
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      console.error("Error details:", err.response?.data);
      setError(err.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format = 'pdf') => {
    try {
      setExporting(true);
      const response = await api.post(`/departments/${id}/export`, {
        format: format,
        evaluations: evaluationIds
      }, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `department_report_${id}_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExporting(false);
    } catch (err) {
      console.error("Export failed:", err);
      setExporting(false);
      alert("Failed to export report. Please try again.");
    }
  };

  const processData = (apiData) => {
    // Transform API data to component-ready format
    
    // 1. KPIs
    const kpis = {
      total_evaluations: apiData.summary.total_evaluations,
      avg_score: apiData.kpis.average_performance_score,
      participation_rate: apiData.kpis.average_participation_rate,
      top_teacher: 'N/A'
    };

    // Calculate Top Teacher
    if (apiData.teacher_semester_results && apiData.teacher_semester_results.length > 0) {
      const top = apiData.teacher_semester_results.reduce((prev, current) => 
        (prev.weighted_score > current.weighted_score) ? prev : current
      );
      // We need teacher name, but teacher_semester_results might only have ID
      // Let's try to find name from evaluations list if available
      const teacherName = findTeacherName(top.teacher_id, apiData.evaluations);
      kpis.top_teacher = teacherName || `ID: ${top.teacher_id}`;
    }

    // 2. Charts
    // Rating Distribution
    const ratingDist = [];
    if (apiData.rating_distribution) {
      Object.keys(apiData.rating_distribution).forEach(key => {
        ratingDist.push({
          name: `${key} Star${key > 1 ? 's' : ''}`,
          value: apiData.rating_distribution[key]
        });
      });
    }

    // Performance Trend (from evaluations list)
    const trend = [];
    if (apiData.evaluations) {
      // Group by month
      const grouped = {};
      apiData.evaluations.forEach(ev => {
        const date = new Date(ev.created_at);
        const key = date.toLocaleString('default', { month: 'short' });
        if (!grouped[key]) grouped[key] = { sum: 0, count: 0 };
        grouped[key].sum += ev.weighted_score;
        grouped[key].count++;
      });
      
      Object.keys(grouped).forEach(key => {
        trend.push({
          name: key,
          score: parseFloat((grouped[key].sum / grouped[key].count).toFixed(2)),
          monthIndex: new Date(`${key} 1, 2000`).getMonth() // Helper to sort
        });
      });
      
      // Sort chronologically
      trend.sort((a, b) => a.monthIndex - b.monthIndex);
    }

    // 3. Teachers Table
    const teachers = (apiData.teacher_semester_results || []).map(t => {
      const foundTeacher = (apiData.evaluations || []).find(e => e.teacher_id === t.teacher_id);
      return {
        id: t.teacher_id,
        name: foundTeacher ? foundTeacher.instructor : `Teacher ${t.teacher_id}`,
        score: t.weighted_score,
        evaluations: t.total_responses || 0, 
        course: foundTeacher ? foundTeacher.course : 'N/A'
      };
    });

    return {
      kpis,
      charts: {
        rating_distribution: ratingDist,
        performance_trend: trend,
        section_breakdown: apiData.section_breakdown || [],
        score_breakdown: apiData.score_breakdown || {}
      },
      teachers
    };
  };

  const findTeacherName = (teacherId, evaluations) => {
    if (!evaluations) return null;
    const found = evaluations.find(e => e.teacher_id === teacherId); 
    return found ? found.instructor : null;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="dashboard-overview">
      <div className="dashboard-header">
        <div>
          <h1>Department Reports</h1>
          <p>Comprehensive analytics and performance metrics</p>
        </div>
        <div className="header-actions">
          <select 
            className="dept-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button 
            className="dept-btn dept-btn-primary"
            onClick={() => handleExport('pdf')}
            disabled={exporting || loading || !data}
            style={{ opacity: (exporting || !data) ? 0.7 : 1, cursor: (exporting || !data) ? 'not-allowed' : 'pointer' }}
          >
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
          <h3>Error Loading Reports</h3>
          <p>{typeof error === 'string' ? error : 'Unknown error occurred'}</p>
          <button 
            onClick={() => fetchReports()} 
            className="dept-btn dept-btn-primary"
            style={{ marginTop: '16px' }}
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <div className="reports-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <KPICards data={data.kpis} />
          <PerformanceCharts data={data.charts} />
          <TeacherTable data={data.teachers} />
        </div>
      ) : (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>No data available for this period.</p>
          <button 
            onClick={() => fetchReports()} 
            className="dept-btn dept-btn-secondary"
            style={{ marginTop: '16px' }}
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default Reports;
