import React, { useEffect, useRef } from 'react';
import { useLogging } from '../context/LoggingContext';

const LogWindow: React.FC = () => {
  const { logs, clearLogs } = useLogging();
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  console.log('Current logs:', logs);
  return (
    <div
      style={{
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100px',
        backgroundColor: '#1e1e1e',
        color: '#f0f0f0',
        borderTop: '1px solid #444',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto', // Enable interactions
        overflow: 'hidden', /* Prevent any overflow issues */


      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          backgroundColor: '#333',
          borderBottom: '1px solid #444',
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '12px' }}>Activity Log</span>
        <button
          onClick={clearLogs}
          style={{
            backgroundColor: 'transparent',
            color: '#f0f0f0',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 8px',
            fontSize: '11px',
          }}
        >
          Clear
        </button>
      </div>
      <div
        style={{
          overflowY: 'auto',
          height: 'calc(100% - 25px)', /* Subtract header height */
          padding: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}
      >
        {logs.map((log) => (
          <div
            key={log.id}
            style={{
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ color: '#888', marginRight: '8px' }}>[{formatTime(log.timestamp)}]</span>
            <span
              style={{
                color:
                  log.type === 'error'
                    ? '#ff6b6b'
                    : log.type === 'warning'
                    ? '#feca57'
                    : log.type === 'success'
                    ? '#1dd1a1'
                    : '#48dbfb',
              }}
            >
              {log.message}
            </span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default LogWindow;