#!/bin/bash

meta_url='http://metadata.google.internal/computeMetadata/v1/instance/'
meta_header='Metadata-Flavor: Google'

instance_name=$(curl -H "$meta_header" "$meta_url/name")
instance_zone=$(curl -H "$meta_header" "$meta_url/zone" | awk -F/ '{print $NF}')

mkdir $HOME/simple-server
cd $HOME/simple-server

cat >index.html <<EOL
<!DOCTYPE html>
<html>
<head>
    <title></title>
</head>
<body>
    <h3>Hello from Google Compute Engine!</h3>
    Instance: ${instance_name}
    <br/>
    Zone: ${instance_zone}
</body>
EOL

busybox httpd -f -p 80
