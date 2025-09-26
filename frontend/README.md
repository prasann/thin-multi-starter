# Frontend - Multi-Agent System Interface

The React-based frontend for the Thin Multi-Agent System, providing an interactive visual interface for managing and visualizing AI agent relationships.

## Key Features

- **Visual Agent Canvas**: Drag and drop interface for agent visualization
- **Real-time Chat Panel**: Interactive communication with AI agents
- **Agent Relationship Mapping**: Connect agents with visual arrows
- **Responsive Design**: Works across different screen sizes
- **Integration Ready**: Seamlessly connects to the FastAPI backend

## Quick Start

For detailed setup and running instructions, see the main project [SETUP.md](../SETUP.md).

### Basic Usage

1. Install dependencies: `npm install`
2. Start development server: `npm start`
3. Open browser: `http://localhost:3000`

## Components

- `ChatPanel.tsx` - Chat interface with AI agents
- `LeftPanel.tsx` - Draggable agent selector
- `MainCanvas.tsx` - Visual canvas for agent relationships
- `NodeBox.tsx` - Individual agent representation
- `LogWindow.tsx` - System logging and debugging

## Usage

- Drag agent boxes from the left panel to the main canvas
- Connect agents by drawing arrows between them
- Use the chat panel to interact with individual agents
- View system logs in the logging window

## Technology Stack

- React 18+ with TypeScript
- React Flow for canvas interactions
- Context API for state management
- CSS Modules for styling

For complete project documentation, see the main [README.md](../README.md).