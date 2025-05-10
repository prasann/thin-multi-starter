from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from models.enumerations import StrategyName

class Strategy(BaseModel):
    """Configuration for the agent strategy to be used."""
    
    name: StrategyName = Field(
        description="Strategy name to determine how agents should be orchestrated"
    )
    agents_involved: List[str] = Field(
        description="List of agent names that will participate in this strategy"
    )


class Message(BaseModel):
    """A message in the conversation."""
    
    content: str = Field(
        description="The actual text content of the message"
    )
    role: Optional[str] = Field(
        None, 
        description="Role of the entity sending this message (e.g., 'user', 'assistant')"
    )
    id: str = Field(
        description="Unique identifier for this message"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional metadata associated with this message"
    )

class AgentRequest(BaseModel):
    """
    Request object for invoking an agent.
    """
    
    conversation_id: str = Field(
        description="Unique identifier for the conversation"
    )
    message: Message = Field(
        description="Current message being sent to the agent"
    )
    history: Optional[List[Message]] = Field(
        None,
        description="Previous messages in the conversation, if any"
    )
    strategy: Optional[Strategy] = Field(
        None,
        description="Strategy configuration for agent orchestration"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "conversation_id": "conv_12345",
                "message": {
                    "content": "Tell me a story about a brave knight",
                    "role": "user",
                    "id": "msg_1"
                },
                "strategy": {
                    "name": "single_chat",
                    "agents_involved": ["story_teller"]
                }
            }
        }
    }