from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .model_service import get_bundle, get_sample, get_summary, predict, predict_from_sample
from .schemas import ManualPredictionRequest, SamplePredictionRequest

app = FastAPI(
    title="Parkinson's Voice Screening Explorer API",
    version="1.0.0",
    description="Clinically framed FastAPI backend for a voice-based Parkinson's screening ML demo.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    get_bundle()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/summary")
def summary() -> dict:
    return get_summary()


@app.get("/api/sample")
def sample(
    dataset_name: str = Query(default="dataset1"),
    row_index: int = Query(default=0, ge=0),
) -> dict:
    try:
        return get_sample(dataset_name, row_index)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/predict/sample")
def predict_sample(payload: SamplePredictionRequest) -> dict:
    try:
        return predict_from_sample(payload.dataset_name, payload.row_index)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/predict/manual")
def predict_manual(payload: ManualPredictionRequest) -> dict:
    try:
        return predict(payload.features)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc