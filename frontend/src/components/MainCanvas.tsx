import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStop, faPlay, faCompress, faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
import { useLogging } from '../context/LoggingContext';
import ChatPanel from './ChatPanel'; // Import the new ChatPanel component
import { useToggle } from '../context/ToggleContext';

import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  MiniMap,
  useReactFlow,
  useViewport,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Add a TypeScript interface for the AnimatedMarker props
interface AnimatedMarkerProps {
  x: number;
  y: number;
  isFadingOut: boolean;
}

interface AgentConnectionEdge {
  source: string;
  target: string;
}

const MainCanvas: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { project, fitView } = useReactFlow();
  const [animationActive, setAnimationActive] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [isForwardDirection, setIsForwardDirection] = useState(true);
  const { addLog } = useLogging();
  const { toggleState } = useToggle();
  
  // Chat panel states - still needed in MainCanvas
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [currentPrincipalAgentId, setCurrentPrincipalAgentId] = useState<string>("");
  const [currentAgentIds, setCurrentAgentIds] = useState<string[]>([]);
  const [connectedAgentEdges, setConnectedAgentEdges] = useState<AgentConnectionEdge[]>([]);

  // Add nodeDeleted state back for type compatibility
  const [nodeDeleted, setNodeDeleted] = useState(false);
  
  // Function to reset nodeDeleted
  const resetNodeDeleted = useCallback(() => {
    setNodeDeleted(false);
  }, []);

  // Get the current viewport state
  const { x, y, zoom } = useViewport();
  
  // Update onConnect to log connections and store agent IDs
  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // Check if the source node is a Principal Agent and the target node is not
      const sourceNode = nodes.find(node => node.id === params.source);
      const targetNode = nodes.find(node => node.id === params.target);
      if (sourceNode && targetNode && sourceNode.data.agent_id.includes('PA') && !targetNode.data.agent_id.includes('PA')) {
        setEdges((eds) => addEdge(params, eds));
        addLog(`Connected ${sourceNode.data.label} to ${targetNode.data.label}`, 'info');
        // Store the agent IDs of connected nodes
        setConnectedAgentEdges(prev => [...prev, {
          source: sourceNode.data.agent_id,
          target: targetNode.data.agent_id
        }]);
      }else{
        console.log("Not a valid connection: ", sourceNode, targetNode);
      }
    },
    [setEdges, nodes, addLog]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = (event.target as HTMLDivElement).getBoundingClientRect();
      const boxName = event.dataTransfer.getData('application/reactflow');
      const agent_id = event.dataTransfer.getData('agent_id');

      // Check if this agent_id is already connected in an edge
      const isAlreadyConnected = nodes.some(
        node => node.data.agent_id === agent_id || node.data.agent_id === agent_id
      );

      // Check if you dont have a Principal Agent already in the workflow
      if (nodes.every(node => !node.data.agent_id.includes('PA')) && !agent_id.includes('PA')) {
        addLog(`Cannot add ${boxName}: No Principal agent present in the workflow`, 'error');
        return; // Exit early without adding the node
      }

      
      if (isAlreadyConnected) {
        addLog(`Cannot add ${boxName}: Agent is already connected in the workflow`, 'error');
        return; // Exit early without adding the node
      }


      const mousePosition = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const position = project(mousePosition);

      const boxWidth = 150;
      const boxHeight = 50;
      const adjustedPosition = {
        x: position.x - boxWidth / 2,
        y: position.y - boxHeight / 2,
      };
      // Determine the color based on the node type
      let textColor = '#333'; // default color
      let bgColor = '#ffffff'; // default background
      let borderColor = '#ccc';
      let icon = null;

      if (boxName.includes('Principal Agent')) {
        textColor = '#1a56db'; // deeper blue
        bgColor = '#ebf4ff'; // light blue background
        borderColor = '#93c5fd'; // blue border
      } else if (boxName.includes('Azure AI Agent')) {
        textColor = '#047857'; // deep green
        bgColor = '#ecfdf5'; // light green background
        borderColor = '#6ee7b7'; // green border
      } else if (boxName.includes('Kernel')) {
        textColor = '#6b21a8'; // deep purple
        bgColor = '#f5f3ff'; // light purple background
        borderColor = '#c4b5fd'; // purple border
      } else if (boxName.includes('CoPilot')) {
        textColor = '#b45309'; // deep orange
        bgColor = '#fff7ed'; // light orange background
        borderColor = '#fdba74'; // orange border
      }
      
      // Generate a truly unique ID using timestamp + random string
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10);
      const newNodeId = `node-${timestamp}-${randomStr}`;

      console.log("New node ID: ", boxName, newNodeId);
      
      const newNode = {
        id: newNodeId, // Store ID for later use
        type: 'default',
        position: adjustedPosition,
        data: { 
          label: boxName,
          agent_id: agent_id, // Store the agent_id in the node data
          // Add custom styling to the node
          style: {
            color: textColor,
            fontWeight: 500,
            fontSize: '14px',
          }
        },
        // Add styling for the node container
        style: {
          background: bgColor,
          borderColor: borderColor,
          borderWidth: '2px',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          width: boxWidth,
          height: boxHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }
      };

      setNodes((nds) => nds.concat(newNode));
      addLog(`Created new node: ${boxName}`, 'success');
      
      // If the new node is not a Principal Agent, automatically connect it to the Principal Agent
      if (!agent_id.includes('PA') && toggleState) {
        // Find the Principal Agent node
        const principalNode = nodes.find(node => node.data.agent_id.includes('PA'));
        
        if (principalNode) {
          // Create connection parameters
          const connectionParams: Connection = {
            source: principalNode.id,
            target: newNodeId,
            sourceHandle: null,
            targetHandle: null
          };
          
          // Add the edge using the same logic as onConnect
          setEdges((eds) => addEdge(connectionParams, eds));
          addLog(`Connected ${principalNode.data.label} to ${boxName}`, 'info');
          
          // Store the agent IDs of connected nodes
          setConnectedAgentEdges(prev => [...prev, {
            source: principalNode.data.agent_id,
            target: agent_id
          }]);
        }
      }
    },
    [setNodes, project, addLog, nodes, setEdges, setConnectedAgentEdges]
  );

  // Creating a temporary edge to show animation path
  useEffect(() => {
    if (animationActive) {
      const principalNode = nodes.find((node) => node.data.agent_id.includes('Principal Agent'));
      const azureNode = nodes.find((node) => node.data.agent_id.includes('Azure AI Agent'));
      
      // Determine source and target based on direction
      const sourceNode = isForwardDirection ? principalNode : azureNode;
      const targetNode = isForwardDirection ? azureNode : principalNode;
  
      
      if (!sourceNode || !targetNode) {
        setAnimationActive(false);
        return;
      }
      
      // Create a temporary animation edge
      const animationEdge = {
        id: 'animation-edge',
        source: sourceNode.id,
        target: targetNode.id,
        type: 'straight',
        style: { stroke: 'transparent' }, // Make it invisible
      };
      
      setEdges((eds) => [...eds.filter(e => e.id !== 'animation-edge'), animationEdge]);
      
      return () => {
        setEdges((eds) => eds.filter(e => e.id !== 'animation-edge'));
      };
    }
  }, [animationActive, nodes, setEdges,isForwardDirection]);
  
  // Animation logic
  useEffect(() => {
    if (animationActive) {
      // print each node
      const principalNode = nodes.find((node) => node.data.agent_id.includes('PA'));
      const azureNode = nodes.find((node) => node.data.agent_id.includes('Azure AI Agent'));
      
      // Determine source and target based on direction
      const sourceNode = isForwardDirection ? principalNode : azureNode;
      const targetNode = isForwardDirection ? azureNode : principalNode;
      
      if (!sourceNode || !targetNode) {
        setAnimationActive(false);
        return;
      }
      
      const duration = 2500; // Animation duration in ms
      
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        const currentProgress = Math.min(elapsed / duration, 1);
        
        setProgress(currentProgress);
        
        if (currentProgress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Start fade out
          setIsFadingOut(true);
          setTimeout(() => {
            setAnimationActive(false);
            setIsFadingOut(false);
            setIsForwardDirection(prev => !prev);

          }, 1200);
        }
      };
      
      startTimeRef.current = null;
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [animationActive, nodes, isForwardDirection]);
  
  // Calculate current position based on progress
  const getAnimationPosition = useCallback(() => {
  // Get both nodes
  const principalNode = nodes.find((node) => node.id.includes('Principal Agent'));
  const azureNode = nodes.find((node) => node.id.includes('Azure AI Agent'));
  
  if (!principalNode || !azureNode) return { x: 0, y: 0 };
  
  // Determine start and end nodes based on direction
  const startNode = isForwardDirection ? principalNode : azureNode;
  const endNode = isForwardDirection ? azureNode : principalNode;

    
    // Calculate flow position
    const startX = startNode.position.x + 75; // Half of node width
    const startY = startNode.position.y + 25; // Half of node height
    const endX = endNode.position.x + 75; // Half of node width 
    const endY = endNode.position.y + 15; // half of node height
    
    const currentX = startX + (endX - startX) * progress;
    const currentY = startY + (endY - startY) * progress;

    return {
      x: currentX * zoom + x,
      y: currentY * zoom + y
    };

  }, [nodes, progress, x, y, zoom,isForwardDirection]); // Include viewport state in dependencies

  // Update the AnimatedMarker component to have dynamic sizing
  const AnimatedMarker: React.FC<AnimatedMarkerProps> = ({ x, y, isFadingOut }) => (
    <div
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%)`, // Center on the exact point
        left: x,
        top: y,
        minWidth: '50px', // Set minimum width instead of fixed width
        maxWidth: '200px', // Add maximum width to prevent extremely wide boxes
        width: 'auto', // Let width adjust to content
        height: 'auto', // Let height adjust to content
        backgroundColor: toggleState ? '#e0f2fe' : '#fef3c7', // Change background based on toggle
        color: toggleState ? '#0369a1' : '#92400e', // Change text color based on toggle
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px', // More padding for better text spacing
        justifyContent: 'center',
        borderRadius: '12px', // More rounded corners
        borderLeft: `4px solid ${toggleState ? '#38bdf8' : '#f59e0b'}`, // Change border based on toggle
        pointerEvents: 'none',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 1s ease, transform 0.3s ease', // Add transform for subtle hover effect
        zIndex: 1000,
        whiteSpace: 'nowrap', // Prevent text from wrapping
        boxSizing: 'border-box', // Include padding in width/height calculations
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Add shadow for depth
        fontWeight: 500, // Make text slightly bolder
      }}
    >
      {toggleState 
        ? (isForwardDirection ? 'Advanced Message' : 'Advanced Reply') 
        : (isForwardDirection ? 'Hi' : 'Hello! How can I help you?')} 
    </div>
  )

  return (
    <div className="main-canvas">
      {/* Existing buttons with enhanced styling */}
      <button
        onClick={() => fitView({ padding: 0.2 })}
        style={{
          position: 'absolute',
          left: '10px',
          width: '42px',
          height: '42px',
          bottom: '120px',
          padding: '0',
          backgroundColor: '#f8fafc', // Light background
          color: '#475569', // Slate color for icon
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
          zIndex: 10,
          transition: 'all 0.2s ease',
          outline: 'none',
          border: '1px solid #e2e8f0'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f1f5f9';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <FontAwesomeIcon icon={faCompress} style={{ fontSize: '1.2rem' }} />
      </button>

      <button
        onClick={() => {
          setNodes([]);
          setEdges([]);
          setIsForwardDirection(true);
          setAnimationActive(false);
          setIsFadingOut(false);
          setCurrentAgentIds([]);
          setCurrentPrincipalAgentId("");
          setConnectedAgentEdges([]);
          setShowChatPanel(false); // Hide the chat panel when reset is clicked
        }}
        style={{
          position: 'absolute',
          left: '60px',
          width: '42px',
          height: '42px',
          bottom: '120px',
          padding: '0',
          backgroundColor: '#f8fafc',
          color: '#475569',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
          zIndex: 10,
          transition: 'all 0.2s ease',
          outline: 'none',
          border: '1px solid #e2e8f0'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f1f5f9';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <FontAwesomeIcon icon={faArrowRotateRight} style={{ fontSize: '1.2rem' }} />
      </button>
      <button
        onClick={() => {
          setIsForwardDirection(true);
          setAnimationActive(false);
          setIsFadingOut(false);
        }}
        disabled={!animationActive}
        style={{
          position: 'absolute',
          left: '110px',
          width: '42px',
          height: '42px',
          bottom: '120px',
          padding: '0',
          backgroundColor: !animationActive ? '#f1f5f9' : '#fee2e2', // Red tint when active
          color: !animationActive ? '#94a3b8' : '#b91c1c', // Red icon when active
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
          zIndex: 10,
          cursor: !animationActive ? 'not-allowed' : 'pointer',
          opacity: !animationActive ? 0.7 : 1,
          transition: 'all 0.3s ease',
          border: '1px solid ' + (!animationActive ? '#e2e8f0' : '#fecaca')
        }}
        onMouseOver={(e) => {
          if (animationActive) {
            e.currentTarget.style.backgroundColor = '#fecaca';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseOut={(e) => {
          if (animationActive) {
            e.currentTarget.style.backgroundColor = '#fee2e2';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <FontAwesomeIcon icon={faStop} style={{ fontSize: '1.2rem' }} />
      </button>

      <button
        onClick={() => {
          const principalNode = nodes.find((node) => node.data.agent_id.includes('PA'));
          const agentNodes = nodes.filter((node) => !node.data.agent_id.includes('PA'));

          console.log("Run button clicked!", principalNode, agentNodes)

          if (principalNode && agentNodes) {
            // console.log(principalNode.data.agent_id)
            // console.log(agentNodes.map(node => node.data.agent_id).filter(id => id !== principalNode.data.agent_id))
            setCurrentPrincipalAgentId(principalNode.data.agent_id);
            setCurrentAgentIds(agentNodes.map(node => node.data.agent_id).filter(id => id !== principalNode.data.agent_id));
            setProgress(0);
            setAnimationActive(true);
            setShowChatPanel(true); // Open chat panel when Run is clicked
            // console.log("Connected Agent IDs: ", currentAgentIds);
            // console.log("Current Principal Agent ID: ", currentPrincipalAgentId);
            // console.log("All nodes:" ,nodes)
            // console.log("Connected nodes:" ,connectedAgentIds)
          } else {
            addLog('Need both Principal Agent and Azure AI Agent to run', 'warning');
          }
        }}
        disabled={animationActive}
        style={{
          position: 'absolute',
          left: '160px',
          width: '42px',
          height: '42px',
          bottom: '120px',
          padding: '0',
          backgroundColor: animationActive ? '#f1f5f9' : '#ecfdf5', // Green tint for play
          color: animationActive ? '#94a3b8' : '#047857', // Green icon for play
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
          zIndex: 10,
          cursor: animationActive ? 'not-allowed' : 'pointer',
          opacity: animationActive ? 0.7 : 1,
          transition: 'all 0.3s ease',
          border: '1px solid ' + (animationActive ? '#e2e8f0' : '#d1fae5')
        }}
        onMouseOver={(e) => {
          if (!animationActive) {
            e.currentTarget.style.backgroundColor = '#d1fae5';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseOut={(e) => {
          if (!animationActive) {
            e.currentTarget.style.backgroundColor = '#ecfdf5';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <FontAwesomeIcon icon={faPlay} style={{ fontSize: '1.2rem' }} />
      </button>

      {/* Render the ChatPanel component when showChatPanel is true */}
      {showChatPanel && (
        <ChatPanel
          showChatPanel={showChatPanel}
          setShowChatPanel={setShowChatPanel}
          connectedAgentIds={connectedAgentEdges.map(edge => edge.target)}
          currentPrincipalAgentId={currentPrincipalAgentId}
          nodeDeleted={nodeDeleted}
          resetNodeDeleted={resetNodeDeleted}
        />
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        defaultEdgeOptions={{
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#94a3b8',
          },
          animated: true,
        }}
      >
        <MiniMap 
          nodeStrokeColor="#3b82f6"
          nodeColor={(node) => {
            if (node.data.agent_id.includes('PA')) return '#1a56db';
            if (node.data.agent_id.includes('Azure AI Agent')) return '#047857';
            if (node.data.agent_id.includes('Kernel')) return '#6b21a8';
            if (node.data.agent_id.includes('CoPilot')) return '#b45309';
            return '#94a3b8';
          }}
          maskColor="rgba(240, 242, 245, 0.6)"
        />
        
        {animationActive && (
          <AnimatedMarker 
            {...getAnimationPosition()} 
            isFadingOut={isFadingOut} 
          />
        )}
      </ReactFlow>
    </div>
  );
};

export default MainCanvas;