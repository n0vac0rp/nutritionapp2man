FROM python:3.12-slim

RUN apt-get update -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=300 -r requirements.txt

COPY models/ ./models/
COPY app/ ./app/

RUN chown -R app:app /app
USER app

EXPOSE 3002
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3002"]
