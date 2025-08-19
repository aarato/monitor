# build stage
FROM node:22-alpine AS build-stage
WORKDIR /app
# RUN apk add --no-cache python2 make g++
# RUN apk add --no-cache python3 py3-pip make g++
COPY ./index.html ./index.html
COPY ./vite.config.js ./vite.config.js
COPY ./public ./public
COPY ./src ./src
COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json

RUN npm install
RUN npm run build

# production stage
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# docker build --load -t aarato/monitor_frontend:latest .
# docker push aarato/monitor_frontend:latest