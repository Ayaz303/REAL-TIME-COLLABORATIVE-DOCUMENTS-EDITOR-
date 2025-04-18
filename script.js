const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/collab-editor', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware to serve static files
app.use(express.static('public'));

// Document schema
const documentSchema = new mongoose.Schema({
    content: String,
});

const Document = mongoose.model('Document', documentSchema);

// Socket.IO setup
io.on('connection', (socket) => {
    console.log('A user connected');

    // Load existing document
    Document.findOne({}, (err, doc) => {
        if (doc) {
            socket.emit('load-document', doc.content);
        }
    });

    // Listen for document updates
    socket.on('update-document', (data) => {
        Document.findOneAndUpdate({}, { content: data }, { upsert: true }, (err) => {
            if (err) console.error(err);
        });
        socket.broadcast.emit('document-updated', data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});