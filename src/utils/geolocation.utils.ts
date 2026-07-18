/** Attendance check-in geolocation — works on Expo web; native uses same navigator when available. */

export type CheckInCoords = { latitude: number; longitude: number; accuracy: number };

export async function getCheckInPosition(maxWaitMs = 12000): Promise<{ coords: CheckInCoords }> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Location is not available on this device. Open the app in a browser or enable GPS.');
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
      resolve({
        coords: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 999,
        },
      });
    };

    const fail = (err: GeolocationPositionError | { code: number; message: string }) => {
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

export function geolocationErrorMessage(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? Number((err as { code: number }).code) : 0;
  if (code === 1) return 'Location access is required for check-in. Please enable it.';
  if (code === 3) return 'Could not get your location in time. Please try again outdoors.';
  if (err instanceof Error) return err.message;
  return 'Could not detect your location. Please try again.';
}
