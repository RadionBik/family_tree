FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ARG HOST_UID
ARG HOST_GID

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends procps curl && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /app/logs && \
    touch /app/logs/cron.log && \
    touch /app/logs/ingestion.log

RUN if getent group ${HOST_GID:-1000} >/dev/null; then \
        echo "Group with GID ${HOST_GID:-1000} already exists." ; \
    else \
        groupadd --gid ${HOST_GID:-1000} appgroup ; \
    fi && \
    if getent passwd ${HOST_UID:-1000} >/dev/null; then \
        echo "User with UID ${HOST_UID:-1000} already exists." ; \
    else \
        useradd --uid ${HOST_UID:-1000} --gid appgroup --system --no-create-home --shell /bin/false appuser ; \
    fi

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /db_data && chown -R appuser:appgroup /app /db_data

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1
