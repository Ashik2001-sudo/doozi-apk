/** Attendance check-in geolocation — uses expo-location on native APK, navigator on web. */

import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type CheckInCoords = { latitude: number; longitude: number; accuracy: number };

type GeoErr = { code: number; message: string };

function toCoords(coords: {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}): CheckInCoords {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy ?? 999,
  };
}

async function getNativeCheckInPosition(maxWaitMs: number): Promise<{ coords: CheckInCoords }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    throw { code: 1, message: 'Location permission denied' } satisfies GeoErr;
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error('GPS is turned off. Please enable location services and try again.');
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let best: CheckInCoords | null = null;
    let subscription: Location.LocationSubscription | null = null;

    const cleanup = () => {
      subscription?.remove();
      clearTimeout(timer);
    };

    const finish = (coords: CheckInCoords) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ coords });
    };

    const fail = (err: GeoErr) => {
      if (settled) return;
      if (best) {
        finish(best);
        return;
      }
      settled = true;
      cleanup();
      reject(err);
    };

    const timer = setTimeout(() => {
      if (best) finish(best);
      else fail({ code: 3, message: 'Location timeout' });
    }, maxWaitMs);

    void Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 500,
        distanceInterval: 0,
      },
      (pos) => {
        const coords = toCoords(pos.coords);
        if (!best || coords.accuracy < best.accuracy) best = coords;
        if (coords.accuracy <= 80) finish(coords);
      },
    )
      .then((sub) => {
        if (settled) {
          sub.remove();
          return;
        }
        subscription = sub;
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Location unavailable';
        fail({ code: 2, message });
      });
  });
}

function getWebCheckInPosition(maxWaitMs: number): Promise<{ coords: CheckInCoords }> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Location is not available on this device.');
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let watchId: number | undefined;
    let best: GeolocationPosition | null = null;

    const cleanup = () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
    };

    const finish = (pos: GeolocationPosition) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ coords: toCoords(pos.coords) });
    };

    const fail = (err: GeolocationPositionError | GeoErr) => {
      if (settled) return;
      if (best) {
        finish(best);
        return;
      }
      settled = true;
      cleanup();
      reject(err);
    };

    const timer = setTimeout(() => {
      if (best) finish(best);
      else fail({ code: 3, message: 'Location timeout' });
    }, maxWaitMs);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        if (pos.coords.accuracy <= 80) finish(pos);
      },
      (err) => fail(err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: maxWaitMs },
    );
  });
}

export async function getCheckInPosition(maxWaitMs = 12000): Promise<{ coords: CheckInCoords }> {
  if (Platform.OS === 'web') {
    return getWebCheckInPosition(maxWaitMs);
  }
  return getNativeCheckInPosition(maxWaitMs);
}

export function geolocationErrorMessage(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? Number((err as { code: number }).code) : 0;
  if (code === 1) {
    return 'Location access is required for check-in. Please allow location permission in app settings.';
  }
  if (code === 3) return 'Could not get your location in time. Please try again outdoors.';
  if (err instanceof Error) return err.message;
  return 'Could not detect your location. Please try again.';
}
