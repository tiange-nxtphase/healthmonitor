# Stage 1: Build the Next.js frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy only the necessary files for building the frontend
COPY package.json package-lock.json ./
RUN npm install

# Copy the entire frontend source code
COPY ./app ./app
COPY ./components ./components
COPY ./utils ./utils

# Build the Next.js app (assuming you want a static export)
RUN npm run build && npm run export

# Stage 2: Backend with Python
FROM python:3.8-slim AS backend

WORKDIR /app

# Copy backend code
COPY app.py ./
COPY config.json ./

# Copy the frontend build from the previous stage
COPY --from=frontend-builder /app/out ./public

# Install Python dependencies (if any)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables if needed
ENV PYTHONUNBUFFERED=1

# Expose the Flask application port
EXPOSE 5000

# Run the Flask application
CMD ["python", "app.py"]
