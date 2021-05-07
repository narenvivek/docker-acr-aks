# base-docker-images

## Ingress Architecture

Internet > Cluster > Internal LB (service) > [Frontend] NGINX Reverse Proxy (Deployment) > ClusterIP (service) > [Backend] Hostname Display
