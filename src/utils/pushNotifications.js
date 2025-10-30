// Push Notifications System for Learning Reminders

class PushNotificationManager {
  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.subscription = null;
    this.vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxazjqAKUrXKffi_qa0OtHGl3-NMpGWqVhSWRVNdmHuRBE7J2BUE'; // Demo key - replace with your own
  }

  // Initialize push notifications
  async initialize() {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return { success: false, reason: 'not_supported' };
    }

    try {
      // Check current permission
      this.permission = Notification.permission;
      
      if (this.permission === 'granted') {
        // Get existing subscription
        const registration = await navigator.serviceWorker.ready;
        this.subscription = await registration.pushManager.getSubscription();
        
        if (this.subscription) {
          console.log('Push notifications already subscribed');
          return { success: true, subscription: this.subscription };
        }
      }

      return { success: true, permission: this.permission };
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Request permission and subscribe to push notifications
  async requestPermission() {
    if (!this.isSupported) {
      return { success: false, reason: 'not_supported' };
    }

    try {
      // Request permission
      this.permission = await Notification.requestPermission();
      
      if (this.permission !== 'granted') {
        return { success: false, reason: 'permission_denied' };
      }

      // Subscribe to push notifications
      const registration = await navigator.serviceWorker.ready;
      
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('Push notification subscription successful:', this.subscription);

      // Store subscription preferences
      this.saveSubscriptionPreferences({
        subscribed: true,
        subscribedAt: Date.now(),
        endpoint: this.subscription.endpoint
      });

      // Track subscription
      if (window.gtag) {
        window.gtag('event', 'push_notification_subscribed', {
          event_category: 'Notifications'
        });
      }

      return { success: true, subscription: this.subscription };
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.subscription) {
      return { success: true };
    }

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      
      // Clear subscription preferences
      this.saveSubscriptionPreferences({
        subscribed: false,
        unsubscribedAt: Date.now()
      });

      console.log('Push notification unsubscription successful');
      
      // Track unsubscription
      if (window.gtag) {
        window.gtag('event', 'push_notification_unsubscribed', {
          event_category: 'Notifications'
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Schedule learning reminders
  async scheduleLearningReminders(preferences = {}) {
    const defaultPreferences = {
      enabled: true,
      dailyReminder: true,
      reminderTime: '16:00', // 4 PM
      weeklyGoal: true,
      achievementCelebrations: true,
      streakReminders: true
    };

    const settings = { ...defaultPreferences, ...preferences };
    
    // Save reminder preferences
    localStorage.setItem('emmy-reminder-preferences', JSON.stringify(settings));

    if (!settings.enabled || !this.subscription) {
      return { success: false, reason: 'not_enabled_or_subscribed' };
    }

    try {
      // In a real implementation, you would send these preferences to your server
      // which would then schedule the actual push notifications
      
      // For demo purposes, we'll schedule local notifications
      await this.scheduleLocalReminders(settings);
      
      console.log('Learning reminders scheduled:', settings);
      return { success: true, settings };
    } catch (error) {
      console.error('Failed to schedule learning reminders:', error);
      return { success: false, error: error.message };
    }
  }

  // Schedule local notifications (fallback for demo)
  async scheduleLocalReminders(settings) {
    // Clear existing reminders
    this.clearLocalReminders();

    if (settings.dailyReminder) {
      this.scheduleDailyReminder(settings.reminderTime);
    }

    if (settings.weeklyGoal) {
      this.scheduleWeeklyGoalReminder();
    }

    if (settings.streakReminders) {
      this.scheduleStreakReminders();
    }
  }

  // Schedule daily learning reminder
  scheduleDailyReminder(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    setTimeout(() => {
      this.showLocalNotification({
        title: "Time to Learn with Emmy! 📚",
        body: "Ready for some fun learning? Let's practice together!",
        icon: '/emmys-learning-app/icons/icon-192x192.png',
        badge: '/emmys-learning-app/icons/icon-72x72.png',
        tag: 'daily-reminder',
        data: { type: 'daily_reminder' }
      });

      // Schedule next day's reminder
      this.scheduleDailyReminder(time);
    }, timeUntilReminder);
  }

  // Schedule weekly goal reminder
  scheduleWeeklyGoalReminder() {
    const now = new Date();
    const nextSunday = new Date();
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(18, 0, 0, 0); // 6 PM on Sunday

    const timeUntilReminder = nextSunday.getTime() - now.getTime();

    setTimeout(() => {
      this.showLocalNotification({
        title: "Weekly Learning Check-in! 🎯",
        body: "How did your learning week go? Let's see your progress!",
        icon: '/emmys-learning-app/icons/icon-192x192.png',
        tag: 'weekly-goal',
        data: { type: 'weekly_goal' }
      });

      // Schedule next week's reminder
      this.scheduleWeeklyGoalReminder();
    }, timeUntilReminder);
  }

  // Schedule streak reminders
  scheduleStreakReminders() {
    // Check for learning streak every day at 8 PM
    const checkStreakDaily = () => {
      const lastActivity = localStorage.getItem('emmy-last-activity');
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      if (lastActivity && (now - parseInt(lastActivity)) > oneDayMs) {
        this.showLocalNotification({
          title: "Don't Break Your Streak! 🔥",
          body: "You're doing great! Keep your learning streak alive with a quick practice session.",
          icon: '/emmys-learning-app/icons/icon-192x192.png',
          tag: 'streak-reminder',
          data: { type: 'streak_reminder' }
        });
      }

      // Schedule next check in 24 hours
      setTimeout(checkStreakDaily, oneDayMs);
    };

    // Start checking in 24 hours
    setTimeout(checkStreakDaily, 24 * 60 * 60 * 1000);
  }

  // Show local notification
  async showLocalNotification(options) {
    if (this.permission !== 'granted') {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon,
        badge: options.badge,
        tag: options.tag,
        data: options.data,
        requireInteraction: false,
        silent: false,
        actions: [
          {
            action: 'start-learning',
            title: 'Start Learning',
            icon: '/emmys-learning-app/icons/icon-72x72.png'
          },
          {
            action: 'dismiss',
            title: 'Later',
            icon: '/emmys-learning-app/icons/icon-72x72.png'
          }
        ]
      });

      // Track notification shown
      if (window.gtag) {
        window.gtag('event', 'notification_shown', {
          event_category: 'Notifications',
          event_label: options.tag
        });
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  // Clear all local reminders
  clearLocalReminders() {
    // In a real implementation, you would clear scheduled notifications
    // For now, we'll just clear the preferences
    console.log('Clearing local reminders');
  }

  // Get subscription status
  getSubscriptionStatus() {
    return {
      isSupported: this.isSupported,
      permission: this.permission,
      isSubscribed: !!this.subscription,
      subscription: this.subscription
    };
  }

  // Get reminder preferences
  getReminderPreferences() {
    const stored = localStorage.getItem('emmy-reminder-preferences');
    return stored ? JSON.parse(stored) : {
      enabled: false,
      dailyReminder: true,
      reminderTime: '16:00',
      weeklyGoal: true,
      achievementCelebrations: true,
      streakReminders: true
    };
  }

  // Save subscription preferences
  saveSubscriptionPreferences(preferences) {
    const existing = JSON.parse(localStorage.getItem('emmy-push-subscription') || '{}');
    const updated = { ...existing, ...preferences };
    localStorage.setItem('emmy-push-subscription', JSON.stringify(updated));
  }

  // Utility function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Handle notification click (to be called from service worker)
  static handleNotificationClick(event) {
    const { action, data } = event;
    
    // Track notification interaction
    if (window.gtag) {
      window.gtag('event', 'notification_clicked', {
        event_category: 'Notifications',
        event_label: action || 'default'
      });
    }

    switch (action) {
      case 'start-learning':
        // Open the app and navigate to learning
        event.waitUntil(
          clients.openWindow('/emmys-learning-app/?from=notification')
        );
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        // Default click - open the app
        event.waitUntil(
          clients.openWindow('/emmys-learning-app/?from=notification')
        );
        break;
    }
  }
}

// Create and export singleton instance
export const pushNotificationManager = new PushNotificationManager();

// Export class for testing
export { PushNotificationManager };

export default pushNotificationManager;