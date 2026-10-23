
import numpy as np
import torch


def preprocess_beat(raw_beat):
    try:
        beat = np.asarray(raw_beat, dtype=np.float32)
    except (TypeError, ValueError):
        raise ValueError("Beat must contain numeric values.")

    if beat.shape != (200,):
        raise ValueError("Beat must contain exactly 200 values.")

    if not np.isfinite(beat).all():
        raise ValueError("Beat must contain only finite values.")

    # Normalize the heartbeat
    std = beat.std()
    if std == 0:
        std = 1.0

    beat = (beat - beat.mean()) / std

    # Convert the heartbeat into a PyTorch tensor
    beat_tensor = torch.from_numpy(beat).unsqueeze(0)

    return beat_tensor
