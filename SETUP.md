# Setup and Running Instructions

This guide provides step-by-step instructions to set up and run the Thin Multi-Agent System.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** - Required for the backend
- **Node.js 14+** - Required for the frontend  
- **npm or yarn** - Package manager for frontend dependencies
- **Git** - For cloning the repository

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd thin-multi-agent
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

#### Install Python Dependencies

Using pip:
```bash
pip install -r requirements.txt
```

Or using conda:
```bash
conda create -n thin-multi-agent python=3.8
conda activate thin-multi-agent
pip install -r requirements.txt
```

#### Environment Configuration

Create a `.env` file in the backend directory with your configuration:

```env
# Azure AI Configuration
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name

# Copilot Studio Configuration
COPILOT_STUDIO_BOT_ID=your_bot_id
COPILOT_STUDIO_TENANT_ID=your_tenant_id

# Application Settings
PORT=8000
HOST=localhost
DEBUG=true
```

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd ../frontend
```

#### Install Node.js Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

## Running the Application

### Option 1: Run Both Services Separately

#### Start the Backend

In the backend directory:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at: `http://localhost:8000`

#### Start the Frontend

In a new terminal, navigate to the frontend directory:
```bash
npm start
```

The frontend will be available at: `http://localhost:3000`

### Option 2: Using the Chainlit UI

If you prefer to use the integrated Chainlit interface:

```bash
cd backend
python chainlit_ui.py
```

Access the Chainlit interface at: `http://localhost:8000/chainlit`

## Verifying the Setup

### 1. Check Backend Health

Visit `http://localhost:8000/docs` to access the FastAPI interactive documentation.

### 2. Test Agent Endpoints

You can test the agents using curl or the API documentation:

```bash
# Test the travel agent
curl -X POST "http://localhost:8000/api/agents/travel" \
  -H "Content-Type: application/json" \
  -d '{"message": "Recommend attractions in Paris", "city": "Paris"}'

# Test the culinary agent  
curl -X POST "http://localhost:8000/api/agents/culinary" \
  -H "Content-Type: application/json" \
  -d '{"message": "Best restaurants in Rome", "city": "Rome", "preferences": "Italian cuisine"}'
```

### 3. Check Frontend

Navigate to `http://localhost:3000` and verify:
- The left panel loads with draggable agent boxes
- The main canvas accepts dropped elements
- The chat panel is functional

## Troubleshooting

### Common Issues

**Backend won't start:**
- Verify Python version with `python --version`
- Check if all dependencies are installed: `pip list`
- Ensure environment variables are set correctly

**Frontend won't start:**
- Verify Node.js version with `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

**Agents not responding:**
- Check your Azure AI and Copilot Studio credentials
- Verify network connectivity to Azure services
- Check the backend logs for detailed error messages

**CORS issues:**
- Ensure the frontend is running on `http://localhost:3000`
- Check that the backend CORS settings allow the frontend origin

### Logs and Debugging

**Backend logs:**
```bash
cd backend
python -m uvicorn main:app --reload --log-level debug
```

**Frontend development console:**
Open browser developer tools (F12) and check the Console tab for any errors.

## Development Mode

For development, you might want to run both services with hot reloading:

**Backend with auto-reload:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend with hot reloading:**
```bash
cd frontend
npm start
```

## Production Deployment

For production deployment, consider:

1. **Backend**: Use a production WSGI server like Gunicorn
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

2. **Frontend**: Build the production bundle
   ```bash
   npm run build
   ```

3. **Environment**: Set appropriate environment variables for production
4. **Security**: Configure proper CORS settings and authentication
5. **Monitoring**: Set up logging and monitoring for production use

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/docs/)
- [Chainlit Documentation](https://docs.chainlit.io/)
- [Azure AI Services Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/)

For more information about the project architecture and components, see the main [README.md](./README.md).