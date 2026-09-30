"""Evaluation module for synthetic data fidelity, utility (TSTR), and privacy."""
from backend.app.evaluation.tstr import TSTREvaluationEngine
from backend.app.evaluation.datasets import get_demo_dataset, DEMO_DATASETS

__all__ = ["TSTREvaluationEngine", "get_demo_dataset", "DEMO_DATASETS"]
