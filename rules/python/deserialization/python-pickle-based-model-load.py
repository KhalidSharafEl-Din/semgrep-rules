import joblib
import numpy as np
import pandas as pd
import torch
from safetensors.torch import load_file


def load_uploaded_checkpoint(path):
    # ruleid: python-pickle-based-model-load
    return torch.load(path)


def load_checkpoint_explicit(path):
    # ruleid: python-pickle-based-model-load
    return torch.load(path, map_location="cpu", weights_only=False)


def load_features(path):
    # ruleid: python-pickle-based-model-load
    return np.load(path, allow_pickle=True)


def load_classifier(path):
    # ruleid: python-pickle-based-model-load
    return joblib.load(path)


def load_frame(path):
    # ruleid: python-pickle-based-model-load
    return pd.read_pickle(path)


def load_weights_only(path):
    # ok: python-pickle-based-model-load
    return torch.load(path, map_location="cpu", weights_only=True)


def load_safetensors(path):
    # ok: python-pickle-based-model-load
    return load_file(path)


def load_array(path):
    # ok: python-pickle-based-model-load
    return np.load(path)


def load_csv(path):
    # ok: python-pickle-based-model-load
    return pd.read_csv(path)
