const socket = new WebSocket("ws://localhost:8080");

socket.onmessage = function(event) {
    if (event.data === "reload") {
        location.reload();
    }
};
