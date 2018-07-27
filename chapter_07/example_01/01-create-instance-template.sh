#!/bin/bash

# Creates a new 'hello-migs' instance template. This template will use the
# execute the startup-script-v1.sh shell script, which starts a simple HTTP server
gcloud compute instance-templates create hello-migs-template-v1 \
    --machine-type f1-micro \
    --region us-east1 \
    --tags http-server \
    --metadata-from-file startup-script=./startup-script-v1.sh
