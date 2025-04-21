FROM node:22.13.1-alpine AS base

# Misc software installation
RUN apk update && apk --no-cache add git && cat /etc/os-release

WORKDIR /app

RUN npm install -g corepack@latest && corepack enable

COPY . ./

RUN pnpm install --frozen-lockfile
RUN pnpm build
RUN pnpm --filter=@repo/bot --prod --legacy deploy deploy

FROM node:22.13.1-alpine

# Misc software installation
RUN apk update && apk --no-cache add sudo jq git curl

WORKDIR /app

COPY --from=base --chown=node /app/deploy .

USER node

CMD ["node", "dist/index.js"]






