import React, { useState, useEffect } from 'react';
import { networkManager, offlineQueueManager } from '../../utils/errorHandling';

/**
 * Network Status Component - Shows connectivity information and offline queue status
 */
function NetworkStatus({ showDetails = false, position = 'top-right' }) {
  const [networkInfo, setNetworkInfo] = useState(networkManager.getNetworkInfo());
  const [queueStatus, setQueueStatus] = useState(offlineQueueManager.getQueueStatus());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for network changes
    const unsubscribeNetwork = networkManager.addListener((data) => {
      setNetworkInfo(prev => ({ ...prev, ...data }));
      
      // Show status when network changes
      if ('isOnline' in data) {
        setIsVisible(true);
        setTimeout(() => setIsVisible(false), 5000); // Hide after 5 seconds
      }
    });

    // Update queue status periodically
    const queueInterval = setInterval(() => {
      setQueueStatus(offlineQueueManager.getQueueStatus());
    }, 1000);

    // Show initially if offline or poor connection
    if (!networkInfo.isOnline || networkInfo.connectionQuality === 'poor') {
      setIsVisible(true);
    }

    return () => {
      unsubscribeNetwork();
      clearInterval(queueInterval);
    };
  }, []);

  // Don't show if online with good connection and no queue
  if (networkInfo.isOnline && 
      networkInfo.connectionQuality === 'good' && 
      queueStatus.queueLength === 0 && 
      !isVisible && 
      !showDetails) {
    return null;
  }

  const getStatusColor = () => {
    if (!networkInfo.isOnline) return '#ef4444'; // Red
    if (networkInfo.connectionQuality === 'poor') return '#f59e0b'; // Orange
    if (networkInfo.connectionQuality === 'fair') return '#eab308'; // Yellow
    return '#10b981'; // Green
  };

  const getStatusIcon = () => {
    if (!networkInfo.isOnline) return '📡❌';
    if (queueStatus.queueLength > 0) return '📡⏳';
    if (networkInfo.connectionQuality === 'poor') return '📡⚠️';
    if (networkInfo.connectionQuality === 'fair') return '📡🟡';
    return '📡✅';
  };

  const getStatusText = () => {
    if (!networkInfo.isOnline) return 'Offline';
    if (queueStatus.queueLength > 0) return `${queueStatus.queueLength} queued`;
    if (networkInfo.connectionQuality === 'poor') return 'Poor connection';
    if (networkInfo.connectionQuality === 'fair') return 'Fair connection';
    return 'Connected';
  };

  return (
    <div 
      className={`network-status network-status-${position}`}
      style={{
        position: 'fixed',
        zIndex: 1000,
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: 'white',
        border: `2px solid ${getStatusColor()}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        cursor: showDetails ? 'default' : 'pointer',
        transition: 'all 0.3s ease',
        ...(position === 'top-right' && { top: '20px', right: '20px' }),
        ...(position === 'top-left' && { top: '20px', left: '20px' }),
        ...(position === 'bottom-right' && { bottom: '20px', right: '20px' }),
        ...(position === 'bottom-left' && { bottom: '20px', left: '20px' }),
      }}
      onClick={() => !showDetails && setIsVisible(!isVisible)}
      title={showDetails ? undefined : 'Click for network details'}
    >
      <div className="network-status-main">
        <span className="network-icon" style={{ marginRight: '8px' }}>
          {getStatusIcon()}
        </span>
        <span className="network-text">
          {getStatusText()}
        </span>
      </div>

      {(showDetails || isVisible) && (
        <div 
          className="network-status-details"
          style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #e5e7eb',
            fontSize: '12px',
            color: '#6b7280'
          }}
        >
          <div>Status: {networkInfo.isOnline ? 'Online' : 'Offline'}</div>
          
          {networkInfo.isOnline && (
            <>
              <div>Quality: {networkInfo.connectionQuality}</div>
              
              {networkInfo.effectiveType && networkInfo.effectiveType !== 'unknown' && (
                <div>Type: {networkInfo.effectiveType}</div>
              )}
              
              {networkInfo.downlink && (
                <div>Speed: {networkInfo.downlink} Mbps</div>
              )}
              
              {networkInfo.rtt && (
                <div>Latency: {networkInfo.rtt}ms</div>
              )}
            </>
          )}
          
          {queueStatus.queueLength > 0 && (
            <div style={{ color: '#f59e0b', fontWeight: '500' }}>
              {queueStatus.queueLength} request{queueStatus.queueLength > 1 ? 's' : ''} queued
              {queueStatus.isProcessing && ' (processing...)'}
            </div>
          )}
          
          {!networkInfo.isOnline && (
            <div style={{ color: '#ef4444', fontWeight: '500' }}>
              Requests will be queued until connection is restored
            </div>
          )}
          
          {networkInfo.lastCheck && (
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              Last check: {new Date(networkInfo.lastCheck).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NetworkStatus;