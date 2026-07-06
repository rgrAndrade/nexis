const amqp = require('amqplib');
const { Pool } = require('pg');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDB() {
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log(' Tabela de pagamentos verificada/criada.');
  } catch (err) {
    console.error(' Erro ao inicializar banco, tentando novamente...', err.message);
    setTimeout(initDB, 5000);
  }
}

async function startWorker() {
  await initDB();
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue('orders_queue', { durable: true });
    
    console.log(' [*] Aguardando mensagens na fila orders_queue.');

    channel.consume('orders_queue', async (msg) => {
      if (msg !== null) {
        const order = JSON.parse(msg.content.toString());
        console.log(` [x] Processando pagamento para o pedido: ${order.id}`);

        try {
          await pgPool.query(
            'INSERT INTO payments(order_id, amount, status) VALUES($1, $2, $3)',
            [order.id, order.amount, 'APROVADO']
          );
          console.log(` [✓] Pagamento salvo no Postgres.`);
          channel.ack(msg);
        } catch (dbErr) {
          console.error(' [X] Erro ao salvar no banco, reinserindo na fila...', dbErr.message);
          channel.nack(msg);
        }
      }
    });
  } catch (err) {
    console.error(' Erro no Worker, tentando reiniciar em 5s...', err.message);
    setTimeout(startWorker, 5000);
  }
}

startWorker();