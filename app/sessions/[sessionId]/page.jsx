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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { realApi } from "@/lib/realApi";
import Link from "next/link";
import {
  Bar,
  BarChart,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId;
  const router = useRouter();
  const dispatch = useDispatch();
  const { currentSession } = useSelector((state) => state.sessions);
  const { list: features, status: featuresStatus } = useSelector((state) => state.features);
  const { members } = useSelector((state) => state.orgs);
  const { user } = useSelector((state) => state.auth);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [duplicating, setDuplicating] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [resultsData, setResultsData] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState(null);
  const [selectedTesters, setSelectedTesters] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [isCreateFeatureOpen, setIsCreateFeatureOpen] = useState(false);
  const [featureFormData, setFeatureFormData] = useState({ title: "", description: "", sortOrder: "" });
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ title: "", description: "" });
  const [updating, setUpdating] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [testerToRemove, setTesterToRemove] = useState(null);
  const [testerStats, setTesterStats] = useState({});

  useEffect(() => {
    if (sessionId) {
      dispatch(fetchSessionById(sessionId));
      dispatch(fetchFeatures({ sessionId, params: { page: 1, limit: 100 } }));
      fetchDashboard();
    }
  }, [dispatch, sessionId]);

  useEffect(() => {
    if (currentSession?.orgId?._id) {
      dispatch(fetchOrgMembers(currentSession.orgId._id));
    }
  }, [dispatch, currentSession?.orgId?._id]);

  // Refetch results when filters change
  useEffect(() => {
    if (resultsData && (selectedTesters.length > 0 || selectedStatuses.length > 0)) {
      fetchResults();
    }
  }, [selectedTesters, selectedStatuses]);

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const response = await realApi.sessions.getFeatureStatistics(sessionId);
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoadingDashboard(false);
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

  const fetchResults = async () => {
    setLoadingResults(true);
    try {
      const filters = {
        testerIds: selectedTesters,
        status: selectedStatuses,
      };
      const response = await realApi.sessions.getTestResults(sessionId, filters);
      if (response.success) {
        setResultsData(response.data);
        // Initialize filters with all testers selected on first load
        if (selectedTesters.length === 0 && response.data.session.assignees) {
          setSelectedTesters(response.data.session.assignees.map(t => t._id));
        }
      }
    } catch (error) {
      console.error("Failed to fetch results:", error);
    } finally {
      setLoadingResults(false);
    }
  };

  const toggleTester = (testerId) => {
    setSelectedTesters(prev =>
      prev.includes(testerId)
        ? prev.filter(id => id !== testerId)
        : [...prev, testerId]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const selectAllTesters = () => {
    if (resultsData?.session?.assignees) {
      setSelectedTesters(resultsData.session.assignees.map(t => t._id));
    }
  };

  const clearAllTesters = () => {
    setSelectedTesters([]);
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
      fetchTesterStats(); // Refresh stats after assignment
    } catch (err) {
      toast.error(err || "Failed to assign user");
    }
  };

  const handleUnassign = async (userId) => {
    try {
      await dispatch(unassignUserFromSession({ sessionId, userId })).unwrap();
      toast.success("User unassigned successfully");
      setTesterToRemove(null);
      fetchTesterStats(); // Refresh stats after removal
    } catch (err) {
      toast.error(err || "Failed to unassign user");
    }
  };

  const fetchTesterStats = async () => {
    if (!currentSession?.assignees || currentSession.assignees.length === 0) {
      setTesterStats({});
      return;
    }

    try {
      // Fetch all feedback for this session to calculate stats
      const response = await realApi.sessions.getTestResults(sessionId, {});
      if (response.success && response.data) {
        const stats = {};

        // Initialize stats for each tester
        currentSession.assignees.forEach(tester => {
          stats[tester._id] = {
            totalTestCases: 0,
            testedCases: 0,
            passedCases: 0,
            failedCases: 0,
            completionRate: 0,
            passRate: 0,
          };
        });

        // Count total test cases
        const totalCases = response.data.features?.reduce((sum, feature) =>
          sum + (feature.cases?.length || 0), 0) || 0;

        // Calculate stats from feedback
        response.data.features?.forEach(feature => {
          feature.cases?.forEach(testCase => {
            testCase.feedback?.forEach(fb => {
              if (stats[fb.testerId]) {
                stats[fb.testerId].testedCases++;
                if (fb.result === 'pass') {
                  stats[fb.testerId].passedCases++;
                } else if (fb.result === 'fail') {
                  stats[fb.testerId].failedCases++;
                }
              }
            });
          });
        });

        // Calculate rates
        Object.keys(stats).forEach(testerId => {
          const testerStat = stats[testerId];
          testerStat.totalTestCases = totalCases;
          testerStat.completionRate = totalCases > 0
            ? Math.round((testerStat.testedCases / totalCases) * 100)
            : 0;
          testerStat.passRate = testerStat.testedCases > 0
            ? Math.round((testerStat.passedCases / testerStat.testedCases) * 100)
            : 0;
        });

        setTesterStats(stats);
      }
    } catch (error) {
      console.error("Failed to fetch tester stats:", error);
    }
  };

  const handleCreateFeature = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createFeature({ sessionId, data: featureFormData })).unwrap();
      setIsCreateFeatureOpen(false);
      setFeatureFormData({ title: "", description: "", sortOrder: "" });
      dispatch(fetchFeatures({ sessionId, params: { page: 1, limit: 100 } }));
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

  const formatChangeValue = (key, value) => {
    if (!value) return "None";
    if (key === "assignees" && Array.isArray(value)) {
      return `${value.length} tester${value.length !== 1 ? 's' : ''}`;
    }
    if (key.toLowerCase().includes("date")) {
      return new Date(value).toLocaleDateString();
    }
    if (typeof value === "object" && value._id) {
      return value.title || value.name || value._id;
    }
    if (typeof value === "string" && value.length > 50) {
      return value.slice(0, 50) + "...";
    }
    return String(value);
  };

  const getChangeDetails = (log) => {
    if (!log.before && !log.after) return null;

    const changes = [];
    const before = log.before || {};
    const after = log.after || {};

    // Get all unique keys
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    // Filter out technical fields
    const ignoreKeys = ["_id", "__v", "createdAt", "updatedAt", "orgId", "sessionId", "featureId", "caseId", "createdBy", "testerId"];

    allKeys.forEach((key) => {
      if (ignoreKeys.includes(key)) return;

      const beforeVal = before[key];
      const afterVal = after[key];

      if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        changes.push({
          field: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          before: formatChangeValue(key, beforeVal),
          after: formatChangeValue(key, afterVal),
        });
      }
    });

    return changes;
  };

  // Map backend response to expected format
  const sessionAnalytics = dashboardData ? {
    totalFeatures: dashboardData.summary?.totalFeatures || 0,
    totalCases: dashboardData.summary?.totalCases || 0,
    passedCases: dashboardData.features?.reduce((sum, f) => sum + f.passedCases, 0) || 0,
    failedCases: dashboardData.features?.reduce((sum, f) => sum + f.failedCases, 0) || 0,
    pendingCases: dashboardData.features?.reduce((sum, f) => sum + (f.totalCases - f.testedCases), 0) || 0,
    activeTesters: currentSession?.assignees?.length || 0,
    featureStats: dashboardData.features?.map(f => ({
      name: f.title.length > 15 ? f.title.substring(0, 15) + '...' : f.title,
      passed: f.passedCases,
      failed: f.failedCases,
    })) || [],
  } : {
    totalFeatures: features.length || 0,
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
        {/* Improved Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              <PlayCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-words">{currentSession.title}</h1>
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

              {/* Collapsible Description */}
              {currentSession.description && (
                <Collapsible open={descriptionExpanded} onOpenChange={setDescriptionExpanded}>
                  <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground">
                        {descriptionExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Hide description
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Show description
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="mt-2">
                    <p className="text-muted-foreground break-words">
                      {currentSession.description}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>

          {/* Quick Actions - Right Corner */}
          <div className="flex gap-2 flex-shrink-0">
            <Link href={`/sessions/${sessionId}/quick-test`}>
              <Button className="gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Quick Test</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-2 flex-wrap">
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
                    <Label htmlFor="sortOrder">Sort Order (optional)</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      placeholder="Enter sort order"
                      value={featureFormData.sortOrder}
                      onChange={(e) =>
                        setFeatureFormData({ ...featureFormData, sortOrder: e.target.value })
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
            <span className="hidden sm:inline">Duplicate</span>
          </Button>

          {user && currentSession?.createdBy?._id === user._id && (
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-5 max-w-[750px]">
            <TabsTrigger value="features" className="gap-2">
              <Box className="h-4 w-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="testers" onClick={fetchTesterStats} className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Testers</span>
            </TabsTrigger>
            <TabsTrigger value="activity" onClick={fetchActivity} className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="results" onClick={fetchResults} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Results</span>
            </TabsTrigger>
          </TabsList>

          {/* Features Tab - Grid Layout */}
          <TabsContent value="features" className="mt-6 space-y-4">
            {featuresStatus === "loading" && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {featuresStatus === "succeeded" && features.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Box className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No features yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add features to start testing
                  </p>
                  <Button onClick={() => setIsCreateFeatureOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Feature
                  </Button>
                </CardContent>
              </Card>
            )}

            {featuresStatus === "succeeded" && features.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                  <Link key={feature._id} href={`/features/${feature._id}`}>
                    <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            #{feature.sortOrder || 0}
                          </Badge>
                          <Badge variant={getStatusColor(feature.status)} className="text-xs">
                            {feature.status || 'pending'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg line-clamp-2">
                          {feature.title}
                        </CardTitle>
                        {feature.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {feature.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>{feature.caseCount || 0} cases</span>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6 space-y-6">
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
                        <BarChart data={sessionAnalytics.featureStats || []}>
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

          {/* Testers Tab */}
          <TabsContent value="testers" className="mt-6 space-y-6">
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Testers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentSession.assignees?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Assigned to session</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {currentSession.assignees?.length > 0
                      ? Math.round(
                          Object.values(testerStats).reduce((sum, s) => sum + s.completionRate, 0) /
                            currentSession.assignees.length
                        )
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Average completion rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Pass Rate</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {currentSession.assignees?.length > 0
                      ? Math.round(
                          Object.values(testerStats).reduce((sum, s) => sum + s.passRate, 0) /
                            currentSession.assignees.length
                        )
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Average pass rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tested</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(testerStats).reduce((sum, s) => sum + s.testedCases, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Test cases completed</p>
                </CardContent>
              </Card>
            </div>

            {/* Testers List */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                  <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 w-full sm:w-auto">
                        <UserPlus className="h-4 w-4" />
                        Assign Tester
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Assign Tester to Session</DialogTitle>
                        <DialogDescription>
                          Select a team member to assign to this testing session. They will receive an email notification.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="user">Select Team Member</Label>
                          <Select
                            value={selectedUserId}
                            onValueChange={setSelectedUserId}
                          >
                            <SelectTrigger id="user" className="h-12">
                              <SelectValue placeholder="Choose a user to assign..." />
                            </SelectTrigger>
                            <SelectContent>
                              {unassignedMembers.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  All organization members are already assigned
                                </div>
                              ) : (
                                unassignedMembers.map((member) => (
                                  <SelectItem key={member._id} value={member._id} className="py-3">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">
                                          {getInitials(member.fullName || "U")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="text-left">
                                        <div className="font-medium">{member.fullName}</div>
                                        <div className="text-xs text-muted-foreground">{member.email}</div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
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
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign Tester
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {currentSession.assignees && currentSession.assignees.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {currentSession.assignees.map((assignee) => {
                      const stats = testerStats[assignee._id] || {
                        totalTestCases: 0,
                        testedCases: 0,
                        passedCases: 0,
                        failedCases: 0,
                        completionRate: 0,
                        passRate: 0,
                      };

                      return (
                        <Card key={assignee._id} className="border-l-4 border-l-primary/40">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className="text-sm font-semibold">
                                    {getInitials(assignee?.fullName || "U")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold text-base">{assignee?.fullName}</h4>
                                  <p className="text-sm text-muted-foreground">{assignee?.email}</p>
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => setTesterToRemove(assignee)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-muted-foreground">Progress</span>
                                <span className="text-xs font-bold text-primary">{stats.completionRate}%</span>
                              </div>
                              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                                  style={{ width: `${stats.completionRate}%` }}
                                />
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 text-center">
                                <div className="text-lg font-bold text-blue-600">{stats.testedCases}</div>
                                <div className="text-xs text-muted-foreground">Tested</div>
                              </div>
                              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center">
                                <div className="text-lg font-bold text-green-600">{stats.passedCases}</div>
                                <div className="text-xs text-muted-foreground">Passed</div>
                              </div>
                              <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-2 text-center">
                                <div className="text-lg font-bold text-red-600">{stats.failedCases}</div>
                                <div className="text-xs text-muted-foreground">Failed</div>
                              </div>
                            </div>

                            {/* Pass Rate Badge */}
                            {stats.testedCases > 0 && (
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Pass Rate</span>
                                <Badge
                                  variant={stats.passRate >= 80 ? "default" : stats.passRate >= 50 ? "secondary" : "destructive"}
                                  className="font-semibold"
                                >
                                  {stats.passRate}%
                                </Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No testers assigned</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Assign team members to start testing this session
                    </p>
                    <Button onClick={() => setIsAssignOpen(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign First Tester
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab with Details Modal */}
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
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedActivity(log)}
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

          {/* Results Tab - All Testers' Test Results */}
          <TabsContent value="results" className="mt-6 space-y-4">
            {/* Filters Section */}
            {resultsData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tester Filter */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Testers ({selectedTesters.length}/{resultsData.session.assignees.length})</label>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAllTesters}>
                            All
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAllTesters}>
                            Clear
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {resultsData.session.assignees.map(tester => (
                          <Button
                            key={tester._id}
                            variant={selectedTesters.includes(tester._id) ? "default" : "outline"}
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => toggleTester(tester._id)}
                          >
                            <Avatar className="h-4 w-4 mr-1.5">
                              <AvatarFallback className="text-xs">{tester.fullName?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="hidden sm:inline">{tester.fullName}</span>
                            <span className="sm:hidden">{tester.fullName?.[0]}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status ({selectedStatuses.length}/4)</label>
                      <div className="flex flex-wrap gap-2">
                        {['passed', 'failed', 'partial', 'untested'].map(status => (
                          <Button
                            key={status}
                            variant={selectedStatuses.includes(status) ? "default" : "outline"}
                            size="sm"
                            className="h-8 text-xs capitalize"
                            onClick={() => toggleStatus(status)}
                          >
                            {status === 'passed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Test Results
                </CardTitle>
                <CardDescription>
                  View all testers' feedback for each test case
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingResults ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : !resultsData || !resultsData.features || resultsData.features.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-base font-medium">No test results yet</p>
                    <p className="text-sm mt-1">Test cases will appear here once testers submit feedback</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {resultsData.features.map((feature) => (
                      <div key={feature._id} className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-2 border-b">
                          <div className="flex items-center gap-2">
                            <Box className="h-4 w-4 text-primary flex-shrink-0" />
                            <h3 className="font-semibold text-base sm:text-lg break-words">{feature.title}</h3>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="w-fit text-xs">
                              {feature.stats.passedCases} passed
                            </Badge>
                            <Badge variant="outline" className="w-fit text-xs">
                              {feature.stats.failedCases} failed
                            </Badge>
                            <Badge variant="outline" className="w-fit text-xs">
                              {feature.stats.untestedCases} untested
                            </Badge>
                          </div>
                        </div>

                        {!feature.cases || feature.cases.length === 0 ? (
                          <p className="text-sm text-muted-foreground pl-4 sm:pl-6">No test cases match filters</p>
                        ) : (
                          <div className="space-y-2 sm:space-y-3">
                            {feature.cases.map((testCase) => {
                              const borderLeftColor =
                                testCase.overallStatus === 'passed' ? 'rgb(34 197 94)' :
                                testCase.overallStatus === 'failed' ? 'rgb(239 68 68)' :
                                testCase.overallStatus === 'partial' ? 'rgb(251 191 36)' :
                                'rgb(148 163 184 / 0.3)';

                              return (
                                <Card
                                  key={testCase._id}
                                  className="border-l-4 cursor-pointer hover:shadow-md transition-shadow"
                                  style={{ borderLeftColor }}
                                  onClick={() => setSelectedCaseDetail(testCase)}
                                >
                                  <CardContent className="p-3 sm:p-4">
                                    <div className="flex flex-col gap-3">
                                      {/* Title Row */}
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-sm sm:text-base break-words mb-1">{testCase.title}</h4>
                                          {testCase.note && (
                                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{testCase.note}</p>
                                          )}
                                        </div>
                                        <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                                          {testCase.overallStatus}
                                        </Badge>
                                      </div>

                                      {/* Tester Summary */}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Users className="h-3 w-3" />
                                          <span>{testCase.stats.testedCount}/{testCase.stats.totalTesters} tested</span>
                                        </div>
                                        {testCase.stats.passCount > 0 && (
                                          <Badge variant="default" className="text-xs h-5 bg-green-600">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            {testCase.stats.passCount}
                                          </Badge>
                                        )}
                                        {testCase.stats.failCount > 0 && (
                                          <Badge variant="destructive" className="text-xs h-5">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            {testCase.stats.failCount}
                                          </Badge>
                                        )}

                                        {/* Tester Avatars */}
                                        <div className="flex -space-x-2 ml-auto">
                                          {testCase.feedback.slice(0, 3).map((fb, idx) => (
                                            <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                                              <AvatarFallback className="text-xs">{fb.testerName?.[0] || 'U'}</AvatarFallback>
                                            </Avatar>
                                          ))}
                                          {testCase.feedback.length > 3 && (
                                            <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                                              +{testCase.feedback.length - 3}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Activity Details Modal */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>
              {selectedActivity?.action.charAt(0).toUpperCase() + selectedActivity?.action.slice(1)}{" "}
              {selectedActivity?.entityType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Performed By</p>
                <p className="font-medium">{selectedActivity?.performedBy?.fullName || "Unknown"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Time</p>
                <p className="font-medium">
                  {selectedActivity && new Date(selectedActivity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            {selectedActivity && getChangeDetails(selectedActivity) && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 font-medium text-sm">Changes</div>
                <div className="divide-y">
                  {getChangeDetails(selectedActivity).map((change, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
                      <div className="font-medium">{change.field}</div>
                      <div className="text-muted-foreground">
                        {selectedActivity.action !== "create" && (
                          <span className="line-through">{change.before}</span>
                        )}
                      </div>
                      <div className="text-green-600 font-medium">
                        {selectedActivity.action !== "delete" && change.after}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Other Dialogs */}
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

      {/* Remove Tester Confirmation Dialog */}
      <Dialog open={!!testerToRemove} onOpenChange={() => setTesterToRemove(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Remove Tester from Session
            </DialogTitle>
            <DialogDescription>
              This action will remove the tester from this testing session.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm font-semibold bg-destructive/20">
                    {getInitials(testerToRemove?.fullName || "U")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-base">{testerToRemove?.fullName}</h4>
                  <p className="text-sm text-muted-foreground">{testerToRemove?.email}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to remove <span className="font-semibold text-foreground">{testerToRemove?.fullName}</span> from this session?
                They will lose access to test cases and won't receive further notifications about this session.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTesterToRemove(null)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleUnassign(testerToRemove._id)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Tester
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Case Detail Modal */}
      <Dialog open={!!selectedCaseDetail} onOpenChange={() => setSelectedCaseDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl break-words pr-6">{selectedCaseDetail?.title}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Test case details and tester feedback
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 py-4">
            {/* Test Case Info */}
            <div className="space-y-3 sm:space-y-4">
              {selectedCaseDetail?.note && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Steps</p>
                  <p className="text-sm sm:text-base bg-muted/50 p-3 rounded-md break-words">{selectedCaseDetail.note}</p>
                </div>
              )}

              {selectedCaseDetail?.expectedOutput && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Expected Output</p>
                  <p className="text-sm sm:text-base bg-muted/50 p-3 rounded-md break-words">{selectedCaseDetail.expectedOutput}</p>
                </div>
              )}
            </div>

            {/* All Testers' Feedback */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">
                All Testers' Feedback ({selectedCaseDetail?.feedback?.length || 0}/{selectedCaseDetail?.stats?.totalTesters || 0})
              </h4>

              {selectedCaseDetail?.feedback && selectedCaseDetail.feedback.length > 0 ? (
                <div className="space-y-3">
                  {selectedCaseDetail.feedback.map((fb, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/30">
                        <div className="flex items-center gap-2 flex-1">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                            <AvatarFallback className="text-xs sm:text-sm">
                              {fb.testerName?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm sm:text-base">{fb.testerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(fb.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={fb.result === 'pass' ? 'default' : 'destructive'}
                          className="text-xs sm:text-sm w-fit"
                        >
                          {fb.result === 'pass' ? (
                            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          )}
                          {fb.result}
                        </Badge>
                      </div>

                      {fb.comment && (
                        <div className="p-3 sm:p-4 bg-background border-t">
                          <p className="text-sm sm:text-base break-words whitespace-pre-wrap text-muted-foreground">
                            {fb.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No tester feedback yet
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
