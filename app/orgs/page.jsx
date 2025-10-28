"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrgs, createOrg } from "@/lib/slices/orgsSlice";
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
import { formatLocalDateTime } from "@/lib/utils/time";
import Link from "next/link";
import {
  Plus,
  Building2,
  Users,
  Crown,
  Shield,
  UserCheck,
  Calendar,
  ArrowRight,
  Sparkles
} from "lucide-react";
import AppLayout from "@/components/layout/app-layout";

export default function OrgsPage() {
  const dispatch = useDispatch();
  const { list, status, meta } = useSelector((state) => state.orgs);
  const { user } = useSelector((state) => state.auth);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchOrgs({ page, limit: 10 }));
  }, [dispatch, page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createOrg(formData)).unwrap();
      setIsCreateOpen(false);
      setFormData({ name: "", description: "" });
      dispatch(fetchOrgs({ page: 1, limit: 10 }));
    } catch (err) {
      console.error("[v0] Failed to create org:", err);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "member":
        return <UserCheck className="h-4 w-4" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      case "member":
        return "outline";
      default:
        return "outline";
    }
  };

  const getUserRole = (org) => {
    if (!user) return null;
    const userOrg = user.organizations?.find((o) => o.orgId === org._id);
    return userOrg?.role || "member";
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Organizations
              </h1>
            </div>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage your organizations, teams, and testing workflows
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Create Organization</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create Organization</DialogTitle>
                  <DialogDescription>
                    Add a new organization to manage your test sessions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      placeholder="Acme Inc."
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of your organization"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
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
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {status === "loading" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full rounded-lg mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {status === "succeeded" && list.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
                  <Building2 className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-center">
                No organizations yet
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Get started by creating your first organization to manage teams, sessions, and test workflows
              </p>
              <Button
                size="lg"
                onClick={() => setIsCreateOpen(true)}
                className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
              >
                <Sparkles className="h-5 w-5" />
                Create Your First Organization
              </Button>
            </CardContent>
          </Card>
        )}

        {status === "succeeded" && list.length > 0 && (
          <>
            {/* Organization count */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-3 py-1.5">
                  <Building2 className="h-3.5 w-3.5 mr-1.5" />
                  {meta?.total || list.length} {meta?.total === 1 ? 'Organization' : 'Organizations'}
                </Badge>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {list.map((org) => {
                const userRole = getUserRole(org);
                const RoleIcon = userRole ? getRoleIcon(userRole) : null;

                return (
                  <Link key={org?._id} href={`/orgs/${org?._id}`}>
                    <Card className="group h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/60 cursor-pointer overflow-hidden relative">
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Top gradient accent */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                      <CardHeader className="relative pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 group-hover:from-primary/30 group-hover:to-purple-500/30 transition-all">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                          {userRole && (
                            <Badge
                              variant={getRoleBadgeVariant(userRole)}
                              className="flex items-center gap-1 px-3 py-1 font-medium"
                            >
                              {RoleIcon}
                              <span className="capitalize">{userRole}</span>
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors flex items-center gap-2">
                            {org?.name}
                            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </CardTitle>
                          <CardDescription className="line-clamp-2 leading-relaxed min-h-[2.5rem]">
                            {org?.description || "No description provided"}
                          </CardDescription>
                        </div>
                      </CardHeader>

                      <CardContent className="relative">
                        <div className="space-y-3">
                          {/* Stats section */}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-100 dark:border-blue-900/30">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-white dark:bg-gray-800">
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Members</p>
                                <p className="text-sm font-bold">{org?.membersCount || 0}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Your Role</p>
                              <p className="text-sm font-semibold capitalize text-primary">
                                {userRole || "Member"}
                              </p>
                            </div>
                          </div>

                          {/* Creation date */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Created {formatLocalDateTime(org?.createdAt)}</span>
                          </div>

                          {/* View indicator */}
                          <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-secondary/50 group-hover:bg-primary group-hover:text-primary-foreground transition-all text-sm font-medium">
                            View Organization
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
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
    </AppLayout>
  );
}
