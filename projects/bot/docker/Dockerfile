FROM node:22.13.1-alpine AS base

# Misc software installation
RUN apk update && apk --no-cache add git && cat /etc/os-release

WORKDIR /app
COPY . ./

RUN npm install -g corepack@latest && corepack enable
RUN pnpm install
RUN pnpm run build
RUN pnpm config set --location project inject-workspace-packages true
RUN pnpm --filter=@repo/bot --prod deploy deploy

FROM node:22.13.1-alpine

# Misc software installation
RUN apk update && apk --no-cache add sudo jq git curl

WORKDIR /app

COPY --from=base --chown=node /app/deploy .

USER node

CMD ["node", "dist/index.js"]






