from abc import ABC, abstractmethod
from typing import Dict, Any

from models.agent_request import AgentRequest
from models.agent_response import AgentResponse

# Abstract base class for chat strategies
class ChatStrategy(ABC):
    @abstractmethod
    async def handle_request(self, agent_request: AgentRequest) -> AgentResponse:
        pass