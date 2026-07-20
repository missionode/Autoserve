#!/usr/bin/env sh
set -eu
environment_name="$1"
artifact_digest="$2"
echo "Deployment adapter requires the environment-owned AWS role: ${environment_name} ${artifact_digest}"
