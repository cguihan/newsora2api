"""Load balancing module"""
import asyncio
import random
from typing import Optional
from ..core.models import Token
from ..core.config import config
from .token_manager import TokenManager
from .token_lock import TokenLock
from .concurrency_manager import ConcurrencyManager
from ..core.logger import debug_logger

class LoadBalancer:
    """Token load balancer with random selection and image generation lock"""

    def __init__(self, token_manager: TokenManager, concurrency_manager: Optional[ConcurrencyManager] = None):
        self.token_manager = token_manager
        self.concurrency_manager = concurrency_manager
        # Use image timeout from config as lock timeout
        self.token_lock = TokenLock(lock_timeout=config.image_timeout)
        self._round_robin_state = {"image": None, "video": None, "default": None}
        self._rr_lock = asyncio.Lock()

    async def _select_round_robin(self, tokens: list[Token], key: str) -> Optional[Token]:
        """Select tokens in round-robin order for the given key."""
        if not tokens:
            return None
        tokens_sorted = sorted(tokens, key=lambda t: t.id)
        async with self._rr_lock:
            last_id = self._round_robin_state.get(key)
            start_idx = 0
            if last_id is not None:
                for idx, token in enumerate(tokens_sorted):
                    if token.id == last_id:
                        start_idx = (idx + 1) % len(tokens_sorted)
                        break
            selected = tokens_sorted[start_idx]
            self._round_robin_state[key] = selected.id
        return selected

    async def select_token(
        self,
        for_image_generation: bool = False,
        for_video_generation: bool = False,
        required_sora2_remaining: int = 1
    ) -> Optional[Token]:
        """
        Select a token using random or polling load balancing.

        Args:
            for_image_generation: If True, only select tokens that are not locked for image generation and have image_enabled=True.
            for_video_generation: If True, filter out tokens with Sora2 quota exhausted, tokens that don't support Sora2, and tokens with video_enabled=False.
            required_sora2_remaining: Minimum remaining Sora2 count required for video generation.

        Returns:
            Selected token or None if no available tokens.
        """
        # Try to auto-refresh tokens expiring within 24 hours if enabled
        if config.at_auto_refresh_enabled:
            debug_logger.log_info(f"[LOAD_BALANCER] 🔄 自动刷新功能已启用，开始检查Token过期时间...")
            all_tokens = await self.token_manager.get_all_tokens()
            debug_logger.log_info(f"[LOAD_BALANCER] 📊 总Token数: {len(all_tokens)}")

            refresh_count = 0
            for token in all_tokens:
                if token.is_active and token.expiry_time:
                    from datetime import datetime
                    time_until_expiry = token.expiry_time - datetime.now()
                    hours_until_expiry = time_until_expiry.total_seconds() / 3600
                    # Refresh if expiry is within 24 hours
                    if hours_until_expiry <= 24:
                        debug_logger.log_info(f"[LOAD_BALANCER] 🔔 Token {token.id} ({token.email}) 需要刷新，剩余时间: {hours_until_expiry:.2f} 小时")
                        refresh_count += 1
                        await self.token_manager.auto_refresh_expiring_token(token.id)

            if refresh_count == 0:
                debug_logger.log_info(f"[LOAD_BALANCER] ✅ 所有Token都无需刷新")
            else:
                debug_logger.log_info(f"[LOAD_BALANCER] ✅ 刷新检查完成，共检查 {refresh_count} 个Token")

        active_tokens = await self.token_manager.get_active_tokens()

        if not active_tokens:
            return None

        available_tokens = []

        if for_video_generation:
            from datetime import datetime
            for token in active_tokens:
                if not token.video_enabled:
                    continue
                if not token.sora2_supported:
                    continue

                if token.sora2_cooldown_until and token.sora2_cooldown_until <= datetime.now():
                    await self.token_manager.refresh_sora2_remaining_if_cooldown_expired(token.id)
                    token = await self.token_manager.db.get_token(token.id)

                if token and token.sora2_cooldown_until and token.sora2_cooldown_until > datetime.now():
                    continue

                if required_sora2_remaining > 1:
                    remaining = token.sora2_remaining_count if token else None
                    if remaining is None or remaining < required_sora2_remaining:
                        continue

                if self.concurrency_manager and not await self.concurrency_manager.can_use_video(token.id):
                    continue

                if token:
                    available_tokens.append(token)

        elif for_image_generation:
            for token in active_tokens:
                if not token.image_enabled:
                    continue

                if await self.token_lock.is_locked(token.id):
                    continue

                if self.concurrency_manager and not await self.concurrency_manager.can_use_image(token.id):
                    continue

                available_tokens.append(token)

        else:
            available_tokens = active_tokens

        if not available_tokens:
            return None

        if config.call_logic_mode == "polling":
            key = "image" if for_image_generation else "video" if for_video_generation else "default"
            return await self._select_round_robin(available_tokens, key)

        return random.choice(available_tokens)
