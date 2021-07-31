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
COPY . .
RUN find . -maxdepth 1 ! \
  \( \
    -name "model" -o \
    -name "src" -o \
    -name "_conf.js" -o \
    -name "predict.js" -o \
    -name "prepare-images.js" -o \
    -name "package.json" -o \
    -name "package-lock.json" \
  \) \
  -exec rm -Rf {} + || true
RUN npm ci

FROM node:14.17.3-alpine3.12 AS runner
WORKDIR /home
COPY --from=builder /home/logic .
ENTRYPOINT [ "node" ]
