from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from models.enumerations import StrategyName

class Strategy(BaseModel):
    name: StrategyName
    agents_involved: List[str]


class Message(BaseModel):
    content: str
    role: Optional[str] = None
    id: str
    metadata: Optional[Dict[str, Any]] = None  

class AgentRequest(BaseModel):
    conversation_id: str
    message: Message
    history: Optional[List[Message]] = None
    strategy: Optional[Strategy] = None