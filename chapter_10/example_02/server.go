package main

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"time"

	"cloud.google.com/go/storage"
	"google.golang.org/api/iterator"
	"google.golang.org/appengine"
	"google.golang.org/appengine/log"
)

var (
	bucketName string
	projectId  string
)

type urlResponse struct {
	Url string `json:"url"`
}

func init() {
	projectId = os.Getenv("PROJECT_ID")
	bucketName = os.Getenv("BUCKET_NAME")

	http.HandleFunc("/_ah/start", handleStartup)
	http.HandleFunc("/api/upload-via-appengine", uploadThroughAppEngineHandler)
	http.HandleFunc("/api/client-url", uploadWithSignedUrlHandler)
}

// Check that the bucket exists. If it does not, provision it with the correct
// permissions. NOTE: all objects stored in this bucket will be publicly accessible by default.
func getOrCreateBucket(ctx context.Context) (*storage.BucketHandle, error) {
	var bucket *storage.BucketHandle

	client, err := storage.NewClient(ctx)
	if err != nil {
		log.Errorf(ctx, "Failed to create client: %v", err)
		return nil, err
	}

	// Check if the bucket already exists
	it := client.Buckets(ctx, projectId)
	it.Prefix = bucketName
	for {
		attrs, err := it.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, err
		}
		if attrs.Name == bucketName {
			// Bucket exists, capture reference and return
			log.Debugf(ctx, "bucket already exists")
			bucket = client.Bucket(bucketName)
			return bucket, nil
		}
	}

	// Configure the attributes of our bucket.
	bucketAttrs := storage.BucketAttrs{}
	// Because we're providing direct client access to images, we'll
	// use Multi-Regional Storage to improve read times.
	bucketAttrs.StorageClass = "MULTI_REGIONAL"
	bucketAttrs.Location = "us"
	// Configure CORS to enable direct client uploads via signed URLs.
	bucketAttrs.CORS = []storage.CORS{
		{
			MaxAge:          time.Hour,
			Methods:         []string{"GET", "PUT"},
			Origins:         []string{"*"},
			ResponseHeaders: []string{"Access-Control-Allow-Origin", "Content-Type"},
		},
	}
	// Alow public access to this bucket so users can view images
	bucketAttrs.DefaultObjectACL = []storage.ACLRule{
		{storage.AllUsers, storage.RoleReader},
	}

	// We always want to ensure the bucket exists early on due to the fact
	// that bucket names must be globally unique. If the bucket name is already
	// taken by another project, the application should fail to start.
	bucket = client.Bucket(bucketName)
	if err := bucket.Create(ctx, projectId, &bucketAttrs); err != nil {
		log.Errorf(ctx, "Failed to get or create bucket: %v", err)
		return nil, err
	}

	log.Debugf(ctx, "bucket created")
	return bucket, nil
}

// For use in manual and basic scaling. This allows us to eagerly provision our
// bucket before accepting user requests. Note that for automatic scaling, this
// endpoint will not be called.
func handleStartup(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	log.Infof(ctx, "Starting application with project %s, bucket %s", projectId, bucketName)

	if _, err := getOrCreateBucket(ctx); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write([]byte("bucket provisioned"))
}

// Method 1: Allow users to upload images directly to our service. Upon receiving
// an image, this handler will write it into Cloud Storage (not a great use of resources).
func uploadThroughAppEngineHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)

	log.Infof(ctx, "in upload handler")

	if r.Method != "POST" {
		http.Error(w, "uploads must use POST", http.StatusMethodNotAllowed)
		return
	}

	// Pull the image file out of the client's request
	file, header, err := r.FormFile("gae-image")
	if err != nil {
		log.Errorf(ctx, "Failed to process request form: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()
	// Determine the image format. We're only allowing .jpeg and .png, though others would work.
	contentType := header.Header.Get("Content-Type")
	if contentType != "image/png" && contentType != "image/jpeg" {
		http.Error(w, "image must be .png or .jpeg", http.StatusBadRequest)
		return
	}

	// Get or create a reference to our bucket
	bucket, err := getOrCreateBucket(ctx)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Create an object writer for the bucket
	wc := bucket.Object(header.Filename).NewWriter(ctx)
	// Allow public access to image
	wc.ACL = []storage.ACLRule{{storage.AllUsers, storage.RoleReader}}

	log.Infof(ctx, "Saving file to Cloud Storage: %s", header.Filename)

	// Write the uploaded file to Cloud Storage
	if _, err := io.Copy(wc, file); err != nil {
		log.Errorf(ctx, "Failed to write file to bucket: %v, %s", err, bucketName)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := wc.Close(); err != nil {
		log.Errorf(ctx, "Failed to commit object to bucket: %v, %s", err, wc.Attrs().Name)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return the image's public URL in the response body
	log.Infof(ctx, "Returning URL to client")
	json, err := json.Marshal(urlResponse{wc.Attrs().MediaLink})
	if err != nil {
		log.Errorf(ctx, "Failed to process UrlResponse: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(json)
}

// Method 2: Provide clients with a Signed URL for the given filename and type.
// Users can then load their image directly into Cloud Storage from their browser,
// saving us the resource overhead and improving performance for them.
func uploadWithSignedUrlHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)

	opts := &storage.SignedURLOptions{}
	// Only allow PUT requests for this URL
	opts.Method = "PUT"
	// Set the URL to expire one hour after creation
	opts.Expires = time.Now().Local().Add(time.Hour)
	opts.ContentType = r.URL.Query().Get("content-type")
	// Set this URL's access ID to the default App Engine service account
	acc, _ := appengine.ServiceAccount(ctx)
	opts.GoogleAccessID = acc
	// Use the provided App Engine SignBytes function to sign the URL
	opts.SignBytes = func(b []byte) ([]byte, error) {
		_, signedBytes, err := appengine.SignBytes(ctx, b)
		return signedBytes, err
	}
	// Get a reference to our bucket, or create it
	if _, err := getOrCreateBucket(ctx); err != nil {
		log.Errorf(ctx, "Failed to get or create bucket: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	// Generate the signed URL
	url, err := storage.SignedURL(bucketName, r.URL.Query().Get("name"), opts)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// Return the resulting URL to the client. The can then use this URL
	// to upload the specified file for up to one hour.
	json, err := json.Marshal(urlResponse{url})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(json)
}
