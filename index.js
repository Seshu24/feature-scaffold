const express = require('express');
const { Kafka } = require('kafkajs');

const app = express();
const port = 3000;

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'] // Replace with your Kafka brokers
});

const consumer = kafka.consumer({ groupId: 'my-group' });

const consume = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'my-topic', fromBeginning: true }); // Replace with your topic

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        topic,
        partition,
        offset: message.offset,
        value: message.value.toString(),
      });
    },
  });
};

app.get('/', (req, res) => {
  res.send('Kafka Listener is running!');
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
  consume().catch(console.error);
});