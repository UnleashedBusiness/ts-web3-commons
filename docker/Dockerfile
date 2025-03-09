FROM node:23

ARG AUTH_TOKEN
ARG TSC_CONFIG_FILE

RUN npm config rm _authToken
RUN npm config set //registry.npmjs.org/:_authToken=${AUTH_TOKEN}

COPY package.json /build/
COPY package-lock.json /build/

WORKDIR /build/

RUN npm ci

COPY --chown=node:node . /build/

RUN node_modules/typescript/bin/tsc --project ${TSC_CONFIG_FILE}
RUN npm publish --access=public
