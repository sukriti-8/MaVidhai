import logging
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.utils.logging import request_id_context

logger = logging.getLogger(__name__)

class LoggingMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
            
        req_id = ""
        for name, value in scope.get("headers", []):
            if name.decode("latin1").lower() == "x-request-id":
                req_id = value.decode("latin1").strip()
                break
                
        if not req_id or len(req_id) > 128:
            req_id = str(uuid.uuid4())
            
        # Ensure it's in scope["headers"] for downstream
        headers = [(n, v) for n, v in scope.get("headers", []) if n.decode("latin1").lower() != "x-request-id"]
        headers.append((b"x-request-id", req_id.encode("latin1")))
        scope["headers"] = headers
            
        token = request_id_context.set(req_id)
        start_time = time.perf_counter()
        status_code = 500
        
        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                headers = message.get("headers", [])
                headers.append((b"x-request-id", req_id.encode("latin1")))
                message["headers"] = headers
            await send(message)
            
        try:
            await self.app(scope, receive, send_wrapper)
            
            path = scope.get("path", "")
            duration_ms = (time.perf_counter() - start_time) * 1000
            
            if path in ["/health", "/ready"] and status_code < 400:
                pass
            else:
                log_level = logging.ERROR if status_code >= 500 else logging.INFO
                logger.log(
                    log_level,
                    "Request completed",
                    extra={
                        "method": scope.get("method", ""),
                        "path": path,
                        "status_code": status_code,
                        "duration_ms": duration_ms
                    }
                )
        except Exception as e:
            path = scope.get("path", "")
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Unhandled exception processing request",
                exc_info=e,
                extra={
                    "method": scope.get("method", ""),
                    "path": path,
                    "status_code": 500,
                    "duration_ms": duration_ms
                }
            )
            raise
        finally:
            request_id_context.reset(token)
