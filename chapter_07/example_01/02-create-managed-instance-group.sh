#!/bin/bash

# Creates a new 3-node Managed Instance Group based on the 'hello-migs-template-v1' instance template
gcloud compute instance-groups managed create hello-migs \
    --template hello-migs-template-v1 \
    --size 3 \
    --region us-east1
