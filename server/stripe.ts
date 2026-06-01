import Stripe from 'stripe';
import { db } from './db';
import { users, transactions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Check if Stripe is configured
export const isStripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

// Initialize Stripe with placeholder if missing to prevent crashes
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-10-28.acacia',
});

// Helper to determine the price IDs (can be configured via env vars)
export const STRIPE_PRICES = {
  BUMP_PACK_5: process.env.STRIPE_PRICE_BUMP_PACK_5 || 'price_bump_pack_5_placeholder',
  PREMIUM_SUBSCRIPTION: process.env.STRIPE_PRICE_PREMIUM || 'price_premium_placeholder',
};

// Webhook handler function
export async function handleStripeWebhook(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id ? parseInt(session.client_reference_id) : null;
    
    if (!userId) {
      console.error('Stripe webhook error: No client_reference_id found in session', session.id);
      return;
    }

    // Retrieve full session with line items to determine what they bought
    const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items'],
    });

    const lineItems = sessionWithLineItems.line_items?.data || [];
    
    // Determine the type of transaction based on price IDs
    let isSubscription = false;
    let bumpsToAdd = 0;
    
    for (const item of lineItems) {
      const priceId = item.price?.id;
      if (priceId === STRIPE_PRICES.PREMIUM_SUBSCRIPTION) {
        isSubscription = true;
      } else if (priceId === STRIPE_PRICES.BUMP_PACK_5) {
        bumpsToAdd += 5;
      } else {
        // Fallback checks by name if price ID isn't matching env exactly
        const name = item.description?.toLowerCase() || '';
        if (name.includes('premium') || name.includes('f2f+')) {
          isSubscription = true;
        } else if (name.includes('bump')) {
          bumpsToAdd += 5; // Default assumption
        }
      }
    }

    // Record the transaction
    await db.insert(transactions).values({
      userId,
      stripeSessionId: session.id,
      amount: session.amount_total || 0,
      status: session.payment_status,
      type: isSubscription ? 'subscription' : 'bump_pack'
    });

    // Update the user
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user) {
      await db.update(users).set({
        isPremium: isSubscription ? true : user.isPremium,
        availableBumps: (user.availableBumps || 0) + bumpsToAdd,
        stripeCustomerId: session.customer as string,
      }).where(eq(users.id, userId));
      
      console.log(`Successfully processed payment for user ${userId}. Added ${bumpsToAdd} bumps. Premium: ${isSubscription}`);
    }
  }
}
