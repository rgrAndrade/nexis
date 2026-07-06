const express = require('express');
const amqp = require('amqplib');
const client = require('prom-client');

const app = express();
app.use(express.json());

// Coleta de métricas padrão do Prometheus
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Métrica customizada para contar requisições de pedidos
const ordersCounter = new client.Counter({
  name: 'http_orders_total',
  help: 'Total de pedidos recebidos via API'
});

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
let channel = null;

// Conexão com o RabbitMQ com retry simplificado
async function connectRabbit() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('orders_queue', { durable: true });
    console.log(' Conectado ao RabbitMQ');
  } catch (err) {
    console.error(' Erro ao conectar no RabbitMQ, tentando novamente em 5s...', err.message);
    setTimeout(connectRabbit, 5000);
  }
}
connectRabbit();

app.post('/orders', async (req, res) => {
  ordersCounter.inc();
  const order = req.body;

  if (!channel) {
    return res.status(503).json({ error: 'Serviço de mensageria indisponível' });
  }

  channel.sendToQueue('orders_queue', Buffer.from(JSON.stringify(order)), { persistent: true });
  console.log(`[x] Pedido enviado para a fila:`, order);
  return res.status(202).json({ message: 'Pedido recebido e enviado para processamento!' });
});

// Endpoints de Saúde para as Probes do K8s
app.get('/healthz', (req, res) => res.status(200).send('OK'));

// Endpoint de Métricas para o Scraping do Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));