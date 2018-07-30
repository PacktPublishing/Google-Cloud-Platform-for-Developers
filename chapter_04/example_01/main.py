""" Example Google App Engine standard environment service.

This is intended to serve as a basic example of a default 
App Engine service. The application uses the Flask framework, 
which App Engine will interact with via the WSGI standard.

This example delegates requests to '/api/colors' to an additional
App Engine service, 'colors'. A standard approach to designing App 
Engine applications is to split functionality among multiple 
microservices. In this example, requests for 'colors' are fulfilled by
the colors service (see chapter_04/example_02).
"""
import os
import json
import urllib2
from flask import Flask

app = Flask(__name__)

# For local development, route requests to a locally running service.
colors_url = 'http://localhost:8081'

""" When running on App Engine, route requests to the 'colors' service.
 By default, non-default services are available at 
 <SERVICE_NAME>-dot-<PROJECT_ID>-dot-appspot.com. Here, we generate
 that URL based on the DEFAULT_VERSION_HOSTNAME environment variable. 
"""
if os.getenv('SERVER_SOFTWARE', '').startswith('Google App Engine/'):
    print 'running in app engine, using service URL'
    base_url = os.getenv('DEFAULT_VERSION_HOSTNAME')
    colors_url = os.getenv('COLORS_URL').format(base_url)


""" Example Flask API endpoint

This endpoint receives traffic based on the /api/.* handler defined
in app.yaml. The handler definition specifies main.app, which informs
App Engine that this service should be managed via WSGI.
"""
@app.route('/api/colors')
def get_colors():
    try:
        colors = urllib2.urlopen(colors_url + '/colors')
        return colors.read()
    except:
        return 'Failed to fetch colors', 500

""" Example secured endpoint

This endpoint will return all environment variables provided by App Engine.
It is included both to demonstrate secured endpoints and to show which
environment variables developers may use when writing Python applications
in the standard environment.

To test that this endpoint is secure, try accessing it from a browser session
that has not been authenticated against your Google Cloud project. 
"""
@app.route('/admin/env')
def get_env():
    env = {}
    for k in os.environ.keys():
        # Exclude wsgi system properties
        if not k.startswith('wsgi'):
            env[k] = os.getenv(k)
    return json.dumps(env)
