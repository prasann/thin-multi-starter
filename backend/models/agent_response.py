from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class Message(BaseModel):
    """A message in the agent's response."""
    
    content: str = Field(
        description="The text content of the response message"
    )
    role: Optional[str] = Field(
        None, 
        description="Role of the entity sending this message (e.g., 'assistant')"
    )
    agent_id: Optional[str] = Field(
        None,
        description="Identifier of the agent that generated this message"
    )
    private_message: Optional[bool] = Field(
        None, 
        description="Whether this is an internal message not meant for the end user"
    )
    id: Optional[str] = Field(
        None,
        description="Unique identifier for this message"
    )
    rich_content: Optional[Dict[str, Any]] = Field(
        None, 
        description="Additional structured content like adaptive cards or suggested actions"
    )

class AgentResponse(BaseModel):
    """
    Response object from an agent invocation.
    """
    
    conversation_id: str = Field(
        description="Unique identifier for the conversation this response belongs to"
    )
    message: Message = Field(
        description="The message content of the agent's response"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "conversation_id": "conv_12345",
                "message": {
                    "content": "Once upon a time, in a kingdom far away, there lived a brave knight...",
                    "role": "assistant",
                    "agent_id": "story_teller",
                    "id": "msg_2"
                }
            }
        }
    }
