"""
Tracing middleware for FastAPI applications.
Provides functionality for distributed tracing with OpenTelemetry.
"""
from fastapi import FastAPI, Request
from opentelemetry import trace
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
import logging

logger = logging.getLogger(__name__)


async def trace_request(request: Request, call_next):
    """
    Middleware that creates spans and adds trace context headers.
    This middleware:
    - Creates spans for each request with conversationId/turnId
    - Adds attributes based on request headers
    - Adds trace context headers to responses
    """

    # Only process POST requests
    if request.method != "POST":
        return await call_next(request)

    conversation_id = request.headers.get("x-conversation-id")
    turn_id = request.headers.get("x-turn-id")

     # Read body and make it available for later use
    body_bytes = await request.body()

    # Parse the JSON payload to extract user message
    user_message = None
    try:
        import json
        body_json = json.loads(body_bytes.decode())
        if 'message' in body_json and 'content' in body_json['message']:
            user_message = body_json['message']['content']
    except Exception as e:
        logger.warning(f"Could not parse request body: {str(e)}")

    # Create appropriate span name based on available info
    if turn_id:
        span_name = f"turn-{turn_id}-{conversation_id}"
    else:
        span_name = f"request-{request.url.path}"

    with trace.get_tracer(__name__).start_as_current_span(name=span_name) as span:
        if conversation_id:
            span.set_attribute("conversation_id", conversation_id)
        if turn_id:
            span.set_attribute("turn_id", turn_id)
        if user_message:
            span.set_attribute("user_message", user_message)
        
        # Process the request
        response = await call_next(request)
        
        # Add trace context to response headers
        response_carrier = {}
        propagator = TraceContextTextMapPropagator()
        propagator.inject(response_carrier)
        for key, value in response_carrier.items():
            response.headers[key] = value
        
        return response


def setup_tracing(app: FastAPI):
    """
    Add tracing middleware to the FastAPI app.
    
    Args:
        app: The FastAPI application instance
    """
        
    app.middleware("http")(trace_request)