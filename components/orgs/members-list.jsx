"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import { inviteMember, removeMember, fetchOrgMembers } from "@/lib/slices/orgsSlice";
import { formatLocalDateTime } from "@/lib/utils/time";
import { Users, UserPlus, Trash2, Shield, Crown, Loader2 } from "lucide-react";
import { realApi } from "@/lib/realApi";
import toast from "react-hot-toast";

export default function MembersList({ orgId, members }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "member",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(null);

  // Get current user's role in this org
  const currentUserRole = user?.organizations?.find(
    (o) => o.orgId === orgId
  )?.role;

  const canManageRoles = currentUserRole === "owner" || currentUserRole === "admin";
  const isOwner = currentUserRole === "owner";

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dispatch(inviteMember({ orgId, data: formData })).unwrap();
      setIsInviteOpen(false);
      setFormData({ email: "", role: "member" });
      toast.success("Invitation sent successfully");
    } catch (err) {
      console.error("Failed to invite member:", err);
      toast.error(err.message || "Failed to invite member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (userId, memberName) => {
    try {
      await dispatch(removeMember({ orgId, userId })).unwrap();
      toast.success(`${memberName} removed successfully`);
      // Refetch members
      dispatch(fetchOrgMembers(orgId));
    } catch (err) {
      console.error("Failed to remove member:", err);
      toast.error(err.message || "Failed to remove member");
    }
  };

  const handleRoleChange = async (userId, newRole, memberName) => {
    setUpdatingRole(userId);
    try {
      await realApi.orgs.updateMemberRole(orgId, userId, newRole);
      toast.success(`${memberName}'s role updated to ${newRole}`);
      // Refetch members to get updated data
      dispatch(fetchOrgMembers(orgId));
    } catch (err) {
      console.error("Failed to update role:", err);
      toast.error(err.message || "Failed to update role");
    } finally {
      setUpdatingRole(null);
    }
  };

  const getRoleIcon = (role) => {
    if (role === "owner") return <Crown className="h-3 w-3" />;
    if (role === "admin") return <Shield className="h-3 w-3" />;
    return null;
  };

  const getRoleBadgeVariant = (role) => {
    if (role === "owner") return "destructive";
    if (role === "admin") return "default";
    return "secondary";
  };

  const getAvailableRoles = (memberRole, memberId) => {
    // Can't change your own role
    if (memberId === user?._id) return [memberRole];

    // Owners can promote to any role
    if (isOwner) {
      return ["member", "admin", "owner"];
    }

    // Admins can only promote to admin or member (not owner)
    if (currentUserRole === "admin") {
      // Admins can't change owner roles
      if (memberRole === "owner") return [memberRole];
      return ["member", "admin"];
    }

    // Regular members can't change roles
    return [memberRole];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              People who have access to this organization
            </CardDescription>
          </div>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleInvite}>
                <DialogHeader>
                  <DialogTitle>Invite Member</DialogTitle>
                  <DialogDescription>
                    Invite a new member to join this organization
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="member@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        {isOwner && <SelectItem value="owner">Owner</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Inviting..." : "Invite"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No members yet</h3>
            <p className="text-sm text-muted-foreground">
              Invite team members to collaborate
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => {
              const availableRoles = getAvailableRoles(member.role, member._id);
              const canChangeRole = canManageRoles && availableRoles.length > 1;

              return (
                <div
                  key={member._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback>
                        {getInitials(member.fullName || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{member.fullName}</p>
                        {member._id === user?._id && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {formatLocalDateTime(member.joinedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                    {canChangeRole ? (
                      <Select
                        value={member.role}
                        onValueChange={(newRole) =>
                          handleRoleChange(member._id, newRole, member.fullName)
                        }
                        disabled={updatingRole === member._id}
                      >
                        <SelectTrigger className="w-full sm:w-32 h-9">
                            <div className="flex items-center gap-2">
                              {updatingRole === member._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                getRoleIcon(member.role)
                              )}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                  {getRoleIcon(role)}
                                  <span className="capitalize">{role}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1 whitespace-nowrap">
                        {getRoleIcon(member.role)}
                        {member.role}
                      </Badge>
                    )}

                    {canManageRoles && member.role !== "owner" && member._id !== user?._id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {member.fullName} from the organization.
                              They will lose access to all organization resources.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(member._id, member.fullName)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
