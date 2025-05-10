from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.available_agents import AvailableAgents
from models.agent_response import AgentResponse
from models.agent_request import AgentRequest
from orchestrator.request_dispatcher import RequestDispatcher
from models.conversation_state import ConversationStateStore


class AgentAPI:
    def __init__(self, conversation_store: ConversationStateStore, app: FastAPI = None):
        """
        Initialize the AgentAPI with the provided agents and optional FastAPI app.
        
        Args:
            conversation_store: Store for conversation state
            app: Optional FastAPI application instance. If not provided, a new one will be created.
        """
        self.request_dispatcher = RequestDispatcher(conversation_store=conversation_store)
        self.app = app if app is not None else FastAPI()
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
            allow_credentials=True,
        )
        self.setup_routes()
        self.setup_error_handlers()

    def setup_routes(self):
        """
        Define all the routes for the FastAPI application.
        """
        
        @self.app.get("/agents", 
                     summary="Get Available Agents",
                     description="Lists all available agents in the system with their names, descriptions, and labels.",
                     response_description="List of available agents",
                     tags=["Agents"])
        def get_agents() -> list[dict[str, str]]:
            """
            List all available agents with their names and descriptions.
            
            Returns:
                List of dictionaries containing agent information
            """
            return [
                {"name": agent["name"], "description": agent["description"], "label": agent["label"]}
                for agent in list(AvailableAgents.agents.values())
            ]

        @self.app.post("/plan/invoke", 
                      summary="Invoke Agent",
                      description="Invokes an agent with the provided prompt and returns its response.",
                      response_description="Agent's response to the prompt",
                      tags=["Agents"])
        async def invoke_strategy(request: AgentRequest) -> AgentResponse:
            """
            Invoke an agent with the provided prompt.
            
            Args:
                request: The agent request containing the prompt and agent details
                
            Returns:
                The agent's response to the prompt
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
            
        @self.app.get("/", 
                     include_in_schema=False)
        async def root():
            """Redirect to the Swagger UI documentation"""
            from fastapi.responses import RedirectResponse
            return RedirectResponse(url="/swagger")