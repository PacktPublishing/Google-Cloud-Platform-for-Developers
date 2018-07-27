const Readable = require('stream').Readable;
const Storage = require('@google-cloud/storage');
const Vision = require('@google-cloud/vision');

const storage = Storage();
const vision = new Vision.ImageAnnotatorClient();
const postfix = '.annotations.json';

/**
 * Accepts a Google Cloud Storage change event. The new object will
 * be submitted to the Google Cloud Vision API for analysis. Results
 * are then written to the originating bucket as
 * <ORIGINAL_FILE>.annotations.json.
 */
exports.processImage = (event, callback) => {
    const file = event.data;

    /**
     * We're writing the output of our function to the same bucket we're watching.
     * In practice, it would be better to write our results to another bucket or
     * Cloud Datastore. Here, just check that this is an image upload.
     */
    if (!['image/jpeg', 'image/png'].includes(file.contentType)) {
        console.log('File is not a .jpeg or .png, exiting');
        return callback();
    }

    console.log('Submitting new file for analysis:', file.name);

    /**
     * Submit the file to the Google Cloud Vision API for analysis.
     * We're checking for general labels, but we could also check
     * for logos, landmarks, faces, and more.
     */
    vision.annotateImage({
        image: {
            source: {
                gcsImageUri: `gs://${file.bucket}/${file.name}`
            }
        },
        features: [
            { type: 'LABEL_DETECTION' },
        ]
    }).then(annotations => {

        console.log('Analysis complete:', JSON.stringify(annotations));

        const output = `${file.name}${postfix}`;
        console.log('Writing annotations to ', output);

        // Upload the results to a new file alongside the processed image.
        const writeStream = storage
            .bucket(file.bucket)
            .file(output)
            .createWriteStream({
                contentType: 'application/json',
            });

        // We need to make sure that we either invoke the callback, return,
        // or throw an error. Failure to do so will cause the function to
        // hang, resulting in more expensive function invocations.
        writeStream
            .on('finish', () => {
                console.log('Annotations successfully uploaded to GCS');
                callback();
            })
            .on('error', (e) => {
                throw e
            });

        writeStream.write(JSON.stringify(annotations, null, 2));
        writeStream.end();
    });
};
