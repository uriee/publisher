#!/usr/bin/env node

const express = require("express")
const app = express()
const http = require("http")
const socketIo = require("socket.io")
const port = process.env.PORT || 5000
const router = express.Router();
const server = http.createServer(app)
const io = socketIo(server) 

var amqp = require('amqplib/callback_api')

router.get("/", (req, res) => {
  res.send({ response: "I am alive" }).status(200);
});

io.on("connection", socket => {
    console.log("New client connected")
    const user = socket.handshake.query['usr']
    amqp.connect('amqp://localhost', function(error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }

            var queue = user

            channel.assertQueue(queue, {
                durable: false
            });

            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

            channel.consume(queue, function(msg) {
                console.log(" [x] Received %s", msg.content.toString())
                io.emit('new msg', msg.content.toString());
            }, {
                noAck: true
            });
        });
    });

    socket.on("disconnect", () => console.log("Client disconnected"));
});

server.listen(port, () => console.log(`Listening on port ${port}`));



