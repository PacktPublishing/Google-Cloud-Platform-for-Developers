const { google } = require('googleapis');

const IOT_DISCOVERY_URL = 'https://cloudiot.googleapis.com/$discovery/rest?version=v1';
const IOT_REQUIRED_SCOPES = ['https://www.googleapis.com/auth/cloudiot'];

exports.handleDeviceTelemetry = (event, callback) => {
    console.log('received device telemetry event:', event);
    try {
        // Cloud IoT Core publishes device details as message attributes.
        // Use these attributes to construct the device's fully qualified name (FQN)
        const deviceFQN = (a =>
            `projects/${a.projectId}/locations/${a.deviceRegistryLocation}`
            + `/registries/${a.deviceRegistryId}/devices/${a.deviceId}`
        )(event.data.attributes);
        // Message payloads arrive with base64 encoding. Convert to JSON object.
        const telemetry = JSON.parse(Buffer.from(event.data.data, 'base64').toString());
        console.log(`Received device telemetry for ${deviceFQN}:`, telemetry);
        // Determine the new device config based on telemetry
        const update = processTelemetry(telemetry);
        // Submit the updated config to Cloud IoT Core 
        updateDeviceConfig(deviceFQN, update).then(callback);
    } catch (e) {
        console.error('Error processing device telemetry:', event.data, e);
        callback(e);
    }
}

/**
 * Returns an authenticated Cloud IoT Core API client. This function authenticates
 * using application default credentials, applying additional scopes if needed.
 * Currently, Google does not provide a dedicated Cloud IoT Core client library for 
 * Node.JS. Instead, we rely on the standard Google API client, enriching it using
 * Google's API discovery mechanism.
 *
 * @param {function} callback
 * @returns {Promise} a promise which resolves with the authenticated client
 */
function getClient() {
    const promise = google.auth.getApplicationDefault().then(res => {
        let auth = res.credential;
        if (auth.createScopedRequired && auth.createScopedRequired()) {
            console.log('Auth requires additional scopes, applying');
            auth = auth.createScoped(IOT_REQUIRED_SCOPES);
        }

        google.options({ auth: auth });
        return google.discoverAPI(IOT_DISCOVERY_URL, {});
    });

    return promise;
}

/**
 * Performs a simple analysis of provided telemetry data, and returns an updated
 * device configuration. In this example, we simply inform the device to open windows
 * when temperature and humidity are within acceptable ranges.
 * 
 * In practice, it would be best to first retrieve the device's current state to 
 * determine if changes are required. Additionally, we would likely want to leverage
 * data from surrounding devices and historical data to make more informed decisions.
 * 
 * @param {object} telemetry device telemetry data 
 * @returns {object} the resulting device configuration
 */
function processTelemetry(telemetry) {
    const config = {
        windowsOpen: false,
        reason: 'unset',
    }

    if (telemetry.temperature > 26) {
        config.reason = `${telemetry.temperature} Celsius is too hot`;
        return config;
    }

    if (telemetry.temperature < 19) {
        config.reason = `${telemetry.temperature} Celsius is too cold`;
        return config;
    }

    if (telemetry.humidity > 0.75) {
        config.reason = `${telemetry.humidity * 100}% humidity is very humid`;
        return config;
    }

    config.windowsOpen = true;
    config.reason = 'Weather conditions appear favorable';
    return config;
}

/**
 * Makes an authenticated API call to Cloud IoT Core in order to update the origin
 * device's config.
 * 
 * @param {string} source information about the device 
 * @param {object} config the new device config
 * @param {function} callback function invoked on completion, with error on failure
 * @returns {Promise} a promise which resolves with the result of the API call
 */
function updateDeviceConfig(deviceFQN, config) {
    const promise = getClient().then(client => {
        return client.projects.locations.registries.devices
            .modifyCloudToDeviceConfig(
                {
                    // Cloud IoT Core requires the use of a fully qualified device name
                    name: deviceFQN,
                    // The device config must be base64 encoded
                    binaryData: Buffer.from(JSON.stringify(config)).toString('base64'),
                }
            );
    });

    return promise;
}
