#!/bin/bash

# Deployment status tracker
# Maintains a JSON status file for monitoring deployment progress

STATUS_DIR="/var/www/procedure/deploy/status"
STATUS_FILE="$STATUS_DIR/status.json"
LOG_FILE="$STATUS_DIR/deploy.log"
MAX_LOG_LINES=50

# Ensure status directory exists
mkdir -p "$STATUS_DIR"

# Initialize empty status
init_status() {
    cat > "$STATUS_FILE" << 'EOF'
{
  "status": "idle",
  "started_at": null,
  "finished_at": null,
  "current_step": 0,
  "steps": [
    {"name": "Pull code", "status": "pending"},
    {"name": "Build images", "status": "pending"},
    {"name": "Stop containers", "status": "pending"},
    {"name": "Cleanup", "status": "pending"},
    {"name": "Run migrations", "status": "pending"},
    {"name": "Start services", "status": "pending"}
  ],
  "containers": [],
  "log": []
}
EOF
    echo "Status initialized"
}

# Start deployment
start_deploy() {
    local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Reset steps
    cat > "$STATUS_FILE" << EOF
{
  "status": "running",
  "started_at": "$now",
  "finished_at": null,
  "current_step": 0,
  "steps": [
    {"name": "Pull code", "status": "pending"},
    {"name": "Build images", "status": "pending"},
    {"name": "Stop containers", "status": "pending"},
    {"name": "Cleanup", "status": "pending"},
    {"name": "Run migrations", "status": "pending"},
    {"name": "Start services", "status": "pending"}
  ],
  "containers": [],
  "log": []
}
EOF

    # Clear log file
    > "$LOG_FILE"
    add_log "Deployment started"
}

# Update step status
update_step() {
    local step_num=$1
    local step_status=$2

    if [ ! -f "$STATUS_FILE" ]; then
        init_status
    fi

    # Use Python for reliable JSON manipulation
    python3 << EOF
import json

with open("$STATUS_FILE", "r") as f:
    data = json.load(f)

step_idx = $step_num - 1
if 0 <= step_idx < len(data["steps"]):
    data["steps"][step_idx]["status"] = "$step_status"
    data["current_step"] = $step_num

with open("$STATUS_FILE", "w") as f:
    json.dump(data, f, indent=2)
EOF

    add_log "Step $step_num: ${step_status}"
}

# Add log message
add_log() {
    local message="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Add to log file
    echo "[$timestamp] $message" >> "$LOG_FILE"

    # Keep only last N lines
    tail -n $MAX_LOG_LINES "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"

    # Update status file log
    if [ -f "$STATUS_FILE" ]; then
        python3 << EOF
import json

with open("$STATUS_FILE", "r") as f:
    data = json.load(f)

data["log"].append({"time": "$timestamp", "message": "$message"})
data["log"] = data["log"][-$MAX_LOG_LINES:]

with open("$STATUS_FILE", "w") as f:
    json.dump(data, f, indent=2)
EOF
    fi
}

# Update container status
update_containers() {
    if [ ! -f "$STATUS_FILE" ]; then
        init_status
    fi

    # Get container status
    local containers=$(docker ps --format '{"name":"{{.Names}}","status":"{{.Status}}","image":"{{.Image}}"}' | paste -sd ',' -)

    python3 << EOF
import json

with open("$STATUS_FILE", "r") as f:
    data = json.load(f)

containers_json = "[$containers]"
data["containers"] = json.loads(containers_json)

with open("$STATUS_FILE", "w") as f:
    json.dump(data, f, indent=2)
EOF
}

# Finish deployment
finish_deploy() {
    local final_status=$1
    local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    python3 << EOF
import json

with open("$STATUS_FILE", "r") as f:
    data = json.load(f)

data["status"] = "$final_status"
data["finished_at"] = "$now"

with open("$STATUS_FILE", "w") as f:
    json.dump(data, f, indent=2)
EOF

    add_log "Deployment finished: $final_status"
    update_containers
}

# Show help
show_help() {
    echo "Deployment Status Tracker"
    echo ""
    echo "Usage: ./status-update.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  init              - Initialize empty status"
    echo "  start             - Start new deployment"
    echo "  step <n> <status> - Update step (1-6), status: pending|running|done|failed"
    echo "  log <message>     - Add log line"
    echo "  containers        - Update container status"
    echo "  finish <status>   - Finish deploy (success|failed)"
    echo ""
    echo "Example:"
    echo "  ./status-update.sh start"
    echo "  ./status-update.sh step 1 running"
    echo "  ./status-update.sh log 'Pulling from git...'"
    echo "  ./status-update.sh step 1 done"
    echo "  ./status-update.sh finish success"
}

# Main
case "$1" in
    init)
        init_status
        ;;
    start)
        start_deploy
        ;;
    step)
        update_step "$2" "$3"
        ;;
    log)
        add_log "$2"
        ;;
    containers)
        update_containers
        ;;
    finish)
        finish_deploy "$2"
        ;;
    *)
        show_help
        ;;
esac
