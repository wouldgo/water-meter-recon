FROM node:14.17.3-buster-slim AS builder
RUN npm install -g npm@latest-6
RUN apt-get update && \
    apt-get install -y build-essential \
    wget \
    git \
    python3 \
    make \
    gcc \
    libc6-dev \
    cmake
WORKDIR /home/logic
COPY model model
COPY src src
COPY _conf.js package-lock.json package.json predict.js ./

RUN npm ci

CMD [ "node", "predict.js" ]
