"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Check, X, Loader2, Info } from "lucide-react";
import { realApi } from "@/lib/realApi";
import toast from "react-hot-toast";

export default function JiraConfigCard({ orgId }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    jiraUrl: "",
    jiraEmail: "",
    jiraApiToken: "",
    jiraProjectKey: "",
    syncEnabled: true,
  });

  useEffect(() => {
    if (orgId) {
      loadConfig();
    }
  }, [orgId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await realApi.jira.getConfig(orgId);
      if (response.data) {
        setConfig(response.data);
        setFormData({
          jiraUrl: response.data.jiraUrl || "",
          jiraEmail: response.data.jiraEmail || "",
          jiraApiToken: "", // Don't show token for security
          jiraProjectKey: response.data.jiraProjectKey || "",
          syncEnabled: response.data.syncEnabled !== false,
        });
      }
    } catch (error) {
      console.error("Failed to load Jira config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleTestConnection = async () => {
    if (!formData.jiraUrl || !formData.jiraEmail || !formData.jiraApiToken) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setTesting(true);
      const response = await realApi.jira.testConnection(formData);

      if (response.success) {
        toast.success(`Connection successful! Authenticated as ${response.data.user}`);
      } else {
        toast.error(response.message || "Connection failed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to test connection");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.jiraUrl || !formData.jiraEmail || !formData.jiraProjectKey) {
      toast.error("Please fill in Jira URL, Email, and Project Key");
      return;
    }

    // For new configurations, API token is required
    if (!config && !formData.jiraApiToken) {
      toast.error("API Token is required for new configuration. Get it from the link above.");
      return;
    }

    // Warn if trying to save without token on new config
    if (!config && formData.jiraApiToken.trim().length < 10) {
      toast.error("API Token seems too short. Please copy the full token from Atlassian.");
      return;
    }

    try {
      setSaving(true);
      const response = await realApi.jira.saveConfig(orgId, formData);

      setConfig(response.data);
      toast.success("Jira configuration saved successfully!");

      // Clear the API token field
      setFormData(prev => ({ ...prev, jiraApiToken: "" }));
    } catch (error) {
      const errorMessage = error.message || "Failed to save configuration";
      toast.error(errorMessage);

      // Show more helpful message for token errors
      if (errorMessage.includes('jiraApiToken') || errorMessage.includes('token')) {
        toast.error("Please check your API token and try again", { duration: 5000 });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this Jira configuration?")) {
      return;
    }

    try {
      await realApi.jira.deleteConfig(orgId);
      setConfig(null);
      setFormData({
        jiraUrl: "",
        jiraEmail: "",
        jiraApiToken: "",
        jiraProjectKey: "",
        syncEnabled: true,
      });
      toast.success("Jira configuration deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete configuration");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Jira Integration (Personal)</CardTitle>
            <CardDescription>
              Connect your Jira account to create tickets automatically
            </CardDescription>
          </div>
          {config && (
            <Badge variant={config.connectionStatus === 'active' ? 'default' : 'destructive'}>
              {config.connectionStatus === 'active' ? 'Connected' : 'Error'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-blue-900">Get your Jira API Token:</p>
              <div className="bg-white rounded-md p-3 border border-blue-100">
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-2 font-medium text-base"
                >
                  https://id.atlassian.com/manage-profile/security/api-tokens
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700 ml-1">
                <li>Click the link above to open Atlassian API Tokens page</li>
                <li>Click <span className="font-semibold">"Create API token"</span> button</li>
                <li>Give it a label (e.g., "TestForge Integration")</li>
                <li>Copy the generated token immediately</li>
                <li>Paste it in the "API Token" field below</li>
              </ol>
              <p className="text-xs text-muted-foreground italic mt-2">
                Note: You won't be able to see the token again after closing the dialog
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jiraUrl">Jira URL *</Label>
            <Input
              id="jiraUrl"
              name="jiraUrl"
              type="url"
              placeholder="https://your-domain.atlassian.net"
              value={formData.jiraUrl}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground">
              Your Jira Cloud instance URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jiraEmail">Jira Email *</Label>
            <Input
              id="jiraEmail"
              name="jiraEmail"
              type="email"
              placeholder="your-email@company.com"
              value={formData.jiraEmail}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground">
              The email address associated with your Jira account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jiraApiToken" className="flex items-center gap-2">
              API Token {config ? "" : "*"}
              {!config && (
                <span className="text-xs font-normal text-red-600">
                  (Required for new configuration)
                </span>
              )}
            </Label>
            <Input
              id="jiraApiToken"
              name="jiraApiToken"
              type="password"
              placeholder={config ? "Leave empty to keep current token" : "Paste your Jira API token here"}
              value={formData.jiraApiToken}
              onChange={handleChange}
            />
            <div className="flex items-start gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>
                {config
                  ? "Only enter a new token if you want to update it. Leave empty to keep your existing token."
                  : "Get your token from the blue box above. This is required to connect to Jira."}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jiraProjectKey">Project Key *</Label>
            <Input
              id="jiraProjectKey"
              name="jiraProjectKey"
              placeholder="PROJ"
              value={formData.jiraProjectKey}
              onChange={handleChange}
              className="uppercase"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              The key of your Jira project (e.g., "RPD", "DEV")
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="syncEnabled"
              name="syncEnabled"
              checked={formData.syncEnabled}
              onChange={handleChange}
              className="rounded"
            />
            <Label htmlFor="syncEnabled" className="text-sm font-normal">
              Enable automatic ticket creation
            </Label>
          </div>
        </div>

        {config?.lastError && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>{config.lastError}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleTestConnection}
            variant="outline"
            disabled={testing || !formData.jiraUrl || !formData.jiraEmail || !formData.jiraApiToken}
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Testing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>Save Configuration</>
            )}
          </Button>

          {config && (
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>

        {config?.lastSyncAt && (
          <p className="text-xs text-muted-foreground">
            Last synced: {new Date(config.lastSyncAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
