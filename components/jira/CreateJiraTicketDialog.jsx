"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, ExternalLink, User } from "lucide-react";
import { realApi } from "@/lib/realApi";
import toast from "react-hot-toast";

export default function CreateJiraTicketDialog({ open, onOpenChange, issue, orgId }) {
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [jiraConfig, setJiraConfig] = useState(null);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    labels: [],
    assignee: "",
  });
  const [aiGenerated, setAiGenerated] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);

  useEffect(() => {
    if (open && issue) {
      loadJiraConfig();
      setFormData({
        title: issue.title || "",
        description: issue.description || "",
        priority: mapPriority(issue.priority),
        labels: [],
        assignee: "",
      });
      setAiGenerated(false);
      setCreatedTicket(null);
    }
  }, [open, issue]);

  const loadJiraConfig = async () => {
    try {
      const response = await realApi.jira.getConfig(orgId);
      if (response.data) {
        setJiraConfig(response.data);
        // Load assignable users
        loadAssignableUsers(response.data);
      } else {
        toast.error("Please configure Jira integration first");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to load Jira config:", error);
      toast.error("Failed to load Jira configuration");
    }
  };

  const loadAssignableUsers = async (config) => {
    try {
      setLoadingUsers(true);
      const response = await realApi.jira.getAssignableUsers({
        jiraUrl: config.jiraUrl,
        jiraEmail: config.jiraEmail,
        jiraApiToken: config.jiraApiToken || "", // Will use stored token from backend
        jiraProjectKey: config.jiraProjectKey,
      });

      if (response.success && response.data) {
        setAssignableUsers(response.data);
      }
    } catch (error) {
      console.error("Failed to load assignable users:", error);
      // Not critical, just log it
    } finally {
      setLoadingUsers(false);
    }
  };

  const mapPriority = (priority) => {
    const mapping = {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Highest",
    };
    return mapping[priority?.toLowerCase()] || "Medium";
  };

  const handleGenerateWithAI = async () => {
    if (!issue) return;

    try {
      setGeneratingAI(true);
      const response = await realApi.issues.generateAITicket(issue._id);

      if (response.success && response.data) {
        setFormData({
          title: response.data.title || formData.title,
          description: response.data.description || formData.description,
          priority: response.data.priority || formData.priority,
          labels: response.data.labels || [],
          assignee: formData.assignee,
        });
        setAiGenerated(true);
        toast.success("AI generated ticket content successfully!");
      }
    } catch (error) {
      console.error("Failed to generate AI ticket:", error);
      toast.error(error.message || "Failed to generate ticket with AI");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Please fill in title and description");
      return;
    }

    try {
      setLoading(true);
      const ticketData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        labels: formData.labels,
      };

      // Add assignee if selected
      if (formData.assignee) {
        ticketData.assignee = formData.assignee;
      }

      const response = await realApi.jira.createTicket(issue._id, {
        orgId,
        ticketData,
      });

      if (response.success && response.data) {
        setCreatedTicket(response.data);
        toast.success(`Jira ticket ${response.data.ticketKey} created successfully!`);

        // Optionally close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to create Jira ticket:", error);
      toast.error(error.message || "Failed to create Jira ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!jiraConfig) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Jira Ticket</DialogTitle>
          <DialogDescription>
            Generate a professional Jira ticket from this issue
          </DialogDescription>
        </DialogHeader>

        {createdTicket ? (
          <Alert className="bg-green-50 border-green-200">
            <ExternalLink className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <p className="font-medium">Ticket created successfully!</p>
              <a
                href={createdTicket.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
              >
                View {createdTicket.ticketKey} in Jira
                <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* AI Generate Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleGenerateWithAI}
                variant="outline"
                disabled={generatingAI}
                className="gap-2"
              >
                {generatingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate with Gemini AI
                  </>
                )}
              </Button>
            </div>

            {aiGenerated && (
              <Alert className="bg-blue-50 border-blue-200">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Content generated by AI! Review and edit if needed.
                </AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Brief summary of the issue"
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/255 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Detailed description of the issue..."
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Supports markdown formatting
              </p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lowest">Lowest</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Highest">Highest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <Label htmlFor="assignee">
                Assignee (Optional)
                {loadingUsers && <Loader2 className="h-3 w-3 animate-spin inline ml-2" />}
              </Label>
              <Select
                value={formData.assignee}
                onValueChange={(value) => handleChange("assignee", value)}
                disabled={loadingUsers || assignableUsers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingUsers
                      ? "Loading users..."
                      : assignableUsers.length === 0
                      ? "No users available"
                      : "Select assignee..."
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {assignableUsers.map((user) => (
                    <SelectItem key={user.accountId} value={user.accountId}>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {user.displayName}
                        {user.emailAddress && (
                          <span className="text-xs text-muted-foreground">
                            ({user.emailAddress})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {assignableUsers.length} team member(s) available
              </p>
            </div>

            {/* Labels */}
            {formData.labels.length > 0 && (
              <div className="space-y-2">
                <Label>Labels</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.labels.map((label, index) => (
                    <Badge key={index} variant="secondary">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {createdTicket ? "Close" : "Cancel"}
          </Button>
          {!createdTicket && (
            <Button
              onClick={handleCreate}
              disabled={loading || !formData.title || !formData.description}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Ticket"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
