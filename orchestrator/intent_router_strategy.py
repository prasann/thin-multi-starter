from fastapi import HTTPException
from orchestrator.chat_strategy import ChatStrategy
from models.agent_request import AgentRequest
from models.agent_response import AgentResponse
from models.conversation_state import ConversationStateStore
from agents.intent_router_principal_agent import IntentRouterPrincipalAgent
from utils.response_parser import parse_agent_response


class IntentRouterStrategy(ChatStrategy):
    def __init__(self, conversation_store: ConversationStateStore):
        self.conversation_store = conversation_store

    async def handle_request(self, request: AgentRequest) -> AgentResponse:
        intent_router_agent = IntentRouterPrincipalAgent(
            name="intent_router_principal_agent",
            description="This agent evaluates the relevance of three responses to a given prompt.",
            agent_list=request.strategy.agents_involved,
            conversation_store=self.conversation_store,
            conversation_id=request.conversation_id
        )

        responses = []
        async for response in intent_router_agent.execute(message=request.message):
            if response:
                responses.append(response)

        if responses:
            # Use the last response as the final one
            final_response = responses[-1]
            return await parse_agent_response(final_response, request.conversation_id)

        else:
            raise HTTPException(
                status_code=501,
                detail="Intent router agent did not return any response."
            )
