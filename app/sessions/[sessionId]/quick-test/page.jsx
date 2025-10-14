"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

  // Refs for scroll position preservation
  const scrollPositionRef = useRef(0);
  const containerRef = useRef(null);

  // Save scroll position and expanded state to sessionStorage
  const saveUIState = useCallback(() => {
    if (typeof window !== 'undefined') {
      const state = {
        scrollPosition: window.scrollY,
        expandedFeatures,
        statusFilter,
      };
      sessionStorage.setItem(`quickTest_${sessionId}`, JSON.stringify(state));
    }
  }, [sessionId, expandedFeatures, statusFilter]);

  // Restore UI state after data loads
  const restoreUIState = useCallback(() => {
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem(`quickTest_${sessionId}`);
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          if (state.expandedFeatures?.length > 0) {
            setExpandedFeatures(state.expandedFeatures);
          }
          if (state.statusFilter) {
            setStatusFilter(state.statusFilter);
          }
          // Restore scroll position after a brief delay to ensure content is rendered
          setTimeout(() => {
            window.scrollTo(0, state.scrollPosition || 0);
          }, 100);
        } catch (e) {
          console.error("Failed to restore UI state:", e);
        }
      }
    }
  }, [sessionId]);

  const loadDashboard = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      // Save current state before reloading
      if (dashboardData) {
        saveUIState();
      }

      const response = await realApi.sessions.getDashboard(sessionId);
      setDashboardData(response.data);

      // Only set default expanded state on first load
      if (!dashboardData && response.data.features.length > 0) {
        const savedState = sessionStorage.getItem(`quickTest_${sessionId}`);
        if (!savedState) {
          setExpandedFeatures([response.data.features[0]._id]);
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      toast.error("Failed to load session data");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadDashboard();
    }
  }, [sessionId]);

  // Restore UI state after dashboard data loads
  useEffect(() => {
    if (dashboardData && !loading) {
      restoreUIState();
    }
  }, [dashboardData, loading, restoreUIState]);

  // Save state before unmount
  useEffect(() => {
    return () => {
      if (dashboardData) {
        saveUIState();
      }
    };
  }, [dashboardData, saveUIState]);

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

    // Save current UI state
    saveUIState();

    // Optimistic update - update local state immediately
    if (dashboardData) {
      const updatedFeatures = dashboardData.features.map(feature => ({
        ...feature,
        cases: feature.cases.map(testCase => {
          if (testCase._id === caseId) {
            const updatedFeedback = isUpdate && testCase.userFeedback
              ? { ...testCase.userFeedback, result, comment: feedbackComment || `Marked as ${result}` }
              : { _id: feedbackId || 'temp', result, comment: feedbackComment || `Marked as ${result}`, testerId: {} };

            return {
              ...testCase,
              userFeedback: updatedFeedback
            };
          }
          return testCase;
        })
      }));

      setDashboardData(prev => ({
        ...prev,
        features: updatedFeatures
      }));
    }

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

      // Silent reload to update progress stats without losing position
      await loadDashboard(true);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error(error.message || "Failed to submit feedback");

      // Revert optimistic update on error
      await loadDashboard(true);
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

  if (loading && !dashboardData) {
    return (
      <AppLayout>
        <DynamicBreadcrumb />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading session data...</p>
          </div>
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

  const breadcrumbItems = session?.orgId?._id
    ? [
        { label: session.orgId.name || "Organization", href: `/orgs/${session.orgId._id}` },
        { label: session.title, href: `/sessions/${sessionId}` },
        { label: "Quick Test Mode" }
      ]
    : null;

  return (
    <AppLayout>
      <DynamicBreadcrumb items={breadcrumbItems} />
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">Quick Test Mode</h1>
            <p className="text-sm text-muted-foreground break-words">{session.title}</p>
          </div>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Your Testing Progress</CardTitle>
                <CardDescription>Click Pass/Fail to submit. Click again to update.</CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2 bg-background">{stats.progressPercentage}% Complete</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Progress value={stats.progressPercentage} className="h-3" />
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.passedCases}</p>
                  <p className="text-xs text-green-600/70 dark:text-green-500/70">Passed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.failedCases}</p>
                  <p className="text-xs text-red-600/70 dark:text-red-500/70">Failed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-700/30">
                <Clock className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                <div>
                  <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{stats.untestedCases}</p>
                  <p className="text-xs text-slate-600/70 dark:text-slate-400/70">Untested</p>
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
                <AccordionItem key={feature._id} value={feature._id} className="border border-border/50 rounded-lg shadow-sm bg-card">
                  <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/30 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between w-full pr-4 flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-foreground break-words">{feature.title}</h3>
                        <Badge variant="outline" className="bg-background flex-shrink-0">{feature.stats.tested}/{feature.stats.total} tested</Badge>
                      </div>
                      {feature.description && <p className="text-sm text-muted-foreground max-w-md truncate break-words overflow-hidden">{feature.description}</p>}
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
                          const borderColor = myFeedback
                            ? (myFeedback.result === "pass"
                              ? "rgb(34 197 94 / 0.5)"
                              : "rgb(239 68 68 / 0.5)")
                            : "rgb(148 163 184 / 0.3)";
                          return (
                            <Card key={testCase._id} className="border-l-4 border-border/40 shadow-sm hover:shadow-md transition-shadow" style={{
                              borderLeftColor: borderColor,
                            }}>
                              <CardContent className="pt-4 pb-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0 break-words overflow-hidden">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <h4 className="font-medium text-foreground break-words">{testCase.title}</h4>
                                      {isTested && <Badge variant={getStatusColor(myFeedback.result)} className="flex items-center gap-1 flex-shrink-0">
                                        {getStatusIcon(myFeedback.result)}{myFeedback.result}
                                      </Badge>}
                                    </div>
                                    {testCase.note && <p className="text-sm text-muted-foreground mb-1 break-words"><span className="font-medium">Steps:</span> {testCase.note}</p>}
                                    {testCase.expectedOutput && <p className="text-sm text-muted-foreground mb-1 break-words"><span className="font-medium">Expected:</span> {testCase.expectedOutput}</p>}
                                    {isTested && myFeedback.comment && <p className="text-sm text-foreground/80 mt-3 p-3 bg-muted/50 rounded-md border border-border/30 break-words"><span className="font-medium">Your comment:</span> {myFeedback.comment}</p>}
                                  </div>
                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    <Button size="sm" variant={myFeedback?.result === "pass" ? "default" : "outline"}
                                      className={myFeedback?.result === "pass" ? "bg-green-600 hover:bg-green-700 border-0" : "border-green-500/50 text-green-700 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-600"}
                                      onClick={() => handleQuickFeedback(testCase, "pass")} disabled={submittingFeedback[testCase._id]}>
                                      <CheckCircle2 className="mr-2 h-4 w-4" />{myFeedback?.result === "pass" ? "Passed" : "Pass"}
                                    </Button>
                                    <Button size="sm" variant={myFeedback?.result === "fail" ? "destructive" : "outline"}
                                      className={myFeedback?.result === "fail" ? "" : "border-red-500/50 text-red-700 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-600"}
                                      onClick={() => handleQuickFeedback(testCase, "fail")} disabled={submittingFeedback[testCase._id]}>
                                      <XCircle className="mr-2 h-4 w-4" />{myFeedback?.result === "fail" ? "Failed" : "Fail"}
                                    </Button>
                                    {isTested && <Button size="sm" variant="ghost" className="hover:bg-muted/50" onClick={() => {
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
