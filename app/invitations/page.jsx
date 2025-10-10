"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInvitations,
  acceptInvitation,
  declineInvitation,
} from "@/lib/slices/invitationsSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Check, X, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AppLayout from "@/components/layout/app-layout";

export default function InvitationsPage() {
  const dispatch = useDispatch();
  const { invitations, status, error } = useSelector(
    (state) => state.invitations
  );

  useEffect(() => {
    dispatch(fetchInvitations());
  }, [dispatch]);

  const handleAccept = async (token) => {
    try {
      await dispatch(acceptInvitation(token)).unwrap();
      // Refresh invitations list
      dispatch(fetchInvitations());
    } catch (err) {
      console.error("[v0] Failed to accept invitation:", err);
    }
  };

  const handleDecline = async (invitationId) => {
    try {
      await dispatch(declineInvitation(invitationId)).unwrap();
      // Refresh invitations list
      dispatch(fetchInvitations());
    } catch (err) {
      console.error("[v0] Failed to decline invitation:", err);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "default",
      accepted: "success",
      declined: "secondary",
    };
    return (
      <Badge variant={variants[status] || "default"} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Invitations</h1>
          <p className="text-muted-foreground">
            Manage your organization invitations
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status === "loading" ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invitations</h3>
              <p className="text-sm text-muted-foreground text-center">
                You don't have any pending invitations at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {invitation.orgId?.name || "Organization"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Invited by{" "}
                          {invitation.invitedBy?.name ||
                            invitation.invitedBy?.email}{" "}
                          •{" "}
                          {formatDistanceToNow(new Date(invitation.createdAt), {
                            addSuffix: true,
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(invitation.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Role</p>
                      <Badge variant="outline" className="capitalize">
                        {invitation.role}
                      </Badge>
                    </div>
                    {invitation.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDecline(invitation.id)}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(invitation.token)}
                          className="gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Accept
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
