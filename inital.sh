#!/bin/bash

# --- Configuration ---
FILE="text.txt"
OLD_LINE_START="someString="
NEW_VALUE="11111"

# Define ports if known. Adjust these to your actual dev server ports.
# Based on your ps aux, you likely have a backend and a frontend dev server.
DEV_SERVER_BACKEND_PORT="4000" # Example: common for backend APIs. Adjust this!
DEV_SERVER_FRONTEND_PORT="3000" # Example: common for UI (Next.js). Adjust this!

SLEEP_BEFORE_KILL=5   # Seconds to let pnpm dev run
SLEEP_AFTER_KILL=2    # Seconds to wait for termination before migration (increased slightly)


# --- Function to gracefully terminate the dev server processes ---
terminate_dev_server() {
    echo "" # New line for cleaner output after Ctrl+C
    echo "Attempting to terminate pnpm dev server processes..."

    # Method 1: Kill by specific command line patterns (most effective for your setup)
    # This targets the 'concurrently' process and its children's main node processes.
    echo "Killing processes matching 'pnpm dev' and related node processes..."
    # Kill the main 'pnpm dev' wrapper (if it's still running, sometimes it exits fast)
    pkill -f "pnpm dev$"
    # Kill the 'concurrently' process if it's still alive
    pkill -f "concurrently"
    # Kill the backend ts-node-dev server
    pkill -f "ts-node-dev.*src/index.ts"
    # Kill the Next.js UI dev server
    pkill -f "next dev --turbopack"
    # Kill any direct 'pnpm dev:server' or 'pnpm dev:ui' if they are running node
    pkill -f "pnpm dev:server"
    pkill -f "pnpm dev:ui"


    # Method 2: Kill processes listening on the dev server ports
    # This is highly reliable if you know the ports.
    echo "Checking for processes on port $DEV_SERVER_BACKEND_PORT and $DEV_SERVER_FRONTEND_PORT..."
    lsof -ti tcp:"$DEV_SERVER_BACKEND_PORT" | xargs -r kill -9 # Force kill backend port
    lsof -ti tcp:"$DEV_SERVER_FRONTEND_PORT" | xargs -r kill -9 # Force kill frontend port

    # Add a short sleep to allow processes to register as dead
    sleep 1

    echo "Dev server termination attempt finished."
}

# Ensure the termination function runs on script exit or Ctrl+C
# Using `trap -l` will show available signals. EXIT handles normal exit, INT handles Ctrl+C.
trap terminate_dev_server EXIT INT

# --- Setup steps ---
echo "Running pnpm install..."
pnpm i

echo "Copying .env file..."
cp .env.example .env

# --- Run dev server in background ---
echo "Starting pnpm dev in background..."
# Redirect output to a log file to capture anything for debugging
pnpm dev > pnpm_dev_output.log 2>&1 &
# We don't rely on DEV_PID alone anymore, as it's just the wrapper.

echo "pnpm dev started. Output redirected to pnpm_dev_output.log"
echo "Waiting $SLEEP_BEFORE_KILL seconds before attempting termination..."
sleep "$SLEEP_BEFORE_KILL"

# --- Execute the termination ---
terminate_dev_server

echo "Waiting $SLEEP_AFTER_KILL seconds to ensure all server processes are down..."
sleep "$SLEEP_AFTER_KILL"

# Optional: Verify processes are gone (for debugging)
echo "Verifying dev processes are terminated..."
ps aux | grep -E "pnpm dev|concurrently|ts-node-dev|next dev" | grep -v grep

# --- Run migration ---
echo "Running pnpm handly migration:run..."
pnpm handly migration:run

echo "Script completed successfully."

exit 0 # Explicitly exit success
