from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd
from sklearn.ensemble import ExtraTreesClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
DATASETS = {
    "dataset1": DATA_DIR / "Parkinson Dataset1.csv",
    "dataset2": DATA_DIR / "Parkinson Dataset2.csv",
}


@dataclass
class ModelBundle:
    model: ExtraTreesClassifier
    feature_names: list[str]
    metrics: dict[str, Any]


_BUNDLE: ModelBundle | None = None


def load_dataset(dataset_name: str) -> pd.DataFrame:
    if dataset_name not in DATASETS:
        raise ValueError(f"Unknown dataset: {dataset_name}")
    return pd.read_csv(DATASETS[dataset_name])


def get_feature_names() -> list[str]:
    df = load_dataset("dataset1")
    return [column for column in df.columns if column not in {"name", "status"}]


def _train_bundle() -> ModelBundle:
    df = load_dataset("dataset1")
    feature_names = get_feature_names()

    X = df[feature_names]
    y = df["status"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        stratify=y,
        random_state=42,
    )

    model = ExtraTreesClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    probabilities = model.predict_proba(X_test)[:, 1]
    importances = sorted(
        zip(feature_names, model.feature_importances_),
        key=lambda item: item[1],
        reverse=True,
    )

    metrics = {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "precision": round(float(precision_score(y_test, predictions, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, predictions, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, predictions, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, probabilities)), 4),
        "confusion_matrix": confusion_matrix(y_test, predictions).tolist(),
        "top_features": [
            {"name": name, "importance": round(float(score), 4)}
            for name, score in importances[:8]
        ],
        "dataset_rows": int(df.shape[0]),
        "dataset_columns": int(df.shape[1]),
        "class_balance": {str(label): int(count) for label, count in y.value_counts().sort_index().items()},
        "model_name": "ExtraTreesClassifier",
        "trained_on": "dataset1",
        "clinical_note": "Educational voice-based screening demo. Not a diagnostic tool.",
    }

    return ModelBundle(model=model, feature_names=feature_names, metrics=metrics)


def get_bundle() -> ModelBundle:
    global _BUNDLE
    if _BUNDLE is None:
        _BUNDLE = _train_bundle()
    return _BUNDLE


def get_summary() -> dict[str, Any]:
    bundle = get_bundle()
    dataset1 = load_dataset("dataset1")
    dataset2 = load_dataset("dataset2")

    return {
        "project": {
            "title": "Parkinson's Voice Screening Explorer",
            "subtitle": "A clinically framed frontend and API built from a notebook-first ML project.",
            "repo_focus": "Voice-based Parkinson's screening estimate using a deployable ensemble classifier.",
            "medical_disclaimer": "This application is for educational demonstration only and is not intended for diagnosis.",
        },
        "datasets": {
            "dataset1": {
                "rows": int(dataset1.shape[0]),
                "columns": int(dataset1.shape[1]),
                "preview_name": str(dataset1.iloc[0]["name"]),
                "source_type": "original voice measurements",
            },
            "dataset2": {
                "rows": int(dataset2.shape[0]),
                "columns": int(dataset2.shape[1]),
                "preview_name": str(dataset2.iloc[0]["name"]),
                "source_type": "comparison records",
            },
        },
        "features": bundle.feature_names,
        "deployed_model": bundle.metrics,
        "ui_notes": [
            "Use sample-based screening to run the model on a stored voice record.",
            "Use manual biomedical input to enter feature values directly.",
            "Treat all outputs as educational model estimates rather than medical conclusions.",
        ],
    }


def get_sample(dataset_name: str, row_index: int) -> dict[str, Any]:
    df = load_dataset(dataset_name)
    safe_index = max(0, min(int(row_index), len(df) - 1))
    row = df.iloc[safe_index]
    feature_names = get_feature_names()

    return {
        "dataset_name": dataset_name,
        "row_index": safe_index,
        "name": str(row["name"]),
        "actual_status": int(row["status"]),
        "features": {feature: float(row[feature]) for feature in feature_names},
    }


def predict(features: dict[str, float]) -> dict[str, Any]:
    bundle = get_bundle()
    missing = [feature for feature in bundle.feature_names if feature not in features]
    if missing:
        raise ValueError(f"Missing features: {', '.join(missing)}")

    ordered = pd.DataFrame([{feature: float(features[feature]) for feature in bundle.feature_names}])
    predicted_class = int(bundle.model.predict(ordered)[0])
    probability = float(bundle.model.predict_proba(ordered)[0][1])

    return {
        "prediction": predicted_class,
        "parkinsons_probability": round(probability, 4),
        "healthy_probability": round(1 - probability, 4),
        "label": "Elevated Parkinsonian signal" if predicted_class == 1 else "Lower Parkinsonian signal",
    }


def predict_from_sample(dataset_name: str, row_index: int) -> dict[str, Any]:
    sample = get_sample(dataset_name, row_index)
    prediction = predict(sample["features"])
    return {**sample, **prediction}