"""Mod helpers for token cleanup logic."""
from typing import Iterable, List, Set
import aiosqlite


async def _delete_tokens(token_manager, concurrency_manager, token_ids: Iterable[int]) -> List[int]:
    """Delete tokens and reset concurrency counters."""
    deleted_ids = []
    for token_id in token_ids:
        await token_manager.delete_token(token_id)
        deleted_ids.append(token_id)
        if concurrency_manager:
            await concurrency_manager.reset_token(token_id)
    return deleted_ids


async def cleanup_tokens_by_status(token_manager, db, concurrency_manager, status_code: int) -> List[int]:
    """Delete tokens that have the given status code in request logs."""
    token_ids = await db.get_token_ids_by_status(status_code)
    return await _delete_tokens(token_manager, concurrency_manager, token_ids)


async def _get_token_ids_by_status_code(db_path: str, status_code: int) -> List[int]:
    """Return token IDs with a status_code flag."""
    async with aiosqlite.connect(db_path) as db:
        cursor = await db.execute(
            """
            SELECT id FROM tokens
            WHERE status_code = ?
            """,
            (status_code,),
        )
        rows = await cursor.fetchall()
        return [row[0] for row in rows]


async def _get_expired_token_ids(db_path: str) -> List[int]:
    """Return token IDs that are expired based on expiry_time."""
    async with aiosqlite.connect(db_path) as db:
        cursor = await db.execute(
            """
            SELECT id FROM tokens
            WHERE expiry_time IS NOT NULL
              AND expiry_time < CURRENT_TIMESTAMP
            """
        )
        rows = await cursor.fetchall()
        return [row[0] for row in rows]


async def cleanup_problematic_tokens(token_manager, db, concurrency_manager) -> List[int]:
    """Delete tokens marked with 401 or expired tokens."""
    status_401_ids = await _get_token_ids_by_status_code(db.db_path, 401)
    expired_ids = await _get_expired_token_ids(db.db_path)
    to_delete: Set[int] = set(status_401_ids + expired_ids)
    return await _delete_tokens(token_manager, concurrency_manager, to_delete)
