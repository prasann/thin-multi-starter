# Backend - Multi-Agent System API

The backend component of the Thin Multi-Agent System, built with FastAPI and featuring specialized AI agents for travel and dining recommendations.

## Key Components

- **Agent Orchestration**: Coordinate multiple AI agents (Copilot Studio & Azure AI Foundry)
- **REST API**: FastAPI-based endpoints for agent communication
- **Intent Routing**: Automatically route user queries to appropriate agents
- **Chainlit Integration**: Interactive chat interface
- **Telemetry**: Built-in monitoring and tracing capabilities

## Quick Start

For detailed setup and running instructions, see the main project [SETUP.md](../SETUP.md).

### Basic Usage

1. Install dependencies: `pip install -r requirements.txt`
2. Configure environment variables (see SETUP.md)
3. Run: `uvicorn main:app --reload`
4. Access API docs: `http://localhost:8000/docs`
5. Access Chainlit UI: `http://localhost:8000/chainlit`

## Project Structure

- `agents/` - AI agent implementations
- `api/` - REST API endpoints
- `models/` - Data models and schemas
- `orchestrator/` - Agent coordination logic
- `telemetry/` - Monitoring and tracing
- `utils/` - Utility functions

For complete project documentation, see the main [README.md](../README.md).

