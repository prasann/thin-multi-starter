from pydantic import BaseModel
from abc import ABC, abstractmethod
from typing import Dict, Optional
from semantic_kernel.agents.agent import  AgentThread
from semantic_kernel.agents import  ChatHistoryAgentThread
from semantic_kernel.contents.chat_history import ChatHistory

class ConversationState:
    """A class to manage the state of a conversation.
    This class is responsible for storing the conversation ID, thread ids and corresponding message ids"""
    
    id: str
    threads: Dict[str, AgentThread]

    def __init__(self, id: str, threads: Optional[Dict[str, AgentThread]] = None):
        self.id = id
        self.threads = threads if threads is not None else {}


    def get_thread(self, id: str) -> Optional[AgentThread]:
        """Get a thread by its ID."""
        return self.threads.get(id)
    
    def update_thread(self, id: str, thread:AgentThread) -> None:
        self.threads[id] = thread
    
class ConversationStateStore(ABC):
    """Abstract base class for managing conversation state storage."""

    @abstractmethod
    def init_state(self, id: str) -> ConversationState:
        """Initialize the conversation state."""
        pass

    @abstractmethod
    def save_state(self, state: ConversationState) -> None:
        """Save or update the conversation state."""
        pass

    @abstractmethod
    def get_state(self, id: str) -> ConversationState | None:
        """Retrieve the conversation state by conversation ID."""
        pass

    @abstractmethod
    def delete_state(self, id: str) -> None:
        """Delete the conversation state by conversation ID."""
        pass

class InMemoryConversationStateStore(ConversationStateStore):
    """In-memory implementation of the ConversationStateStore."""

    def __init__(self):
        self._store: dict[str, ConversationState] = {}

    def init_state(self, id: str) -> ConversationState:
        """get or create the conversation state."""
        state = self.get_state(id=id)
        if not state:
            state = ConversationState(
                id=id,
                threads={}
            )
            self.save_state(state=state)
        return state
    
    def save_state(self, state: ConversationState) -> None:
        """Save or update the conversation state in memory."""
        self._store[state.id] = state

    def get_state(self, id: str) -> ConversationState | None:
        """Retrieve the conversation state from memory."""
        return self._store.get(id)

    def delete_state(self, id: str) -> None:
        """Delete the conversation state from memory."""
        self._store.pop(id, None)

          