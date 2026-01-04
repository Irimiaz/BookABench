# BookABench — Helm Chart for Kubernetes (kind + NodePorts + MongoDB PVC)

Helm chart to deploy **BookABench backend** locally in Kubernetes using **kind**.

- External access via **NodePort** (no port-forward needed)
- MongoDB with **PersistentVolumeClaim** (data persists)

---

## Prerequisites

- Docker Desktop (Windows)
- kubectl, kind, Helm v3.x
- Git Bash or PowerShell

---

## Quick Start

### 1) Create kind cluster

Create `kind-nodeports.yaml` in repo root.

```bash
kind delete cluster --name bookabench
kind create cluster --name bookabench --config kind-nodeports.yaml
```

### 2) Build and load images

```bash
docker build -t bookabench-auth:dev ./Backend/auth-service
docker build -t bookabench-business:dev ./Backend/business-service
docker build -t bookabench-database:dev ./Backend/database-service

kind load docker-image bookabench-auth:dev --name bookabench
kind load docker-image bookabench-business:dev --name bookabench
kind load docker-image bookabench-database:dev --name bookabench
```

### 3) Install Helm chart

```bash
helm upgrade --install bookabench ./helm/bookabench -n bookabench --create-namespace
```

### 4) Check status

```bash
kubectl -n bookabench get pods,svc
helm status bookabench -n bookabench
```

---

## Access Services

- **Auth:** http://localhost:32000
- **Database:** http://localhost:32001
- **Business:** http://localhost:32002

**Frontend:** `BACKEND_URL=http://localhost:32002`

---

## MongoDB Compass

```bash
kubectl -n bookabench port-forward svc/mongodb 27017:27017
```

Connection: `mongodb://root:rootpass123@localhost:27017/?authSource=admin`

---

## Portainer (Kubernetes UI)

```bash
helm repo add portainer https://portainer.github.io/k8s/
helm repo update
kubectl create namespace portainer
helm upgrade --install portainer portainer/portainer -n portainer
kubectl -n portainer port-forward svc/portainer 9443:9443
```

Open: https://localhost:9443

---

## Upgrade

```bash
helm upgrade bookabench ./helm/bookabench -n bookabench
```

With custom values:

```bash
helm upgrade bookabench ./helm/bookabench -n bookabench --set authService.tag=latest
```

---

## Uninstall

```bash
helm uninstall bookabench -n bookabench
kubectl delete namespace bookabench
```

**Note:** MongoDB PVC persists. Delete manually: `kubectl -n bookabench delete pvc data-mongodb-0`

---

## Cleanup

```bash
helm uninstall bookabench -n bookabench
kubectl delete namespace bookabench
kind delete cluster --name bookabench
```

---

## Configuration

Edit `helm/bookabench/values.yaml` to customize:
- Image tags, replicas, ports
- MongoDB storage size
- Environment variables

Then upgrade: `helm upgrade bookabench ./helm/bookabench -n bookabench`

---

## Troubleshooting

**Pods not starting:**
```bash
kubectl -n bookabench describe pod <pod-name>
kubectl -n bookabench logs deploy/<service-name>
```

**Services not accessible:**
```bash
kubectl -n bookabench get svc,endpoints
docker ps | grep kind
```

**Helm template errors:**
```bash
helm template ./helm/bookabench
helm install bookabench ./helm/bookabench -n bookabench --create-namespace --dry-run --debug
```
