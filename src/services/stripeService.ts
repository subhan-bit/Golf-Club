// ─────────────────────────────────────────────────────────────────────────
// Stripe integration service.
//
// This is the ONLY module that should ever talk to Stripe. In production,
// createPaymentIntent / confirmPayment / refundPayment would call your
// FastAPI backend (which itself holds the Stripe secret key server-side —
// NEVER in frontend code) which in turn calls the real Stripe API using
// stripe-python and Stripe Terminal SDKs.
//
// For this prototype, VITE_DEMO_MODE=true (see .env.example) forces every
// call below to resolve against a local mock instead of a live network
// request, so the whole POS flow works with zero external credentials.
// No card numbers, CVV, or PINs are ever collected, stored, or transmitted
// by this app — Stripe Terminal / Stripe.js handle that on real hardware
// or in Stripe's own hosted UI, out of reach of this codebase.
// ─────────────────────────────────────────────────────────────────────────
import type { PaymentMethodType } from '../types'
import { nextId } from '../lib/rng'

const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE ?? 'true') !== 'false'

export interface PaymentIntentResult {
  id: string // pi_demo_xxx or real Stripe PaymentIntent id
  clientSecret: string
  amount: number
  currency: 'gbp'
  status: 'requires_payment_method' | 'requires_capture' | 'succeeded' | 'canceled' | 'failed'
}

export interface CapturedPayment {
  paymentIntentId: string
  status: 'succeeded' | 'failed' | 'canceled'
  method: PaymentMethodType
  last4?: string
  failureReason?: string
}

export interface RefundResult {
  id: string
  status: 'succeeded' | 'failed'
  amount: number
}

/**
 * Creates a Stripe PaymentIntent for the basket total.
 * Production: POST /payments/intent -> backend calls stripe.paymentIntents.create()
 */
export async function createPaymentIntent(amountGbp: number): Promise<PaymentIntentResult> {
  if (!DEMO_MODE) {
    throw new Error('Live Stripe mode requires a backend endpoint — not implemented in this prototype.')
  }
  await wait(300)
  return {
    id: `pi_demo_${nextId('').slice(-10)}`,
    clientSecret: `pi_demo_secret_${nextId('').slice(-8)}`,
    amount: Math.round(amountGbp * 100),
    currency: 'gbp',
    status: 'requires_payment_method',
  }
}

/**
 * Simulates Stripe Terminal collecting a contactless/card/wallet payment.
 * Production: backend calls stripe.terminal.readers.process_payment_intent()
 * for physical readers, or Stripe.js confirmCardPayment() for a card element.
 */
export async function processTerminalPayment(
  paymentIntentId: string,
  method: PaymentMethodType,
  outcome: 'success' | 'fail' = 'success',
): Promise<CapturedPayment> {
  if (!DEMO_MODE) {
    throw new Error('Live Stripe Terminal requires connected reader hardware — not available in this prototype.')
  }
  await wait(1400)
  if (outcome === 'fail') {
    return {
      paymentIntentId,
      status: 'failed',
      method,
      failureReason: 'Card declined — insufficient funds (simulated)',
    }
  }
  return {
    paymentIntentId,
    status: 'succeeded',
    method,
    last4: method === 'Card' ? String(randomDigits(4)) : undefined,
  }
}

/**
 * Production: stripe.paymentIntents.confirm() — included for architectural
 * completeness; the terminal flow above already confirms in this prototype.
 */
export async function confirmPayment(paymentIntentId: string): Promise<{ status: string }> {
  await wait(200)
  return { status: 'succeeded', ...{ paymentIntentId } }
}

/** Production: stripe.paymentIntents.retrieve() */
export async function getPaymentStatus(paymentIntentId: string): Promise<{ status: string }> {
  await wait(150)
  return { status: paymentIntentId ? 'succeeded' : 'unknown' }
}

/** Production: stripe.refunds.create({ payment_intent, amount }) */
export async function refundPayment(paymentIntentId: string, amountGbp: number): Promise<RefundResult> {
  if (!DEMO_MODE) {
    throw new Error('Live Stripe refunds require a backend endpoint — not implemented in this prototype.')
  }
  await wait(900)
  return {
    id: `re_demo_${nextId('').slice(-10)}`,
    status: 'succeeded',
    amount: Math.round(amountGbp * 100),
  }
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
function randomDigits(n: number) {
  return Math.floor(Math.random() * Math.pow(10, n)).toString().padStart(n, '0')
}

export const stripeIsDemoMode = DEMO_MODE
