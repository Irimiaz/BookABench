# BookABench — Kubernetes (kind + NodePorts + MongoDB PVC)

This folder contains the Kubernetes manifests and the commands to run **BookABench backend** locally in Kubernetes using **kind**.

- External access via **NodePort** (no `kubectl port-forward` for HTTP services)
- MongoDB runs **inside Kubernetes** using a **PersistentVolumeClaim** (data survives pod restart)
- Optional: expose MongoDB to Compass via NodePort (if enabled in your YAML)

---

## Prerequisites

- **Docker Desktop** installed and running (Windows)
- **kubectl** installed:
  ```bash
  kubectl version --client
  ```
- **kind** installed:
  ```bash
  kind --version
  ```
- **Git Bash** or **PowerShell**

---

## Files in this folder

- `00-config.yaml` (ConfigMaps: auth-config, database-config, business-config)
- `05-mongodb.yaml` (MongoDB StatefulSet + PVC + Service)
- `10-database-service.yaml`
- `20-auth-service.yaml`
- `30-business-service.yaml`

**Important:** Apply configs (ConfigMaps/Secrets) before Deployments to avoid `CreateContainerConfigError`.

---

## 1) Create kind cluster (NodePorts mapped to localhost)

NodePorts on kind (Windows) need port mappings. Create `kind-nodeports.yaml` in this folder:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 32000
        hostPort: 32000
        protocol: TCP
      - containerPort: 32001
        hostPort: 32001
        protocol: TCP
      - containerPort: 32002
        hostPort: 32002
        protocol: TCP
      # OPTIONAL: MongoDB NodePort (if mongodb Service uses nodePort 32017)
      - containerPort: 32017
        hostPort: 32017
        protocol: TCP
```

Create the cluster (run from k8s folder):

```bash
kind delete cluster --name bookabench
kind create cluster --name bookabench --config kind-nodeports.yaml
kubectl create namespace bookabench
```

---

## 2) Load app images into kind

Build images (run from k8s folder):

```bash
docker build -t bookabench-auth:dev ../Backend/auth-service
docker build -t bookabench-business:dev ../Backend/business-service
docker build -t bookabench-database:dev ../Backend/database-service
```

Then load them into kind:

```bash
kind load docker-image bookabench-auth:dev --name bookabench
kind load docker-image bookabench-business:dev --name bookabench
kind load docker-image bookabench-database:dev --name bookabench
```

---

## 3) Apply configs

Apply ConfigMaps:

```bash
kubectl apply -f 00-config.yaml
```

Create Secret for database-service (do NOT commit passwords in YAML):

```bash
kubectl -n bookabench create secret generic bookabench-secrets \
  --from-literal=MONGODB_URI="mongodb://root:rootpass123@mongodb:27017/?authSource=admin" \
  --dry-run=client -o yaml | kubectl apply -f -
```

Check they exist:

```bash
kubectl -n bookabench get configmap
kubectl -n bookabench get secret bookabench-secrets
```

---

## 4) Deploy MongoDB with PVC (data persistence)

```bash
kubectl apply -f 05-mongodb.yaml
kubectl -n bookabench get pods
kubectl -n bookabench get pvc
```

You should see:

- `mongodb-0` = Running
- PVC (e.g. `data-mongodb-0`) = Bound

---

## 5) Deploy backend microservices (NodePorts)

```bash
kubectl apply -f 10-database-service.yaml
kubectl apply -f 20-auth-service.yaml
kubectl apply -f 30-business-service.yaml
```

---

## 6) Verify everything is running

```bash
kubectl -n bookabench get pods
kubectl -n bookabench get svc
kubectl -n bookabench get endpoints
```

Logs (useful for debugging):

```bash
kubectl -n bookabench logs deploy/database-service
kubectl -n bookabench logs deploy/auth-service
kubectl -n bookabench logs deploy/business-service
```

---

## 7) Access from host (no port-forward)

HTTP services:

- **Auth:** http://localhost:32000
- **Database-service:** http://localhost:32001
- **Business (main backend):** http://localhost:32002

Test:

```bash
curl -i http://localhost:32002
```

Frontend env:

```
BACKEND_URL=http://localhost:32002
```

---

## 8) MongoDB Compass

### A) Recommended (internal DB): port-forward only when needed

```bash
kubectl -n bookabench port-forward svc/mongodb 27017:27017
```

Compass connection string:

```
mongodb://root:rootpass123@localhost:27017/?authSource=admin
```

### B) Optional (external DB): MongoDB via NodePort

Only if `05-mongodb.yaml` Service is `type: NodePort` with `nodePort: 32017` (and `kind-nodeports.yaml` includes mapping for 32017).

Compass connection string:

```
mongodb://root:rootpass123@localhost:32017/?authSource=admin
```

---

## 9) Prove PVC works (restart MongoDB pod, data stays)

Restart MongoDB pod:

```bash
kubectl -n bookabench delete pod mongodb-0
kubectl -n bookabench get pods -w
```

Check in Compass that your document still exists.

---

## 10) Restart services after config changes

```bash
kubectl -n bookabench rollout restart deploy/database-service
kubectl -n bookabench rollout restart deploy/auth-service
kubectl -n bookabench rollout restart deploy/business-service
```

---

## 11) Cleanup

Delete everything:

```bash
kubectl delete namespace bookabench
kind delete cluster --name bookabench
```
