FROM node:23

ARG AUTH_TOKEN
ARG TSC_CONFIG_FILE

RUN npm config rm _authToken
RUN npm config set //registry.npmjs.org/:_authToken=${AUTH_TOKEN}

COPY package.json ./
COPY package-lock.json ./

RUN npm ci --only=production && npm cache clean --force

COPY --chown=node:node . .

RUN node_modules/typescript/bin/tsc --project ${TSC_CONFIG_FILE}
RUN npm publish --access=public
