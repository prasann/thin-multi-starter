from abc import ABC, abstractmethod


class CustomAgent(ABC):
    @staticmethod
    @abstractmethod
    def what_can_i_do() -> str:
        pass

    @property
    @abstractmethod
    def is_async_initialization(self) -> bool:
      """
      Abstract property to indicate if the agent requires async initialization.
      """
      pass

    async def initialize_agent(self):
      """
      Abstract method for initializing the agent. To be implemented by subclasses.
      """
      pass