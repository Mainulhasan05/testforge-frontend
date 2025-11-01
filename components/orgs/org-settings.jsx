"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { updateOrg, deleteOrg } from "@/lib/slices/orgsSlice"
import { fetchMe } from "@/lib/slices/authSlice"
import { fetchJiraConfig, saveJiraConfig, testJiraConnection, deleteJiraConfig } from "@/lib/slices/issuesSlice"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function OrgSettings({ org }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const { user } = useSelector((state) => state.auth)
  const [formData, setFormData] = useState({
    name: org.name,
    description: org.description || "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

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
    // Fetch fresh user data to ensure organizations array is up-to-date
    dispatch(fetchMe())

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
      await dispatch(updateOrg({ orgId: org._id, data: formData })).unwrap()
      toast.success("Organization updated successfully")
    } catch (err) {
      console.error("[v0] Failed to update org:", err)
      toast.error(err || "Failed to update organization")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmation !== org.name) {
      toast.error("Organization name doesn't match")
      return
    }

    setIsDeleting(true)
    try {
      await dispatch(deleteOrg(org._id)).unwrap()
      toast.success("Organization deleted successfully")
      router.push("/orgs")
    } catch (err) {
      console.error("[v0] Failed to delete org:", err)
      toast.error(err || "Failed to delete organization")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setDeleteConfirmation("")
    }
  }

  // Check if user is owner - using multiple methods for reliability
  const isOwner = user && (
    // Method 1: Check user's organizations array
    user?.organizations?.some(
      (o) => o.orgId?.toString() === org._id?.toString() && o.role === "owner"
    ) ||
    // Method 2: Check if user is in org's owners array
    org?.owners?.some((ownerId) => {
      const ownerIdStr = typeof ownerId === 'object' ? ownerId._id?.toString() : ownerId?.toString()
      return ownerIdStr === user._id?.toString()
    })
  )

  // Debug log
  useEffect(() => {
    console.log('===== Organization Delete Button Debug =====')
    console.log('User:', user)
    console.log('User ID:', user?._id)
    console.log('User organizations:', user?.organizations)
    console.log('Current org:', org)
    console.log('Current org ID:', org._id)
    console.log('Org owners:', org?.owners)
    console.log('Is owner (computed):', !!isOwner)
    console.log('==========================================')
  }, [user, org, isOwner])

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

      {isOwner && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions for this organization. Only organization owners can delete.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-destructive">Delete this organization</p>
                  <p className="text-sm text-muted-foreground">
                    Once you delete an organization, there is no going back. This will permanently delete:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
                    <li>All sessions and test data</li>
                    <li>All features and test cases</li>
                    <li>All issues and feedback</li>
                    <li>All member access</li>
                  </ul>
                </div>
              </div>
            </div>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Delete Organization
                  </DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete the organization and all its data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                    <p className="text-sm font-semibold mb-2">You are about to delete:</p>
                    <p className="text-base font-bold">{org.name}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-name">
                      Type <span className="font-bold">{org.name}</span> to confirm
                    </Label>
                    <Input
                      id="confirm-name"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Enter organization name"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will permanently delete all sessions, features, test cases, issues, and member access.
                    </p>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDeleteDialogOpen(false)
                      setDeleteConfirmation("")
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteConfirmation !== org.name || isDeleting}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete Organization"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
