import { NextResponse, type NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return new NextResponse(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
        }

        const priceId = process.env.STRIPE_PRICE_ID;
        if (!priceId) {
            console.error('Stripe Price ID is not configured');
            return new NextResponse(JSON.stringify({ error: 'Stripe Price ID is not configured' }), { status: 500 });
        }
        
        const origin = headers().get('origin') || 'http://localhost:9002';
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/?subscribed=true`,
            cancel_url: `${origin}/subscribe`,
            client_reference_id: userId, // Pass Firebase user ID to link them
        });
        
        if (!session.id) {
            return new NextResponse(JSON.stringify({ error: 'Failed to create Stripe session' }), { status: 500 });
        }

        return NextResponse.json({ sessionId: session.id });
    } catch (error) {
        console.error('[STRIPE_CHECKOUT]', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
