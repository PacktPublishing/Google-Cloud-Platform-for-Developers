const express = require('express');
const app = express();

const config = {
    port: process.env.PORT || 8080,
    message: process.env.MESSAGE || 'Hello from the Express server!'
}

app.use('/', (req, res) => {
    res.send(config.message);
});

app.listen(config.port, (err) => {
    if (err) {
        return console.error('Node server failed to start:', err.message);
    }
    console.log('Node server listening on port ' + config.port);
});
