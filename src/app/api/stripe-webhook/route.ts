
import { NextResponse, type NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { updateUserProfile } from '@/services/user-service';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = headers().get('Stripe-Signature') as string;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('Stripe Webhook Secret is not configured');
        return new NextResponse('Webhook secret not configured', { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        if (!session?.client_reference_id) {
            console.error('Missing client_reference_id in checkout session');
            return new NextResponse('Missing client_reference_id', { status: 400 });
        }

        const userId = session.client_reference_id;

        try {
            // Update user profile to grant "Pro" access
            await updateUserProfile(userId, {
                subscriptionStatus: 'paid'
            });
            console.log(`Successfully updated user ${userId} to paid subscription.`);
        } catch (error) {
            console.error(`Failed to update user profile for ${userId}:`, error);
            // We return a 200 OK to Stripe even if our DB update fails to prevent Stripe
            // from retrying the webhook. We log the error for manual intervention.
            return new NextResponse('Failed to update user profile, but acknowledging webhook.', { status: 200 });
        }
    } else {
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt of the event
    return new NextResponse(null, { status: 200 });
}
