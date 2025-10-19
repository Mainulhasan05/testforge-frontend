"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import {
  fetchSessionById,
  assignUserToSession,
  unassignUserFromSession,
} from "@/lib/slices/sessionsSlice";
import { fetchOrgMembers } from "@/lib/slices/orgsSlice";
import { createFeature, fetchFeatures } from "@/lib/slices/featuresSlice";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlayCircle,
  Calendar,
  Users,
  UserPlus,
  BarChart3,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Zap,
  Copy,
  Plus,
  Trash2,
  Activity,
  Clock,
  Edit,
  Box,
  PieChart,
} from "lucide-react";
import { toast } from "sonner";
import { realApi } from "@/lib/realApi";
import Link from "next/link";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
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
  const router = useRouter();
  const dispatch = useDispatch();
  const { currentSession } = useSelector((state) => state.sessions);
  const { members } = useSelector((state) => state.orgs);
  const { user } = useSelector((state) => state.auth);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [duplicating, setDuplicating] = useState(false);
  const [featureStats, setFeatureStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isCreateFeatureOpen, setIsCreateFeatureOpen] = useState(false);
  const [featureFormData, setFeatureFormData] = useState({ title: "", description: "", sortOrder: 0 });
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ title: "", description: "" });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (sessionId) {
      dispatch(fetchSessionById(sessionId));
      fetchStats();
    }
  }, [dispatch, sessionId]);

  useEffect(() => {
    if (currentSession?.orgId?._id) {
      dispatch(fetchOrgMembers(currentSession.orgId._id));
    }
  }, [dispatch, currentSession?.orgId?._id]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await realApi.sessions.getDashboard(sessionId);
      if (response.success) {
        setFeatureStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchActivity = async () => {
    setLoadingActivity(true);
    try {
      const response = await realApi.changelog.getAll("Session", sessionId, {});
      if (response.success) {
        setActivityLogs(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const result = await realApi.sessions.duplicate(sessionId);
      toast.success("Session duplicated successfully");
      if (result.data?._id) {
        router.push(`/sessions/${result.data._id}`);
      }
    } catch (error) {
      toast.error(error.message || "Failed to duplicate session");
    } finally {
      setDuplicating(false);
      setIsDuplicateOpen(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) return;
    try {
      await dispatch(
        assignUserToSession({ sessionId, userId: selectedUserId })
      ).unwrap();
      setSelectedUserId("");
      setIsAssignOpen(false);
      toast.success("User assigned successfully");
    } catch (err) {
      toast.error(err || "Failed to assign user");
    }
  };

  const handleUnassign = async (userId) => {
    try {
      await dispatch(unassignUserFromSession({ sessionId, userId })).unwrap();
      toast.success("User unassigned successfully");
    } catch (err) {
      toast.error(err || "Failed to unassign user");
    }
  };

  const handleCreateFeature = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createFeature({ sessionId, data: featureFormData })).unwrap();
      setIsCreateFeatureOpen(false);
      setFeatureFormData({ title: "", description: "", sortOrder: 0 });
      dispatch(fetchFeatures({ sessionId, params: { page: 1, limit: 10 } }));
      toast.success("Feature created successfully");
    } catch (err) {
      console.error("Failed to create feature:", err);
      toast.error("Failed to create feature");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await realApi.sessions.delete(sessionId);
      toast.success("Session deleted successfully");
      router.push(`/orgs/${currentSession?.orgId?._id || '/orgs'}`);
    } catch (error) {
      toast.error(error.message || "Failed to delete session");
    } finally {
      setDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const handleEdit = () => {
    setEditFormData({
      title: currentSession.title,
      description: currentSession.description || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await realApi.sessions.update(sessionId, editFormData);
      toast.success("Session updated successfully");
      setIsEditOpen(false);
      dispatch(fetchSessionById(sessionId));
    } catch (error) {
      toast.error(error.message || "Failed to update session");
    } finally {
      setUpdating(false);
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

  const sessionAnalytics = featureStats || {
    totalFeatures: 0,
    totalCases: 0,
    passedCases: 0,
    failedCases: 0,
    pendingCases: 0,
    activeTesters: currentSession?.assignees?.length || 0,
    featureStats: [],
  };

  const pieData = [
    { name: "Passed", value: sessionAnalytics.passedCases, color: "#10b981" },
    { name: "Failed", value: sessionAnalytics.failedCases, color: "#ef4444" },
    { name: "Pending", value: sessionAnalytics.pendingCases, color: "#f59e0b" },
  ];

  const unassignedMembers = members.filter(
    (member) => !currentSession?.assignees?.some((a) => a._id === member._id)
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

  const breadcrumbItems = currentSession?.orgId?._id
    ? [
        { label: currentSession.orgId.name || "Organization", href: `/orgs/${currentSession.orgId._id}` },
        { label: currentSession.title }
      ]
    : null;

  return (
    <AppLayout>
      <DynamicBreadcrumb items={breadcrumbItems} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <PlayCircle className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold break-words">{currentSession.title}</h1>
              <Badge variant={getStatusColor(currentSession.status)}>
                {currentSession.status}
              </Badge>
              {user && currentSession?.createdBy?._id === user._id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleEdit}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-muted-foreground mb-4 break-words">
              {currentSession.description || "No description"}
            </p>

            <div className="flex gap-2 flex-wrap items-center">
              <Link href={`/sessions/${sessionId}/quick-test`}>
                <Button className="gap-2">
                  <Zap className="h-4 w-4" />
                  Quick Test Mode
                </Button>
              </Link>

              <Dialog open={isCreateFeatureOpen} onOpenChange={setIsCreateFeatureOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Feature
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
                  <form onSubmit={handleCreateFeature}>
                    <DialogHeader>
                      <DialogTitle>Create Feature</DialogTitle>
                      <DialogDescription>
                        Add a new feature to test in this session
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Feature Title</Label>
                        <Input
                          id="title"
                          placeholder="Enter feature name"
                          value={featureFormData.title}
                          onChange={(e) =>
                            setFeatureFormData({ ...featureFormData, title: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe the feature"
                          value={featureFormData.description}
                          onChange={(e) =>
                            setFeatureFormData({ ...featureFormData, description: e.target.value })
                          }
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sortOrder">Sort Order</Label>
                        <Input
                          id="sortOrder"
                          type="number"
                          placeholder="0"
                          value={featureFormData.sortOrder}
                          onChange={(e) =>
                            setFeatureFormData({ ...featureFormData, sortOrder: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateFeatureOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Create Feature</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setIsDuplicateOpen(true)}
                disabled={duplicating}
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>

              {user && currentSession?.createdBy?._id === user._id && (
                <Button
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Tabs - Features First */}
        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-[600px]">
            <TabsTrigger value="features" className="gap-2">
              <Box className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="activity" onClick={fetchActivity} className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Features Tab - Primary View */}
          <TabsContent value="features" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Test Features</h2>
                <p className="text-muted-foreground">
                  Manage and organize your testing features
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {sessionAnalytics.totalFeatures} Features
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {sessionAnalytics.totalCases} Cases
                </Button>
              </div>
            </div>
            <FeaturesList sessionId={sessionId} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Test Analytics</h2>
              <p className="text-muted-foreground">
                View detailed statistics and insights
              </p>
            </div>

            {/* Stats Cards */}
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
                    {sessionAnalytics.totalCases > 0
                      ? Math.round(
                          (sessionAnalytics.passedCases / sessionAnalytics.totalCases) *
                            100
                        )
                      : 0}
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

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Test Results Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <ChartContainer
                      config={{
                        passed: { label: "Passed", color: "hsl(var(--chart-2))" },
                        failed: { label: "Failed", color: "hsl(var(--chart-1))" },
                        pending: { label: "Pending", color: "hsl(var(--chart-3))" },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                        <RechartsPieChart>
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
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feature-wise Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <ChartContainer
                      config={{
                        passed: { label: "Passed", color: "hsl(var(--chart-2))" },
                        failed: { label: "Failed", color: "hsl(var(--chart-1))" },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%" minWidth={400}>
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
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Session Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
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
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assigned Testers ({currentSession.assignees?.length || 0})
                  </CardTitle>
                  <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Assign User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Assign User to Session</DialogTitle>
                        <DialogDescription>
                          Select a team member to assign to this testing session
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="user">Team Member</Label>
                          <Select
                            value={selectedUserId}
                            onValueChange={setSelectedUserId}
                          >
                            <SelectTrigger id="user">
                              <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                            <SelectContent>
                              {unassignedMembers.map((member) => (
                                <SelectItem key={member._id} value={member._id}>
                                  {member.fullName || member.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAssignOpen(false)}
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAssign} disabled={!selectedUserId} className="w-full sm:w-auto">
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
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Session Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingActivity ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No activity logs yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityLogs.map((log) => (
                      <div
                        key={log._id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {log.action === "create" && (
                            <Plus className="h-5 w-5 text-green-600" />
                          )}
                          {log.action === "update" && (
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                          )}
                          {log.action === "delete" && (
                            <Trash2 className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {log.action.charAt(0).toUpperCase() + log.action.slice(1)}{" "}
                            {log.entityType}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            by {log.performedBy?.fullName || "Unknown"} •{" "}
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <Dialog open={isDuplicateOpen} onOpenChange={setIsDuplicateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Session</DialogTitle>
            <DialogDescription>
              This will create a copy of this session with all features and test cases.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDuplicateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={duplicating}>
              {duplicating ? "Duplicating..." : "Duplicate Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This will permanently delete
              all features, test cases, and feedback. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Session</DialogTitle>
              <DialogDescription>
                Update session details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={updating}>
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Updating..." : "Update Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
