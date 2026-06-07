import requests
import json

# This script is used to initially train the model using simple data.
# Note: this is not enough training data to achieve optimal results
with open("training_data.json", "r") as f:
    training_data = json.load(f)

url = "http://localhost:8000/train"

for example in training_data:
    response = requests.post(url, json=example)
    if response.ok:
        print(f"Trained with label {example['label']}, similarity={response.json()['similarity']}")
    else:
        print(f"Failed to train: {response.text}")
        