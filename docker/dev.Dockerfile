FROM node:23

ARG TSC_CONFIG_FILE=./tsconfig.json

COPY package.json ./
COPY package-lock.json ./

RUN npm ci

COPY --chown=node:node . .

RUN node_modules/typescript/bin/tsc --project ${TSC_CONFIG_FILE}
