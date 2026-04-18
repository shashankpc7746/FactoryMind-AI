export interface AppNotificationPayload {
  title: string;
  message: string;
  level?: 'info' | 'success' | 'warning' | 'error';
  category?: 'documents' | 'reports' | 'system';
}

export const APP_NOTIFICATION_EVENT = 'factorymind:notification';

export function emitNotification(payload: AppNotificationPayload) {
  window.dispatchEvent(new CustomEvent<AppNotificationPayload>(APP_NOTIFICATION_EVENT, { detail: payload }));
}
