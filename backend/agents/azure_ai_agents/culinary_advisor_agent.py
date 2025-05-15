import os
from azure.identity.aio import DefaultAzureCredential
from azure.ai.projects.aio import AIProjectClient
from azure.ai.projects.models import FileSearchTool, OpenAIFile, VectorStore
from azure.ai.projects.aio import AIProjectClient
from azure.ai.projects.models import FileSearchTool, OpenAIFile, VectorStore
from semantic_kernel.agents.azure_ai.azure_ai_agent import AzureAIAgent
from azure.monitor.opentelemetry import configure_azure_monitor

from models.custom_agent import CustomAgent
from models.azure_ai_agent import AzureAIAgentRequest
import uuid
import os



class CulinaryAdvisorAgent(AzureAIAgent, CustomAgent):
    def __init__(self):
        """
        Initialize the CulinaryAdvisorAgent with basic attributes.
        """
        pass
        
        
    @classmethod
    async def _create_or_load_agent(
        cls, 
        agent_creation_request: AzureAIAgentRequest = None,
        client: AIProjectClient = None,
    ) -> AzureAIAgent:
        """
        Create or load the agent asynchronously.
        """
        if agent_creation_request.agent_id is not None: # load existing agent
            return await client.agents.get_agent(agent_id=agent_creation_request.agent_id)
        else: # create new agent
            if agent_creation_request.rag_agent: # Create a RAG agent

                if agent_creation_request.file_paths is None:
                    raise ValueError("file_paths must be provided for RAG agents")
                
                uploaded_file_ids = []
                for pdf_file_path in agent_creation_request.file_paths:
                    file: OpenAIFile = await client.agents.upload_file_and_poll(file_path=pdf_file_path, purpose="assistants")
                    uploaded_file_ids.append(file.id)

                vector_store: VectorStore = await client.agents.create_vector_store_and_poll(
                    file_ids=uploaded_file_ids, name=f"{str(uuid.uuid4())}_vector_store"
                )

                # 2. Create file search tool with uploaded resources
                file_search = FileSearchTool(vector_store_ids=[vector_store.id])

                # 3. Create an agent on the Azure AI agent service with the file search tool
                agent_definition = await client.agents.create_agent(
                    name=agent_creation_request.name,
                    model=agent_creation_request.model,
                    tools=file_search.definitions,
                    tool_resources=file_search.resources,
                    instructions=agent_creation_request.instructions,
                )

                return agent_definition
            else:
                agent_definition = await client.agents.create_agent(
                    name=agent_creation_request.name,
                    model=agent_creation_request.model,
                    instructions=agent_creation_request.instructions,
                )
                return agent_definition
             
        # # Use object.__setattr__ to bypass Pydantic validation
        # object.__setattr__(self, "agent_id", agent_id)
        # await self.initialize_agent()

    @staticmethod
    def what_can_i_do() -> str:
        return """
        I am a restaurant guide for cities worldwide. I help travelers find great places to eat in their destination cities. Whether you're looking for local delicacies, fine dining, 
        budget-friendly options, or specific cuisines, I provide tailored recommendations to enhance your dining experience. Simply tell me the city and your preferences, and I'll guide you to the best spots.
        """

    @property
    def is_async_initialization(self) -> bool:
        return True

    async def initialize_agent(self):
        """
        Perform asynchronous initialization for the CulinaryAdvisorAgent.
        """
        # Create Azure credentials and client
        creds = DefaultAzureCredential()
        client = AIProjectClient.from_connection_string(
            credential=creds,
            conn_str=os.environ.get("AZURE_AI_AGENT_PROJECT_CONNECTION_STRING")
        )

        application_insights_connection_string = os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING") # project_client.telemetry.get_connection_string()
        if application_insights_connection_string:
            configure_azure_monitor(connection_string=application_insights_connection_string)
            client.telemetry.enable()

        # Fetch Agent details from environment variables
        agent_creation_request = AzureAIAgentRequest(
            agent_id = os.environ.get("CULINARY_AGENT_ID"),
            model= os.environ.get("CULINARY_AGENT_MODEL"),
            name= "culinary_advisor",
            description= self.what_can_i_do(),
            rag_agent= False,
            file_paths= None,
            instructions= """You are a restaurant guide. When given a destination city and user preferences, provide helpful dining recommendations. Focus on tailoring suggestions to the user's needs, such as cuisine type, budget, dietary restrictions, or ambiance preferences. Include information on:
                1. Popular local dishes and where to try them
                2. Highly rated restaurants for specific cuisines
                3. Budget-friendly dining options
                4. Fine dining or unique culinary experiences
                5. Tips for making reservations or avoiding long waits

                Keep your responses concise, with a maximum of 300 words. Prioritize the most relevant and practical information for the user.

                If unsure about specific details for a city, acknowledge limitations and provide general guidance for the region while being clear about uncertainties."""
        )
       
        # Fetch the agent definition
        agent_definition = await CulinaryAdvisorAgent._create_or_load_agent(
            agent_creation_request=agent_creation_request,
            client=client,
        )
        os.environ["CULINARY_AGENT_ID"] = agent_definition.id
        
        # Call the parent class constructor using super()
        super().__init__(client=client, definition=agent_definition)

        # Explicitly set the name attribute
        self.name = agent_creation_request.name
        return self

