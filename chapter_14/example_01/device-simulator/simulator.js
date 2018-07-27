const fs = require('fs');
const program = require('commander');
const jwt = require('jsonwebtoken');
const mqtt = require('mqtt');

const pendingMessages = [];

let telemetryInterval = null;
let stateInterval = null;
let flushInterval = null;

/**
 * Generates a JSON Web Token (JWT) using the provided RSA x509 private key.
 * The JWT is created with an expiry of one hour, after which the simulator will fail.
 *
 * @param {string} projectId GCP project ID that the device is registered to
 * @param {string} keyPath File path to the device's RSA x509 private key
 * @returns {object} the signed JWT
 */
function generateToken(projectId, keyPath) {
    const token = {
        'exp': Math.floor(Date.now() / 1000) + (60 * 60),
        'aud': projectId
    };
    const key = fs.readFileSync(keyPath);
    const options = { algorithm: 'RS256' };
    return jwt.sign(token, key, options);
}

/**
 * Generates mock weather senser telemetry for use by Cloud IoT Core.
 * The telemetry is queued locally in `pendingMessages` to be published via MQTT
 * when a connection is available.
 */
function generateTelemetry() {
    const telemetry = {
        localtime: new Date(),
        temperature: +(Math.random() * 20 + 12).toFixed(4),
        humidity: +(Math.random()).toFixed(4),
    };
    pendingMessages.push(telemetry);
    console.log('Telemetry generated. Pending messages:', pendingMessages.length);
}

/**
 * Publishes all queued messages to Cloud IoT Core via MQTT.
 * Should the connection fail, messaging will continue after it is re-established.
 */
function flushMessages() {
    if (pendingMessages.length < 1) {
        return
    }
    const telemetry = JSON.stringify(pendingMessages[0]);
    console.log('Publishing telemetry: ', telemetry);
    client.publish(eventsTopic, telemetry, (err) => {
        if (err) {
            console.error('Failed to publish telemetry', err);
            return;
        }
        pendingMessages.shift();
        flushMessages();
    });
}

/**
 * Updates the device configuration based on incoming messages from Cloud IoT Core.
 *
 * @param {string} config serialzied device configuration
 */
function updateConfig(config) {
    console.log('Received config update:', config);
    // (take actions based on the new config)
}

/**
 * Presents a command-line interface for the simulator.
 * Run `node simulator.js --help` to view help dialog.
 */
program
    .option('-k, --key-path <path>', 'Path to RSA x509 private key', './private-key.pem')
    .option('-n, --device <device_id>', 'ID of device to simulate', 'example-device-001')
    .option('-r, --registry <registry_id>', 'Device registry ID', 'weather-sensors')
    .option('-e, --region <region>', 'REQUIRED: The device registry\'s GCP region', 'us-central1')
    .option('-p, --project-id <project_id>', 'GCP project ID')
    .parse(process.argv)

// Project ID is required to establish an MQTT connection.
if (!program.projectId) {
    program.outputHelp();
    return;
}

// The fully-qualified name for the simulated device. This is the required client ID 
// format for connecting to Cloud IoT Core via MQTT.
const deviceFqn = `projects/${program.projectId}/locations/${program.region}`
    + `/registries/${program.registry}/devices/${program.device}`;
// Available MQTT topics:
// - `events`: used for sending telemetry data to Cloud IoT Core
// - `state`: used for sending device state to Cloud IoT Core
// - `config`: used for receiving device configuration update from Cloud IoT Core
const eventsTopic = `/devices/${program.device}/events`;
const stateTopic = `/devices/${program.device}/state`;
const configTopic = `/devices/${program.device}/config`;

// Establish the MQTT connection using a singed JWT.
const token = generateToken(program.projectId, program.keyPath);
const client = mqtt.connect('mqtts://mqtt.googleapis.com:8883', {
    clientId: deviceFqn,
    username: '',
    password: token,
});

// Once a connection is established, begin generating and publishing telemetry data
client.on('connect', (success) => {
    if (!success) {
        console.error('MQTT connection failed');
        process.exit(1);
    }

    console.log('MQTT connection established');

    if (!telemetryInterval) {
        generateTelemetry();
        telemetryInterval = setInterval(generateTelemetry, 5000);
    }

    if (!flushInterval) {
        flushInterval = setInterval(flushMessages, 300);
    }
});

// Handle incoming device configuration messages
client.on('message', (_, buffer) => { updateConfig(buffer.toString()) });
client.subscribe(configTopic);
