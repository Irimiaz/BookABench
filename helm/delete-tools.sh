#!/usr/bin/env bash
set -euo pipefail

./monitoring.sh uninstall
./portainer.sh uninstall

# Delete metrics-server
kubectl delete -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml >/dev/null 2>&1 || true

echo ""
echo "Done. All tools uninstalled."

