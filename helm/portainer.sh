#!/usr/bin/env bash
set -euo pipefail

NS="portainer"
REL="portainer"

ensure_repo() {
  local name="$1"
  local url="$2"
  if ! helm repo list | awk '{print $1}' | grep -qx "$name"; then
    helm repo add "$name" "$url" >/dev/null
  fi
}

install() {
  ensure_repo portainer https://portainer.github.io/k8s/
  helm repo update >/dev/null

  kubectl get ns "$NS" >/dev/null 2>&1 || kubectl create namespace "$NS" >/dev/null

  helm upgrade --install "$REL" portainer/portainer -n "$NS" >/dev/null

  echo "OK: Portainer installed in namespace: $NS (release: $REL)"
}

uninstall() {
  helm uninstall "$REL" -n "$NS" || true
  echo "OK: uninstalled release $REL from namespace $NS"
}

status() {
  kubectl -n "$NS" get pods
}

case "${1:-install}" in
  install) install ;;
  uninstall) uninstall ;;
  status) status ;;
  *) echo "Usage: $0 [install|uninstall|status]"; exit 1 ;;
esac
