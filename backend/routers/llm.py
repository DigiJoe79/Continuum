# backend/routers/llm.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from loguru import logger
from database import get_db
from schemas import (
    EnrichRequest, EnrichVariantRequest,
    EnrichLayeredResponse, LayeredPrompt,
    LLMLogsResponse, TestConnectionResponse
)
from services.llm_client import get_llm_client, get_request_logs, LLMError
import traceback

router = APIRouter(prefix="/api/llm", tags=["llm"])


@router.get("/logs", response_model=LLMLogsResponse)
def get_llm_logs():
    """Get the last 10 LLM request logs (current session only)."""
    logs = get_request_logs()
    # Return in reverse order (newest first)
    return {"logs": list(reversed(logs))}


@router.post("/test", response_model=TestConnectionResponse)
def test_connection(db: Session = Depends(get_db)):
    """Test LLM connection with a simple request."""
    try:
        client = get_llm_client(db)
        message = client.complete(
            messages=[{"role": "user", "content": "Say 'OK' if you can read this."}],
            max_tokens=10
        )
        return TestConnectionResponse(
            success=True,
            message=message.strip(),
            model=client.model
        )
    except LLMError as e:
        return TestConnectionResponse(success=False, message=str(e))
    except Exception as e:
        return TestConnectionResponse(success=False, message=f"Connection failed: {str(e)}")


@router.post("/enrich", response_model=EnrichLayeredResponse)
def enrich_asset(request: EnrichRequest, db: Session = Depends(get_db)):
    """Enrich asset with layered prompt structure."""
    try:
        client = get_llm_client(db)
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        result = client.enrich(
            asset_type=request.asset_type,
            messages=messages,
            current_prompt=request.current_prompt
        )
        outfit = result.get("outfit_suggestion")
        return EnrichLayeredResponse(
            layers=LayeredPrompt(**{k: v for k, v in result.items() if k != "outfit_suggestion"}),
            outfit_suggestion=LayeredPrompt(**outfit) if outfit else None
        )
    except LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.error(f"LLM Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")


@router.post("/enrich-variant", response_model=EnrichLayeredResponse)
def enrich_variant(request: EnrichVariantRequest, db: Session = Depends(get_db)):
    """Enrich variant with layered delta structure."""
    try:
        client = get_llm_client(db)
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        result = client.enrich_variant(
            asset_type=request.asset_type,
            base_prompt=request.base_prompt,
            messages=messages,
            current_delta=request.current_delta
        )
        return EnrichLayeredResponse(layers=LayeredPrompt(**result))
    except LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.error(f"LLM Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")
