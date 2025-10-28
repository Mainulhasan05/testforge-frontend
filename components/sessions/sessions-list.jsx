"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSessions, createSession } from "@/lib/slices/sessionsSlice";
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
import { Badge } from "@/components/ui/badge";
import { formatLocalDate } from "@/lib/utils/time";
import Link from "next/link";
import {
  Plus,
  Calendar,
  PlayCircle,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Activity,
  TrendingUp
} from "lucide-react";

export default function SessionsList({ orgId }) {
  const dispatch = useDispatch();
  const { list, status, meta } = useSelector((state) => state.sessions);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "active",
    startDate: "",
    endDate: "",
  });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (orgId) {
      dispatch(
        fetchSessions({
          orgId,
          params: {
            page,
            limit: 10,
            status: statusFilter == "all" ? "" : statusFilter,
          },
        })
      );
    }
  }, [dispatch, orgId, page, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createSession({ orgId, data: formData })).unwrap();
      setIsCreateOpen(false);
      setFormData({
        title: "",
        description: "",
        status: "active",
        startDate: "",
        endDate: "",
      });
      dispatch(fetchSessions({ orgId, params: { page: 1, limit: 10 } }));
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { variant: "default", icon: Activity, color: "text-green-600" },
      completed: { variant: "secondary", icon: CheckCircle2, color: "text-blue-600" },
      planned: { variant: "outline", icon: Clock, color: "text-orange-600" },
      archived: { variant: "outline", icon: null, color: "text-gray-600" },
    };
    return config[status] || config.active;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          {meta?.total > 0 && (
            <span className="text-sm text-muted-foreground">
              {meta.total} {meta.total === 1 ? 'session' : 'sessions'}
            </span>
          )}
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Test Session</DialogTitle>
                <DialogDescription>
                  Add a new test session to track features and test cases
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Session Title</Label>
                  <Input
                    id="title"
                    placeholder="Sprint 1 Testing"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the scope and goals of this test session"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Button type="submit">Create Session</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {status === "loading" && (
        <div className="grid grid-cols-1 gap-4">
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

      {status === "succeeded" && list.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PlayCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first test session to get started
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "succeeded" && list.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {list.map((session) => {
              const statusConfig = getStatusBadge(session.status);
              const StatusIcon = statusConfig.icon;
              const progressPercent = session.completedCases && session.totalCases
                ? Math.round((session.completedCases / session.totalCases) * 100)
                : 0;

              return (
                <Link key={session._id} href={`/sessions/${session._id}`}>
                  <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/60 cursor-pointer group overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                            {session.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                            {session?.description || "No description provided"}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={statusConfig.variant}
                          className="flex items-center gap-1.5 px-3 py-1 shrink-0"
                        >
                          {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
                          <span className="capitalize font-medium">{session.status}</span>
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">Overall Progress</span>
                          <span className="text-xs font-bold text-primary">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Features</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {session.totalFeatures || 0}
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-300">Test Cases</span>
                          </div>
                          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {session.totalCases || 0}
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Testers</span>
                          </div>
                          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                            {session.assignedTo?.length || 0}
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Completed</span>
                          </div>
                          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                            {session.completedCases || 0}
                          </div>
                        </div>
                      </div>

                      {/* Date Info */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {session.startDate
                            ? formatLocalDate(session.startDate)
                            : "No start"}{" "}
                          →{" "}
                          {session.endDate
                            ? formatLocalDate(session.endDate)
                            : "No end"}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
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
  );
}
