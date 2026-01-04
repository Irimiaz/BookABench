# BookABench — Helm Chart

Helm chart to deploy **BookABench backend** locally in Kubernetes using **kind**.

- External access via **NodePort** (no port-forward needed)
- MongoDB with **PersistentVolumeClaim** (data persists)

---

## Prerequisites

Docker Desktop, kubectl, kind, Helm v3.x

---

## Quick Start

### 1) Create kind cluster

Create `kind-nodeports.yaml` in repo root, then:

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

---

## Connectivity

### Backend Services (NodePort)

- **Auth:** http://localhost:32000
- **Database:** http://localhost:32001
- **Business:** http://localhost:32002

**Frontend:** `BACKEND_URL=http://localhost:32002`

### MongoDB Compass (Desktop App)

Connection: `mongodb://root:rootpass123@localhost:32017/?authSource=admin`

### Mongo Express (Web UI)

- **URL:** http://localhost:32018
- **Username:** admin
- **Password:** admin

### Portainer, Grafana & Metrics Server

Install all tools:
```bash
./helm/setup-tools.sh
```

### Portainer (Kubernetes UI)

```bash
kubectl -n portainer port-forward svc/portainer 9443:9443
```

Open: https://localhost:9443

### Grafana (Monitoring)

```bash
kubectl -n monitoring port-forward svc/kps-grafana 3000:80
```

Open: http://localhost:3000  
Username: admin  
Password: `kubectl -n monitoring get secret kps-grafana -o jsonpath='{.data.admin-password}' | base64 -d; echo`

### Metrics Server

```bash
kubectl top nodes
kubectl top pods -n bookabench
```

---

## Management

**Upgrade:**
```bash
helm upgrade bookabench ./helm/bookabench -n bookabench
```

**Uninstall:**
```bash
helm uninstall bookabench -n bookabench
kubectl delete namespace bookabench
```

**Cleanup:**
```bash
helm uninstall bookabench -n bookabench
kubectl delete namespace bookabench
kind delete cluster --name bookabench
```

**Note:** MongoDB PVC persists. Delete manually: `kubectl -n bookabench delete pvc data-mongodb-0`

---

## Troubleshooting

```bash
# Check status
kubectl -n bookabench get pods,svc

# View logs
kubectl -n bookabench logs deploy/<service-name>

# Describe pod
kubectl -n bookabench describe pod <pod-name>
```

---

## Configuration

Edit `helm/bookabench/values.yaml` to customize image tags, replicas, ports, MongoDB storage, and environment variables.
