import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.types import ASGIApp, Receive, Scope, Send

from app.api.routes import router
from app.core.config import get_settings

logger = logging.getLogger("research_explorer")
settings = get_settings()
app = FastAPI(
    title="Research Discovery Explorer",
    version="1.0.0",
    description="Synthetic research profiles. Read-only discovery API; similarity is not researcher quality.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET"],
    allow_headers=["Accept", "Content-Type"],
)


class RequestGuard:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        if len(scope.get("query_string", b"")) > 8192:
            return await JSONResponse({"detail": "Query is too large"}, 414)(scope, receive, send)
        chunks = []
        size = 0
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            size += len(message.get("body", b""))
            if size > settings.max_request_bytes:
                return await JSONResponse({"detail": "Request body is too large"}, 413)(
                    scope, receive, send
                )
            chunks.append(message)
            if not message.get("more_body", False):
                break

        async def replay():
            return chunks.pop(0) if chunks else await receive()

        await self.app(scope, replay, send)


app.add_middleware(RequestGuard)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(SQLAlchemyError)
async def database_error(request: Request, exc: SQLAlchemyError):
    logger.error("Database request failed: %s", type(exc).__name__)
    return JSONResponse(
        {"detail": "The research database is temporarily unavailable. Please retry."}, 503
    )


@app.exception_handler(Exception)
async def unexpected_error(request: Request, exc: Exception):
    logger.error("Request failed: %s", type(exc).__name__)
    return JSONResponse(
        {"detail": "The request could not be completed. Please retry or use keyword search."}, 500
    )


app.include_router(router)
