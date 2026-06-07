from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import List, Optional
from sentence_transformers import SentenceTransformer, util
from sklearn.linear_model import SGDClassifier
from transformers import T5Tokenizer, T5ForConditionalGeneration
import numpy as np
import joblib
import os
import logging

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

MODEL_PATH = "model.pkl"

# Load Machine Learning model
if os.path.exists(MODEL_PATH):
    logger.info(f"Loading model from {MODEL_PATH}")
    model = joblib.load(MODEL_PATH)
else:
    logger.info(f"Model not found, creating new model at {MODEL_PATH}")
    model = SGDClassifier(loss='log_loss')
    model.partial_fit([[0, 0, 0, 0, 0]], [0], classes=np.array([0, 1]))
    joblib.dump(model, MODEL_PATH)

# Load SBERT model
logger.info("Loading SentenceTransformer model...")
text_model = SentenceTransformer("all-MiniLM-L6-v2")

# Load T5 model
logger.info("Loading T5 model and tokenizer...")
t5_model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")
t5_tokenizer = T5Tokenizer.from_pretrained("google/flan-t5-base")

# Schemas
class PredictRequest(BaseModel):
    features: List[float]
    title: Optional[str] = ""
    type: Optional[str] = ""

class TrainRequest(PredictRequest):
    label: int

class CombineRequest(BaseModel):
    title: str
    type: str

# Calculate text similarity
def text_similarity(title, type):
    logger.info(f"Computing similarity for title='{title}', type='{type}'")
    title = (title or "").lower()
    type = (type or "").lower()
    embeddings = text_model.encode([title, type], convert_to_tensor=True)
    sim = util.cos_sim(embeddings[0], embeddings[1]).item()
    logger.info(f"Similarity score: {sim}")
    return sim

# Model prediction
@app.post("/predict")
async def predict(req: PredictRequest, request: Request):
    logger.info(f"Incoming /predict request from {request.client.host}")
    logger.info(f"Payload: {req}")

    try:
        features = req.features.copy()
        sim = text_similarity(req.title, req.type)
        features.append(sim)

        logger.info(f"Final feature vector: {features}")

        pred = model.predict([features])[0]
        prob = model.predict_proba([features])[0][1]

        result = {
            "linked": bool(pred),
            "confidence": round(prob, 3),
            "similarity": round(sim, 3)
        }

        logger.info(f"Prediction result: {result}")
        return result

    except Exception as e:
        logger.error(f"Error during prediction: {e}", exc_info=True)
        return {"error": str(e)}

# Model training
@app.post("/train")
def train(req: TrainRequest):
    logger.info(f"Training on new data: {req}")
    try:
        features = req.features.copy()
        sim = text_similarity(req.title, req.type)
        features.append(sim)

        model.partial_fit([features], [req.label])
        joblib.dump(model, MODEL_PATH)

        result = {
            "status": "model updated",
            "features": features,
            "label": req.label,
            "similarity": round(sim, 3)
        }

        logger.info(f"Training result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error during training: {e}", exc_info=True)
        return {"error": str(e)}

# Combine texts using the T5 model
@app.post("/combine_texts")
def combine_texts(req: CombineRequest):
    logger.info(f"Combining texts: title='{req.title}', type='{req.type}'")
    try:
        input_text = f"Can you create a title from this sentence: '{(req.type).lower()} and {req.title}'?"
        input_ids = t5_tokenizer(input_text, return_tensors="pt").input_ids
        outputs = t5_model.generate(input_ids)
        combined_text = t5_tokenizer.decode(outputs[0], skip_special_tokens=True)

        logger.info(f"Combined result: {combined_text}")
        return {"combined_text": combined_text}

    except Exception as e:
        logger.error(f"Error during text combination: {e}", exc_info=True)
        return {"error": str(e)}
