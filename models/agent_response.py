from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class Message(BaseModel):
    content: str
    role: Optional[str] = None
    agent_id: Optional[str] = None
    private_message: Optional[bool] = None # Sending all the internal conversation to the UI might help if we have a detailed UI
    id: Optional[str] = None
    rich_content: Optional[Dict[str, Any]] = None # Support for adaptive cards, suggested actions, etc.

class AgentResponse(BaseModel):
    conversation_id: str 
    message: Message
