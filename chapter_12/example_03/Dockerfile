FROM gcr.io/google-appengine/nodejs

ARG message='Hello from Container Builder!'
ENV MESSAGE=${message}

ADD . /app

WORKDIR /app

RUN npm install

CMD npm start

