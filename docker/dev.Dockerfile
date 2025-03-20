FROM node:23

ARG TSC_CONFIG_FILE=./tsconfig.json

COPY package.json /build/
COPY package-lock.json /build/

WORKDIR /build/

COPY --chown=node:node . /build/

RUN node_modules/typescript/bin/tsc --project ${TSC_CONFIG_FILE}
