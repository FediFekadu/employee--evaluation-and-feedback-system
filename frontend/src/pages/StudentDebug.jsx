import React, { useEffect, useState } from 'react';
import api from '../services/api';

function StudentDebug() {
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDebugInfo = async () => {
      try {
        // Get localStorage data
        const studentDbId = localStorage.getItem('student_db_id');
        const departmentId = localStorage.getItem('department_id');
        const yearLevel = localStorage.getItem('year_level');
        const studentName = localStorage.getItem('student_name');

        // Get available evaluations
        const params = new URLSearchParams();
        if (departmentId) {
          params.append('department_id', departmentId);
        }
        params.append('open_only', 'true');
        
        const evaluationsResponse = await api.get(`/evaluations?${params.toString()}`);
        const evaluations = evaluationsResponse.data?.data || evaluationsResponse.data || [];

        // Get detailed evaluation data
        const evaluationsWithDetails = await Promise.all(
          evaluations.slice(0, 3).map(async (eval) => {
            try {
              const detailResponse = await api.get(`/evaluations/${eval.id}`);
              return detailResponse.data;
            } catch (error) {
              return { ...eval, error: error.message };
            }
          })
        );

        setDebugInfo({
          localStorage: {
            studentDbId,
            departmentId,
            yearLevel,
            studentName
          },
          evaluations: evaluationsWithDetails,
          totalEvaluations: evaluations.length
        });
      } catch (error) {
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    loadDebugInfo();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading debug info...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Student Debug Information</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>LocalStorage Data:</h2>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
          {JSON.stringify(debugInfo.localStorage, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Available Evaluations ({debugInfo.totalEvaluations}):</h2>
        {debugInfo.evaluations?.map((eval, index) => (
          <div key={eval.id || index} style={{ 
            backgroundColor: '#f9f9f9', 
            padding: '10px', 
            marginBottom: '10px', 
            borderRadius: '5px',
            border: eval.error ? '2px solid red' : '1px solid #ddd'
          }}>
            <h3>Evaluation {eval.id}</h3>
            <p><strong>Course:</strong> {eval.course?.title || 'N/A'}</p>
            <p><strong>Teacher:</strong> {eval.teacher?.name || 'N/A'}</p>
            <p><strong>Questions:</strong> {eval.questions?.length || 0}</p>
            <p><strong>Feedbacks:</strong> {eval.feedbacks?.length || 0}</p>
            
            {eval.feedbacks?.length > 0 && (
              <div>
                <strong>Submitted by students:</strong>
                <ul>
                  {eval.feedbacks.map(fb => (
                    <li key={fb.id}>
                      Student {fb.student_id} 
                      {fb.student_id === parseInt(debugInfo.localStorage.studentDbId) && ' (YOU)'}
                      {fb.anonymous ? ' (Anonymous)' : ' (Named)'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {eval.error && (
              <p style={{ color: 'red' }}><strong>Error:</strong> {eval.error}</p>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Recommendations:</h2>
        <ul>
          <li>If you see no evaluations, try changing your department ID to: 1790, 1802, or 2215</li>
          <li>If you see "YOU" next to any feedback, you've already submitted that evaluation</li>
          <li>Student ID 39192 (Leta Tsegaye) should work for testing</li>
          <li>Department 2215 (Software Engineering) has the most evaluations</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Quick Fix:</h2>
        <button 
          onClick={() => {
            localStorage.setItem('student_db_id', '39192');
            localStorage.setItem('department_id', '2215');
            localStorage.setItem('student_name', 'Leta Tsegaye');
            localStorage.setItem('year_level', '3');
            window.location.reload();
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Set Test Student (Leta Tsegaye, Dept 2215)
        </button>
      </div>

      {debugInfo.error && (
        <div style={{ color: 'red', marginTop: '20px' }}>
          <h2>Error:</h2>
          <p>{debugInfo.error}</p>
        </div>
      )}
    </div>
  );
}

export default StudentDebug;