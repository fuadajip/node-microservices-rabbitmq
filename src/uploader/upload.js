const express = require("express");
const EventEmitter = require("events");
const amqplib = require("amqplib");
const fileUpload = require("express-fileupload");

const events = new EventEmitter();

const PORT = 3050;

const queue = "optimizeimg";
let channel = null;

const app = express();
app.use(fileUpload());

app.get("/", (req, res) => {
  res.status(200).json({ service: "upload" });
});

async function initConn() {
  try {
    const conn = await amqplib.connect("amqp://localhost");
    const ch = await conn.createChannel();
    channel = ch;
    ch.consume(
      "amq.rabbitmq.reply-to",
      msg => events.emit(msg.properties.correlationId, msg.content),
      { noAck: true }
    );
    return ch;
  } catch (error) {
    console.log(error);
  }
}

function randomIdGen() {
  return (
    Math.random().toString() +
    Math.random().toString() +
    Math.random().toString()
  );
}
app.post("/upload", (req, res) => {
  let img = req.files.image;

  let id = randomIdGen();
  console.log(id);

  //Event listener that will fire when the proper randomid is provided
  events.once(id, msg => {
    res.write(msg, "binary");
    res.end(null, "binary");
  });

  channel.assertQueue(queue).then(() =>
    channel.sendToQueue(queue, img.data, {
      correlationId: id,
      replyTo: "amq.rabbitmq.reply-to"
    })
  );
});

initConn()
  .then(() => {
    app.listen(3051, () => console.log("> Worker run in port 3051"));
  })
  .catch(err => console.log(err));
