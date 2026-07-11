output "cluster_endpoint" {
  value       = kind_cluster.nexis_cluster.endpoint
  description = "O endpoint para se conectar ao cluster Kubernetes do Nexis."
}

output "instrucoes" {
  value = "Cluster Nexis criado com sucesso! Use 'kubectl get nodes' para validar."
}