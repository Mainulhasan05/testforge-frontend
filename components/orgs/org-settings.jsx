"use client"

import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import { updateOrg, deleteOrg } from "@/lib/slices/orgsSlice"
import { fetchJiraConfig, saveJiraConfig, testJiraConnection, deleteJiraConfig } from "@/lib/slices/issuesSlice"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function OrgSettings({ org }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: org.name,
    description: org.description || "",
  })
  const [isSaving, setIsSaving] = useState(false)

  // Jira configuration state
  const [jiraConfig, setJiraConfig] = useState(null)
  const [jiraFormData, setJiraFormData] = useState({
    jiraUrl: '',
    jiraEmail: '',
    jiraApiToken: '',
    jiraProjectKey: '',
  })
  const [isSavingJira, setIsSavingJira] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [connectionTested, setConnectionTested] = useState(false)

  useEffect(() => {
    // Fetch existing Jira config
    dispatch(fetchJiraConfig(org._id)).unwrap()
      .then((response) => {
        // The API wraps data in response.data
        const config = response?.data || response
        console.log('Jira config fetched:', config)
        if (config && config.jiraUrl) {
          setJiraConfig(config)
          setJiraFormData({
            jiraUrl: config.jiraUrl || '',
            jiraEmail: config.jiraEmail || '',
            jiraApiToken: '', // Don't show the token
            jiraProjectKey: config.jiraProjectKey || '',
          })
        }
      })
      .catch((error) => {
        // No config yet, that's fine
        console.log('No Jira config found:', error)
      })
  }, [org._id, dispatch])

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await dispatch(updateOrg({ orgId: org.id, data: formData })).unwrap()
    } catch (err) {
      console.error("[v0] Failed to update org:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await dispatch(deleteOrg(org.id)).unwrap()
      router.push("/orgs")
    } catch (err) {
      console.error("[v0] Failed to delete org:", err)
    }
  }

  const handleSaveJira = async (e) => {
    e.preventDefault()
    setIsSavingJira(true)
    try {
      // Prepare config data - exclude empty API token on update
      const configToSave = { ...jiraFormData }
      if (jiraConfig && !configToSave.jiraApiToken) {
        // If updating and no new token provided, don't send it
        delete configToSave.jiraApiToken
      }

      await dispatch(saveJiraConfig({ orgId: org._id, configData: configToSave })).unwrap()
      toast.success(jiraConfig ? 'Jira configuration updated successfully' : 'Jira configuration saved successfully')
      // Refetch config
      const config = await dispatch(fetchJiraConfig(org._id)).unwrap()
      setJiraConfig(config)
      // Clear the API token field after successful save
      setJiraFormData(prev => ({ ...prev, jiraApiToken: '' }))
    } catch (err) {
      toast.error(err || 'Failed to save Jira configuration')
    } finally {
      setIsSavingJira(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setConnectionTested(false)
    try {
      await dispatch(testJiraConnection(jiraFormData)).unwrap()
      toast.success('Connection successful!')
      setConnectionTested(true)
    } catch (err) {
      toast.error(err || 'Connection failed')
      setConnectionTested(false)
    } finally {
      setIsTesting(false)
    }
  }

  const handleDeleteJira = async () => {
    try {
      await dispatch(deleteJiraConfig(org._id)).unwrap()
      toast.success('Jira configuration deleted')
      setJiraConfig(null)
      setJiraFormData({
        jiraUrl: '',
        jiraEmail: '',
        jiraApiToken: '',
        jiraProjectKey: '',
      })
    } catch (err) {
      toast.error(err || 'Failed to delete configuration')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>Update your organization information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jira Integration (Personal)</CardTitle>
          <CardDescription>
            {jiraConfig
              ? "Your personal Jira configuration is active. You can update or remove your configuration below."
              : "Connect your personal Jira account to create and sync issues automatically. Each member can have their own Jira configuration."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveJira} className="space-y-4">
            {!jiraConfig && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You need a Jira Cloud account. Your Jira URL should be in the format: <code className="bg-blue-100 px-1 py-0.5 rounded">https://your-domain.atlassian.net</code>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="jiraUrl">Jira URL</Label>
              <Input
                id="jiraUrl"
                type="url"
                placeholder="https://your-domain.atlassian.net"
                value={jiraFormData.jiraUrl}
                onChange={(e) => {
                  setJiraFormData({ ...jiraFormData, jiraUrl: e.target.value })
                  setConnectionTested(false)
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jiraEmail">Jira Email</Label>
              <Input
                id="jiraEmail"
                type="email"
                placeholder="your-email@example.com"
                value={jiraFormData.jiraEmail}
                onChange={(e) => {
                  setJiraFormData({ ...jiraFormData, jiraEmail: e.target.value })
                  setConnectionTested(false)
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jiraApiToken">
                Jira API Token {!jiraConfig && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="jiraApiToken"
                type="password"
                placeholder={jiraConfig ? "Leave empty to keep current token" : "Enter your Jira API token"}
                value={jiraFormData.jiraApiToken}
                onChange={(e) => {
                  setJiraFormData({ ...jiraFormData, jiraApiToken: e.target.value })
                  setConnectionTested(false)
                }}
                required={!jiraConfig}
              />
              <p className="text-xs text-muted-foreground">
                {jiraConfig
                  ? "Only enter a new token if you want to update it. Leave empty to keep the existing one."
                  : (
                    <>
                      Generate an API token from{" "}
                      <a
                        href="https://id.atlassian.com/manage-profile/security/api-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Atlassian Account Settings
                      </a>
                    </>
                  )}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jiraProjectKey">Jira Project Key</Label>
              <Input
                id="jiraProjectKey"
                type="text"
                placeholder="PROJ"
                value={jiraFormData.jiraProjectKey}
                onChange={(e) => setJiraFormData({ ...jiraFormData, jiraProjectKey: e.target.value.toUpperCase() })}
                required
              />
              <p className="text-xs text-muted-foreground">
                The project key from your Jira project (e.g., PROJ, DEV, TEST)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting || !jiraFormData.jiraUrl || !jiraFormData.jiraEmail || (!jiraConfig && !jiraFormData.jiraApiToken)}
              >
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
              <Button type="submit" disabled={isSavingJira}>
                {isSavingJira
                  ? (jiraConfig ? "Updating..." : "Saving...")
                  : (jiraConfig ? "Update Configuration" : "Save Configuration")}
              </Button>
              {jiraConfig && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteJira}
                >
                  Delete Configuration
                </Button>
              )}
            </div>
            {connectionTested && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✓ Connection test successful! You can now save your configuration.
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Organization</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the organization and all associated data
                  including sessions, features, and test cases.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
