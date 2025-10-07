"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import {
  fetchSessionById,
  assignUserToSession,
  unassignUserFromSession,
} from "@/lib/slices/sessionsSlice";
import { fetchOrgMembers } from "@/lib/slices/orgsSlice";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/components/layout/app-layout";
import FeaturesList from "@/components/features/features-list";
import { formatLocalDate } from "@/lib/utils/time";
import { PlayCircle, Calendar, Users, UserPlus } from "lucide-react";

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId;
  const dispatch = useDispatch();
  const { currentSession } = useSelector((state) => state.sessions);
  const { members } = useSelector((state) => state.orgs);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (sessionId) {
      dispatch(fetchSessionById(sessionId));
    }
  }, [dispatch, sessionId]);

  useEffect(() => {
    if (currentSession?.orgId) {
      dispatch(fetchOrgMembers(currentSession.orgId?._id));
    }
  }, [dispatch, currentSession?.orgId?._id]);

  const handleAssign = async () => {
    if (!selectedUserId) return;
    try {
      await dispatch(
        assignUserToSession({ sessionId, userId: selectedUserId })
      ).unwrap();
      setIsAssignOpen(false);
      setSelectedUserId("");
    } catch (err) {
      console.error("[v0] Failed to assign user:", err);
      alert(err.message || "Failed to assign user");
    }
  };

  const handleUnassign = async (userId) => {
    try {
      await dispatch(unassignUserFromSession({ sessionId, userId })).unwrap();
    } catch (err) {
      console.error("[v0] Failed to unassign user:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "archived":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const unassignedMembers = members.filter(
    (member) =>
      !currentSession?.assignees?.some((a) => a.userId === member.userId)
  );

  if (!currentSession) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <PlayCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{currentSession.title}</h1>
                <Badge variant={getStatusColor(currentSession.status)}>
                  {currentSession.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {currentSession.description || "No description"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {currentSession.startDate
                    ? formatLocalDate(currentSession.startDate)
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">
                  {currentSession.endDate
                    ? formatLocalDate(currentSession.endDate)
                    : "Not set"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assignees
                </CardTitle>
                <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Member</DialogTitle>
                      <DialogDescription>
                        Assign a team member to this session
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="member">Select Member</Label>
                        <Select
                          value={selectedUserId}
                          onValueChange={setSelectedUserId}
                        >
                          <SelectTrigger id="member">
                            <SelectValue placeholder="Choose a member" />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedMembers.map((member) => (
                              <SelectItem
                                key={member.userId}
                                value={member.userId}
                              >
                                {member.user?.name || member.user?.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAssignOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAssign} disabled={!selectedUserId}>
                        Assign
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {currentSession.assignees &&
              currentSession.assignees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentSession.assignees.map((assignee) => (
                    <div
                      key={assignee._id}
                      className="flex items-center gap-2 bg-secondary/50 rounded-full pl-1 pr-3 py-1"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(assignee?.fullName || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{assignee?.fullName}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 p-0 hover:bg-destructive/20"
                        onClick={() => handleUnassign(assignee._id)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No assignees yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <FeaturesList sessionId={sessionId} />
      </div>
    </AppLayout>
  );
}
