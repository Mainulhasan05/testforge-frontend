"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams } from "next/navigation"
import { fetchSessionById } from "@/lib/slices/sessionsSlice"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import AppLayout from "@/components/layout/app-layout"
import FeaturesList from "@/components/features/features-list"
import ActivityFeed from "@/components/activity/activity-feed"
import { formatLocalDate } from "@/lib/utils/time"
import { PlayCircle, Calendar, Users } from "lucide-react"

export default function SessionDetailPage() {
  const params = useParams()
  const sessionId = params.sessionId
  const dispatch = useDispatch()
  const { currentSession } = useSelector((state) => state.sessions)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (sessionId) {
      dispatch(fetchSessionById(sessionId))
    }
  }, [dispatch, sessionId])

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "default"
      case "completed":
        return "secondary"
      case "archived":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!currentSession) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <PlayCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{currentSession.title}</h1>
                <Badge variant={getStatusColor(currentSession.status)}>{currentSession.status}</Badge>
              </div>
              <p className="text-muted-foreground">{currentSession.description || "No description"}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {currentSession.startDate ? formatLocalDate(currentSession.startDate) : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {currentSession.endDate ? formatLocalDate(currentSession.endDate) : "Not set"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assignees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentSession.assignees && currentSession.assignees.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {currentSession.assignees.map((assignee) => (
                        <div key={assignee.userId} className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(assignee.user?.name || "U")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{assignee.user?.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No assignees yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{currentSession.description || "No description provided"}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <FeaturesList sessionId={sessionId} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <ActivityFeed entityType="session" entityId={sessionId} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
