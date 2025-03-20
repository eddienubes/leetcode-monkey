FROM node:22.13.1-alpine AS base

# Misc software installation
RUN apk update && apk --no-cache add git && cat /etc/os-release

WORKDIR /app
COPY . ./

RUN npm install -g corepack@latest && corepack enable
RUN pnpm install
RUN pnpm run build

FROM node:22.13.1-alpine

# Misc software installation
RUN apk update && apk --no-cache add sudo jq git curl

WORKDIR /app

COPY --from=base --chown=node /app/node_modules ./node_modules
COPY --from=base --chown=node /app/build ./build
COPY --from=base --chown=node /app/package.json ./package.json

USER node

CMD ["node", "build/src/index.js"]






