from fastapi import FastAPI
from agents.storyteller_chat_agent import StoryTellerAgent
from api.agent_api import AgentAPI
from models.available_agents import AvailableAgents
from models.conversation_state import InMemoryConversationStateStore
from dotenv import load_dotenv

# Create FastAPI app with metadata for better Swagger documentation
app = FastAPI(
    title="Multi-Agent System API",
    description="API for interacting with multiple AI agents within a single system",
    version="1.0.0",
    docs_url="/swagger",  # Custom Swagger UI URL (optional)
    redoc_url="/redoc"    # Custom ReDoc URL (optional)
)

load_dotenv(override=True)

conversation_store = InMemoryConversationStateStore()

AvailableAgents.add_agent("story_teller", lambda: StoryTellerAgent(), StoryTellerAgent.what_can_i_do(), "SK")

agent_api = AgentAPI(conversation_store=conversation_store, app=app)  # Pass the app to AgentAPI

app = agent_api.app