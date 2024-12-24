# Use Python 3.9 slim image as base
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all necessary files
COPY . .

# Create results directory
RUN mkdir -p results

# Make sure server.py is executable and has proper line endings
RUN chmod +x server.py && \
    ls -la /app && \
    echo "Contents of /app:" && \
    ls -l /app

# Expose the port
EXPOSE 30113

# Command to run the server with unbuffered output
CMD ["python", "-u", "server.py"]