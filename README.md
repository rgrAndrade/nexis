# 📦 Orders API — Microservice Architecture & Observability

Uma API RESTful para gerenciamento de pedidos construída em Node.js, empacotada em containers Docker e orquestrada via **Kubernetes**. O projeto utiliza a cultura **GitOps (ArgoCD)** para implantação contínua e uma stack robusta de **Observabilidade (Prometheus + Grafana)** para monitoramento em tempo real.

---

## 🏗️ Arquitetura do Sistema

```text
[ Cliente / Load Balancer ]
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│                    Cluster Kubernetes                   │
│                                                         │
│  ┌─────────────────┐             ┌───────────────────┐  │
│  │   Orders API    │             │    Observability  │  │
│  │ (Node.js Pods)  │             │                   │  │
│  │  [Pod 1] [Pod 2]│──/metrics──>│    Prometheus     │  │
│  └────────┬────────┘             └─────────┬─────────┘  │
│           │                                │            │
│           ▼                                ▼            │
│  ┌─────────────────┐             ┌───────────────────┐  │
│  │    PostgreSQL   │             │      Grafana      │  │
│  │    / RabbitMQ   │             │   (Dashboards)    │  │
│  └─────────────────┘             └─────────┬─────────┘  │
└─────────────────────────────────────────────────────────┘
            ▲
            │ (GitOps Sync)
   ┌─────────────────┐
   │     ArgoCD      │
   └─────────────────┘
```

---

## 🚀 Tecnologias Utilizadas

* **Aplicação:** Node.js, Express, Prometheus Client (`prom-client`).
* **Containerização:** Docker & Docker Hub.
* **Orquestração:** Kubernetes (Deployments, Services, ConfigMaps, RBAC).
* **GitOps & Continuous Delivery:** ArgoCD.
* **Observabilidade & Métricas:** Prometheus Operator (`PodMonitor` / `ServiceMonitor`) e Grafana.
* **Persistência & Mensageria:** PostgreSQL e RabbitMQ.

---

## 📊 Observabilidade e Monitoramento

A aplicação expõe métricas nativas do ecossistema Node.js (uso de CPU, Garbage Collection, estatísticas de Event Loop e consumo de memória Heap) e métricas de negócios no endpoint `/metrics`.

### Métricas Monitoradas
* **Process Heap Memory (`process_heap_bytes_used` / `process_heap_bytes_total`)**
* **Event Loop Lag (`nodejs_eventloop_lag_seconds`)**
* **HTTP Request Duration & Rate**

### Coleta de Métricas (Prometheus Operator)
A coleta é realizada via `PodMonitor` diretamente sobre os pods da API:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: orders-api-pod-monitor
  namespace: monitoring
spec:
  podMetricsEndpoints:
  - port: http
    path: /metrics
    interval: 5s
  namespaceSelector:
    any: true
  selector:
    matchLabels:
      app: orders-api
```

---

## ⚡ Como Rodar o Projeto Localmente

### Pré-requisitos
* Cluster Kubernetes ativo (Kind, Minikube ou k3s)
* `kubectl` instalado e configurado
* Helm 3 instalado

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/orders-api.git
cd orders-api
```

### 2. Aplicar os Manifestos do Kubernetes
```bash
kubectl apply -f k8s/
```

### 3. Expor as Ferramentas de Gerenciamento (`port-forward`)

Para acessar os painéis no seu navegador, execute os comandos em terminais separados:

| Ferramenta | Comando de Liberação | Endereço de Acesso |
| :--- | :--- | :--- |
| **Grafana** | `kubectl port-forward svc/kube-prometheus-stack-grafana -n monitoring 3000:80` | `http://localhost:3000` |
| **Prometheus** | `kubectl port-forward svc/kube-prometheus-stack-prometheus -n monitoring 9090:9090` | `http://localhost:9090` |
| **ArgoCD** | `kubectl port-forward svc/argocd-server -n argocd 8080:443` | `https://localhost:8080` |

---

## 🧪 Teste de Carga e Liberação de Tráfego

Para gerar tráfego de requisições e visualizar o dashboard do Grafana reagindo aos picos de memória em tempo real, execute o script abaixo:

```bash
for i in {1..100}; do
  curl -s -X POST http://localhost:30080/orders \
    -H "Content-Type: application/json" \
    -d "{\"id\": \"order-$i\", \"amount\": 150.00, \"item\": \"Teste de Carga Observability\"}"
  echo "Pedido $i processado com sucesso!"
  sleep 0.05
done
```

---

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se à vontade para usar e contribuir!
