#!/bin/bash

REPO="https://raw.githubusercontent.com/aarato/monitor/main/"

# Exit immediately if a command exits with a non-zero status
set -e

# 1. Update system packages
echo "Updating system packages..."
sudo apt-get update -y

# 2. Install Docker
echo "Installing Docker..."
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker’s official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the stable repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# 3. Install Docker Compose if not included
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 4. Download Docker Compose file
COMPOSE_FILE_URL="https://raw.githubusercontent.com/your-repo/docker-compose.yml"
COMPOSE_FILE_PATH="/path/to/docker-compose.yml"

echo "Downloading Docker Compose file..."
sudo curl -L $COMPOSE_FILE_URL -o $COMPOSE_FILE_PATH

# 5. Run Docker Compose
echo "Running Docker Compose..."
sudo docker-compose -f $COMPOSE_FILE_PATH up -d

echo "Docker Compose services are up and running."
