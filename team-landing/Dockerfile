FROM python:3.12-slim

WORKDIR /app

COPY . .

EXPOSE 4174

CMD ["python", "-m", "http.server", "4174", "--directory", "/app"]
