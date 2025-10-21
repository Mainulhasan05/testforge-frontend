'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MessageSquare,
  ThumbsUp,
  Eye,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  acknowledged: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  wont_fix: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function IssueCard({ issue, isSelected, onSelect, onNavigate }) {
  const handleClick = (e) => {
    if (e.target.type !== 'checkbox') {
      onNavigate();
    }
  };

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Checkbox - Mobile and Desktop */}
        <div className="flex-shrink-0 pt-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(issue._id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
            <h3 className="font-semibold text-base md:text-lg line-clamp-2">
              {issue.title}
            </h3>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <Badge className={priorityColors[issue.priority]}>
                {issue.priority}
              </Badge>
              <Badge className={statusColors[issue.status]}>
                {issue.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {issue.description}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="font-medium">{issue.reportedBy?.fullName}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
            </div>

            {issue.category && (
              <Badge variant="outline" className="text-xs">
                {issue.category.replace('_', ' ')}
              </Badge>
            )}

            {issue.environment && (
              <Badge variant="outline" className="text-xs">
                {issue.environment}
              </Badge>
            )}
          </div>

          {/* Stats & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {issue.votes?.length > 0 && (
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  <span>{issue.votes.length}</span>
                </div>
              )}

              {issue.comments?.length > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{issue.comments.length}</span>
                </div>
              )}

              {issue.watchers?.length > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{issue.watchers.length}</span>
                </div>
              )}

              {issue.images?.length > 0 && (
                <div className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  <span>{issue.images.length}</span>
                </div>
              )}
            </div>

            {/* Jira Badge */}
            {issue.jiraTicket && (
              <a
                href={issue.jiraTicket.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {issue.jiraTicket.ticketKey}
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
