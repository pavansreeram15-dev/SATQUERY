from typing import List, Optional
from ..models.analysis import AnalysisModel

class AnalysisRepository:
    def __init__(self):
        self._history: List[AnalysisModel] = []

    def save(self, analysis: AnalysisModel) -> AnalysisModel:
        self._history.insert(0, analysis)
        if len(self._history) > 200:
            self._history.pop()
        return analysis

    def list_history(self, limit: int = 50) -> List[AnalysisModel]:
        return self._history[:limit]

analysis_repository = AnalysisRepository()
