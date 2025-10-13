"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { signup, clearError } from "@/lib/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { realApi } from "@/lib/realApi";
import { toast } from "sonner";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("token");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [invitationInfo, setInvitationInfo] = useState(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();
  const { status, error, user } = useSelector((state) => state.auth);

  // Verify invitation token if present
  useEffect(() => {
    const verifyInvitation = async () => {
      if (invitationToken) {
        setLoadingInvitation(true);
        try {
          const response = await realApi.invitations.verify(invitationToken);
          setInvitationInfo(response.data);
          setEmail(response.data.email || "");
        } catch (error) {
          toast.error("Invalid or expired invitation link");
          setValidationError("Invalid or expired invitation link");
        } finally {
          setLoadingInvitation(false);
        }
      }
    };

    verifyInvitation();
  }, [invitationToken]);

  useEffect(() => {
    if (user) {
      router.push("/orgs");
    }
  }, [user, router]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    // Validation
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }

    try {
      const signupData = { fullName: name, email, password };

      // Add invitation token if present
      if (invitationToken) {
        signupData.invitationToken = invitationToken;
      }

      await dispatch(signup(signupData)).unwrap();

      if (invitationToken && invitationInfo) {
        toast.success(`Welcome! You've joined ${invitationInfo.organizationName}`);
      }

      router.push("/orgs");
    } catch (err) {
      console.error("[v0] Signup failed:", err);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            {invitationInfo
              ? `Join ${invitationInfo.organizationName} as ${invitationInfo.role}`
              : "Enter your information to create a new account"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {loadingInvitation && (
              <Alert>
                <AlertDescription>Verifying invitation...</AlertDescription>
              </Alert>
            )}
            {invitationInfo && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <AlertDescription className="text-green-800 dark:text-green-400">
                  You're invited to join <strong>{invitationInfo.organizationName}</strong> as a {invitationInfo.role}
                </AlertDescription>
              </Alert>
            )}
            {displayError && (
              <Alert variant="destructive">
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!invitationInfo}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Creating account..." : "Sign Up"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
