from fastapi import FastAPI
from pydantic import BaseModel
from chainlit.utils import mount_chainlit

app = FastAPI()

class InvokeRequest(BaseModel):
    message: str

@app.post("/invoke") 
async def invoke(request_data: InvokeRequest):  
    print(f"Received message: {request_data.message}")
    return f"Received your message: {request_data.message}"

# Mount Chainlit UI
mount_chainlit(app=app, target="chainlit_ui.py", path="/agents")