import json
import logging
import os
import contextvars
from datetime import datetime, timezone

# Context variable to hold the request ID for the current execution context
request_id_context = contextvars.ContextVar("request_id", default="-")

class RequestIdFilter(logging.Filter):
    """Injects the request_id context variable into log records if not already set."""
    def filter(self, record):
        if not hasattr(record, "request_id"):
            record.request_id = request_id_context.get()
        elif record.request_id is None:
            record.request_id = request_id_context.get()
        return True

class JSONFormatter(logging.Formatter):
    """Formats log records as JSON, useful for production environments."""
    def format(self, record):
        log_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", "-")
        }
        
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
            
        # Add any extra kwargs passed to the logger
        for key, value in record.__dict__.items():
            if key not in ["args", "asctime", "created", "exc_info", "exc_text", "filename", "funcName", "levelname", "levelno", "lineno", "module", "msecs", "message", "msg", "name", "pathname", "process", "processName", "relativeCreated", "stack_info", "thread", "threadName", "request_id"]:
                log_record[key] = value

        return json.dumps(log_record)

class DevelopmentFormatter(logging.Formatter):
    """Formats log records in a human-readable format for development."""
    def format(self, record):
        timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
        request_id = getattr(record, "request_id", "-")
        message = record.getMessage()
        
        log_line = f"[{timestamp}] {record.levelname:8} [{record.name}] [req: {request_id}] {message}"
        
        # Add extra info like method, path, status, duration if present
        extras = []
        if hasattr(record, "method") and hasattr(record, "path"):
            extras.append(f"{record.method} {record.path}")
        if hasattr(record, "status_code"):
            extras.append(f"-> {record.status_code}")
        if hasattr(record, "duration_ms"):
            extras.append(f"{record.duration_ms:.1f}ms")
            
        if extras:
            log_line += " | " + " ".join(extras)
            
        if record.exc_info:
            log_line += "\n" + self.formatException(record.exc_info)
            
        return log_line

def setup_logging():
    """Configures the root logger based on the environment."""
    environment = os.getenv("ENVIRONMENT", "development")
    
    root_logger = logging.getLogger()
    
    # Remove existing handlers to avoid duplicates during tests or reload
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
        
    root_logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler()
    handler.addFilter(RequestIdFilter())
    
    if environment == "production":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(DevelopmentFormatter())
        
    root_logger.addHandler(handler)
    
    # Suppress noisy logs from third-party libraries if necessary
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
