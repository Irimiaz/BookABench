#!/usr/bin/env bash
set -euo pipefail

install() {
  kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml >/dev/null

  # Kind often needs insecure TLS to kubelet
  kubectl -n kube-system patch deployment metrics-server --type='json' -p='[
    {"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"},
    {"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname"}
  ]' >/dev/null 2>&1 || true

  echo "OK: metrics-server installed"
}

case "${1:-install}" in
  install) install ;;
  *) echo "Usage: $0 [install]"; exit 1 ;;
esac
