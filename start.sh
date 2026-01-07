#!/bin/bash
# start.sh
nginx &
cd /app/backend && uvicorn main:app --host 0.0.0.0 --port 8000
