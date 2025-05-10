import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import LeftPanel from './components/LeftPanel';
import MainCanvas from './components/MainCanvas';
import { LoggingProvider } from './context/LoggingContext';
import { ToggleProvider } from './context/ToggleContext';
import LogWindow from './components/LogWindow';

import './styles/App.css';
import './styles/flowStyles.css'; // Import the new styles

const App: React.FC = () => {
  return (
    <LoggingProvider>
      <ToggleProvider>
        <ReactFlowProvider>
          <div className="app-container">
            <div className="app-main-content">
              <LeftPanel />
              <MainCanvas />
            </div>
            <LogWindow />
          </div>
        </ReactFlowProvider>
      </ToggleProvider>
    </LoggingProvider>
  );
};

export default App;