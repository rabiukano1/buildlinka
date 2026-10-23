/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as PhonePassword from "../PhonePassword.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as delivery from "../delivery.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as jobs from "../jobs.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_guards from "../lib/guards.js";
import type * as lib_notify from "../lib/notify.js";
import type * as lib_phone from "../lib/phone.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as products from "../products.js";
import type * as projects from "../projects.js";
import type * as reviews from "../reviews.js";
import type * as saved from "../saved.js";
import type * as stores from "../stores.js";
import type * as support from "../support.js";
import type * as users from "../users.js";
import type * as workers from "../workers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  PhonePassword: typeof PhonePassword;
  admin: typeof admin;
  auth: typeof auth;
  delivery: typeof delivery;
  files: typeof files;
  http: typeof http;
  jobs: typeof jobs;
  "lib/auth": typeof lib_auth;
  "lib/guards": typeof lib_guards;
  "lib/notify": typeof lib_notify;
  "lib/phone": typeof lib_phone;
  notifications: typeof notifications;
  orders: typeof orders;
  payments: typeof payments;
  products: typeof products;
  projects: typeof projects;
  reviews: typeof reviews;
  saved: typeof saved;
  stores: typeof stores;
  support: typeof support;
  users: typeof users;
  workers: typeof workers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
