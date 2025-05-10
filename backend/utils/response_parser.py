from typing import List

from semantic_kernel.agents.agent import AgentResponseItem
from models.agent_response import AgentResponse, Message
from semantic_kernel.agents import  ChatHistoryAgentThread, AzureAIAgentThread
# from agents.copilot_studio.base.copilot_message_content import CopilotMessageContent, CopilotContentType

async def parse_agent_response(agent_response: AgentResponseItem, conversation_id: str) -> AgentResponse:
    """
    Parse the agent response into a structured format.
    """
    # If the response contains a CopilotMessageContent, extract rich content
    rich_content = None
    # if isinstance(agent_response.message, CopilotMessageContent):
    #     # Check for adaptive card
    #     if agent_response.message.copilot_content_type == CopilotContentType.ADAPTIVE_CARD:
    #         rich_content = {
    #             "type": "adaptiveCard",
    #             "content": agent_response.message.adaptive_card
    #         }
    #     # Check for suggested actions
    #     elif agent_response.message.copilot_content_type == CopilotContentType.SUGGESTED_ACTIONS and agent_response.message.suggested_actions:
    #         rich_content = {
    #             "type": "suggestedActions",
    #             "actions": agent_response.message.suggested_actions
    #         }

    message = Message(
        content=agent_response.message.content,
        role=agent_response.message.role,
        agent_id=agent_response.name,
        id=agent_response.metadata.get("id"),
        rich_content=rich_content,
    )

    # Extract the history from the agent thread
    thread = agent_response.thread
    history: List[Message] = []
    if isinstance(thread, ChatHistoryAgentThread):
        for history_message in thread._chat_history:
             history.append(
                Message(
                    content=history_message.content,
                    role=history_message.role,
                    agent_id= history_message.name if history_message.name else history_message.metadata.get("agent_id"),
                    id=history_message.metadata.get("id"),
                    private_message=False,                    
                )
            )
    elif isinstance(thread, AzureAIAgentThread):
        async for history_message in thread.get_messages():
             history.append(
                Message(
                    content=history_message.content,
                    role=history_message.role,
                    agent_id= history_message.name if history_message.name else history_message.metadata.get("agent_id"),
                    id=history_message.metadata.get("id"),
                    private_message=False,                    
                )
            )

    return AgentResponse(
        conversation_id=conversation_id,
        message=message,
        history=history,
    )