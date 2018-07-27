#!/bin/bash

set -x

gcloud compute forwarding-rules delete us-east1-tcp-http \
    --region us-east1 --quiet

gcloud compute addresses delete us-east-tcp-ip \
    --region us-east1 --quiet

gcloud compute target-pools delete us-east-tcp-unmanaged \
    --region us-east1 --quiet

gcloud compute http-health-checks delete simple-http-get --quiet

gcloud compute instances delete simple-http-server-1 \
    --zone us-east1-b --quiet

gcloud compute instances delete simple-http-server-2 \
    --zone us-east1-c --quiet

gcloud compute instance-templates delete simple-http-server-v1 --quiet

echo "NLB resources deleted"
