const Storage = require('@google-cloud/storage');
const packageJson = require('./package.json');

let bucket = null;

/* 
Lazily initialize the global Storage bucket reference.
Use discression when using global variables in Cloud Functions
as global variables may be shared across function invocations.
*/
function getBucket() {
    if (bucket === null) {
        const projectId = process.env.GCP_PROJECT;
        const bucketName = packageJson.config.bucketName;    
        console.log(`Initializing global bucket reference 
            with project id: ${projectId}, bucket: ${bucketName}`);    
        bucket = new Storage({ projectId }).bucket(bucketName);
    }
    return bucket;
}

/*
List all files in the bucket specified bucket.
Be sure to update the bucket name in package.json (config.bucketName).
*/
exports.listBucket = function listBucket (req, res) {
    getBucket()
        .getFiles()
        .then(results => {
            res.send({files: results[0].map(f => f.name)});
        }).catch(err => {
            res.status(500).send({err: err.message});
        });
}
