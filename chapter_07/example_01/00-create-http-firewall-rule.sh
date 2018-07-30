#!/bin/bash

# Generates a firewall rule to allow inbound TCP traffic on port 80, from all sources
gcloud compute firewall-rules create default-allow-http \
    --target-tags http-server \
    --direction INGRESS \
    --network default \
    --priority 1000 \
    --source-ranges 0.0.0.0/0 \
    --action ALLOW \
    --rules tcp:80
