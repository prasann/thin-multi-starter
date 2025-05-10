from enum import Enum

class StrategyName(Enum):
    """
    Enumeration of available agent orchestration strategies.
    """
    SINGLE_CHAT = "single_chat"  # Single agent chat strategy
    INTENT_ROUTER = "intent_router"  # Route to different agents based on intent