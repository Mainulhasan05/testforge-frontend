"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { fetchOrgById, fetchOrgMembers } from "@/lib/slices/orgsSlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/app-layout";
import SessionsList from "@/components/sessions/sessions-list";
import MembersList from "@/components/orgs/members-list";
import OrgSettings from "@/components/orgs/org-settings";
import ActivityFeed from "@/components/activity/activity-feed";
import {
  Building2,
  AlertCircle,
  TrendingUp,
  Users,
  PlayCircle,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  Target,
  Activity
} from "lucide-react";
import { useRouter } from "next/navigation";
import { realApi } from "@/lib/realApi";

export default function OrgDetailPage() {
  const params = useParams();
  const orgId = params.orgId;
  const router = useRouter();
  const dispatch = useDispatch();
  const { currentOrg, members } = useSelector((state) => state.orgs);
  const [activeTab, setActiveTab] = useState("sessions");
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (orgId) {
      dispatch(fetchOrgById(orgId));
      dispatch(fetchOrgMembers(orgId));
      loadStats();
    }
  }, [dispatch, orgId]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await realApi.orgs.getStats(orgId);
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!currentOrg || loadingStats) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  const StatCard = ({ title, value, icon: Icon, trend, color = "text-primary", bgColor = "bg-primary/10" }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-bold">{value}</h3>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{currentOrg.name}</h1>
              <p className="text-muted-foreground mt-1">
                {currentOrg.description || "No description"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {members.length} members
                </Badge>
                {stats && stats.sessions.active > 0 && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {stats.sessions.active} active sessions
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues">
              <AlertCircle className="h-4 w-4 mr-2" />
              Issues
            </TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Stats
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Sessions"
                  value={stats?.sessions.total || 0}
                  icon={PlayCircle}
                  color="text-blue-600"
                  bgColor="bg-blue-100"
                />
                <StatCard
                  title="Active Sessions"
                  value={stats?.sessions.active || 0}
                  icon={Activity}
                  color="text-green-600"
                  bgColor="bg-green-100"
                />
                <StatCard
                  title="Total Issues"
                  value={stats?.issues.total || 0}
                  icon={AlertCircle}
                  color="text-red-600"
                  bgColor="bg-red-100"
                />
                <StatCard
                  title="Team Members"
                  value={members.length}
                  icon={Users}
                  color="text-purple-600"
                  bgColor="bg-purple-100"
                />
              </div>
            </div>

            {/* Sessions Breakdown */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Sessions Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{stats?.sessions.completed || 0}</div>
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{stats?.sessions.active || 0}</div>
                      <Activity className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Planned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{stats?.sessions.planned || 0}</div>
                      <Clock className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{stats?.sessions.assignedUsers || 0}</div>
                      <Users className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Issues Breakdown */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Issues Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* By Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Open
                      </span>
                      <span className="font-semibold">{stats?.issues.open || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        In Progress
                      </span>
                      <span className="font-semibold">{stats?.issues.inProgress || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Resolved
                      </span>
                      <span className="font-semibold">{stats?.issues.resolved || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        Closed
                      </span>
                      <span className="font-semibold">{stats?.issues.closed || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* By Priority */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Priority</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        Critical
                      </span>
                      <span className="font-semibold text-red-600">{stats?.issues.byPriority.critical || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        High
                      </span>
                      <span className="font-semibold text-orange-600">{stats?.issues.byPriority.high || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        Medium
                      </span>
                      <span className="font-semibold text-yellow-600">{stats?.issues.byPriority.medium || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-gray-600" />
                        Low
                      </span>
                      <span className="font-semibold text-gray-600">{stats?.issues.byPriority.low || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Testing Overview */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Testing Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                  title="Total Features"
                  value={stats?.testing.totalFeatures || 0}
                  icon={FileText}
                  color="text-indigo-600"
                  bgColor="bg-indigo-100"
                />
                <StatCard
                  title="Total Test Cases"
                  value={stats?.testing.totalTestCases || 0}
                  icon={CheckCircle2}
                  color="text-teal-600"
                  bgColor="bg-teal-100"
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <ActivityFeed entityType="org" entityId={orgId} limit={10} />
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <SessionsList orgId={orgId} />
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            {activeTab === "issues" && router.push(`/orgs/${orgId}/issues`)}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <MembersList orgId={orgId} members={members} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <OrgSettings org={currentOrg} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
