import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'; // Example icon

interface NodeBoxProps {
  boxName: string;
  agent_id: string;
  description?: string;
  label?: string;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, boxName: string, agent_id: string) => void;
  isBlue?: boolean; // New property to conditionally style the box
}

const NodeBox: React.FC<NodeBoxProps> = ({ boxName, agent_id, description, label, onDragStart, isBlue = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Determine the color based on the node type
  let textColor = '#333'; // default color
  let bgColor = '#ffffff'; // default background
  let textBold = 'normal';
  if (boxName === 'Principal Agent') {
    textColor = '#0066cc'; // blue for Principal Agent
    bgColor = '#f0f8ff'; // light blue background
    textBold = 'bold'; // make it bold
  } else if (boxName === 'Azure AI Agent') {
    textColor = '#107c10'; // green for Azure AI Agent
    bgColor = '#f0fff0'; // light green background
  } else if (boxName.includes('Kernel')) {
    textColor = '#5c2d91'; // purple for Semantic Kernel
    bgColor = '#f8f0ff'; // light purple background
  } else if (boxName.includes('CoPilot')) {
    textColor = '#d83b01'; // orange for CoPilot
    bgColor = '#fff8f0'; // light orange background
  }

  return (
    <div
      className={`node-box ${isBlue ? 'blue' : ''}`} // Apply the "blue-text" class if isBlue is true
      draggable
      onDragStart={(event) => onDragStart(event, boxName, agent_id)}
      onMouseEnter={() => {
        setShowTooltip(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        setIsHovered(false);
      }}
      style={{
        padding: '20px 5px',
        border: '1px solid #ddd',
        borderRadius: '10px',
        margin: '10px 0',
        cursor: 'grab',
        position: 'relative',
        backgroundColor: isHovered ? bgColor : 'white',
        transition: 'all 0.2s ease-in-out',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        boxShadow: isHovered ? '0 4px 8px rgba(0, 0, 0, 0.1)' : 'none',
        color: isHovered ? textColor : 'inherit',
        fontWeight: textBold, // Optionally make it bold too
      }}
    >
      {/* Label on the top right */}
      <div
        style={{
          position: 'absolute',
          top: '5px',
          right: '10px',
          backgroundColor: '#ffcc00', // Yellow background for the label
          color: '#333', // Dark text color
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
          marginLeft: '5px', // Added margin to the left
          marginBottom: '5px', // Added margin to the bottom
        }}
      >
        {label}
      </div>
      <FontAwesomeIcon icon={faChevronRight} className="node-box-icon" />
      {boxName}
      {description && showTooltip && (
        <div 
          className="node-tooltip"
          style={{
            position: 'absolute',
            top: '0',
            left: '100%', // Position it right after the right edge of the NodeBox
            marginLeft: '10px', // Add some spacing from the NodeBox
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            zIndex: 9999,
            minWidth: '200px',
            maxWidth: '300px',
            wordWrap: 'break-word',
            fontSize: '12px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '4px' }}>
            {boxName}
          </div>
          {description}
        </div>
      )}
    </div>
  );
};

export default NodeBox;