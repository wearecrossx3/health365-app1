self.addEventListener("push", (event) => {
  let data = { title: "Health365 Admin", body: "You have a new update.", url: "/admin" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // ignore malformed payloads, fall back to defaults above
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: { url: data.url || "/admin" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/admin";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      // Reuse an already-open admin tab if there is one, otherwise open a new one.
      const existing = clientsList.find((c) => c.url.includes("/admin"));
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
