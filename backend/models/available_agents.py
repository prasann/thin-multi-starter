import asyncio
from semantic_kernel.agents import Agent


class AvailableAgents:
    """
    A class to represent available agents.
    """

    agents: dict[str, object] = {}

    @classmethod
    def add_agent(cls, name: str, factory: callable, description: str, label:str) -> None:
        """
        Adds an agent to the global list of available agents.
        """
        cls.agents[name]={
            "name": name,
            "description": description,
            "label": label,
            "factory": factory
        }
        
    @classmethod
    async def get_agent(cls, name: str) -> Agent | None:
        """
        Retrieves an agent by its name.
        """
        agent = cls.agents.get(name)
        if agent:
            agent_factory = agent["factory"]()
            if asyncio.iscoroutine(agent_factory):
                return await agent_factory
            else:
                return agent_factory
        else:                
            return None
    