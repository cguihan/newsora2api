"""Mod helpers for request log queries."""
from typing import List
import aiosqlite


async def fetch_token_ids_by_status(db_path: str, status_code: int) -> List[int]:
    """Return distinct token IDs that have the given status code in request logs."""
    async with aiosqlite.connect(db_path) as db:
        cursor = await db.execute(
            """
            SELECT DISTINCT token_id
            FROM request_logs
            WHERE status_code = ? AND token_id IS NOT NULL
            """,
            (status_code,),
        )
        rows = await cursor.fetchall()
        return [row[0] for row in rows]
