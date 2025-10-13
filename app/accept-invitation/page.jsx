"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { realApi } from "@/lib/realApi";
import { CheckCircle, XCircle, AlertCircle, UserPlus } from "lucide-react";
import Link from "next/link";

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [invitationInfo, setInvitationInfo] = useState(null);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const verifyInvitation = async () => {
      if (!token) {
        setError("No invitation token provided");
        setLoading(false);
        return;
      }

      try {
        const response = await realApi.invitations.verify(token);
        setInvitationInfo(response.data);
      } catch (err) {
        setError(err.message || "Invalid or expired invitation");
      } finally {
        setLoading(false);
      }
    };

    verifyInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      // Not logged in - redirect to signup with token
      router.push(`/signup?token=${token}`);
      return;
    }

    // User is logged in - try to accept invitation
    setAccepting(true);
    try {
      await realApi.invitations.accept(token);
      setAccepted(true);
      setTimeout(() => {
        router.push("/orgs");
      }, 2000);
    } catch (err) {
      if (err.message.includes("different email")) {
        setError("This invitation was sent to a different email address. Please log out and sign up with the invited email.");
      } else if (err.message.includes("already a member")) {
        setError("You are already a member of this organization!");
        setTimeout(() => {
          router.push("/orgs");
        }, 2000);
      } else {
        setError(err.message || "Failed to accept invitation");
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-10 w-full mt-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invitation Error</CardTitle>
            </div>
            <CardDescription>There was a problem with your invitation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
                Go Home
              </Button>
              {!user && (
                <Button className="flex-1" onClick={() => router.push("/login")}>
                  Login
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle>Invitation Accepted!</CardTitle>
            </div>
            <CardDescription>Welcome to {invitationInfo?.organizationName}</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-400">
                You've successfully joined the organization. Redirecting...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            <CardTitle>You're Invited!</CardTitle>
          </div>
          <CardDescription>
            Join {invitationInfo?.organizationName} on Test Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Organization:</span>
                <span className="font-medium">{invitationInfo?.organizationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Role:</span>
                <span className="font-medium capitalize">{invitationInfo?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="font-medium">{invitationInfo?.email}</span>
              </div>
            </div>
          </div>

          {!user && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to create an account or login to accept this invitation.
              </AlertDescription>
            </Alert>
          )}

          {user && user.email !== invitationInfo?.email && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation was sent to {invitationInfo?.email}, but you're logged in as {user.email}.
                Please log out and create an account with the invited email.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDecline}
              disabled={accepting}
            >
              Decline
            </Button>
            <Button
              className="flex-1"
              onClick={handleAccept}
              disabled={accepting || (user && user.email !== invitationInfo?.email)}
            >
              {accepting ? "Accepting..." : user ? "Accept Invitation" : "Create Account"}
            </Button>
          </div>

          {!user && (
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href={`/login?redirect=/accept-invitation?token=${token}`} className="text-primary hover:underline">
                Login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
