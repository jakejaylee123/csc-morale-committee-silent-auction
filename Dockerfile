FROM oven/bun:latest

COPY app ./app
COPY prisma ./prisma
COPY public ./public

COPY package.json .
COPY vite.config.ts .
COPY tsconfig.json .

RUN bun install
RUN bun run build

# Expose these ports for MySQL, Redis, and 
# incoming web requests
EXPOSE 80/tcp
EXPOSE 443/tcp
EXPOSE 8080/tcp
EXPOSE 3306/tcp
EXPOSE 6380/tcp

CMD [ "bun", "run", "start" ]