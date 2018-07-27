#!/bin/bash

# This script creates a simple index.html file based on the below text snippet,
# and serves it on port 80 via busybox
mkdir $HOME/simple-server
cd $HOME/simple-server

cat >index.html <<EOL
<!DOCTYPE html>
<html>
<head>
    <title>Hello MIG</title>
</head>
<body>
    <h1>Managed Instance Group</h1>
    <h3>Template v1.0</h3>
</body>
EOL

busybox httpd -f -p 80
