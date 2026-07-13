FROM node:24-bookworm-slim

WORKDIR /app

RUN npm install -g corepack@latest && corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN MARIADB_HOST=build MARIADB_USER=build MARIADB_PASSWORD=build MARIADB_DATABASE=build \
    MONGO_HOST=build MONGO_USER=build MONGO_PASSWORD=build MONGO_DATABASE=build \
    AUTH_SECRET=build pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
