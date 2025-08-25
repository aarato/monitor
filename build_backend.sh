#!/bin/bash
docker build --load --build-arg MAXMIND_ACCOUNT_ID=$MAXMIND_ACCOUNT_ID --build-arg MAXMIND_LICENSE_KEY=$MAXMIND_LICENSE_KEY -t aarato/monitor_backend:latest source/backend