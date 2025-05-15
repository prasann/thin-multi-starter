from semantic_kernel.agents import ChatCompletionAgent
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion

from models.custom_agent import CustomAgent


class CultureGuruAgent(ChatCompletionAgent, CustomAgent):
    def __init__(self):
        kernel = Kernel()
        kernel.add_service(AzureChatCompletion())
        super().__init__(
            kernel=kernel,
            name="culture_guru",
            description=self.what_can_i_do(),
            instructions="""You are a city culture guide. When given a destination city, provide helpful cultural guidance 
            including local customs, etiquette, dos and don'ts, important cultural norms, and practical tips for visitors.
            Focus on helping travelers be respectful and avoid cultural faux pas. Include information on:
            1. Greetings and social interactions
            2. Dining etiquette and tipping practices
            3. Appropriate dress codes for different settings
            4. Public behavior expectations
            5. Transportation etiquette

            Keep your responses concise, maximum of 300 words should be fine. Prioritize the most important cultural information
            that travelers need to know.

            If unsure about specific details for a city, acknowledge limitations and provide general guidance 
            for the region while being clear about uncertainties."""
        )

    @staticmethod
    def what_can_i_do() -> str:
        return """
        I am a cultural guide for cities worldwide. I help travelers understand local customs, etiquette, 
        and cultural norms for their destination cities. I provide practical advice on what to do and what to avoid 
        to show respect for local culture and have a positive travel experience. Simply tell me which city you're 
        planning to visit, and I'll share relevant cultural insights and practical tips.
        """

    @property
    def is_async_initialization(self) -> bool:
        return False