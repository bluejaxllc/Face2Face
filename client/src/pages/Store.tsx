import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Star, Zap, EyeOff, Map, Loader2 } from 'lucide-react';

export default function Store() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleCheckout = async (type: 'subscription' | 'bump_pack') => {
    setIsLoading(type);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
      setIsLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-24">
      <div className="text-center mb-10 mt-6">
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-primary">Face 2 Face Store</h1>
        <p className="text-muted-foreground text-lg">Enhance your experience with premium features</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* F2F+ Subscription */}
        <Card className={`relative overflow-hidden border-primary/50 shadow-lg ${user?.isPremium ? 'opacity-80' : ''}`}>
          {user?.isPremium && (
            <div className="absolute top-4 right-4">
              <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/20">Active</Badge>
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              F2F+ Premium
            </CardTitle>
            <CardDescription>The ultimate Face 2 Face experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold mb-4">$9.99<span className="text-lg text-muted-foreground font-normal">/month</span></div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <EyeOff className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Stealth Mode</p>
                  <p className="text-sm text-muted-foreground">Browse the map invisibly. See others without sharing your location.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">VIP Map Badge</p>
                  <p className="text-sm text-muted-foreground">Stand out with a golden crown next to your avatar on the map.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Map className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Unlimited Radar & Heatmap</p>
                  <p className="text-sm text-muted-foreground">Access advanced map features without daily limits.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">5 Free Bumps / Month</p>
                  <p className="text-sm text-muted-foreground">Get extra bumps every month you are subscribed.</p>
                </div>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            {user?.isPremium ? (
              <Button className="w-full" disabled variant="secondary">You are subscribed</Button>
            ) : (
              <Button 
                className="w-full text-lg h-12" 
                onClick={() => handleCheckout('subscription')}
                disabled={isLoading !== null}
              >
                {isLoading === 'subscription' ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Upgrade to F2F+
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Bump Pack */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Zap className="w-6 h-6 text-orange-500 fill-orange-500" />
              Bump Pack
            </CardTitle>
            <CardDescription>Get more attention instantly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            <div className="text-3xl font-bold mb-4">$2.99<span className="text-lg text-muted-foreground font-normal"> for 5</span></div>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-center font-medium">
                You currently have <span className="text-orange-500 text-lg mx-1">{user?.availableBumps || 0}</span> bumps available
              </p>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">5 Instant Bumps</p>
                  <p className="text-sm text-muted-foreground">Send a direct notification to someone without needing a mutual match.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Star className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Never Expire</p>
                  <p className="text-sm text-muted-foreground">Keep them in your inventory until you're ready to use them.</p>
                </div>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full text-lg h-12" 
              variant="outline" 
              onClick={() => handleCheckout('bump_pack')}
              disabled={isLoading !== null}
            >
              {isLoading === 'bump_pack' ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Buy 5 Bumps
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
