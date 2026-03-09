---
title: "Zero-Downtime Deployments on Kubernetes"
date: 2026-01-20
excerpt: "How to deploy to Kubernetes without dropping a single request using rolling updates and readiness probes."
tags: ["Kubernetes", "DevOps", "CI/CD"]
draft: false
---

Downtime during deployments is a solved problem. Yet we still see teams losing minutes (or hours) of availability every time they push a release. The root cause is almost always the same: missing or misconfigured health checks. Kubernetes has everything you need for zero-downtime deployments built in -- you just have to configure it correctly.

## Rolling Update Strategy

The default Kubernetes deployment strategy is `RollingUpdate`, which gradually replaces old pods with new ones. The key parameters are `maxUnavailable` and `maxSurge`. For zero-downtime, set `maxUnavailable: 0` so Kubernetes never terminates an old pod until a new one is confirmed healthy.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
        - name: api
          image: registry.example.com/api-server:v2.4.1
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

## Readiness vs. Liveness

These two probes serve fundamentally different purposes, and confusing them is the number one cause of deployment-related outages we see in client clusters.

- **Readiness probes** tell Kubernetes whether a pod is ready to receive traffic. A pod that fails its readiness probe is removed from the Service's endpoint list -- no requests are routed to it. This is what enables zero-downtime: new pods do not receive traffic until they are fully initialized.

- **Liveness probes** tell Kubernetes whether a pod is still functioning. A pod that fails its liveness probe is killed and restarted. Setting this too aggressively (low `failureThreshold`, short `periodSeconds`) causes restart loops during startup.

## Graceful Shutdown

When Kubernetes decides to terminate a pod, it sends a `SIGTERM` signal and waits for `terminationGracePeriodSeconds` (default 30s) before force-killing with `SIGKILL`. Your application must handle `SIGTERM` by stopping acceptance of new connections, draining in-flight requests, and then exiting cleanly.

Without graceful shutdown handling, active requests get dropped during pod termination -- even if your rolling update configuration is perfect.

## Pre-Stop Hooks

There is a subtle race condition in Kubernetes networking: the kubelet sends `SIGTERM` and simultaneously updates the Endpoints object, but the kube-proxy and ingress controllers may not process the endpoint removal before the pod starts shutting down. A `preStop` hook with a short sleep (3-5 seconds) gives the network layer time to catch up.

## Putting It Together

Zero-downtime deployments require all four pieces working in concert: rolling update strategy with `maxUnavailable: 0`, properly configured readiness probes, graceful shutdown handling in your application, and pre-stop hooks to handle the networking race condition. Miss any one of these, and you will drop requests during deploys.
