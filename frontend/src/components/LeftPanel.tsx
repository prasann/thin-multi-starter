import React, { useState, useEffect } from 'react';
import NodeBox from './NodeBox';
import { useLogging } from '../context/LoggingContext';
import { useToggle } from '../context/ToggleContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';

interface Agent {
  name: string;
  description: string;
  label: string;
}

const LeftPanel: React.FC = () => {
  const [workerAgents, setWorkerAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addLog } = useLogging();
  const { toggleState, setToggleState } = useToggle();
  // Add a ref to track if the component has mounted
  const hasMounted = React.useRef(false);

  // Principal agents remain hardcoded
  const principalAgents = [
    { 
      name: 'Principal Agent - Single Chat', 
      agent_id: 'PA_single_chat',      
      description: 'A principal agent that manages single chat interactions',
      label: 'SK',
    },
    { 
      name: 'Principal Agent - Intent Router', 
      agent_id: 'PA_intent_router',
      description: 'A principal agent that routes intents to appropriate worker agents',
      label: 'SK',
    }
  ];

  useEffect(() => {
    // Only fetch on first mount
    if (!hasMounted.current) {
      hasMounted.current = true;
      
      const fetchAgents = async () => {
        try {
          setIsLoading(true);
          console.log('Fetching agents from API...');
          const response = await fetch('http://localhost:8000/agents');
          
          if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
          }
          
          const data: Agent[] = await response.json();
          setWorkerAgents(data);
          addLog('Worker agents loaded successfully', 'success');
        } catch (err) {
          console.error('Error fetching agents:', err);
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
          addLog(`Failed to load worker agents: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
          // Set default agents if API fails
          setWorkerAgents([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAgents();
    }
  }, []); // Empty dependency array to run only once
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, box: string, agent_id: string) => {
    event.dataTransfer.setData('application/reactflow', box);
    event.dataTransfer.setData('agent_id', agent_id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleToggleClick = () => {
    setToggleState(!toggleState);
  };

  return (
    <div className="left-panel">
      {/* Principal Agents Heading */}
      <h3 className="agent-section-heading">Principal Agents</h3>
      
      {/* Principal Agent boxes */}
      {principalAgents.map((agent) => (
        <NodeBox
          key={agent.name}
          boxName={agent.name}
          agent_id={agent.agent_id}
          description={agent.description}
          label={agent.label}
          onDragStart={handleDragStart}
          isBlue={true}
        />
      ))}
      
      {/* Line break */}
      <div className="line-break"></div>
      
      {/* Worker Agents Heading */}
      <h3 className="agent-section-heading">Worker Agents</h3>
      
      {isLoading ? (
        <div className="loading-indicator">Loading agents...</div>
      ) : error ? (
        <div className="error-message">
          <p>Error loading agents. Using defaults.</p>
        </div>
      ) : (
        /* Map through the fetched worker agents */
        workerAgents.map((agent) => (
          <NodeBox
            key={agent.name}
            boxName={agent.name.charAt(0).toUpperCase() + agent.name.slice(1).replace(/_/g, ' ')}
            agent_id={agent.name}
            label={agent.label}
            description={agent.description}
            onDragStart={handleDragStart}
          />
        ))
      )}

      {/* Add the toggle at the bottom of the left panel */}
      <div className="toggle-container" style={{
        position: 'absolute',
        bottom: '140px',
        left: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        padding: '10px',
      }} onClick={handleToggleClick}>
        <FontAwesomeIcon 
          icon={toggleState ? faToggleOn : faToggleOff} 
          style={{ 
            fontSize: '1.5rem', 
            margin: "20px 2px",
            color: toggleState ? '#3b82f6' : '#94a3b8',
            transition: 'color 0.3s ease'
          }} 
        />
        <span style={{ 
          fontSize: '14px', 
          color: toggleState ? '#3b82f6' : '#94a3b8',
          fontWeight: 500,
          transition: 'color 0.3s ease' 
        }}>
          {toggleState ? 'Auto Connect: Enabled' : 'Auto Connect: Disabled'}
        </span>
      </div>
    </div>
  );
};

export default LeftPanel;