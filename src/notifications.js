const SHOWN_NOTIFICATIONS_KEY = 'toxi_shown_notifications';

function getShownNotifications() {
  try {
    const data = localStorage.getItem(SHOWN_NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function markNotificationShown(id) {
  try {
    const shown = getShownNotifications();
    if (!shown.includes(id)) {
      shown.push(id);
      localStorage.setItem(SHOWN_NOTIFICATIONS_KEY, JSON.stringify(shown));
    }
  } catch {}
}

export function initNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.log('[Notif] Not supported');
    return;
  }

  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'GET_SHOWN_NOTIFICATIONS') {
        event.ports[0].postMessage(getShownNotifications());
      } else if (event.data?.type === 'MARK_NOTIFICATION_SHOWN') {
        markNotificationShown(event.data.id);
      }
    });
  }

  if (Notification.permission === 'default') {
    setTimeout(() => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone === true;
      
      if (isStandalone) {
        Notification.requestPermission().then(permission => {
          console.log('[Notif] Permission:', permission);
        });
      }
    }, 5000);
  }
}
