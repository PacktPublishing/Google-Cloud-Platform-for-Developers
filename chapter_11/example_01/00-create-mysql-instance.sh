#!/bin/bash

set -e
set -x

# Create the new todos-db Cloud SQL instance
gcloud sql instances create todos-db \
    --region us-central1 \
    --database-version MYSQL_5_6 \
    --tier db-f1-micro \
    --no-backup

# Wait a moment to allow instance is fully initialize
sleep 10

# Create a todos database in the new instance
gcloud sql databases create todos --instance todos-db

# Update the root password for this instance
gcloud sql users set-password root % \
    --instance todos-db \
    --prompt-for-password

INSTANCE_NAME=$(gcloud sql instances describe todos-db --format="value(connectionName)")

echo "Your instance connection name is ${INSTANCE_NAME}"
