from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from models.available_agents import AvailableAgents
from models.agent_response import AgentResponse
from models.agent_request import AgentRequest
from orchestrator.request_dispatcher import RequestDispatcher
from models.conversation_state import ConversationStateStore


class AgentAPI:
    def __init__(self, conversation_store: ConversationStateStore):
        """
        Initialize the AgentAPI with the provided agents.
        """
        self.request_dispatcher = RequestDispatcher(conversation_store=conversation_store)
        self.app = FastAPI()

        self.setup_routes()
        self.setup_error_handlers()

    def setup_routes(self):
        """
        Define all the routes for the FastAPI application.
        """
        
        @self.app.get("/agents")
        def get_agents() -> list[dict[str, str]]:
            """
            List all available agents with their names and descriptions.
            """
            return [
                {"name": agent["name"], "description": agent["description"], "label": agent["label"]}
                for agent in list(AvailableAgents.agents.values())
            ]

        @self.app.post("/plan/invoke")
        async def invoke_strategy(request: AgentRequest) -> AgentResponse:
            """
            Invoke an agent with the provided prompt.
            """
            return await self.request_dispatcher.dispatch_request(request)
        
    def setup_error_handlers(self):
        """
        Define generic error handlers for the FastAPI application.
        """

        @self.app.exception_handler(StarletteHTTPException)
        async def http_exception_handler(request: Request, exc: StarletteHTTPException):
            return JSONResponse(
                status_code=exc.status_code,
                content={"error": f"HTTP error occurred: {exc.detail}"}
            )

        @self.app.exception_handler(RequestValidationError)
        async def validation_exception_handler(request: Request, exc: RequestValidationError):
            return JSONResponse(
                status_code=422,
                content={"error": "Validation error", "details": exc.errors()}
            )

        @self.app.exception_handler(Exception)
        async def generic_exception_handler(request: Request, exc: Exception):
            return JSONResponse(
                status_code=500,
                content={"error": "An unexpected error occurred", "details": str(exc)}
            )