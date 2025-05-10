from typing import Dict, Type
from fastapi import HTTPException
from orchestrator.chat_strategy import ChatStrategy
from orchestrator.single_chat_strategy import SingleChatStrategy
from orchestrator.intent_router_strategy import IntentRouterStrategy
from models.agent_request import AgentRequest
from models.agent_response import AgentResponse
from models.enumerations import StrategyName
from models.conversation_state import ConversationStateStore


class RequestDispatcher:
    def __init__(self, conversation_store: ConversationStateStore):
        self.conversation_store = conversation_store
        # Dictionary to store available strategies
        self.strategies: Dict[StrategyName, Type[ChatStrategy]] = {
            StrategyName.INTENT_ROUTER: IntentRouterStrategy,
            StrategyName.SINGLE_CHAT: SingleChatStrategy,
        }

    def register_strategy(self, strategy_name: StrategyName, strategy: ChatStrategy) -> None:
        """Method to add new chat strategies dynamically"""
        self.strategies[strategy_name] = strategy

    async def dispatch_request(self, request: AgentRequest) -> AgentResponse:
        """Route the request to appropriate handler"""
        
        if request.strategy.name not in self.strategies:
            raise HTTPException(
                status_code=400,
                detail=f"No strategy registered for '{request.strategy.name}'"
            )
        
        strategy = self.strategies[request.strategy.name](self.conversation_store)
        response = await strategy.handle_request(request)
        return response