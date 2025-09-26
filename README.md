# Thin Multi-Agent System

A sophisticated multi-agent system demonstrating integration between different AI platforms and agent frameworks. This project showcases how to build a travel assistant ecosystem with specialized agents for different domains.

## Project Intentions

This project demonstrates:

- **Multi-Agent Architecture**: Building a system with specialized agents that can work together to provide comprehensive travel assistance
- **Platform Integration**: Showcasing integration between Microsoft Copilot Studio and Azure AI Foundry agents
- **Real-world Application**: Creating practical travel and dining recommendation services
- **Scalable Design**: Implementing a flexible architecture that can accommodate additional agent types and capabilities

## What's Included

### 🤖 Specialized Agents

**Travel Explorer Agent (Copilot Studio)**
- Recommends tourist attractions based on destination cities
- Categorizes attractions by type (religious sites, nightlife, family-friendly locations)
- Provides comprehensive travel guidance

**Culinary Advisor Agent (Azure AI Foundry)**
- Restaurant guide for cities worldwide
- Tailored dining recommendations based on user preferences
- Covers local delicacies, fine dining, budget options, and specific cuisines
- Provides information on popular dishes, ratings, and unique culinary experiences

### 🏗️ Architecture Components

**Backend (`/backend`)**
- FastAPI-based REST API with agent orchestration
- Intent routing system for multi-agent coordination
- Telemetry and tracing capabilities
- Chainlit UI integration for interactive chat
- Modular agent framework supporting multiple platforms

**Frontend (`/frontend`)**
- React-based visual interface with drag-and-drop functionality
- Interactive canvas for visualizing agent relationships
- Real-time chat panel integration
- Responsive design for various screen sizes

### 🔧 Key Features

- **Intent Routing**: Automatically routes user queries to the most appropriate agent
- **Multi-Platform Support**: Seamlessly integrates Copilot Studio and Azure AI Foundry agents
- **Visual Interface**: Interactive canvas for understanding agent relationships
- **Real-time Chat**: Live conversation interface with specialized agents
- **Extensible Design**: Easy to add new agents and capabilities
- **Telemetry Integration**: Built-in monitoring and tracing for performance insights

## Technology Stack

- **Backend**: Python, FastAPI, Chainlit
- **Frontend**: React, TypeScript, React Flow
- **AI Platforms**: Microsoft Copilot Studio, Azure AI Foundry
- **Infrastructure**: Azure AI Services, REST APIs

## Getting Started

For detailed setup and running instructions, please see [SETUP.md](./SETUP.md).

## Project Structure

```
thin-multi-agent/
├── backend/           # FastAPI backend with agent orchestration
│   ├── agents/        # Agent implementations
│   ├── api/          # REST API endpoints
│   ├── models/       # Data models and schemas
│   ├── orchestrator/ # Agent coordination logic
│   └── telemetry/    # Monitoring and tracing
├── frontend/         # React frontend application
│   ├── src/          # Source code
│   │   ├── components/ # UI components
│   │   └── context/   # React context providers
│   └── public/       # Static assets
└── SETUP.md         # Detailed setup instructions
```

## Use Cases

- **Travel Planning**: Get comprehensive destination recommendations with categorized attractions
- **Dining Discovery**: Find the perfect restaurants based on your preferences and location
- **Multi-Agent Workflows**: Understand how different AI agents can collaborate effectively
- **Platform Integration**: Learn how to integrate multiple AI platforms in a single application

## Contributing

This project serves as a demonstration of multi-agent system architecture and platform integration. Feel free to explore the code, experiment with different agent configurations, and extend the functionality.

## License

This project is for demonstration purposes and showcases integration patterns for multi-agent AI systems.