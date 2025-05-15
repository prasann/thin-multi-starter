from fastapi import FastAPI
from agents.culture_guru_agent import CultureGuruAgent
from agents.copilot_studio.explorer_guide_agent import ExplorerGuideAgent
from agents.azure_ai_agents.culinary_advisor_agent import CulinaryAdvisorAgent
from api.agent_api import AgentAPI
from telemetry import telemetry
from telemetry.tracing_middleware import setup_tracing
from models.available_agents import AvailableAgents
from models.conversation_state import InMemoryConversationStateStore
from dotenv import load_dotenv
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

app = FastAPI(
    title="Multi-Agent System API",
    description="API for interacting with multiple AI agents within a single system",
    version="1.0.0",
    docs_url="/swagger",  
    redoc_url="/redoc"  
)

load_dotenv(override=True)
telemetry.setup()

conversation_store = InMemoryConversationStateStore()

AvailableAgents.add_agent("culture_guru", lambda: CultureGuruAgent(), CultureGuruAgent.what_can_i_do(), "SK")
AvailableAgents.add_agent("explorer_guide", lambda: ExplorerGuideAgent(), ExplorerGuideAgent.what_can_i_do(), "MCS")
AvailableAgents.add_agent("culinary_advisor", lambda: CulinaryAdvisorAgent().initialize_agent(), CulinaryAdvisorAgent.what_can_i_do(), "AZ")

agent_api = AgentAPI(conversation_store=conversation_store, app=app)

app = agent_api.app

setup_tracing(app)

FastAPIInstrumentor.instrument_app(app, exclude_spans=["receive", "send"])