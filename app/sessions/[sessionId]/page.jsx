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
import { DynamicBreadcrumb } from "@/components/ui/dynamic-breadcrumb";
import AppLayout from "@/components/layout/app-layout";
import FeaturesList from "@/components/features/features-list";
import { formatLocalDate } from "@/lib/utils/time";
import {
  PlayCircle,
  Calendar,
  Users,
  UserPlus,
  BarChart3,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId;
  const dispatch = useDispatch();
  const { currentSession } = useSelector((state) => state.sessions);
  const { members } = useSelector((state) => state.orgs);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const sessionAnalytics = {
    totalFeatures: 8,
    totalCases: 45,
    passedCases: 32,
    failedCases: 8,
    pendingCases: 5,
    activeTesters: 6,
    completionRate: 71,
    // Feature-wise breakdown
    featureStats: [
      { name: "Login", total: 8, passed: 7, failed: 1 },
      { name: "Dashboard", total: 12, passed: 10, failed: 2 },
      { name: "Profile", total: 6, passed: 5, failed: 1 },
      { name: "Settings", total: 9, passed: 6, failed: 2 },
      { name: "Reports", total: 10, passed: 4, failed: 4 },
    ],
    // Daily progress
    dailyProgress: [
      { date: "Mon", tested: 5, passed: 4, failed: 1 },
      { date: "Tue", tested: 8, passed: 6, failed: 2 },
      { date: "Wed", tested: 12, passed: 10, failed: 2 },
      { date: "Thu", tested: 10, passed: 7, failed: 3 },
      { date: "Fri", tested: 10, passed: 5, failed: 0 },
    ],
  };

  const pieData = [
    {
      name: "Passed",
      value: sessionAnalytics.passedCases,
      color: "hsl(var(--chart-2))",
    },
    {
      name: "Failed",
      value: sessionAnalytics.failedCases,
      color: "hsl(var(--chart-1))",
    },
    {
      name: "Pending",
      value: sessionAnalytics.pendingCases,
      color: "hsl(var(--chart-3))",
    },
  ];

  useEffect(() => {
    if (sessionId) {
      dispatch(fetchSessionById(sessionId));
    }
  }, [dispatch, sessionId]);

  useEffect(() => {
    if (currentSession?.orgId) {
      dispatch(fetchOrgMembers(currentSession.orgId._id));
    }
  }, [dispatch, currentSession?.orgId]);

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
        <DynamicBreadcrumb />
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <DynamicBreadcrumb />

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

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Features
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessionAnalytics.totalFeatures}
              </div>
              <p className="text-xs text-muted-foreground">
                {sessionAnalytics.totalCases} test cases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {sessionAnalytics.passedCases}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(
                  (sessionAnalytics.passedCases / sessionAnalytics.totalCases) *
                    100
                )}
                % success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {sessionAnalytics.failedCases}
              </div>
              <p className="text-xs text-muted-foreground">
                {sessionAnalytics.pendingCases} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Testers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessionAnalytics.activeTesters}
              </div>
              <p className="text-xs text-muted-foreground">
                Team members testing
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Test Results Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  passed: { label: "Passed", color: "hsl(var(--chart-2))" },
                  failed: { label: "Failed", color: "hsl(var(--chart-1))" },
                  pending: { label: "Pending", color: "hsl(var(--chart-3))" },
                }}
                className="h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature-wise Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  passed: { label: "Passed", color: "hsl(var(--chart-2))" },
                  failed: { label: "Failed", color: "hsl(var(--chart-1))" },
                }}
                className="h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionAnalytics.featureStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="passed"
                      fill="var(--color-passed)"
                      name="Passed"
                    />
                    <Bar
                      dataKey="failed"
                      fill="var(--color-failed)"
                      name="Failed"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Testing Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                tested: { label: "Tested", color: "hsl(var(--chart-4))" },
                passed: { label: "Passed", color: "hsl(var(--chart-2))" },
                failed: { label: "Failed", color: "hsl(var(--chart-1))" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionAnalytics.dailyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tested"
                    stroke="var(--color-tested)"
                    name="Tested"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="passed"
                    stroke="var(--color-passed)"
                    name="Passed"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="var(--color-failed)"
                    name="Failed"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

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
