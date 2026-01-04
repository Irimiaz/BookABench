#!/usr/bin/env bash
set -euo pipefail

./metrics-server.sh install
./monitoring.sh install
./portainer.sh install

echo ""
echo "Done. All tools installed."
echo ""
echo "=== Access Commands ==="
echo ""
echo "Metrics Server:"
echo "  kubectl top nodes"
echo "  kubectl top pods -n bookabench"
echo ""
echo "Grafana (port-forward):"
echo "  kubectl -n monitoring port-forward svc/kps-grafana 3000:80"
echo "  Open: http://localhost:3000"
echo "  Username: admin"
echo "  Password:"
echo "    kubectl -n monitoring get secret kps-grafana -o jsonpath='{.data.admin-password}' | base64 -d; echo"
echo ""
echo "Portainer (port-forward):"
echo "  kubectl -n portainer port-forward svc/portainer 9443:9443"
echo "  Open: http://localhost:9443"
echo ""
echo "Mongo Express:"
echo "  Open: http://localhost:32018"
echo "  Username: admin"
echo "  Password: admin"

