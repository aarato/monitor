#!/bin/bash
set -e

# Real-time Monitoring System - Ubuntu Installation Script
# This script installs Docker, Docker Compose, and sets up the monitoring system

echo "🚀 Real-time Monitoring System Installation"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   echo "Please run without sudo. The script will ask for sudo when needed."
   exit 1
fi

# Check if Ubuntu
if ! grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: This script is designed for Ubuntu. It may work on other Debian-based systems.${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${BLUE}📋 System Information:${NC}"
lsb_release -a 2>/dev/null || echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '\"')"
echo ""

# Update system packages
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install required packages
echo -e "${BLUE}📦 Installing required packages...${NC}"
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    jq

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker is already installed:${NC}"
    docker --version
else
    echo -e "${BLUE}🐳 Installing Docker...${NC}"
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
fi

# Check if user is in docker group
if ! groups $USER | grep -q docker; then
    echo -e "${YELLOW}⚠️  Adding user to docker group...${NC}"
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}⚠️  You'll need to log out and log back in (or run 'newgrp docker') for group changes to take effect${NC}"
fi

# Test Docker installation
echo -e "${BLUE}🧪 Testing Docker installation...${NC}"
if sudo docker run --rm hello-world > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is working correctly${NC}"
else
    echo -e "${RED}❌ Docker installation failed${NC}"
    exit 1
fi

# Check Docker Compose
if docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose is available:${NC}"
    docker compose version
else
    echo -e "${RED}❌ Docker Compose is not available${NC}"
    exit 1
fi

# Clone or update repository (if not already present)
REPO_DIR="$(pwd)"
if [[ ! -f "docker-compose.yml" ]]; then
    echo -e "${RED}❌ docker-compose.yml not found in current directory${NC}"
    echo "Please run this script from the monitoring system directory"
    exit 1
fi

# Create .env file if it doesn't exist
if [[ ! -f ".env" ]]; then
    echo -e "${BLUE}📝 Creating .env configuration file...${NC}"
    cat > .env << EOF
# MaxMind GeoLite2 Configuration
# Get a free account at: https://www.maxmind.com/en/geolite2/signup
MAXMIND_ACCOUNT_ID=your_account_id_here
MAXMIND_LICENSE_KEY=your_license_key_here

# Backend Configuration
PASSWORD=Test123
PORT=5000

# Frontend Configuration  
NODE_ENV=production
EOF
    echo -e "${YELLOW}⚠️  Created .env file with default values${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your MaxMind credentials before running the system${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Create systemd service for auto-start (optional)
read -p "Do you want to create a systemd service for auto-start on boot? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}📝 Creating systemd service...${NC}"
    
    sudo tee /etc/systemd/system/monitor-system.service > /dev/null << EOF
[Unit]
Description=Real-time Monitoring System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$REPO_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable monitor-system.service
    echo -e "${GREEN}✅ Systemd service created and enabled${NC}"
    echo -e "${BLUE}💡 Service commands:${NC}"
    echo "   Start:   sudo systemctl start monitor-system"
    echo "   Stop:    sudo systemctl stop monitor-system" 
    echo "   Status:  sudo systemctl status monitor-system"
fi

# Setup UFW firewall rules (if UFW is installed)
if command -v ufw &> /dev/null && sudo ufw status | grep -q "Status: active"; then
    echo -e "${BLUE}🔥 Configuring firewall rules...${NC}"
    sudo ufw allow 80/tcp comment "Monitoring System HTTP"
    sudo ufw allow 443/tcp comment "Monitoring System HTTPS"
    echo -e "${GREEN}✅ Firewall rules added${NC}"
fi

# Test the installation
echo -e "${BLUE}🧪 Testing Docker Compose setup...${NC}"
if docker compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker Compose configuration is valid${NC}"
else
    echo -e "${RED}❌ Docker Compose configuration has errors${NC}"
    docker compose config
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Installation completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo -e "${YELLOW}1. Configure MaxMind credentials:${NC}"
echo "   Edit .env file and add your MaxMind account ID and license key"
echo "   Get free account at: https://www.maxmind.com/en/geolite2/signup"
echo ""
echo -e "${YELLOW}2. Start the monitoring system:${NC}"
echo "   docker compose up -d"
echo ""
echo -e "${YELLOW}3. Access the web dashboard:${NC}"
echo "   http://localhost (or http://your-server-ip)"
echo ""
echo -e "${YELLOW}4. Install client dependencies:${NC}"
echo "   For Node.js: cd source/clients && npm install"
echo "   For Python:  cd source/clients && pip3 install -r requirements.txt"
echo ""
echo -e "${YELLOW}5. Send test data:${NC}"
echo "   echo 'Hello World' | URL=http://localhost PASSWORD=Test123 CLIENTNAME=Test node source/clients/monitor_client.js"
echo ""
echo -e "${BLUE}💡 Useful Commands:${NC}"
echo "   View logs:     docker compose logs -f"
echo "   Stop system:   docker compose down"
echo "   Update images: docker compose pull && docker compose up -d"
echo ""

# Check if user needs to re-login for docker group
if ! docker ps &> /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Note: If you get permission errors with Docker, run 'newgrp docker' or log out and back in.${NC}"
fi

echo -e "${GREEN}✨ Happy monitoring!${NC}"