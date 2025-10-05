"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchChangelog } from "@/lib/slices/changelogSlice"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatRelativeTime } from "@/lib/utils/time"
import { Activity, Plus, Edit, Trash } from "lucide-react"

export default function ActivityFeed({ entityType, entityId }) {
  const dispatch = useDispatch()
  const { list, status, meta } = useSelector((state) => state.changelog)
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchChangelog({ entityType, entityId, params: { page, limit: 20 } }))
  }, [dispatch, entityType, entityId, page])

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getActionIcon = (action) => {
    switch (action) {
      case "created":
        return <Plus className="h-4 w-4" />
      case "updated":
        return <Edit className="h-4 w-4" />
      case "deleted":
        return <Trash className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case "created":
        return "default"
      case "updated":
        return "secondary"
      case "deleted":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatChanges = (changes) => {
    if (!changes || typeof changes !== "object") return ""
    const entries = Object.entries(changes)
    if (entries.length === 0) return ""
    return entries
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(", ")
      .slice(0, 100)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Feed
        </CardTitle>
        <CardDescription>Recent changes and updates</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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

        {status === "succeeded" && list.length === 0 && (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        )}

        {status === "succeeded" && list.length > 0 && (
          <>
            <div className="space-y-4">
              {list.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                  <Avatar>
                    <AvatarFallback>{getInitials(item.user?.name || "U")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-medium">{item.user?.name}</p>
                      <Badge variant={getActionColor(item.action)} className="text-xs">
                        {getActionIcon(item.action)}
                        <span className="ml-1">{item.action}</span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.entityType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
                    </div>
                    {item.changes && (
                      <p className="text-sm text-muted-foreground truncate">{formatChanges(item.changes)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
