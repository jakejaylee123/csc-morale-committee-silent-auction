FROM oven/bun:debian

RUN apt-get update && apt-get install -y ca-certificates

ADD ./certs/DigiCertGlobalRootCA.crt.pem /usr/local/share/ca-certificates/DigiCertGlobalRootCA.crt.pem
RUN chmod 644 /usr/local/share/ca-certificates/DigiCertGlobalRootCA.crt.pem && update-ca-certificates

ADD app ./app
ADD prisma ./prisma
ADD public ./public

ADD package.json .
ADD vite.config.ts .
ADD tsconfig.json .

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