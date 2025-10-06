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
import { Plus, Calendar, PlayCircle } from "lucide-react";

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
          params: { page, limit: 10, status: statusFilter },
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
      console.error("[v0] Failed to create session:", err);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
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
          <div className="space-y-4">
            {list.map((session) => (
              <Link key={session._id} href={`/sessions/${session._id}`}>
                <Card className="transition-colors hover:bg-accent cursor-pointer">
                  <CardHeader>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">
                            {session.title}
                          </CardTitle>
                          <Badge variant={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {session?.description || "No description"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {session.startDate
                            ? formatLocalDate(session.startDate)
                            : "No start date"}{" "}
                          -{" "}
                          {session.endDate
                            ? formatLocalDate(session.endDate)
                            : "No end date"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
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
  );
}
