# Demo: Managing User Uploads to GCS

This is a simple service intended to show two ways to handle user uploads to Google Cloud Storage.

1. By accepting client uploads within the App Engine service, where they are then written to GCS.
   This method is slightly simpler and avoids the additional hop of generating a signed URL for upload.
   It does however require that the service handle additional load of processing files during upload.
   For large files or heavy traffic, this will cause increased server load, requiring 
   applications to scale needlessly.

2. By using signed URLs to allow end users to upload files directly to Cloud Storage. This method avoids
   the resource overhead of uploading large files by simply negotiating the upload and handing it off
   to the client browser. By using short expiration times and specific upload criteria, we can maintain
   control over what is uploaded to our bucket.

## Setup

Before running this service, replace both `<YOUR_PROJECT_ID>` and `<YOUR_BUCKET_NAME>` in `app.yaml`
with appropriate values. This application will create and set up the bucket correctly for you, so 
provide a bucket name that is unique, but does not already exist.


## Running Locally

These instructions assume you are running in a *nix system, such as the Google Cloud Shell. You can click the
`Open in Cloud Shell` link in this repository's root README to automatically set it up.

This service uses the App Engine default service account in order to perform URL signing. In order to do this
within the App Engine Dev Server, you'll first need to provide the development server with the App Engine
default service account email and an RSA key. We can do this with the following commands:

- Get a reference to the App Engine default service account:
```bash
SERVICE_ACCT_EMAIL=$(gcloud iam service-accounts list \
  --format="value(email)" --filter="email:(appspot.gserviceaccount.com)")
```
- Download a .p12 key for the service account:
```bash
gcloud iam service-accounts keys create --iam-account=$SERVICE_ACCT_EMAIL \
  --key-file-type=p12  ./gae-development-key
```
- Convert the .p12 key to a .pem
```bash
cat ./gae-development-key.p12 \
  | openssl pkcs12 -nocerts -nodes -passin pass:notasecret \
  | openssl rsa > ./gae-development-key.pem 
```

With the file and service account set, run the App Engine Dev Server with the 
`--appidentity_email_address` and `--appidentity_private_key_path` flags:

```bash
dev_appserver.py app.yaml --appidentity_email_address=$SERVICE_ACCT_EMAIL \
  --appidentity_private_key_path=./gae-development-key.pem 
```

Your application should now be available at http://localhost:8080

## Deploying the Application

The service uses the Go 1.8 runtime on App Engine standard.

To deploy this application, run `gcloud app deploy app.yaml` from within this directory.

See __Chapter 4: Google App Engine__ for a full rundown on how to get App Engine services up and running.
