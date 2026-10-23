import { Platform } from 'react-native';
import { ConvexReactClient } from 'convex/react';
import { router } from 'expo-router';

// expo-secure-store has no web native module, and dev builds compiled before
// the package was added lack the native code too — never let the import crash.
let SecureStore: {
  getItemAsync: (k: string) => Promise<string | null>;
  setItemAsync: (k: string, v: string) => Promise<void>;
  deleteItemAsync: (k: string) => Promise<void>;
} | null = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SecureStore = require('expo-secure-store');
  } catch {
    SecureStore = null;
    if (__DEV__) console.warn('expo-secure-store native module missing — rebuild your dev client (`npx expo run:android`). Tokens will not persist.');
  }
}

const url = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!url) throw new Error('EXPO_PUBLIC_CONVEX_URL is not set. Add it to .env.local (see BACKEND-GUIDE.md).');

export const convex = new ConvexReactClient(url, { unsavedChangesWarning: false });

// SecureStore keys may only contain letters, digits, ".", "-" and "_"; Convex Auth keys include the URL.
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

/** Login tokens live in the phone's encrypted keychain / keystore. Web (or a dev build
 *  missing the native module) falls back to the Convex default storage. */
export const tokenStorage = SecureStore
  ? {
      getItem: (key: string) => SecureStore.getItemAsync(safeKey(key)),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(safeKey(key), value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(safeKey(key)),
    }
  : undefined;

export type Role = 'buyer' | 'vendor' | 'worker' | 'engineer' | 'admin';

/** Product as returned by the backend catalogue (convex/products.ts `withStore`).
 *  This replaces the old MockData `Product` type everywhere in the app. */
export type BackendProduct = {
  _id: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'sold';
  barcode?: string;
  photoUrls: string[];
  storeId: string;
  storeName: string;
  storeLocation: string;
  storeVerified: boolean;
  storeOpen: boolean;
  createdAt: number;
};

/** Naira formatting used across product cards and cart. */
export const formatPrice = (price: number) => '₦' + Math.round(price).toLocaleString('en-NG');

export const ROLE_HOME: Record<Role, string> = {
  buyer: '/buyer-dashboard',
  vendor: '/vendor-dashboard',
  worker: '/worker-dashboard',
  engineer: '/engineer-dashboard',
  admin: '/admin-panel',
};

/** Roles a new account can pick on the sign-up screen (admin is granted, never picked). */
export const SIGNUP_ROLES: { role: Exclude<Role, 'admin'>; title: string; icon: string; description: string }[] = [
  { role: 'buyer', title: 'Buyer', icon: 'shopping-bag', description: 'Buy materials and hire workers.' },
  { role: 'vendor', title: 'Vendor', icon: 'store', description: 'Sell materials from your own store.' },
  { role: 'worker', title: 'Worker', icon: 'build', description: 'Find jobs and get hired.' },
  { role: 'engineer', title: 'Engineer', icon: 'engineering', description: 'Run projects and teams.' },
];

/** Back if the stack has somewhere to go, otherwise home.
 *  Prevents the dev-only "GO_BACK was not handled by any navigator" warning
 *  on deep links / replaced stacks. */
export function goBackOrHome(home: `/${string}` = '/(tabs)') {
  if (router.canGoBack()) router.back();
  else router.replace(home as never);
}

/** Message from a ConvexError, or a friendly fallback. Real backend messages
 *  (validation, permissions) always win so users see what actually failed. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.') {
  const data = (err as { data?: unknown })?.data;
  if (typeof data === 'string' && data.trim()) return data;
  const msg = err instanceof Error ? err.message.trim() : '';
  if (/network|fetch|connect/i.test(msg)) return 'No connection to BuildLinka. Check your internet and try again.';
  // Surface concrete errors (e.g. "Photo upload failed") instead of hiding
  // them behind the generic fallback. Skip Convex request-plumbing noise.
  if (msg && msg.length < 200 && !/^\[CONVEX|Request ID|Server Error$/i.test(msg)) return msg;
  return fallback;
}

/** The backend rejects uploads with an empty/malformed Content-Type (400).
 *  React Native blobs from file:// URIs often carry no usable MIME type, so
 *  derive one from the file extension and fall back to JPEG. */
function imageContentType(uri: string, blobType: string): string {
  const t = (blobType || '').split(';')[0].trim().toLowerCase();
  if (/^[a-z]+\/[a-z0-9.+-]+$/.test(t)) return t;
  const ext = uri.split('.').pop()?.toLowerCase().split('?')[0];
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
}

/** Upload a local photo (file:// uri) to Convex storage and return its storage id. */
export async function uploadPhoto(uploadUrl: string, uri: string): Promise<string> {
  const file = await fetch(uri);
  const blob = await file.blob();
  const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': imageContentType(uri, blob.type) }, body: blob });
  if (!res.ok) throw new Error('Photo upload failed');
  const { storageId } = await res.json();
  return storageId;
}
