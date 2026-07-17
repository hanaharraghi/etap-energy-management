FROM python:3.11-slim

WORKDIR /app

# gcc/g++ needed to build some scientific-Python wheels on platforms without
# prebuilt binaries; cmdstan (Prophet's backend) needs make.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ make \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Prophet's Stan backend compiles itself into a native binary on first
# import if it isn't already built — doing that once here at image-build
# time means the container doesn't pay that cost (10-60s) on every restart.
RUN python -c "from prophet import Prophet; import pandas as pd; \
    df = pd.DataFrame({'ds': pd.date_range('2024-01-01', periods=10, freq='MS'), 'y': range(10)}); \
    Prophet().fit(df)"

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
