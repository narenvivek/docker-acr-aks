# Docker, Azure Container Registry and Azure Kubernetes Services

# Ingress Architecture

Internet > Cluster > Internal LB (service) > [Frontend] NGINX Reverse Proxy (Deployment) > ClusterIP (service) > [Backend] Hostname Display

# Docker

## Backend: Pull, Change, Build and Push

Pull the image using the Dockerfile below. This is just a plain-vanilla Node.js image

### Pull: Dockerfile
```
FROM node:10-alpine
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
EXPOSE 8080
CMD [ "node", "app.js" ]
```

### Change: package.js and app.js
Add app.js file added to the folder. Test if the app is working locally

1. Install required packages
```
npm install
```

2. Run locally

```
node app.js
```

3. Test
```
curl localhost:8080
My Hostname: xyz.local 
```
### Build: Image
```
docker build . -t nodejs-backend
```

### Try running locally with docker
```
docker run --name nodejs-backend -p 8080:8080 -d nodejs-backend
```
Test it with a browser 'http://localhost:8080' this should show you the Docker instance hostname

### Push: To Azure Container Registry

Tag newly built image (tagging is necessary to push to ACR)
```
docker tag nodejs-backend simpleregrepo.azurecr.io/nodejs-backend:v1
```

Check whether the tag and version is applied correctly
```
docker image ls                                      

REPOSITORY                                TAG       IMAGE ID       CREATED          SIZE
backend-nodejs                            latest    f3d40fee7064   14 minutes ago   113MB
simpleregrepo.azurecr.io/backend-nodejs   v1        f3d40fee7064   14 minutes ago   113MB
```

Login to the repo
```
az acr login -n simpleregrepo
The login server endpoint suffix '.azurecr.io' is automatically omitted.
Login Succeeded
```

Finally, push the image

```
docker push simpleregrepo.azurecr.io/nodejs-backend:v1

The push refers to repository [simpleregrepo.azurecr.io/nodejs-backend]
30ee6fdf1f50: Pushed
c2f5568d2d7d: Pushed
ceb29479d452: Pushed
5f70bf18a086: Pushed
deb5406e389b: Pushed
6f70d0d792c4: Pushed
1c4162a1ec66: Pushed
f428274dabf6: Pushed
f645bd8028b1: Pushed
v1: digest: sha256:75d5c6eb389a0df13290d1757089a182ed90106b1bc57cb118f28bc82d6afd66 size: 2198
```

If you just want to test this, use Azure Container Instances (ACI) and create a container. With the public IP you should be able to test the instance on ACI.

## Frontend: Pull, change, build and push
Frontend of our applications uses NGINX reverse proxy with a simple configuration file that redirects traffic to the backend.

### Pull: Dockerfile
```
FROM nginx:latest
COPY default.conf /etc/nginx/conf.d
```

### Change: Default.conf

When we deploy this in the Kube cluster, we will need to adjust proxy_pass to the ClusterIP service of the backend

```
server {
    listen       80;
    server_name  localhost;
    location / {
    # Update your backend application Kubernetes Cluster-IP Service name  and port below      
    # proxy_pass http://<Backend-ClusterIp-Service-Name>:<Port>;      
    proxy_pass http://backend-service:8080;
    }
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```

### Build

```
docker build -t ngnix-frontend .
```

### Push: To Azure Container Registry

Tag newly built image (tagging is necessary to push to ACR)
```
docker tag ngnix-frontend simpleregrepo.azurecr.io/ngnix-frontend:v1
```
Login to the repo
```
az acr login -n simpleregrepo
The login server endpoint suffix '.azurecr.io' is automatically omitted.
Login Succeeded
```

Finally, push the image

```
docker push simpleregrepo.azurecr.io/ngnix-frontend:v1
```

# Kubernetes (AKS)

In this example, we will use imperative semantics to deploy our Kubernetes Cluster. This means will only use kubectl commands to deploy our cluster and will NOT use YAML manifest to deploy our cluster. This section assumes that Azure Kubernetes Services is used to deploy the cluster. AKS makes use of CLI that needs to be installed as a pre-requisite using Azure CLI.

## Check whether Azure CLI is installed

### Windows 10
Launch a command window and issue following command

`az --version`

### Mac OS X
Launch a Terminal window and issue following command

`az --version`

```
azure-cli                         2.23.0

core                              2.23.0
telemetry                          1.0.6

Python location '/opt/homebrew/Cellar/azure-cli/2.23.0/libexec/bin/python'
Extensions directory '/Users/narenvivek/.azure/cliextensions'

Python (Darwin) 3.8.10 (default, May  3 2021, 18:58:19)
[Clang 12.0.5 (clang-1205.0.22.9)]

Legal docs and information: aka.ms/AzureCliLegal


Your CLI is up-to-date.

Please let us know how we are doing: https://aka.ms/azureclihats
and let us know if you're interested in trying out our newest features: https://aka.ms/CLIUXstudy
```

## Install AKS CLI using Azure CLI
(you might need admin rights to perform this step. On Windows 10, you might need to launch a Cmd (Run as Administrator))

`sudo az aks install-cli`

## Login to the cluster
This is an important step to ensure we could perform ANY actions Control Plane actions on the cluster. If this step fails, your cluster access could be restricted to be a specific IP range or with additional authentication steps. Contact your Azure administrator if you are stuck. 

Also, this step expects that you have added a new AKS cluster (MyManagedCluster) within an Azure Resoruce Group (MyResourceGroup).

`az aks get-credentials --admin --name MyManagedCluster --resource-group MyResourceGroup`