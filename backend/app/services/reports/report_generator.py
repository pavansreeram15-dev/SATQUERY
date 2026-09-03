from typing import Dict, Any

class ReportGenerator:
    """Executive PDF and structured geospatial intelligence report generator."""
    def generate_summary_report(self, query_response: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "title": f"SATQUERY Geospatial Intelligence Report — {query_response.get('query_id', 'QRY-001')}",
            "generated_at": query_response.get("timestamp"),
            "prompt": query_response.get("prompt"),
            "summary": query_response.get("summary_text"),
            "data_source": query_response.get("data_source"),
            "evidence_breakdown": query_response.get("evidence_breakdown"),
            "metrics": query_response.get("metrics")
        }

report_generator = ReportGenerator()
