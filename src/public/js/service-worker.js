self.addEventListener('push', (event) => {
    const payload = event.data ? event.data.json() : 'New message!';
  
    event.waitUntil(
      self.registration.showNotification(payload.title, {
        body: 'Yay it works!',
      })
    );
});