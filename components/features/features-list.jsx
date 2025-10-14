"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeatures, createFeature } from "@/lib/slices/featuresSlice";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Box } from "lucide-react";

export default function FeaturesList({ sessionId }) {
  const dispatch = useDispatch();
  const { list, status, meta } = useSelector((state) => state.features);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (sessionId) {
      dispatch(fetchFeatures({ sessionId, params: { page, limit: 10 } }));
    }
  }, [dispatch, sessionId, page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createFeature({ sessionId, data: formData })).unwrap();
      setIsCreateOpen(false);
      setFormData({ title: "", description: "" });
      dispatch(fetchFeatures({ sessionId, params: { page: 1, limit: 10 } }));
    } catch (err) {
      console.error("[v0] Failed to create feature:", err);
    }
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Features</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Feature
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Feature</DialogTitle>
                <DialogDescription>
                  Add a new feature to test in this session
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Feature Title</Label>
                  <Input
                    id="title"
                    placeholder="User Authentication"
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
                    placeholder="Describe what this feature does"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
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
                <Button type="submit">Create Feature</Button>
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
            <Box className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No features yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add features to start testing
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Feature
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "succeeded" && list.length > 0 && (
        <>
          <div className="space-y-4">
            {list.map((feature) => (
              <Link key={feature._id} href={`/features/${feature._id}`}>
                <Card className="transition-colors hover:bg-accent cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className="text-xs font-mono">
                            #{feature.sortOrder || 0}
                          </Badge>
                          <CardTitle className="text-lg">
                            {feature.title}
                          </CardTitle>
                          <Badge variant={getStatusColor(feature.status)}>
                            {feature.status}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {feature.description || "No description"}
                        </CardDescription>
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
