from dataclasses import dataclass
from typing import List, Optional


@dataclass
class AzureAIAgentRequest:
    """
    Represents a request to create an Azure AI agent.
    """
    agent_id: str
    name: str
    model: str
    description: str
    instructions: str
    rag_agent: bool
    file_paths: Optional[List[str]] = None