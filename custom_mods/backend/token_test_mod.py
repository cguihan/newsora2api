"""Mod helpers for token testing."""
import re
from src.core.models import RequestLog


async def handle_test_exception(token_manager, token_id: int, error: Exception) -> dict:
    """Handle test_token exceptions, record status codes, and disable tokens when needed."""
    error_msg = str(error)
    status_match = re.search(r"\b(\d{3})\b", error_msg)
    status_code = int(status_match.group(1)) if status_match else None

    if status_code is not None:
        await token_manager.db.update_token_status_code(token_id, status_code)
        await token_manager.db.log_request(RequestLog(
            token_id=token_id,
            operation="test_token",
            request_body=None,
            response_body=error_msg,
            status_code=status_code,
            duration=0
        ))

    if status_code == 401:
        await token_manager.disable_token(token_id)
    elif status_code == 403:
        await token_manager.disable_token(token_id)

    return {
        "valid": False,
        "message": f"Token is invalid: {error_msg}",
        "status_code": status_code
    }
