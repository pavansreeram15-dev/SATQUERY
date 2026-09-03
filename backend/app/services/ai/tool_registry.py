from typing import Dict, Any, Callable

class AIToolRegistry:
    """Centralized registry for AI agent tools."""
    def __init__(self):
        self._tools: Dict[str, Callable] = {}

    def register_tool(self, name: str, func: Callable):
        self._tools[name] = func

    def get_tool(self, name: str) -> Callable:
        return self._tools.get(name)

    def list_tools(self) -> list:
        return list(self._tools.keys())

tool_registry = AIToolRegistry()
