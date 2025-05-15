from fastapi import HTTPException
from orchestrator.chat_strategy import ChatStrategy
from models.agent_request import AgentRequest
from models.agent_response import AgentResponse
from models.available_agents import AvailableAgents
from utils.response_parser import parse_agent_response
from models.conversation_state import ConversationStateStore

class SingleChatStrategy(ChatStrategy):
    def __init__(self, conversation_store: ConversationStateStore):
        self.conversation_store = conversation_store

    async def handle_request(self, request: AgentRequest) -> AgentResponse:   
        conversation_id = request.conversation_id      
        message_id = request.message.id        
        if not conversation_id or not message_id:
            raise HTTPException(
                status_code=400,
                detail="Conversation ID and message ID are required."
            )
        
        
        agent_name = request.strategy.agents_involved[0]
        if not agent_name:
            raise HTTPException(
                status_code=404,
                detail=f"Agent {agent_name} not found in agent registry."
            )
        
        # Create agent instance
        agent_instance = await AvailableAgents.get_agent(agent_name)
        if not agent_instance:
            raise HTTPException(
                status_code=404,
                detail=f"Agent {agent_name} not found in agent registry."
            )
        # Get agent thread from conversation state
        conversation_state = self.conversation_store.init_state(id=conversation_id)
        thread = conversation_state.get_thread(id=agent_name)
       
        # Pass the message as a string from request
        # Let the agent's invoke method handle formatting it appropriately
        message = request.message.content
        message_data = request.message.metadata
        
        # Collect all responses from the stream
        responses = []
        # Pass any additional parameters to the agent's invoke method
        kwargs = {}
        if message_data is not None:
            kwargs["message_data"] = message_data
            
        async for response in agent_instance.invoke(messages=message, thread=thread, **kwargs):
            if response:
                responses.append(response)            
        
        if responses:
            # Use the last response as the final one
            final_response = responses[-1]

            # Update conversation store
            conversation_state.update_thread(id=agent_name, thread=final_response.thread)
            self.conversation_store.save_state(state=conversation_state)

            return await parse_agent_response(final_response, conversation_id)
        else:
             raise HTTPException(
                status_code=500,
                detail="Internal server error, Agent didn't return any response."
            )