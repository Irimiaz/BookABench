# BookABench — Helm Chart for Kubernetes (kind + NodePorts + MongoDB PVC)

This folder contains the **Helm chart** to deploy **BookABench backend** locally in Kubernetes using **kind**.

- **Helm** manages all Kubernetes resources (Deployments, Services, ConfigMaps, Secrets, StatefulSets)
- External access via **NodePort** (no `kubectl port-forward` for HTTP services)
- MongoDB runs **inside Kubernetes** using a **PersistentVolumeClaim** (data survives pod restart)
- Optional: expose MongoDB to Compass via NodePort

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
- **Helm** installed (v3.x):
  ```bash
  helm version
  ```
- **Git Bash** or **PowerShell**

---

## Chart Structure

```
helm/bookabench/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default configuration values
└── templates/              # Kubernetes manifest templates
    ├── secrets.yaml        # Secrets (MongoDB credentials, MONGODB_URI)
    ├── mongodb.yaml        # MongoDB StatefulSet + PVC + Service
    ├── auth-service.yaml   # Auth service Deployment + Service
    ├── database-service.yaml  # Database service Deployment + Service
    └── business-service.yaml  # Business service Deployment + Service
```

---

## 1) Create kind cluster (NodePorts mapped to localhost)

NodePorts on kind (Windows) need port mappings. Create `kind-nodeports.yaml` in the repo root:

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

Create the cluster (run from repo root):

```bash
kind delete cluster --name bookabench
kind create cluster --name bookabench --config kind-nodeports.yaml
```

---

## 2) Build and load Docker images

Build images (run from repo root):

```bash
docker build -t bookabench-auth:dev ./Backend/auth-service
docker build -t bookabench-business:dev ./Backend/business-service
docker build -t bookabench-database:dev ./Backend/database-service
```

Load them into kind:

```bash
kind load docker-image bookabench-auth:dev --name bookabench
kind load docker-image bookabench-business:dev --name bookabench
kind load docker-image bookabench-database:dev --name bookabench
```

---

## 3) Install the Helm chart

Install the chart (run from repo root):

```bash
helm upgrade --install bookabench ./helm/bookabench -n bookabench --create-namespace
```

This command will:
- Create the `bookabench` namespace if it doesn't exist
- Install all resources (Secrets, ConfigMaps, MongoDB StatefulSet, Services, Deployments)
- Use values from `helm/bookabench/values.yaml`

### Install with custom values

You can override values using `--set` or a custom values file:

```bash
# Using --set
helm upgrade --install bookabench ./helm/bookabench -n bookabench --create-namespace \
  --set authService.replicas=2 \
  --set businessService.nodePort=32003

# Using a custom values file
helm upgrade --install bookabench ./helm/bookabench -n bookabench --create-namespace \
  -f my-custom-values.yaml
```

---

## 4) Check installation status

Verify everything is running:

```bash
# Check Helm release status
helm status bookabench -n bookabench

# Check all resources
kubectl -n bookabench get all

# Check pods
kubectl -n bookabench get pods

# Check services
kubectl -n bookabench get svc

# Check PersistentVolumeClaims (MongoDB data)
kubectl -n bookabench get pvc

# Check ConfigMaps and Secrets
kubectl -n bookabench get configmap,secret
```

Expected output:
- All pods should be in `Running` state
- Services should have `EXTERNAL-IP` showing NodePorts
- MongoDB PVC should be `Bound`

---

## 5) View logs

View logs for debugging:

```bash
# View logs for all services
kubectl -n bookabench logs deploy/auth-service
kubectl -n bookabench logs deploy/database-service
kubectl -n bookabench logs deploy/business-service
kubectl -n bookabench logs statefulset/mongodb

# Follow logs (stream)
kubectl -n bookabench logs -f deploy/business-service

# View logs for a specific pod
kubectl -n bookabench logs <pod-name>
```

---

## 6) Access services (no port-forward)

HTTP services are accessible via NodePort:

- **Auth Service:** http://localhost:32000
- **Database Service:** http://localhost:32001
- **Business Service (main backend):** http://localhost:32002

Test the services:

```bash
# Test business service
curl -i http://localhost:32002

# Test auth service
curl -i http://localhost:32000

# Test database service
curl -i http://localhost:32001
```

**Frontend environment variable:**

```
BACKEND_URL=http://localhost:32002
```

---

## 7) MongoDB Compass connection

### Option A: Port-forward (recommended)

```bash
kubectl -n bookabench port-forward svc/mongodb 27017:27017
```

Compass connection string:

```
mongodb://root:rootpass123@localhost:27017/?authSource=admin
```

### Option B: NodePort (if enabled)

If `values.yaml` has `mongodb.serviceType: NodePort` and `mongodb.nodePort: 32017`, connect directly:

```
mongodb://root:rootpass123@localhost:32017/?authSource=admin
```

---

## 8) Upgrade the Helm release

After modifying `values.yaml` or templates, upgrade the release:

```bash
# Upgrade with current values.yaml
helm upgrade bookabench ./helm/bookabench -n bookabench

# Upgrade with specific values
helm upgrade bookabench ./helm/bookabench -n bookabench \
  --set authService.tag=latest

# Check upgrade history
helm history bookabench -n bookabench

# Rollback to previous version
helm rollback bookabench -n bookabench
```

After upgrading, restart services if needed:

```bash
kubectl -n bookabench rollout restart deploy/auth-service
kubectl -n bookabench rollout restart deploy/database-service
kubectl -n bookabench rollout restart deploy/business-service
```

---

## 9) Verify data persistence (MongoDB PVC)

Restart MongoDB pod to verify data persists:

```bash
# Delete MongoDB pod (StatefulSet will recreate it)
kubectl -n bookabench delete pod mongodb-0

# Watch pod recreation
kubectl -n bookabench get pods -w

# Verify PVC is still bound
kubectl -n bookabench get pvc
```

Check in MongoDB Compass that your data still exists.

---

## 10) Uninstall the Helm release

Remove all resources:

```bash
# Uninstall the Helm release
helm uninstall bookabench -n bookabench

# Verify everything is removed
kubectl -n bookabench get all

# Delete namespace (optional)
kubectl delete namespace bookabench
```

**Note:** Uninstalling the Helm release will delete all resources, but the MongoDB PVC will remain (to prevent data loss). To delete the PVC manually:

```bash
kubectl -n bookabench delete pvc data-mongodb-0
```

---

## 11) Cleanup (remove cluster)

Delete the entire kind cluster:

```bash
# Uninstall Helm release first
helm uninstall bookabench -n bookabench

# Delete namespace
kubectl delete namespace bookabench

# Delete kind cluster
kind delete cluster --name bookabench
```

---

## Configuration

Edit `helm/bookabench/values.yaml` to customize:

- **Image tags:** Change `tag: dev` to `tag: latest` or specific version
- **Replicas:** Adjust `replicas: 1` for scaling
- **Ports:** Modify `port` and `nodePort` values
- **MongoDB storage:** Change `mongodb.storage: 2Gi`
- **Environment variables:** Update `nodeEnv`, `dbName`, `adminId`, etc.

After modifying values, upgrade the release:

```bash
helm upgrade bookabench ./helm/bookabench -n bookabench
```

---

## Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl -n bookabench get pods

# Describe pod for details
kubectl -n bookabench describe pod <pod-name>

# Check events
kubectl -n bookabench get events --sort-by='.lastTimestamp'
```

### Services not accessible

```bash
# Verify NodePort services
kubectl -n bookabench get svc

# Check endpoints
kubectl -n bookabench get endpoints

# Verify kind port mappings
docker ps | grep kind
```

### MongoDB connection issues

```bash
# Check MongoDB pod logs
kubectl -n bookabench logs statefulset/mongodb

# Verify MongoDB service
kubectl -n bookabench get svc mongodb

# Test connection from a pod
kubectl -n bookabench run -it --rm debug --image=mongo:7 --restart=Never -- mongosh "mongodb://root:rootpass123@mongodb:27017/?authSource=admin"
```

### Helm template errors

```bash
# Validate templates
helm template ./helm/bookabench

# Dry-run install
helm install bookabench ./helm/bookabench -n bookabench --create-namespace --dry-run --debug
```

---

## Useful Commands Summary

```bash
# Install
helm upgrade --install bookabench ./helm/bookabench -n bookabench --create-namespace

# Status
helm status bookabench -n bookabench
kubectl -n bookabench get all

# Logs
kubectl -n bookabench logs -f deploy/business-service

# Upgrade
helm upgrade bookabench ./helm/bookabench -n bookabench

# Uninstall
helm uninstall bookabench -n bookabench

# Cleanup
kind delete cluster --name bookabench
```

---

## Next Steps

- Modify `values.yaml` to customize your deployment
- Scale services by changing `replicas` in values.yaml
- Add more services by creating new templates in `templates/`
- Use Helm hooks for pre/post-install jobs if needed

