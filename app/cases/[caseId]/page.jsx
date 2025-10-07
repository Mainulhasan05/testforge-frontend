"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { fetchCaseById, updateCase, deleteCase } from "@/lib/slices/casesSlice";
import {
  fetchFeedback,
  createFeedback,
  deleteFeedback,
} from "@/lib/slices/feedbackSlice";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AppLayout from "@/components/layout/app-layout";
import { formatLocalDateTime } from "@/lib/utils/time";
import {
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
} from "lucide-react";

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId;
  const dispatch = useDispatch();
  const { currentCase } = useSelector((state) => state.cases);
  const {
    list: feedback,
    status: feedbackStatus,
    meta,
  } = useSelector((state) => state.feedback);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ result: "pass", comment: "" });
  const [editFormData, setEditFormData] = useState({
    title: "",
    note: "",
    expectedOutput: "",
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteCaseOpen, setIsDeleteCaseOpen] = useState(false);
  const [deleteFeedbackId, setDeleteFeedbackId] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (caseId) {
      dispatch(fetchCaseById(caseId));
      dispatch(fetchFeedback({ caseId, params: { page, limit: 10 } }));
    }
  }, [dispatch, caseId, page]);

  useEffect(() => {
    if (currentCase) {
      setEditFormData({
        title: currentCase.title || "",
        note: currentCase.note || "",
        expectedOutput: currentCase.expectedOutput || "",
      });
    }
  }, [currentCase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createFeedback({ caseId, data: formData })).unwrap();
      setFormData({ result: "pass", comment: "" });
      dispatch(fetchFeedback({ caseId, params: { page: 1, limit: 10 } }));
      dispatch(fetchCaseById(caseId));
    } catch (err) {
      console.error("[v0] Failed to create feedback:", err);
    }
  };

  const handleUpdateCase = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateCase({ caseId, data: editFormData })).unwrap();
      setIsEditOpen(false);
    } catch (err) {
      console.error("[v0] Failed to update case:", err);
    }
  };

  const handleDeleteCase = async () => {
    try {
      await dispatch(deleteCase(caseId)).unwrap();
      router.push(`/features/${currentCase.featureId}`);
    } catch (err) {
      console.error("[v0] Failed to delete case:", err);
    }
  };

  const handleDeleteFeedback = async () => {
    if (!deleteFeedbackId) return;
    try {
      await dispatch(deleteFeedback(deleteFeedbackId)).unwrap();
      setDeleteFeedbackId(null);
      dispatch(fetchFeedback({ caseId, params: { page, limit: 10 } }));
    } catch (err) {
      console.error("[v0] Failed to delete feedback:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "outline";
      case "pass":
        return "secondary";
      case "fail":
        return "destructive";
      default:
        return "outline";
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

  if (!currentCase) {
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
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{currentCase.title}</h1>
                <Badge variant={getStatusColor(currentCase.status)}>
                  {currentCase.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteCaseOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Test Steps / Notes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentCase.note || "No notes provided"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Expected Output</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentCase.expectedOutput ||
                      "No expected output specified"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Feedback History
                </CardTitle>
                <CardDescription>
                  Test results and comments from team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackStatus === "loading" && (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {feedbackStatus === "succeeded" && feedback.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No feedback yet
                  </p>
                )}

                {feedbackStatus === "succeeded" && feedback.length > 0 && (
                  <div className="space-y-4">
                    {feedback.map((item) => (
                      <div
                        key={item._id}
                        className="flex gap-4 pb-4 border-b last:border-0"
                      >
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(item?.testerId?.fullName || "U")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">
                              {item?.testerId?.fullName || "Unknown User"}
                            </p>
                            <Badge
                              variant={
                                item.result === "pass"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {item.result === "pass" ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {item.result}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatLocalDateTime(item.createdAt)}
                            </span>
                            {currentUser &&
                              item?.testerId?._id === currentUser.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 ml-auto"
                                  onClick={() => setDeleteFeedbackId(item._id)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.comment}
                          </p>
                        </div>
                      </div>
                    ))}

                    {meta.totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                        >
                          Previous
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Page {page} of {meta.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === meta.totalPages}
                          onClick={() => setPage(page + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Add Feedback</CardTitle>
                <CardDescription>Record your test results</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="result">Result</Label>
                    <Select
                      value={formData.result}
                      onValueChange={(value) =>
                        setFormData({ ...formData, result: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment">Comment</Label>
                    <Textarea
                      id="comment"
                      placeholder="Add your observations and notes"
                      value={formData.comment}
                      onChange={(e) =>
                        setFormData({ ...formData, comment: e.target.value })
                      }
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Submit Feedback
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateCase}>
            <DialogHeader>
              <DialogTitle>Edit Test Case</DialogTitle>
              <DialogDescription>
                Update the test case details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Test Case Title</Label>
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
                <Label htmlFor="edit-note">Test Steps / Notes</Label>
                <Textarea
                  id="edit-note"
                  value={editFormData.note}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, note: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expectedOutput">Expected Output</Label>
                <Textarea
                  id="edit-expectedOutput"
                  value={editFormData.expectedOutput}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
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
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteCaseOpen} onOpenChange={setIsDeleteCaseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test Case?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this test case and all its feedback
              history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCase}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteFeedbackId}
        onOpenChange={() => setDeleteFeedbackId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this feedback entry. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFeedback}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
