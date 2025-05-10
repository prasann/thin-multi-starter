import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the structure of a log entry
interface LogEntry {
  id: number;
  timestamp: Date;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

// Define the logging context shape
interface LoggingContextType {
  logs: LogEntry[];
  addLog: (message: string, type?: 'info' | 'warning' | 'error' | 'success') => void;
  clearLogs: () => void;
}

// Create the context with default values
const LoggingContext = createContext<LoggingContextType>({
  logs: [],
  addLog: () => {},
  clearLogs: () => {},
});

// Custom hook for easy access to the logging context
export const useLogging = () => useContext(LoggingContext);

// Provider component
interface LoggingProviderProps {
  children: ReactNode;
}

export const LoggingProvider: React.FC<LoggingProviderProps> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Function to add a new log
  const addLog = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    const newLog: LogEntry = {
      id: Date.now(),
      timestamp: new Date(),
      message,
      type,
    };
    setLogs((prevLogs) => [...prevLogs, newLog]);
  };

  // Function to clear all logs
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <LoggingContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LoggingContext.Provider>
  );
};