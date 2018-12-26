const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const amqplib = require("amqplib/callback_api");

const queue = "optimizeimg";
let ch = null;

const initWorker = async () => {
  try {
    const conn = await amqplib.connect(
      "amqp://localhost",
      function(err, conn) {
        conn.createChannel(function(err, ch) {
          ch.assertQueue(queue);
          console.log("awaiting rpc request");
          ch.consume(queue, async function reply(msg) {
            // image processing
            const processedImage = await imagemin.buffer(msg.content, {
              plugins: [imageminPngquant()]
            });
            //Send back to the sender (replyTo) queue and give the correlationId back
            //so we can emit the event.
            ch.sendToQueue(msg.properties.replyTo, processedImage, {
              correlationId: msg.properties.correlationId
            });

            // acknowledge the job done with the message
            ch.ack(msg);
          });
        });
      }
    );
  } catch (error) {
    console.log(error);
  }
};

initWorker().then(() => {
  console.log("> Worker running");
});
