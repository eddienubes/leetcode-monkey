# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:22.11.0-alpine AS base

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

#ARG ENV_FILE_BE_NAME
# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies based on the preferred package manager
#COPY packages/cms/docker/.aws/credentials /root/.aws/credentials
#COPY packages/cms/docker/$ENV_FILE_BE_NAME packages/cms/.env
RUN npm install -g corepack && corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build
#RUN #pnpm config set --location project inject-workspace-packages true

# Production image, copy all the files and run next
FROM node:22.11.0-alpine
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
#COPY --from=base --chown=node /root/.aws/credentials /root/.aws/credentials
#COPY --from=base --chown=node /app/projects/ui/.env .env
COPY --from=base --chown=ndoe /app/projects/ui/public ./standalone/public
COPY --from=base --chown=nextjs:nodejs /app/projects/ui/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/projects/ui/.next/static ./.next/static
# Resulting image:
# ./
# /...standalone stuff
# /public
# /.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "projects/ui/server.js"]
