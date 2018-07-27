#!/bin/bash

# Creates a second, updated instance template for use in rolling updates
gcloud compute instance-templates create hello-migs-template-v2 \
    --machine-type f1-micro \
    --region us-east1 \
    --tags http-server \
    --metadata-from-file startup-script=./startup-script-v2.sh
