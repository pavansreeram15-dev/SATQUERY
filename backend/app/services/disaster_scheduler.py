import asyncio
import logging
import json
from typing import Set
from datetime import datetime, timezone
from .disaster_aggregator import disaster_aggregator

logger = logging.getLogger(__name__)

class DisasterStreamBroadcaster:
    """
    Manages active SSE (Server-Sent Events) clients for real-time live disaster updates.
    """
    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()
        self._is_running = False
        self._task: asyncio.Task = None

    def subscribe(self) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.add(queue)
        logger.info(f"[SSE] New client subscribed. Total active listeners: {len(self._subscribers)}")
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        self._subscribers.discard(queue)
        logger.info(f"[SSE] Client unsubscribed. Total active listeners: {len(self._subscribers)}")

    async def broadcast_event(self, data: dict):
        """Broadcast updated disaster events to all connected clients."""
        if not self._subscribers:
            return

        payload = f"data: {json.dumps(data)}\n\n"
        for queue in list(self._subscribers):
            try:
                queue.put_nowait(payload)
            except Exception:
                self._subscribers.discard(queue)

    async def start_background_poller(self):
        """Start async background poller daemon."""
        if self._is_running:
            return
        self._is_running = True
        logger.info("[Scheduler] Starting live disaster background polling daemon...")
        
        while self._is_running:
            try:
                # Refresh all providers
                events = await disaster_aggregator.get_all_events(time_range="24h", force_refresh=True)
                geojson = disaster_aggregator.to_geojson_feature_collection(events)
                summary = disaster_aggregator.get_summary()

                broadcast_payload = {
                    "type": "LIVE_DISASTERS_UPDATE",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "total_events": len(events),
                    "geojson": geojson.model_dump(),
                    "summary": summary.model_dump()
                }

                await self.broadcast_event(broadcast_payload)
            except Exception as e:
                logger.error(f"[Scheduler] Background disaster polling iteration failed: {e}")

            # Sleep between polling cycles (min 45 seconds)
            await asyncio.sleep(45)

disaster_broadcaster = DisasterStreamBroadcaster()
