FROM gcr.io/google-appengine/nodejs

ARG message='Hello from Container Builder!'
ARG buildId=
ARG repoName=
ARG commit=

ENV MESSAGE=${message} \
    BUILD_ID=${buildId} \
    REPO_NAME=${repoName} \
    COMMIT=${commit}

ADD . /app

WORKDIR /app

RUN npm install

CMD npm start
