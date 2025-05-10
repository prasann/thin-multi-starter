import chainlit as cl

@cl.on_chat_start
async def main():
    await cl.Message(content="Hello! Send a message to the backend API.").send()

@cl.on_message
async def on_message(message: cl.Message):
    # Import directly from main.py
    from main import invoke, InvokeRequest
    
    # Call the endpoint function directly
    response = await invoke(InvokeRequest(message=message.content))
    
    # Send the response back to the user
    await cl.Message(content=f"Backend says: {response}").send()