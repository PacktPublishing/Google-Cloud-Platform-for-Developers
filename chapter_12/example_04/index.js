const express = require('express');
const request = require('request');
const app = express();

const instanceMetadataUrl = 'http://metadata.google.internal/computeMetadata/v1/instance'
const headers = { 'Metadata-Flavor': 'Google' };

const config = {
    port: process.env.PORT || 8080,
    message: process.env.MESSAGE || 'Hello from the Express server!',
    build: process.env.BUILD_ID || 'UNSET',
    repo: process.env.REPO_NAME || 'UNSET',
    commit: process.env.COMMIT || 'UNSET',
    zone: 'UNSET',
    name: 'UNSET'
}

setValueFromMetadata('name');
setValueFromMetadata('zone');

app.use('/', (req, res) => {
    res.set('Content-Type', 'text/html');
    res.send(renderHTML());
});

app.listen(config.port, (err) => {
    if (err) {
        return console.error('Node server failed to start:', err.message);
    }
    console.log('Node server listening on port ' + config.port);
});


function setValueFromMetadata(name) {
    const options = {
        url: `${instanceMetadataUrl}/${name}`,
        headers: headers
    };
    console.log('options:', options);
    request(options, (err, res, body) => {
        if (err) {
            console.warn('failed to fetch metadata for ' + name);
            return;
        }
        console.log('response: ', body);
        config[name] = body;
    });
}


function renderHTML() {
    return `
        <html>
            <body>
                <h2>${config.message}</h2>
                <h4>Release Info:</h4>
                <table border="1">
                    <tr>
                        <td>Build ID</td>
                        <td>${config.build}</td>
                    </tr>
                    <tr>
                        <td>Repository</td>
                        <td>${config.repo}</td>
                    </tr>
                    <tr>
                        <td>Commit SHA</td>
                        <td>${config.commit}</td>
                    </tr>
                    <tr>
                        <td>Instance Name</td>
                        <td>${config.name}</td>
                    </tr>
                    <tr>
                        <td>Instance Zone</td>
                        <td>${config.zone}</td>
                    </tr>
                </table>
            </body>
        </html>
    `;
}