import { Platform } from "react-native";

/**
 * Base URL for the BarrierFree backend.
 *
 * - Web / iOS simulator: `localhost` reaches your machine directly.
 * - Android emulator: `localhost` refers to the emulator itself, not your
 *   machine — use `10.0.2.2` instead (Android's documented alias for the
 *   host loopback).
 * - Physical device: use your machine's LAN IP instead of either.
 */
export const API_BASE_URL = Platform.select({
  android: "http://10.0.2.2:4000",
  default: "http://localhost:4000",
});
