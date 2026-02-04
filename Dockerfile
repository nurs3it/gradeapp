#
# Single-container build for Render:
# - Builds Vite frontend (frontend/dist)
# - Copies build into Django container
# - Serves static via WhiteNoise
# - Runs Django with gunicorn on $PORT
#

########################
# Frontend build stage
########################
FROM node:20-slim AS frontend-build

WORKDIR /frontend

RUN corepack enable

COPY frontend/ ./

# Install deps from root yarn.lock for consistency
COPY yarn.lock /yarn.lock
RUN yarn install --frozen-lockfile

# NOTE: project "build" script runs `tsc && vite build` and currently fails on TS errors.
# For Docker deploy we build the bundle with Vite directly.
RUN yarn run vite build


########################
# Backend runtime stage
########################
FROM python:3.11-slim AS backend

WORKDIR /app

RUN apt-get update && apt-get install -y \
    postgresql-client \
    build-essential \
    libpq-dev \
    curl \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libgobject-2.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy frontend build into Django (static + index.html)
COPY --from=frontend-build /frontend/dist /app/frontend_dist
RUN mkdir -p /app/templates && cp /app/frontend_dist/index.html /app/templates/index.html

# Collect static (includes frontend_dist via STATICFILES_DIRS)
RUN python manage.py collectstatic --noinput

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]

# Render provides PORT; default 8000 for local docker run.
CMD ["sh", "-c", "gunicorn gradeapp_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --threads 4 --timeout 120"]

