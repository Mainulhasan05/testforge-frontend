'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import {
  fetchIssueById,
  updateIssue,
  updateStatus,
  assignIssue,
  addComment,
  voteOnIssue,
  toggleWatch,
  deleteIssue,
} from '@/lib/slices/issuesSlice';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  MessageSquare,
  ThumbsUp,
  Eye,
  EyeOff,
  User,
  Calendar,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { orgId, issueId } = params;

  const { currentIssue: issue, loading } = useSelector((state) => state.issues);
  const { user } = useSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    if (issueId) {
      dispatch(fetchIssueById(issueId));
    }
  }, [issueId, dispatch]);

  useEffect(() => {
    if (issue) {
      setEditData({
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        category: issue.category,
      });
    }
  }, [issue]);

  const handleSaveEdit = async () => {
    try {
      await dispatch(updateIssue({ issueId, data: editData })).unwrap();
      toast.success('Issue updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(error || 'Failed to update issue');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await dispatch(updateStatus({ issueId, status: newStatus })).unwrap();
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error(error || 'Failed to update status');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    setAddingComment(true);
    try {
      await dispatch(addComment({ issueId, text: commentText })).unwrap();
      setCommentText('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error(error || 'Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  const handleVote = async (voteType) => {
    try {
      await dispatch(voteOnIssue({ issueId, voteType })).unwrap();
      toast.success('Vote recorded');
    } catch (error) {
      toast.error(error || 'Failed to vote');
    }
  };

  const handleToggleWatch = async () => {
    try {
      await dispatch(toggleWatch(issueId)).unwrap();
      toast.success(issue.watchers?.some(w => w._id === user._id) ? 'Stopped watching' : 'Now watching');
    } catch (error) {
      toast.error(error || 'Failed to toggle watch');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    try {
      await dispatch(deleteIssue(issueId)).unwrap();
      toast.success('Issue deleted successfully');
      router.push(`/orgs/${orgId}/issues`);
    } catch (error) {
      toast.error(error || 'Failed to delete issue');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'resolved': return 'bg-purple-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading || !issue) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const isWatching = issue.watchers?.some(w => w._id === user._id);
  const isReporter = issue.reportedBy?._id === user._id;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/orgs/${orgId}/issues`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Issues
        </Button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="text-2xl font-bold mb-2"
              />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{issue.title}</h1>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge className={getPriorityColor(issue.priority)}>
                {issue.priority}
              </Badge>
              <Badge className={getStatusColor(issue.status)}>
                {issue.status.replace('_', ' ')}
              </Badge>
              {issue.category && (
                <Badge variant="outline">{issue.category}</Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleWatch}
            >
              {isWatching ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {isWatching ? 'Unwatch' : 'Watch'}
            </Button>
            {isReporter && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            {isEditing ? (
              <>
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={6}
                  className="mb-4"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </>
            ) : (
              <p className="whitespace-pre-wrap text-muted-foreground">{issue.description}</p>
            )}
          </Card>

          {/* Comments */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Comments ({issue.comments?.length || 0})
            </h2>

            {/* Comment List */}
            <div className="space-y-4 mb-6">
              {issue.comments?.map((comment) => (
                <div key={comment._id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{comment.userId?.fullName || 'Unknown User'}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleAddComment}
                disabled={!commentText.trim() || addingComment}
              >
                Add Comment
              </Button>
            </div>
          </Card>

          {/* Voting */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Community Feedback</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                onClick={() => handleVote('confirm')}
                className="flex flex-col items-center py-4"
              >
                <ThumbsUp className="h-5 w-5 mb-1" />
                <span className="text-xs">Confirm</span>
                <span className="text-sm font-bold">{issue.voteStats?.confirm || 0}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleVote('critical')}
                className="flex flex-col items-center py-4"
              >
                <AlertCircle className="h-5 w-5 mb-1 text-red-500" />
                <span className="text-xs">Critical</span>
                <span className="text-sm font-bold">{issue.voteStats?.critical || 0}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleVote('cannot_reproduce')}
                className="flex flex-col items-center py-4"
              >
                <span className="text-xs">Can't Reproduce</span>
                <span className="text-sm font-bold">{issue.voteStats?.cannot_reproduce || 0}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleVote('needs_info')}
                className="flex flex-col items-center py-4"
              >
                <span className="text-xs">Needs Info</span>
                <span className="text-sm font-bold">{issue.voteStats?.needs_info || 0}</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground flex items-center mb-1">
                  <User className="h-4 w-4 mr-2" />
                  Reported By
                </label>
                <p className="text-sm">{issue.reportedBy?.fullName || 'Unknown'}</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground flex items-center mb-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created
                </label>
                <p className="text-sm">{format(new Date(issue.createdAt), 'MMM d, yyyy')}</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1">Status</label>
                <Select value={issue.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="wont_fix">Won't Fix</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isEditing && (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1">Priority</label>
                    <Select
                      value={editData.priority}
                      onValueChange={(value) => setEditData({ ...editData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-1">Category</label>
                    <Select
                      value={editData.category}
                      onValueChange={(value) => setEditData({ ...editData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="broken_feature">Broken Feature</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="ui_ux">UI/UX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div>
                <label className="text-sm text-muted-foreground mb-1">Watchers</label>
                <p className="text-sm">{issue.watchers?.length || 0} watching</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1">Severity</label>
                <p className="text-sm font-bold">{issue.severity}/10</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
