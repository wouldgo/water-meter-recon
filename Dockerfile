FROM node:14.17.3-alpine3.12 AS builder
RUN npm install -g npm@latest-6
RUN apk add --no-cache \
  linux-headers \
  git \
  python3 \
  make \
  cmake \
  g++
WORKDIR /home/logic
COPY model model
COPY src src
COPY _conf.js package-lock.json package.json predict.js ./
RUN npm ci

FROM node:14.17.3-alpine3.12 AS runner
WORKDIR /home
COPY --from=builder /home/logic .
CMD [ "node", "predict.js" ]
