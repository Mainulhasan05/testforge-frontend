'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import {
  fetchIssues,
  setFilters,
  notifyMembersMultiple,
} from '@/lib/slices/issuesSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Filter,
  Bell,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import IssueCard from '@/components/issues/IssueCard';
import CreateIssueDialog from '@/components/issues/CreateIssueDialog';
import IssueFilters from '@/components/issues/IssueFilters';
import NotifyMembersDialog from '@/components/issues/NotifyMembersDialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AppLayout from '@/components/layout/app-layout';

export default function IssuesPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const orgId = params.orgId;

  const { list: issues, loading, stats, filters, meta, notifying } = useSelector(
    (state) => state.issues
  );
  const { user } = useSelector((state) => state.auth);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (orgId) {
      dispatch(fetchIssues({ orgId, filters }));
    }
  }, [orgId, filters, dispatch]);

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    dispatch(setFilters({ search: value }));
  };

  const handleSelectIssue = (issueId) => {
    setSelectedIssues((prev) =>
      prev.includes(issueId)
        ? prev.filter((id) => id !== issueId)
        : [...prev, issueId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIssues.length === issues.length) {
      setSelectedIssues([]);
    } else {
      setSelectedIssues(issues.map((i) => i._id));
    }
  };

  const handleNotifyMembers = async (customMessage) => {
    try {
      await dispatch(
        notifyMembersMultiple({
          orgId,
          issueIds: selectedIssues,
          customMessage,
        })
      ).unwrap();

      toast.success(`Notification sent to all members`);
      setNotifyDialogOpen(false);
      setSelectedIssues([]);
    } catch (error) {
      toast.error(error || 'Failed to send notification');
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl md:text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
        </div>
      </div>
    </Card>
  );

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        {/* Back Button */}
        <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/orgs/${orgId}`)}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Organization
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Issues & Bugs</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage system issues
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          icon={AlertCircle}
          label="Total Issues"
          value={stats.total}
          color="bg-blue-500"
        />
        <StatCard
          icon={Clock}
          label="Open"
          value={stats.open}
          color="bg-orange-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical"
          value={stats.critical}
          color="bg-red-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={stats.resolved}
          color="bg-green-500"
        />
      </div>

      {/* Filters & Search */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search issues..."
                value={filters.search}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </div>

          {/* Quick Filters - Desktop */}
          <div className="hidden md:flex gap-2">
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => handleFilterChange('priority', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="broken_feature">Broken Feature</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="ui_ux">UI/UX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Filter Button */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px]">
              <IssueFilters
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </SheetContent>
          </Sheet>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedIssues.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg mb-4">
          <span className="text-sm font-medium">
            {selectedIssues.length} issue(s) selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIssues([])}
            >
              Clear
            </Button>
            <Button size="sm" onClick={() => setNotifyDialogOpen(true)}>
              <Bell className="h-4 w-4 mr-2" />
              Notify Members
            </Button>
          </div>
        </div>
      )}

      {/* Issues List */}
      {loading && issues.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : issues.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No issues found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by reporting your first issue
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <IssueCard
              key={issue._id}
              issue={issue}
              isSelected={selectedIssues.includes(issue._id)}
              onSelect={handleSelectIssue}
              onNavigate={() => router.push(`/orgs/${orgId}/issues/${issue._id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            disabled={!meta.hasPrev}
            onClick={() =>
              handleFilterChange('page', (filters.page || 1) - 1)
            }
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!meta.hasNext}
            onClick={() =>
              handleFilterChange('page', (filters.page || 1) + 1)
            }
          >
            Next
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <CreateIssueDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        orgId={orgId}
      />

      <NotifyMembersDialog
        open={notifyDialogOpen}
        onOpenChange={setNotifyDialogOpen}
        issueCount={selectedIssues.length}
        onConfirm={handleNotifyMembers}
        loading={notifying}
      />
      </div>
    </AppLayout>
  );
}
