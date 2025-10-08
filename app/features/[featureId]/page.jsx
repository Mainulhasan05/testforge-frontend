"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { fetchFeatureById } from "@/lib/slices/featuresSlice";
import { fetchCases, createCase } from "@/lib/slices/casesSlice";
import { fetchFeedback, createFeedback } from "@/lib/slices/feedbackSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicBreadcrumb } from "@/components/ui/dynamic-breadcrumb";
import AppLayout from "@/components/layout/app-layout";
import {
  Box,
  Plus,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  History,
  BarChart3,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
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

export default function FeatureDetailPage() {
  const params = useParams();
  const featureId = params.featureId;
  const dispatch = useDispatch();
  const { currentFeature } = useSelector((state) => state.features);
  const {
    list: cases,
    status: casesStatus,
    meta,
  } = useSelector((state) => state.cases);
  const {
    list: feedbackList,
    status: feedbackStatus,
    meta: feedbackMeta,
  } = useSelector((state) => state.feedback);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    note: "",
    expectedOutput: "",
  });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ result: "", comment: "" });
  const [historyPage, setHistoryPage] = useState(1);

  const featureAnalytics = {
    totalCases: cases.length || 12,
    passedCases: cases.filter((c) => c.status === "pass").length || 8,
    failedCases: cases.filter((c) => c.status === "fail").length || 2,
    pendingCases: cases.filter((c) => c.status === "pending").length || 2,
    uniqueTesters: 4,
    avgTestTime: "2.5 hrs",
    coverageTimeline: [
      { week: "Week 1", tested: 3, passed: 2, failed: 1 },
      { week: "Week 2", tested: 5, passed: 4, failed: 1 },
      { week: "Week 3", tested: 4, passed: 2, failed: 0 },
    ],
    testerStats: [
      { name: "Alice", tested: 5, passed: 4, failed: 1 },
      { name: "Bob", tested: 4, passed: 3, failed: 1 },
      { name: "Carol", tested: 2, passed: 1, failed: 0 },
      { name: "Dave", tested: 1, passed: 0, failed: 0 },
    ],
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "outline";
      case "in-progress":
        return "default";
      case "pass":
        return "secondary";
      case "fail":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="h-4 w-4" />;
      case "fail":
        return <XCircle className="h-4 w-4" />;
      case "in-progress":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (featureId) {
      dispatch(fetchFeatureById(featureId));
      dispatch(
        fetchCases({
          featureId,
          params: {
            page,
            limit: 10,
            status: statusFilter !== "all" ? statusFilter : "",
          },
        })
      );
    }
  }, [dispatch, featureId, page, statusFilter]);

  useEffect(() => {
    if (historyModalOpen) {
      dispatch(
        fetchFeedback({
          caseId: historyModalOpen,
          params: { page: historyPage, limit: 10 },
        })
      );
    }
  }, [dispatch, historyModalOpen, historyPage]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createCase({ featureId, data: formData })).unwrap();
      setIsCreateOpen(false);
      setFormData({ title: "", note: "", expectedOutput: "" });
      dispatch(fetchCases({ featureId, params: { page: 1, limit: 10 } }));
    } catch (err) {
      console.error("[v0] Failed to create case:", err);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.result || !feedbackModalOpen) return;

    try {
      await dispatch(
        createFeedback({
          caseId: feedbackModalOpen,
          data: feedbackForm,
        })
      ).unwrap();

      setFeedbackForm({ result: "", comment: "" });
      setFeedbackModalOpen(null);

      dispatch(
        fetchCases({
          featureId,
          params: {
            page,
            limit: 10,
            status: statusFilter !== "all" ? statusFilter : "",
          },
        })
      );
    } catch (err) {
      console.error("[v0] Failed to submit feedback:", err);
    }
  };

  if (!currentFeature) {
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

  const breadcrumbItems = [
    { label: "Sessions", href: "/orgs" },
    { label: currentFeature.title },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <DynamicBreadcrumb />

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Box className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{currentFeature.title}</h1>
                <Badge variant={getStatusColor(currentFeature.status)}>
                  {currentFeature.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {currentFeature.description || "No description"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {featureAnalytics.totalCases}
              </div>
              <p className="text-xs text-muted-foreground">
                Test cases created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(
                  (featureAnalytics.passedCases / featureAnalytics.totalCases) *
                    100
                )}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {featureAnalytics.passedCases} passed
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
                {featureAnalytics.failedCases}
              </div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Testers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {featureAnalytics.uniqueTesters}
              </div>
              <p className="text-xs text-muted-foreground">
                Unique contributors
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Test Coverage Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  tested: { label: "Tested", color: "hsl(var(--chart-4))" },
                  passed: { label: "Passed", color: "hsl(var(--chart-2))" },
                  failed: { label: "Failed", color: "hsl(var(--chart-1))" },
                }}
                className="h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={featureAnalytics.coverageTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="tested"
                      stroke="var(--color-tested)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="passed"
                      stroke="var(--color-passed)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="var(--color-failed)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tester Contributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  tested: { label: "Tested", color: "hsl(var(--chart-4))" },
                  passed: { label: "Passed", color: "hsl(var(--chart-2))" },
                  failed: { label: "Failed", color: "hsl(var(--chart-1))" },
                }}
                className="h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={featureAnalytics.testerStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="tested"
                      fill="var(--color-tested)"
                      name="Tested"
                    />
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

        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Test Cases</h2>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Test Case
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>Create Test Case</DialogTitle>
                    <DialogDescription>
                      Add a new test case for this feature
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Test Case Title</Label>
                      <Input
                        id="title"
                        placeholder="Login with valid credentials"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="note">Test Steps / Notes</Label>
                      <Textarea
                        id="note"
                        placeholder="Describe the test steps"
                        value={formData.note}
                        onChange={(e) =>
                          setFormData({ ...formData, note: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expectedOutput">Expected Output</Label>
                      <Textarea
                        id="expectedOutput"
                        placeholder="What should happen when the test passes"
                        value={formData.expectedOutput}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expectedOutput: e.target.value,
                          })
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Case</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {casesStatus === "loading" && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {casesStatus === "succeeded" && cases.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No test cases yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add test cases to start testing this feature
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Test Case
                </Button>
              </CardContent>
            </Card>
          )}

          {casesStatus === "succeeded" && cases.length > 0 && (
            <>
              <div className="space-y-4">
                {cases.map((testCase) => (
                  <Card key={testCase._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Link
                              href={`/cases/${testCase._id}`}
                              className="hover:underline"
                            >
                              <CardTitle className="text-lg">
                                {testCase.title}
                              </CardTitle>
                            </Link>
                            <Badge
                              variant={getStatusColor(testCase.status)}
                              className="flex items-center gap-1"
                            >
                              {getStatusIcon(testCase.status)}
                              {testCase.status}
                            </Badge>
                          </div>
                          {testCase.note && (
                            <CardDescription className="mb-2">
                              {testCase.note}
                            </CardDescription>
                          )}
                          {testCase.expectedOutput && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Expected:</span>{" "}
                              {testCase.expectedOutput}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFeedbackModalOpen(testCase._id)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Add Feedback
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setHistoryModalOpen(testCase._id);
                            setHistoryPage(1);
                          }}
                        >
                          <History className="mr-2 h-4 w-4" />
                          View History
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page === meta.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog
        open={!!feedbackModalOpen}
        onOpenChange={(open) => !open && setFeedbackModalOpen(null)}
      >
        <DialogContent>
          <form onSubmit={handleFeedbackSubmit}>
            <DialogHeader>
              <DialogTitle>Add Test Feedback</DialogTitle>
              <DialogDescription>
                Record the test result and any observations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="result">Test Result</Label>
                <Select
                  value={feedbackForm.result}
                  onValueChange={(value) =>
                    setFeedbackForm({ ...feedbackForm, result: value })
                  }
                >
                  <SelectTrigger id="result">
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-note">Notes (optional)</Label>
                <Textarea
                  id="feedback-note"
                  placeholder="Add any observations or issues found"
                  value={feedbackForm.comment}
                  onChange={(e) =>
                    setFeedbackForm({
                      ...feedbackForm,
                      comment: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFeedbackModalOpen(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!feedbackForm.result}>
                Submit Feedback
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!historyModalOpen}
        onOpenChange={(open) => !open && setHistoryModalOpen(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback History</DialogTitle>
            <DialogDescription>
              All test results for this case
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {feedbackStatus === "loading" && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </div>
            )}

            {feedbackStatus === "succeeded" && feedbackList.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No feedback history yet</p>
              </div>
            )}

            {feedbackStatus === "succeeded" && feedbackList.length > 0 && (
              <>
                <div className="space-y-4">
                  {feedbackList.map((feedback) => (
                    <Card key={feedback._id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={getStatusColor(feedback.result)}
                            className="flex items-center gap-1"
                          >
                            {getStatusIcon(feedback.result)}
                            {feedback.result}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(feedback.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </CardHeader>
                      {feedback.comment && (
                        <CardContent>
                          <p className="text-sm">{feedback.comment}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>

                {feedbackMeta.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyPage === 1}
                      onClick={() => setHistoryPage(historyPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {historyPage} of {feedbackMeta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyPage === feedbackMeta.totalPages}
                      onClick={() => setHistoryPage(historyPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
