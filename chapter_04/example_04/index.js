var express = require('express');
var app = express();

app.set('port', process.env.PORT || 8080);

app.get('/colors', (req, res) => {
    res.send({ 
        color: 'green', 
        provider: 'Dockerized Node.JS on App Engine flexible environment' 
    });
});

app.get('/', (req, res) => {
    res.send({status: 'up'});
});

app.listen(app.settings.port, (err) => {
    if (err) {
        console.error('Application failed to start:', err);
        return;
    }
    console.log('Application listening on port ' + app.settings.port);
});
