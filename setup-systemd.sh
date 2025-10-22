#!/bin/bash

# RPO GenData Systemd Service Setup Script
# This script creates a systemd service for the RPO GenData application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    echo
}

print_info() {
    echo -e "${GREEN}→${NC} $1"
}

# Configuration
SERVICE_NAME="rpo-gen"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
SERVICE_DESCRIPTION="RPO GenData Service"
PROJECT_ROOT="/home/ubuntu/RPO_GenData"
USER="ubuntu"

echo -e "${GREEN}=== RPO GenData Systemd Service Setup ===${NC}"
echo

# Create systemd service file
print_info "Creating systemd service file..."

sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=$SERVICE_DESCRIPTION
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_ROOT
Environment=PATH=/home/ubuntu/RPO_GenData/backend/venv/bin
ExecStart=/home/ubuntu/RPO_GenData/backend/venv/bin/python start_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

print_status "Systemd service file created: $SERVICE_FILE"

# Set proper permissions
sudo chmod 644 "$SERVICE_FILE"
print_status "Permissions set on: $SERVICE_FILE"

# Reload systemd daemon
sudo systemctl daemon-reload
print_status "Systemd daemon reloaded"

# Enable and start the service
sudo systemctl enable "$SERVICE_NAME"
print_status "Service enabled: $SERVICE_NAME"

sudo systemctl start "$SERVICE_NAME"
print_status "Starting service..."

# Show service status
sleep 3
sudo systemctl status "$SERVICE_NAME"

# Display instructions
echo
echo -e "${GREEN}=== Service Setup Complete ===${NC}"
echo
echo -e "${YELLOW}Service Commands:${NC}"
echo "  sudo systemctl status $SERVICE_NAME   # Check status"
echo "  sudo systemctl stop $SERVICE_NAME    # Stop service"
echo "  sudo systemctl restart $SERVICE_NAME  # Restart service"
echo "  sudo systemctl enable $SERVICE_NAME  # Enable on boot"
echo "  sudo systemctl disable $SERVICE_NAME  # Disable on boot"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "  sudo journalctl -u $SERVICE_NAME -f       # View logs"
echo "  sudo journalctl -u $SERVICE_NAME -f -n 100 # Last 100 lines"
echo ""
echo -e "${GREEN}The service will auto-start on system boot!${NC}"