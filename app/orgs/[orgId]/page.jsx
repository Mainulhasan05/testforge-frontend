"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { fetchOrgById, fetchOrgMembers } from "@/lib/slices/orgsSlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/app-layout";
import SessionsList from "@/components/sessions/sessions-list";
import MembersList from "@/components/orgs/members-list";
import OrgSettings from "@/components/orgs/org-settings";
import ActivityFeed from "@/components/activity/activity-feed";
import { Building2 } from "lucide-react";

export default function OrgDetailPage() {
  const params = useParams();
  const orgId = params.orgId;
  const dispatch = useDispatch();
  const { currentOrg, members } = useSelector((state) => state.orgs);
  const [activeTab, setActiveTab] = useState("sessions");

  useEffect(() => {
    if (orgId) {
      dispatch(fetchOrgById(orgId));
      dispatch(fetchOrgMembers(orgId));
    }
  }, [dispatch, orgId]);

  if (!currentOrg) {
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
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{currentOrg.name}</h1>
              <p className="text-muted-foreground">
                {currentOrg.description || "No description"}
              </p>
            </div>
          </div>
          <Badge variant="secondary">{members.length} members</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-4">
            <SessionsList orgId={orgId} />
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <MembersList orgId={orgId} members={members} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <OrgSettings org={currentOrg} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ActivityFeed entityType="org" entityId={orgId} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
