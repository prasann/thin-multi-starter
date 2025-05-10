from fastapi import FastAPI
from agents.storyteller_chat_agent import StoryTellerAgent
from api.agent_api import AgentAPI
from models.available_agents import AvailableAgents
from models.conversation_state import InMemoryConversationStateStore
from dotenv import load_dotenv

app = FastAPI()

load_dotenv(override=True)

conversation_store = InMemoryConversationStateStore()

AvailableAgents.add_agent("story_teller", lambda: StoryTellerAgent(), StoryTellerAgent.what_can_i_do(), "SK")

agent_api = AgentAPI(conversation_store=conversation_store)

app = agent_api.app