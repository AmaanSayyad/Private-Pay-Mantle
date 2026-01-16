/**
 * PWA Utilities
 * Handles service worker registration, push notifications, and PWA features
 */

/**
 * Register service worker for PWA
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        type: 'module'
      });
      
      console.log('Service Worker registered:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('New service worker available');
              // You can show a notification to the user here
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Request push notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Show push notification
 */
export function showNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.warn('Notifications not available or not granted');
    return;
  }

  const notificationOptions = {
    body: options.body || '',
    icon: options.icon || '/assets/squidl-logo-only.png',
    badge: '/assets/squidl-only.svg',
    tag: options.tag || 'default',
    requireInteraction: options.requireInteraction || false,
    silent: options.silent || false,
    ...options
  };

  const notification = new Notification(title, notificationOptions);

  notification.onclick = (event) => {
    event.preventDefault();
    window.focus();
    if (options.onClick) {
      options.onClick();
    }
    notification.close();
  };

  // Auto-close after 5 seconds if not requiring interaction
  if (!notificationOptions.requireInteraction) {
    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  return notification;
}

/**
 * Show payment received notification
 */
export function notifyPaymentReceived(amount, fromAddress) {
  const shortAddress = fromAddress 
    ? `${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}`
    : 'Unknown';
  
  showNotification('Payment Received! 💰', {
    body: `You received ${amount} MNT from ${shortAddress}`,
    tag: 'payment-received',
    requireInteraction: false,
    icon: '/assets/squidl-logo-only.png',
    onClick: () => {
      window.location.href = '/';
    }
  });
}

/**
 * Check if app is installed as PWA
 */
export function isPWAInstalled() {
  // Check if running in standalone mode (iOS)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check if running in standalone mode (Android)
  if (window.navigator.standalone === true) {
    return true;
  }
  
  // Check if launched from home screen
  if (document.referrer.includes('android-app://')) {
    return true;
  }
  
  return false;
}

/**
 * Prompt user to install PWA
 */
export async function promptPWAInstall() {
  // Check if already installed
  if (isPWAInstalled()) {
    return false;
  }

  // Check if browser supports install prompt
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  }

  return false;
}

/**
 * Initialize PWA features
 */
export async function initializePWA() {
  // Register service worker
  await registerServiceWorker();
  
  // Request notification permission on user interaction
  // (Browsers require user interaction for permission requests)
  document.addEventListener('click', async () => {
    if (Notification.permission === 'default') {
      await requestNotificationPermission();
    }
  }, { once: true });
  
  console.log('PWA initialized');
}
