import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  withCredentials: false,
  headers: { 'Accept': 'application/json' },
});

function isSafeMode() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem('safe_mode') === '1';
  } catch {
    return false;
  }
}

function mockVisualAnalytics(url, config) {
  const charts = {
    performance_distribution: {
      type: 'pie',
      title: 'Performance Distribution',
      data: {
        excellent: { count: 45, percentage: 45 },
        good: { count: 32, percentage: 32 },
        average: { count: 15, percentage: 15 },
        below_average: { count: 6, percentage: 6 },
        poor: { count: 2, percentage: 2 }
      }
    },
    participation_trends: {
      type: 'line',
      title: 'Participation Trends',
      x_axis: 'date',
      y_axis: 'participation_rate',
      data: Array.from({ length: 12 }).map((_, i) => ({
        date: new Date(Date.now() - (11 - i) * 30 * 24 * 3600 * 1000).toISOString(),
        participation_rate: 60 + Math.round(Math.random() * 30)
      }))
    }
  };
  return { data: { charts } };
}

function mockReports(url, config) {
  return {
    data: {
      data: {
        kpis: {
          average_performance_score: 85.4,
          average_participation_rate: 78.9,
          average_weighted_score: 70.73,
          data_quality: 'good'
        },
        rating_distribution: { '5': 45, '4': 32, '3': 15, '2': 6, '1': 2 }
      }
    }
  };
}

function mockAnalytics(url, config) {
  return {
    data: {
      data: {
        trends: Array.from({ length: 12 }).map((_, i) => ({
          month: i + 1,
          performance: 70 + Math.round(Math.random() * 20)
        })),
        benchmarks: {
          department_avg: 75,
          college_avg: 72
        }
      }
    }
  };
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const cfg = error?.config || {};
    const url = cfg?.url || '';
    if (isSafeMode()) {
      if (url.includes('/visual-analytics')) {
        return mockVisualAnalytics(url, cfg);
      }
      if (url.includes('/reports')) {
        return mockReports(url, cfg);
      }
      if (url.includes('/analytics')) {
        return mockAnalytics(url, cfg);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
