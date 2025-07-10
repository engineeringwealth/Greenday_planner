
'use client';

import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { updateUserProfile } from '@/services/user-service';

function SubscribePageContent() {
    const { toast } = useToast();
    const { user, refetchUserProfile } = useAuth();

    const handleSubscribe = async () => {
        // In a real application, this would redirect to a Stripe Checkout page.
        // For this prototype, we'll just update the user's status and show a toast.
        toast({
            title: "Coming Soon!",
            description: "Payment gateway integration is under construction. For now, we've given you a Pro account!",
        });

        if (user) {
            await updateUserProfile(user.uid, { subscriptionStatus: 'paid' });
            await refetchUserProfile();
        }
    };

    return (
        <div className="relative bg-background flex flex-col h-full max-h-screen sm:max-h-[90vh]">
             <header className="flex items-center p-4 flex-shrink-0">
                <Link href="/" passHref>
                    <Button variant="outline" size="icon" aria-label="Go back">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <Card className="w-full max-w-md shadow-2xl bg-card/80">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-primary">Unlock Myetician Pro</CardTitle>
                        <CardDescription className="text-muted-foreground pt-2">
                            Get unlimited access to all features and reach your health goals faster.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <ul className="space-y-3 text-left text-sm text-foreground">
                            <li className="flex items-center">
                                <Check className="h-5 w-5 mr-3 text-primary" />
                                Unlimited AI meal analysis
                            </li>
                            <li className="flex items-center">
                                <Check className="h-5 w-5 mr-3 text-primary" />
                                Advanced progress tracking
                            </li>
                            <li className="flex items-center">
                                <Check className="h-5 w-5 mr-3 text-primary" />
                                Detailed nutritional insights
                            </li>
                            <li className="flex items-center">
                                <Check className="h-5 w-5 mr-3 text-primary" />
                                Priority support
                            </li>
                        </ul>
                        <div className="text-center">
                            <p className="text-4xl font-bold">$9.99<span className="text-base font-normal text-muted-foreground">/month</span></p>
                        </div>
                        <Button onClick={handleSubscribe} size="lg" className="w-full">
                            Subscribe Now
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}


export default function SubscribePage() {
    return (
        <AuthGuard>
            <main className="min-h-screen bg-zinc-900 flex justify-center items-start pt-4 sm:pt-8">
                 <div className="w-full max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden h-full sm:h-auto sm:max-h-[90vh]">
                    <SubscribePageContent />
                </div>
            </main>
        </AuthGuard>
    );
}
