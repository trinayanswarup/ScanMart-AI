import json
import os
from datetime import datetime

import asyncpg
from dotenv import load_dotenv

load_dotenv()

_pool: asyncpg.Pool | None = None


def _json_dumps(obj: object) -> str:
    class _Enc(json.JSONEncoder):
        def default(self, o: object) -> object:
            if isinstance(o, datetime):
                return o.isoformat()
            return super().default(o)
    return json.dumps(obj, cls=_Enc)


async def _init_conn(conn: asyncpg.Connection) -> None:
    await conn.set_type_codec(
        "jsonb",
        encoder=_json_dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            os.environ["DATABASE_URL"],
            min_size=2,
            max_size=10,
            # Required when connecting via Supabase's transaction pooler (PgBouncer).
            # Prepared statements are session-scoped and don't survive connection reuse.
            statement_cache_size=0,
            init=_init_conn,
        )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
