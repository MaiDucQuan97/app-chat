self.addEventListener('push', (event) => {
    const payload = event.data ? event.data.json() : 'New message!';
  
    event.waitUntil(
      self.registration.showNotification(`Message from ${payload.username}`, {
        body: payload.message
      })
    );
});