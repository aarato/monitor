FROM node:22-alpine
RUN apk --no-cache add git
WORKDIR /app
COPY ./log.js  ./
COPY ./geolookup.js   ./
COPY ./index.js   ./
COPY ./package.json ./
RUN npm install --omit=dev --ignore-scripts
ARG MAXMIND_ACCOUNT_ID
ARG MAXMIND_LICENSE_KEY
RUN if [ -z "$MAXMIND_ACCOUNT_ID" ] || [ -z "$MAXMIND_LICENSE_KEY" ]; then \
    echo "Error: MAXMIND_ACCOUNT_ID and MAXMIND_LICENSE_KEY build args are required"; \
    exit 1; \
    fi
RUN MAXMIND_ACCOUNT_ID=$MAXMIND_ACCOUNT_ID MAXMIND_LICENSE_KEY=$MAXMIND_LICENSE_KEY npm rebuild geolite2
EXPOSE 80
CMD ["sh", "-c", "node index.js"]

# MAXMIND_ACCOUNT_ID=your_id MAXMIND_LICENSE_KEY=your_key docker build --load -t aarato/monitor_backend:latest .
# docker  push aarato/monitor_backend:latest 
