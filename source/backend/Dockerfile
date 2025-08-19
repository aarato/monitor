FROM node:22-alpine
RUN apk --no-cache add git
WORKDIR /app
COPY ./log.js  ./
COPY ./geolookup.js   ./
COPY ./index.js   ./
COPY ./package.json ./
RUN npm install --only=production
EXPOSE 80
CMD ["sh", "-c", "node index.js"]

# docker  build --load -t aarato/monitor_backend:latest .
# docker  push aarato/monitor_backend:latest 
