from semantic_kernel.agents import ChatCompletionAgent
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion

from models.custom_agent import CustomAgent


class StoryTellerAgent(ChatCompletionAgent, CustomAgent):
    def __init__(self):
        kernel = Kernel()
        kernel.add_service(AzureChatCompletion())
        super().__init__(kernel=kernel, 
                         name="story_teller", 
                         description=self.what_can_i_do(),
                         instructions="You are a storyteller. You will tell a story based on the provided prompt.")

    @staticmethod
    def what_can_i_do() -> str:
        return """
        I am a story teller capable of crafting imaginative and engaging stories in various genres and styles based on user inputs.
        I can adapt narratives to suit educational, entertainment, or marketing purposes. I can also provide creative plot suggestions, character development ideas, and thematic exploration to enhance storytelling experiences.
        """

    @property
    def is_async_initialization(self) -> bool:
        return False