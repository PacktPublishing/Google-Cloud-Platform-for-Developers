#!/bin/bash

set -e
set -x

# Create an HTTP server instance template
gcloud compute instance-templates create simple-http-server-v1 \
    --machine-type f1-micro \
    --region us-east1 \
    --tags http-server \
    --metadata-from-file startup-script=./startup-script.sh

# Create two instances using the instance template, one in
# us-east1-b and one in us-east1-c
gcloud compute instances create simple-http-server-1 \
    --source-instance-template simple-http-server-v1 \
    --zone us-east1-b

gcloud compute instances create simple-http-server-2 \
    --source-instance-template simple-http-server-v1 \
    --zone us-east1-c

# Create an HTTP health check to use on the new instances
gcloud compute http-health-checks create simple-http-get

# Create a target pool and attach the instances
gcloud compute target-pools create us-east-tcp-unmanaged \
    --region us-east1 \
    --http-health-check simple-http-get

gcloud compute target-pools add-instances us-east-tcp-unmanaged \
    --region us-east1 \
    --instances simple-http-server-1 \
    --instances-zone us-east1-b \

gcloud compute target-pools add-instances us-east-tcp-unmanaged \
    --region us-east1 \
    --instances simple-http-server-2 \
    --instances-zone us-east1-c

# Create a regional static IP
gcloud compute addresses create us-east-tcp-ip \
    --region us-east1

# Create a regional forwarding rule using the regional IP and target pool
gcloud compute forwarding-rules create us-east1-tcp-http \
    --region us-east1 \
    --target-pool us-east-tcp-unmanaged \
    --target-pool-region us-east1 \
    --ports 80 \
    --address us-east-tcp-ip \
    --address-region us-east1

# Show load balancer public IP
public_ip=$(gcloud compute forwarding-rules describe us-east1-tcp-http \
    --region us-east1 --format="value(IPAddress)")

echo "Setup complete. NLB IP is: $public_ip"
