'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { completeOnboarding } from '@/actions/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function OnboardingPage() {
  const [state, formAction] = useFormState(completeOnboarding, null);

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-[600px] border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle>Create New Brand</CardTitle>
          <CardDescription>Launch a new automated media property in seconds.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="projectName">Brand Name</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  placeholder="e.g. My Media Brand"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shortCode">Short Code</Label>
                <Input
                  id="shortCode"
                  name="shortCode"
                  placeholder="MMB"
                  maxLength={6}
                  required
                  className="uppercase"
                />
                <p className="text-xs text-zinc-500">Used for file naming (e.g. ASFA_VID_001)</p>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <Label className="mb-4 block text-zinc-400">Instagram Connection (Optional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="instagramId">Business ID</Label>
                  <Input id="instagramId" name="instagramId" placeholder="17841..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instagramToken">Long-Lived Token</Label>
                  <Input
                    id="instagramToken"
                    name="instagramToken"
                    type="password"
                    placeholder="EAA..."
                  />
                </div>
              </div>
            </div>

            {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" className="w-full">
      {pending ? 'Creating...' : 'Launch Brand'}
    </Button>
  );
}
