import os
from starlette.types import ASGIApp, Receive, Scope, Send

class SecurityHeadersMiddleware:
    """
    Injects strict security headers into HTTP responses.
    Does not apply to WebSocket connections.
    """
    def __init__(self, app: ASGIApp):
        self.app = app
        self.environment = os.getenv("ENVIRONMENT", "development")

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message: dict) -> None:
            if message["type"] == "http.response.start":
                headers = message.setdefault("headers", [])
                
                # Standard Security Headers
                security_headers = [
                    (b"x-content-type-options", b"nosniff"),
                    (b"x-frame-options", b"DENY"),
                ]
                
                if self.environment == "production":
                    # Only enforce HSTS in production where HTTPS is guaranteed
                    security_headers.append(
                        (b"strict-transport-security", b"max-age=31536000; includeSubDomains")
                    )
                
                # Check for existing headers to avoid duplicates
                existing_keys = {k.lower() for k, v in headers}
                for key, value in security_headers:
                    if key not in existing_keys:
                        headers.append((key, value))
                        
            await send(message)

        await self.app(scope, receive, send_wrapper)
