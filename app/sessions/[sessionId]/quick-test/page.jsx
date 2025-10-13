"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "next/navigation";
import { createFeedback, updateFeedback } from "@/lib/slices/feedbackSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicBreadcrumb } from "@/components/ui/dynamic-breadcrumb";
import AppLayout from "@/components/layout/app-layout";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Filter,
  BarChart3,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { realApi } from "@/lib/realApi";

export default function QuickTestPage() {
  const params = useParams();
  const sessionId = params.sessionId;
  const dispatch = useDispatch();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingFeedback, setSubmittingFeedback] = useState({});
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState(null);
  const [comment, setComment] = useState("");
  const [selectedResult, setSelectedResult] = useState("pass");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedFeatures, setExpandedFeatures] = useState([]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await realApi.sessions.getDashboard(sessionId);
      setDashboardData(response.data);
      if (response.data.features.length > 0) {
        setExpandedFeatures([response.data.features[0]._id]);
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      toast.error("Failed to load session data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadDashboard();
    }
  }, [sessionId]);

  const handleQuickFeedback = async (testCase, result) => {
    const userFeedback = testCase.userFeedback;
    if (userFeedback) {
      setPendingFeedback({
        caseId: testCase._id,
        result,
        feedbackId: userFeedback._id,
        isUpdate: true,
      });
      setSelectedResult(userFeedback.result);
      setComment(userFeedback.comment || "");
      setCommentModalOpen(true);
    } else {
      if (result === "fail") {
        setPendingFeedback({
          caseId: testCase._id,
          result,
          isUpdate: false,
        });
        setSelectedResult(result);
        setComment("");
        setCommentModalOpen(true);
      } else {
        await submitFeedback(testCase._id, result, `Marked as ${result}`, false);
      }
    }
  };

  const submitFeedback = async (caseId, result, feedbackComment, isUpdate = false, feedbackId = null) => {
    setSubmittingFeedback((prev) => ({ ...prev, [caseId]: true }));
    try {
      if (isUpdate && feedbackId) {
        await dispatch(updateFeedback({
          feedbackId,
          data: { result, comment: feedbackComment || `Marked as ${result}` },
        })).unwrap();
        toast.success("Test result updated");
      } else {
        await dispatch(createFeedback({
          caseId,
          data: { result, comment: feedbackComment || `Marked as ${result}` },
        })).unwrap();
        toast.success(`Test case marked as ${result}`);
      }
      await loadDashboard();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setSubmittingFeedback((prev) => ({ ...prev, [caseId]: false }));
    }
  };

  const handleCommentSubmit = async () => {
    if (!pendingFeedback) return;
    await submitFeedback(pendingFeedback.caseId, selectedResult, comment, pendingFeedback.isUpdate, pendingFeedback.feedbackId);
    setCommentModalOpen(false);
    setPendingFeedback(null);
    setComment("");
    setSelectedResult("pass");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pass": return "secondary";
      case "fail": return "destructive";
      default: return "outline";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pass": return <CheckCircle2 className="h-4 w-4" />;
      case "fail": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getFilteredCases = (cases) => {
    if (statusFilter === "all") return cases;
    if (statusFilter === "tested") return cases.filter((c) => c.userFeedback);
    if (statusFilter === "untested") return cases.filter((c) => !c.userFeedback);
    return cases.filter((c) => c.userFeedback?.result === statusFilter);
  };

  if (loading) {
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

  if (!dashboardData) {
    return (
      <AppLayout>
        <DynamicBreadcrumb />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load session data</p>
        </div>
      </AppLayout>
    );
  }

  const { session, features, stats } = dashboardData;

  return (
    <AppLayout>
      <DynamicBreadcrumb />
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Quick Test Mode</h1>
                <p className="text-sm text-muted-foreground">{session.title}</p>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Testing Progress</CardTitle>
                <CardDescription>Click Pass/Fail to submit. Click again to update.</CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">{stats.progressPercentage}% Complete</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={stats.progressPercentage} className="h-2" />
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.passedCases}</p>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.failedCases}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-600">{stats.untestedCases}</p>
                  <p className="text-xs text-muted-foreground">Untested</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                <SelectItem value="untested">Untested Only</SelectItem>
                <SelectItem value="tested">Tested</SelectItem>
                <SelectItem value="pass">Passed Only</SelectItem>
                <SelectItem value="fail">Failed Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            if (expandedFeatures.length === features.length) {
              setExpandedFeatures([]);
            } else {
              setExpandedFeatures(features.map((f) => f._id));
            }
          }}>
            {expandedFeatures.length === features.length ? "Collapse All" : "Expand All"}
          </Button>
        </div>

        {features.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No features to test</h3>
              <p className="text-sm text-muted-foreground">Add features to this session to start testing</p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" value={expandedFeatures} onValueChange={setExpandedFeatures} className="space-y-4">
            {features.map((feature) => {
              const filteredCases = getFilteredCases(feature.cases);
              return (
                <AccordionItem key={feature._id} value={feature._id} className="border rounded-lg">
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                        <Badge variant="outline">{feature.stats.tested}/{feature.stats.total} tested</Badge>
                      </div>
                      {feature.description && <p className="text-sm text-muted-foreground max-w-md truncate">{feature.description}</p>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    {filteredCases.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {statusFilter === "all" ? "No test cases in this feature" : `No ${statusFilter} test cases`}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {filteredCases.map((testCase) => {
                          const myFeedback = testCase.userFeedback;
                          const isTested = !!myFeedback;
                          return (
                            <Card key={testCase._id} className="border-l-4" style={{
                              borderLeftColor: myFeedback ? (myFeedback.result === "pass" ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))") : "hsl(var(--border))",
                            }}>
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-medium">{testCase.title}</h4>
                                      {isTested && <Badge variant={getStatusColor(myFeedback.result)} className="flex items-center gap-1">
                                        {getStatusIcon(myFeedback.result)}{myFeedback.result}
                                      </Badge>}
                                    </div>
                                    {testCase.note && <p className="text-sm text-muted-foreground mb-1"><span className="font-medium">Steps:</span> {testCase.note}</p>}
                                    {testCase.expectedOutput && <p className="text-sm text-muted-foreground mb-1"><span className="font-medium">Expected:</span> {testCase.expectedOutput}</p>}
                                    {isTested && myFeedback.comment && <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded"><span className="font-medium">Your comment:</span> {myFeedback.comment}</p>}
                                  </div>
                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    <Button size="sm" variant={myFeedback?.result === "pass" ? "default" : "outline"}
                                      className={myFeedback?.result === "pass" ? "" : "border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"}
                                      onClick={() => handleQuickFeedback(testCase, "pass")} disabled={submittingFeedback[testCase._id]}>
                                      <CheckCircle2 className="mr-2 h-4 w-4" />{myFeedback?.result === "pass" ? "Passed" : "Pass"}
                                    </Button>
                                    <Button size="sm" variant={myFeedback?.result === "fail" ? "destructive" : "outline"}
                                      className={myFeedback?.result === "fail" ? "" : "border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"}
                                      onClick={() => handleQuickFeedback(testCase, "fail")} disabled={submittingFeedback[testCase._id]}>
                                      <XCircle className="mr-2 h-4 w-4" />{myFeedback?.result === "fail" ? "Failed" : "Fail"}
                                    </Button>
                                    {isTested && <Button size="sm" variant="ghost" onClick={() => {
                                      setPendingFeedback({ caseId: testCase._id, feedbackId: myFeedback._id, isUpdate: true });
                                      setSelectedResult(myFeedback.result);
                                      setComment(myFeedback.comment || "");
                                      setCommentModalOpen(true);
                                    }}>
                                      <Edit className="mr-2 h-4 w-4" />Edit
                                    </Button>}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      <Dialog open={commentModalOpen} onOpenChange={setCommentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingFeedback?.isUpdate ? "Update Test Result" : "Add Test Result"}</DialogTitle>
            <DialogDescription>{pendingFeedback?.isUpdate ? "Update your test result and feedback" : "Add detailed feedback for this test case"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="result">Result</Label>
              <Select value={selectedResult} onValueChange={setSelectedResult}>
                <SelectTrigger id="result"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea id="comment" placeholder="Describe what you observed, any issues, or notes..." value={comment} onChange={(e) => setComment(e.target.value)} rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setCommentModalOpen(false);
              setPendingFeedback(null);
              setComment("");
              setSelectedResult("pass");
            }}>Cancel</Button>
            <Button onClick={handleCommentSubmit} disabled={!pendingFeedback}>{pendingFeedback?.isUpdate ? "Update" : "Submit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
