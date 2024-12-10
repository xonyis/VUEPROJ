const express = require('express')
const cors = require('cors')
const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "1909118",
  key: "8e7b6e5a3111b1da7c12",
  secret: "98c35990874a949c81b3",
  cluster: "eu",
  useTLS: true
});



const app = express()

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:5174']
}))

app.use(express.json())

app.post('/api/messages', async(req, res)=> {
    await pusher.trigger("chat", "message", {
        username: req.body.username,
        message: req.body.message 
    });

    res.json([])
}) 
console.log('listen to port 8000');
app.listen(8000)