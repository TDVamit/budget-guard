import { DeviceEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';

/** Emitted by the native listener the moment a transaction is written to SQLite. */
export const TRANSACTION_DETECTED_EVENT = 'BudgetGuardTransactionDetected';

export function onTransactionDetected(handler: () => void) {
  return DeviceEventEmitter.addListener(TRANSACTION_DETECTED_EVENT, handler);
}

export type InstalledApp = { packageName: string; label: string };

export type DetectionDiagnostics = {
  listenerEnabled: boolean;
  /** Epoch ms of the last notification the listener saw from any app — 0 if never. */
  lastAnyAt: number;
  /** Epoch ms of the last notification from a watched payment/SMS/mail app. */
  lastKnownAt: number;
  lastPackage: string | null;
  lastOutcome: string | null;
  addedCount: number;
};

const { LocalNotification } = NativeModules as {
  LocalNotification?: {
    show: (title: string, body: string, notificationId: number) => void;
    getDetectionDiagnostics: () => Promise<DetectionDiagnostics>;
    getInstalledApps: () => Promise<InstalledApp[]>;
    setWatchedPackages: (packages: string[]) => Promise<boolean>;
    getDefaultWatchedPackages: () => Promise<string[]>;
  };
};

/** Why a notification did or didn't become a transaction — detection fails silently otherwise. */
export async function getDetectionDiagnostics(): Promise<DetectionDiagnostics | null> {
  if (Platform.OS !== 'android' || !LocalNotification?.getDetectionDiagnostics) return null;
  try {
    return await LocalNotification.getDetectionDiagnostics();
  } catch {
    return null;
  }
}

/** Fires a device-only notification (e.g. "new cycle started"). Best-effort: no-ops if permission is denied. */
export async function showLocalNotification(title: string, body: string, notificationId = 1) {
  if (Platform.OS !== 'android' || !LocalNotification) return;

  if (Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
  }

  LocalNotification.show(title, body, notificationId);
}

/** Every launchable app on the device, so any bank or wallet can be watched. */
export async function getInstalledApps(): Promise<InstalledApp[]> {
  if (Platform.OS !== 'android' || !LocalNotification?.getInstalledApps) return [];
  try {
    return await LocalNotification.getInstalledApps();
  } catch {
    return [];
  }
}

/** The listener has no JS runtime, so the watch list is pushed to native storage. */
export async function setWatchedPackages(packages: string[]): Promise<void> {
  await LocalNotification?.setWatchedPackages?.(packages);
}

export async function getDefaultWatchedPackages(): Promise<string[]> {
  if (Platform.OS !== 'android' || !LocalNotification?.getDefaultWatchedPackages) return [];
  try {
    return await LocalNotification.getDefaultWatchedPackages();
  } catch {
    return [];
  }
}
