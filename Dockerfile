FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ backend/
COPY --from=web /web/dist frontend/dist
RUN useradd --create-home app && chown -R app /app
USER app
WORKDIR /app/backend
ENV PORT=8000 ALLOW_BLOCK_REPORTS=0
EXPOSE 8000
CMD gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 --access-logfile - app:app
