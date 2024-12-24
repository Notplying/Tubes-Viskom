from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import cv2
import numpy as np
import os
from ultralytics import YOLO

# Change to the directory containing this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get absolute paths
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, 'best.pt')

# Load YOLOv11 model
print(f"Loading model from: {model_path}")
model = YOLO(model_path)

# Serve static files
app.mount("/static", StaticFiles(directory=current_dir), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open(os.path.join(current_dir, "index.html")) as f:
        return f.read()

@app.get("/script.js")
async def get_script():
    return FileResponse(os.path.join(current_dir, "script.js"), media_type="application/javascript")

@app.get("/styles.css")
async def get_styles():
    return FileResponse(os.path.join(current_dir, "styles.css"), media_type="text/css")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Read image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Create results directory if it doesn't exist
    results_dir = os.path.join(current_dir, 'results')
    if not os.path.exists(results_dir):
        os.makedirs(results_dir)
    
    # Find the next available predict folder number
    predict_folders = [d for d in os.listdir(results_dir) if d.startswith('predict')]
    next_number = 1
    if predict_folders:
        numbers = [int(d.replace('predict', '')) for d in predict_folders if d.replace('predict', '').isdigit()]
        if numbers:
            next_number = max(numbers) + 1
    
    predict_folder = f'predict{next_number}' if next_number > 1 else 'predict'
    
    # Run inference and save results
    results = model.predict(img, save=True, project=results_dir, name=predict_folder)
    
    # Return the processed image from the latest prediction folder
    output_path = os.path.join(results_dir, predict_folder, 'image0.jpg')
    return FileResponse(output_path)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    print(f"Current working directory: {os.getcwd()}")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=30113)