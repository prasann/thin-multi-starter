import os
from dotenv import load_dotenv

from agents.copilot_studio.base.copilot_agent import CopilotAgent
from agents.copilot_studio.base.directline_client import DirectLineClient

from models.custom_agent import CustomAgent

load_dotenv(override=True)

class TourGuideAgent(CopilotAgent, CustomAgent):

    @staticmethod
    def what_can_i_do() -> str:
        return """
        I am a tourist attractions guide for cities worldwide. I provide recommendations for the most popular and significant 
        places to visit in your destination city. For any city you're planning to visit, I'll suggest 8-10 must-see attractions 
        with a brief explanation of why each place is worth your time. From iconic landmarks to hidden gems, I'll help you 
        create the perfect sightseeing itinerary for your trip. Simply tell me which city you're planning to visit, and I'll 
        share the top attractions you shouldn't miss.
        """
    
    @property
    def is_async_initialization(self) -> bool:
        return False

    def __init__(self):
        directline_endpoint = os.getenv("DIRECTLINE_ENDPOINT")
        copilot_agent_secret = os.getenv("TOUR_GUIDE_AGENT_SECRET")
        
        if not directline_endpoint or not copilot_agent_secret:
            raise ValueError("DIRECTLINE_ENDPOINT and TOUR_GUIDE_AGENT_SECRET must be set in environment variables.")

        directline_client = DirectLineClient(
            directline_endpoint=directline_endpoint,
            copilot_agent_secret=copilot_agent_secret,
        )

        super().__init__(
            id="tour_guide",
            name="tour_guide",
            description="You are a tourist attractions guide specialized in recommending popular and must-visit places in cities worldwide. When given a destination city, provide a comprehensive list of 8-10 top tourist attractions with a one-line description highlighting the significance of each place. For each recommendation: 1. Include a mix of historical sites, cultural landmarks, natural attractions, and popular local experiences. 2. Provide the name of the attraction followed by a concise, informative one-liner about what makes it special. 3. Highlight any particular cultural, historical, or architectural significance. 4. Mention if it's especially crowded during certain times or seasons. 5. Note any \"can't miss\" experiences associated with the attraction. 6. Indicate if it's particularly photogenic or iconic to the city. Structure your response as a numbered list for clarity. If the city has famous districts or neighborhoods worth exploring, include those as well. If unsure about specific attractions in a city, acknowledge limitations while providing information about the best-known sites that you're confident about. Always maintain an enthusiastic and informative tone that conveys the unique appeal of each attraction.",
            directline_client=directline_client,
        )