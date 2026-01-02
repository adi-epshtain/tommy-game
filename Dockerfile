FROM python:3.11-slim

WORKDIR /app

# Install Node.js and npm for building React app
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend files and build React app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install --production=false
COPY frontend/ .
RUN npm run build

# Return to app root and copy rest of the application
WORKDIR /app
COPY . .

# Ensure the React build is in the right place
RUN if [ ! -d "static/react" ]; then \
        echo "Warning: React build not found in static/react"; \
    fi

EXPOSE 8000

# Use a startup script that runs both the watch process and uvicorn
# Default command - can be overridden by docker-compose
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
