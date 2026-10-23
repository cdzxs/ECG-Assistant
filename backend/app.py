
from model import ECGCNN
from pathlib import Path
from preprocessing import preprocess_beat
from pyexpat import model
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
import numpy as np

app = Flask(__name__)
CORS(app)


model = ECGCNN()

# 2. Load the saved model
from pathlib import Path

device = torch.device("cpu")
MODEL_PATH = Path(__file__).parent.parent / "models" / "ecg_assist_final.pth"

checkpoint = torch.load(MODEL_PATH, map_location=device, weights_only=True)

LABELS = [
    checkpoint["label_map"][i] 
    for i in range(len(checkpoint["label_map"]))
]


# 3. Create a prediction endpoint
@app.route("/predict", methods=["POST"])

def predict():
    data = request.get_json(silent=True)

    if not isinstance(data, dict) or "beat" not in data:
        return jsonify({
            "error": "Send a JSON object containing 'beat'."
        }), 400

    try:
        beat_tensor = preprocess_beat(data["beat"])
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    with torch.no_grad():
        probabilities = torch.softmax(model(beat_tensor), dim=1)[0]
        predicted_index = int(probabilities.argmax().item())

    return jsonify({
        "prediction": LABELS[predicted_index],
        "confidence": float(probabilities[predicted_index].item()),
        "probabilities": {
            label: float(probabilities[i].item())
            for i, label in enumerate(LABELS)
        }
    })



@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "ECG-Assist API is running",
        "endpoint": "/predict"
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
