import json
from typing import List
import uuid
import re
from fastapi import HTTPException
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.agents import ChatCompletionAgent
from models.agent_request import Message
from models.custom_agent import CustomAgent
from opentelemetry import trace
from typing import AsyncIterable, List
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.agents import ChatCompletionAgent
from models.available_agents import AvailableAgents
from models.custom_agent import CustomAgent
from semantic_kernel.contents.chat_message_content import ChatMessageContent
from models.conversation_state import ConversationStateStore, ConversationState
from semantic_kernel.agents.agent import AgentResponseItem

class IntentRouterPrincipalAgent(ChatCompletionAgent, CustomAgent):

    conversation_store: ConversationStateStore = None
    state: ConversationState = None
    agent_list: List[str] = list[str]

    @staticmethod
    def what_can_i_do() -> str:
        return "This agent evaluates the given prompt and helps to decide the most relevant agent to respond."

    @property
    def is_async_initialization(self) -> bool:
        return False

    def __init__(self, name: str, description: str, agent_list: List[str], conversation_store: ConversationStateStore, conversation_id: str):

        # Initialize the kernel
        kernel = Kernel()

        # Add Azure OpenAI chat completion service
        kernel.add_service(AzureChatCompletion())

        # Prefix each capability with a numbered list like a., b., etc.
        capabilities = ""
        for index, agent in enumerate(agent_list):
            if AvailableAgents.agents[agent]:
                capabilities = f"{capabilities} {chr(97 + index)}. {AvailableAgents.agents[agent]["description"]} Agent id for these capabilities is: {agent} \n"
        
        # Initialize the ChatCompletionAgent with the kernel and service
        super().__init__(
            kernel=kernel,
            name=name,
            description=description,
            instructions=f"""
            You are the Principal Agent in a multi-agent assistant system, responsible for intelligently routing user interactions to the appropriate specialized agents. Your capabilities and responsibilities are outlined below.

            Your Responsibilities:  
            1. Understand the User's Query: Analyze the input to determine the user's intent.  
            2. Route Queries to Specialized Agents: Never answer the query yourself. Always classify the intent and route it to the appropriate specialized agent based on the capabilities provided.  
            3. Classify Intent Based on Capabilities: Use the provided list of capabilities to identify the primary intent and route the query to the corresponding specialized agent using its agent_id:  
                {capabilities}  
            4. Rephrase Queries: Rephrase the user's query in a clear, concise, and task-specific way before forwarding it to the selected agent.
            5. Track Destination City: When a user mentions a city name, remember it for future interactions across all agents. Always include the city in your response to ensure other agents have this context.
            6. Return Results in Plain Text: Always return the result as plain text, formatted as a raw Python dictionary or JSON object. Avoid using markdown, code blocks, or any other formatting.  

            Response Scenarios:  
            Case 1: Confident Classification  
            Use this when the intent is clear:  
            {{  
                "agent_id": "<agent_id>",  
                "confidence_score": <confidence_score>,  
                "your_response": "<your_response that includes city information if available>",
                "destination_city": "<city name if detected>"  
            }}  

            Case 2: Unclear Intent — Needs More Context  
            Use this when the intent is unclear, and additional information is required:  
            {{  
                "agent_id": null,  
                "confidence_score": <score_below_0.6>,  
                "your_response": "<Ask a clarifying question to get more context>",
                "destination_city": "<city name if detected>"  
            }}  

            Case 3: Unrelated Query — Out of Supported Scope  
            Use this when the query is outside the supported scope:  
            {{  
                "agent_id": null,  
                "confidence_score": 0.0,  
                "your_response": "Sorry, this query is outside the areas I can help with. Please ask about one of the supported topics.",
                "destination_city": "<city name if detected>"  
            }}  

            Case 4: Response to an Adaptive card.
            If the query is an adaptive card response, set agent_id to the agent who served the previous request and is capable of handling adaptive cards, and include the destination city if available.
            
            Case 5: Vague or Unclear Query  
            If the query is vague or unclear, set agent_id to null, confidence_score to 0.0, and update your_response to ask for more context.  

            Guardrails:  
            1. Do Not Answer Queries Yourself: Always route the query to the appropriate agent.  
            2. Avoid Hallucinating Intents: If unsure, use "Unknown" or "None" for routing and politely ask for more context.  
            3. Handle Vague Queries Gracefully: Respond with a greeting and make your best effort to classify the intent.  
            4. Confidence Score: Always include a valid confidence_score between 0 and 1, indicating your confidence in the classification.  
            5. City Tracking: Always track, maintain, and include any destination city information across interactions.

            Example:  
            {{  
                "agent_id": "city_culture_guide",  
                "confidence_score": 0.95,  
                "your_response": "Can you help me with the culture of Tokyo?",
                "destination_city": "Tokyo"
            }}  

            This structured approach ensures that user queries are handled efficiently, routed accurately, and responded to in a clear and actionable manner.
            """
        )

        self.conversation_store = conversation_store
        self.state = self.conversation_store.init_state(id=conversation_id)
        # Initialize destination city tracking
        if not hasattr(self.state, 'destination_city'):
            self.state.destination_city = None

    async def execute(self, message: Message) -> AsyncIterable[AgentResponseItem[ChatMessageContent]]:
        with trace.get_tracer(__name__).start_as_current_span(
            name="setup_intents_principal_agent",
        ):
            request_message_id = message.id if message.id else str(uuid.uuid4())
            chat_message = ChatMessageContent(
                    role=message.role,
                    content=message.content, 
                    metadata={"id": request_message_id}
                )

            # Check if the message is an adaptive card response
            # If so, set the message_data to kwarga.
            message_data = message.metadata

            kwargs = {}
            if message_data is not None and message_data.get("adaptive_card_response") is not None:
                kwargs["message_data"] = message_data
                
            # If we have a destination city, include it in the message to the agent
            if hasattr(self.state, 'destination_city') and self.state.destination_city:
                if kwargs.get("message_data") is None:
                    kwargs["message_data"] = {}
                kwargs["message_data"]["destination_city"] = self.state.destination_city

            responses : List[AgentResponseItem] = []
            # Keep calling the principal agent until it returns a response with "agent_id"
            # This fix is added to handle the case where the principal agent tries to respond himself.
            # Principal agent on rare cases returns a response which is not in the expected format.
            # With the loop, it will make sure that the principal agent will return a response in the expected format in the next run.            
            MAX_RETRIES = 5
            retry_count = 0
            while retry_count < MAX_RETRIES:
                async for response in self.invoke(messages=chat_message, thread=self.state.get_thread(id=self.name), **kwargs):
                    if response:
                        responses.append(response)

                if not responses:
                    raise HTTPException(
                        status_code=501,
                        detail="Intent router agent did not return any response."
                    )

                # Use the last response as the final one
                intent_agent_final_response = responses[-1]
                self.save_conversation_state(intent_agent_final_response, self.name)

                # Check if the content contains "agent_id" before parsing
                # print("Intent agent final response content:", intent_agent_final_response.content.content)
                if "agent_id" in intent_agent_final_response.content.content:
                    agent_info = json.loads(intent_agent_final_response.content.content)
                    
                    # Extract and store the destination city if provided
                    if "destination_city" in agent_info and agent_info["destination_city"]:
                        self.state.destination_city = agent_info["destination_city"]
                        
                    break
                else:
                    # If the response is not in the expected format, rephrase the query and ask the principal agent to try again
                    pa_thread = self.state.get_thread(id=self.name)
                    await pa_thread.on_new_message(new_message=ChatMessageContent(
                        role="user", 
                        content="""
                            Your output is not in the expected format. Please try again and ensure that the response is in the correct format like this:
                            {
                                "agent_id": "<agent_id>",
                                "confidence_score": <confidence_score>,
                                "your_response": "<your_response>",
                                "destination_city": "<city name if detected>"
                            }
                        """
                        )
                    )
                    self.state.update_thread(id=self.name, thread=pa_thread)
                # If "agent_id" is not found, continue the loop to invoke again
                retry_count += 1
                
            agent_name = agent_info.get("agent_id")

            # check if principal agent returned an agent name
            if agent_name is None:
                agent_response = agent_info.get("your_response")
                # if no agent name is returned, return the rephrased query as the response
                intent_agent_final_response.content.content = agent_response
                yield intent_agent_final_response
            else:
                agent_instance = await AvailableAgents.get_agent(agent_name)
                
                # Add destination city to kwargs if available
                if hasattr(self.state, 'destination_city') and self.state.destination_city:
                    if "message_data" not in kwargs:
                        kwargs["message_data"] = {}
                    kwargs["message_data"]["destination_city"] = self.state.destination_city
                    
                    # Also include the city in the message content if not already present
                    if self.state.destination_city and self.state.destination_city.lower() not in chat_message.content.lower():
                        enhanced_message = ChatMessageContent(
                            role=chat_message.role,
                            content=f"{chat_message.content} (For the destination city: {self.state.destination_city})",
                            metadata=chat_message.metadata
                        )
                        chat_message = enhanced_message
                
                responses = []
                async for response in agent_instance.invoke(messages=chat_message, thread=self.state.get_thread(id=agent_name), **kwargs):
                    if response:
                        responses.append(response)
                        yield response
                        
                if responses:
                    agent_final_response = responses[-1]

                    # update the principal agent thread with the agent response, so that next time it is available in the conversation state
                    pa_thread = self.state.get_thread(id=self.name)
                    if pa_thread:
                        await pa_thread.on_new_message(agent_final_response.content)
                        self.state.update_thread(id=self.name, thread=pa_thread)
                    self.save_conversation_state(agent_final_response, agent_name)


    def save_conversation_state(self, final_response, agent_name):
        thread = final_response.thread
        self.state.update_thread(id=agent_name, thread=thread)
        self.conversation_store.save_state(state=self.state)
        
    def extract_city_name(self, text):
        """Helper method to extract city names from text using pattern matching"""
        # This is a simple implementation - in production you might want to use a more sophisticated NER model
        city_pattern = r'\b[A-Z][a-z]+ ?(?:[A-Z][a-z]+)?\b'  # Simple pattern to catch capitalized words
        potential_cities = re.findall(city_pattern, text)
        
        # Here you could filter against a list of known cities
        # For now, we'll just return the first match if any
        return potential_cities[0] if potential_cities else None