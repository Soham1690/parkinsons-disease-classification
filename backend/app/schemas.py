from pydantic import BaseModel, Field


class SamplePredictionRequest(BaseModel):
    dataset_name: str = Field(default="dataset1")
    row_index: int = Field(default=0, ge=0)


class ManualPredictionRequest(BaseModel):
    features: dict[str, float]