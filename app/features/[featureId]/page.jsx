"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { fetchFeatureById } from "@/lib/slices/featuresSlice";
import { fetchCases, createCase } from "@/lib/slices/casesSlice";
import { fetchFeedback, createFeedback } from "@/lib/slices/feedbackSlice";
import { realApi } from "@/lib/realApi";
import toast from "react-hot-toast";
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
  Trash2,
  Edit,
  Upload,
  Copy,
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
    sortOrder: 0,
  });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ result: "", comment: "" });
  const [historyPage, setHistoryPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ title: "", description: "" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkJsonData, setBulkJsonData] = useState("");
  const [isBulkCreating, setIsBulkCreating] = useState(false);

  const bulkImportTemplate = JSON.stringify([
    {
      title: "Test case 1",
      note: "Test steps for case 1",
      expectedOutput: "Expected result for case 1",
      sortOrder: 0
    },
    {
      title: "Test case 2",
      note: "Test steps for case 2",
      expectedOutput: "Expected result for case 2",
      sortOrder: 1
    },
    {
      title: "Test case 3",
      note: "Test steps for case 3",
      expectedOutput: "Expected result for case 3",
      sortOrder: 2
    }
  ], null, 2);

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
    setIsCreating(true);
    try {
      await dispatch(createCase({ featureId, data: formData })).unwrap();
      setIsCreateOpen(false);
      setFormData({ title: "", note: "", expectedOutput: "", sortOrder: 0 });
      dispatch(fetchCases({ featureId, params: { page: 1, limit: 10 } }));
    } catch (err) {
      console.error("[v0] Failed to create case:", err);
    } finally {
      setIsCreating(false);
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

  const handleDeleteCase = async () => {
    if (!deleteModalOpen) return;

    setIsDeleting(true);
    try {
      await realApi.cases.delete(deleteModalOpen);
      setDeleteModalOpen(null);
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
      console.error("[v0] Failed to delete case:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditFeature = () => {
    setEditFormData({
      title: currentFeature.title || "",
      description: currentFeature.description || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdateFeature = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await realApi.features.update(featureId, editFormData);
      setIsEditOpen(false);
      dispatch(fetchFeatureById(featureId));
    } catch (err) {
      console.error("Failed to update feature:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    setIsBulkCreating(true);
    try {
      const parsedData = JSON.parse(bulkJsonData);
      if (!Array.isArray(parsedData)) {
        throw new Error("JSON must be an array of test cases");
      }

      await realApi.cases.bulkCreate(featureId, parsedData);
      setIsBulkImportOpen(false);
      setBulkJsonData("");
      dispatch(fetchCases({ featureId, params: { page: 1, limit: 10 } }));
    } catch (err) {
      console.error("Failed to bulk import cases:", err);
      alert(err.message || "Failed to parse JSON or import cases");
    } finally {
      setIsBulkCreating(false);
    }
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(bulkImportTemplate);
      toast.success("Template copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy template:", err);
      toast.error("Failed to copy template");
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

  const breadcrumbItems = currentFeature?.sessionId
    ? [
        {
          label: currentFeature.sessionId.orgId?.name || "Organization",
          href: `/orgs/${currentFeature.sessionId.orgId?._id}`
        },
        {
          label: currentFeature.sessionId.title || "Session",
          href: `/sessions/${currentFeature.sessionId._id}`
        },
        { label: currentFeature.title },
      ]
    : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <DynamicBreadcrumb />

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <Box className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold break-words">{currentFeature.title}</h1>
              <Badge variant={getStatusColor(currentFeature.status)}>
                {currentFeature.status}
              </Badge>
              <Button variant="ghost" size="icon" onClick={handleEditFeature}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground break-words">
              {currentFeature.description || "No description"}
            </p>
          </div>
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

            <div className="flex gap-2">
              <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0">
                  <form onSubmit={handleBulkImport} className="flex flex-col h-full">
                    <div className="px-6 pt-6 flex-shrink-0">
                      <DialogHeader>
                        <DialogTitle>Bulk Import Test Cases</DialogTitle>
                        <DialogDescription>
                          Paste a JSON array of test cases. Each case should have: title (required), note, expectedOutput, and sortOrder (optional).
                        </DialogDescription>
                      </DialogHeader>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="bulk-json">JSON Array</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyTemplate}
                            className="h-8"
                          >
                            <Copy className="mr-2 h-3 w-3" />
                            Copy Template
                          </Button>
                        </div>
                        <Textarea
                          id="bulk-json"
                          placeholder={bulkImportTemplate}
                          value={bulkJsonData}
                          onChange={(e) => setBulkJsonData(e.target.value)}
                          className="font-mono text-sm min-h-[500px] resize-none"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum 100 test cases per import. Click "Copy Template" to get started with a sample structure.
                        </p>
                      </div>
                    </div>
                    <div className="px-6 pb-6 flex-shrink-0 border-t bg-background">
                      <DialogFooter className="mt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsBulkImportOpen(false)}
                          disabled={isBulkCreating}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isBulkCreating}>
                          {isBulkCreating ? "Importing..." : "Import Cases"}
                        </Button>
                      </DialogFooter>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

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
                    <div className="space-y-2">
                      <Label htmlFor="sortOrder">Sort Order (optional)</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        placeholder="0"
                        value={formData.sortOrder}
                        onChange={(e) =>
                          setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                        }
                      />
                      <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Creating..." : "Create Case"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            </div>
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
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className="text-xs font-mono">
                              #{testCase.sortOrder || 0}
                            </Badge>
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
                      <div className="flex gap-2 flex-wrap">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteModalOpen(testCase._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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

      <Dialog
        open={!!deleteModalOpen}
        onOpenChange={(open) => !open && setDeleteModalOpen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Test Case</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this test case? This will permanently delete the test case and all related feedback and progress data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteCase}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateFeature}>
            <DialogHeader>
              <DialogTitle>Edit Feature</DialogTitle>
              <DialogDescription>
                Update the feature title and description
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Feature"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
