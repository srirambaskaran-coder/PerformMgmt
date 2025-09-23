import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Users, Edit2, Trash2, UserPlus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SafeUser, AppraisalGroup, InsertAppraisalGroup } from "@shared/schema";

interface AppraisalGroupWithMembers extends AppraisalGroup {
  members: SafeUser[];
}

interface CreateGroupFormData {
  name: string;
  description: string;
}

interface EmployeeFilters {
  nameOrCode: string;
  location: string;
  department: string;
  level: string;
  grade: string;
  reportingManager: string;
}

export default function AppraisalGroups() {
  const [searchQuery, setSearchQuery] = useState("");
  // Draft filters that user is typing (not yet applied)
  const [draftFilters, setDraftFilters] = useState<EmployeeFilters>({
    nameOrCode: "",
    location: "",
    department: "",
    level: "",
    grade: "",
    reportingManager: "",
  });
  // Applied filters that actually control the results
  const [appliedFilters, setAppliedFilters] = useState<EmployeeFilters>({
    nameOrCode: "",
    location: "",
    department: "",
    level: "",
    grade: "",
    reportingManager: "",
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AppraisalGroupWithMembers | null>(null);
  const [isEmployeeSelectOpen, setIsEmployeeSelectOpen] = useState(false);
  const [selectedGroupForEmployees, setSelectedGroupForEmployees] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const { toast } = useToast();

  // Create group form state
  const [formData, setFormData] = useState<CreateGroupFormData>({
    name: "",
    description: "",
  });

  // Fetch appraisal groups
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery<AppraisalGroupWithMembers[]>({
    queryKey: ['/api/appraisal-groups'],
  });

  // Fetch all users for employee selection
  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery<SafeUser[]>({
    queryKey: ['/api/users'],
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: InsertAppraisalGroup) => {
      const response = await apiRequest('POST', '/api/appraisal-groups', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appraisal-groups'] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Appraisal group created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create appraisal group",
        variant: "destructive",
      });
    },
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAppraisalGroup> }) => {
      const response = await apiRequest('PUT', `/api/appraisal-groups/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appraisal-groups'] });
      setEditingGroup(null);
      resetForm();
      toast({
        title: "Success",
        description: "Appraisal group updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update appraisal group",
        variant: "destructive",
      });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/appraisal-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appraisal-groups'] });
      toast({
        title: "Success",
        description: "Appraisal group deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete appraisal group",
        variant: "destructive",
      });
    },
  });

  // Add members mutation
  const addMembersMutation = useMutation({
    mutationFn: async ({ groupId, userIds }: { groupId: string; userIds: string[] }) => {
      const promises = userIds.map(async userId => {
        const response = await apiRequest('POST', `/api/appraisal-groups/${groupId}/members`, { userId });
        return response.json();
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appraisal-groups'] });
      setIsEmployeeSelectOpen(false);
      setSelectedEmployees([]);
      setSelectedGroupForEmployees(null);
      setDraftFilters({
        nameOrCode: "",
        location: "",
        department: "",
        level: "",
        grade: "",
        reportingManager: "",
      });
      setAppliedFilters({
        nameOrCode: "",
        location: "",
        department: "",
        level: "",
        grade: "",
        reportingManager: "",
      });
      toast({
        title: "Success",
        description: "Employees added to group successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add employees to group",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      return apiRequest('DELETE', `/api/appraisal-groups/${groupId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appraisal-groups'] });
      toast({
        title: "Success",
        description: "Employee removed from group successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove employee from group",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setEditingGroup(null);
  };

  const handleCreateOrUpdate = () => {
    if (editingGroup) {
      updateGroupMutation.mutate({
        id: editingGroup.id,
        data: formData,
      });
    } else {
      createGroupMutation.mutate(formData);
    }
  };

  const handleEdit = (group: AppraisalGroupWithMembers) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this appraisal group? This action cannot be undone.")) {
      deleteGroupMutation.mutate(id);
    }
  };

  const handleAddEmployees = (groupId: string) => {
    setSelectedGroupForEmployees(groupId);
    setIsEmployeeSelectOpen(true);
  };

  const handleEmployeeSelection = (userId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleConfirmAddEmployees = () => {
    if (selectedGroupForEmployees && selectedEmployees.length > 0) {
      addMembersMutation.mutate({
        groupId: selectedGroupForEmployees,
        userIds: selectedEmployees,
      });
    }
  };

  const handleRemoveMember = (groupId: string, userId: string) => {
    if (confirm("Are you sure you want to remove this employee from the group?")) {
      removeMemberMutation.mutate({ groupId, userId });
    }
  };

  // Filter groups based on search query
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );


  // Helper function to get groups for an employee
  const getEmployeeGroups = (employeeId: string) => {
    return groups.filter(group => 
      group.members.some(member => member.id === employeeId)
    );
  };

  // Filter available employees (not already in the selected group)
  const selectedGroup = selectedGroupForEmployees ? groups.find(g => g.id === selectedGroupForEmployees) : null;
  const existingMemberIds = selectedGroup ? selectedGroup.members.map(m => m.id) : [];
  const availableEmployees = allUsers.filter(user => {
    if (existingMemberIds.includes(user.id)) return false;
    
    // Apply structured filters
    // Name or Code filter
    if (appliedFilters.nameOrCode) {
      const nameOrCodeQuery = appliedFilters.nameOrCode.toLowerCase();
      const matchesName = ((user.firstName ?? '') + ' ' + (user.lastName ?? '')).toLowerCase().includes(nameOrCodeQuery);
      const matchesCode = (user.code ?? '').toLowerCase().includes(nameOrCodeQuery);
      if (!matchesName && !matchesCode) return false;
    }

    // Location filter
    if (appliedFilters.location) {
      const locationQuery = appliedFilters.location.toLowerCase();
      if (!(user.locationId ?? '').toLowerCase().includes(locationQuery)) return false;
    }

    // Department filter
    if (appliedFilters.department) {
      const departmentQuery = appliedFilters.department.toLowerCase();
      if (!(user.department ?? '').toLowerCase().includes(departmentQuery)) return false;
    }

    // Level filter
    if (appliedFilters.level) {
      const levelQuery = appliedFilters.level.toLowerCase();
      if (!(user.levelId ?? '').toLowerCase().includes(levelQuery)) return false;
    }

    // Grade filter
    if (appliedFilters.grade) {
      const gradeQuery = appliedFilters.grade.toLowerCase();
      if (!(user.gradeId ?? '').toLowerCase().includes(gradeQuery)) return false;
    }

    // Reporting Manager filter
    if (appliedFilters.reportingManager) {
      const reportingManagerQuery = appliedFilters.reportingManager.toLowerCase();
      if (!(user.reportingManagerId ?? '').toLowerCase().includes(reportingManagerQuery)) return false;
    }

    return true;
  });

  return (
    <RoleGuard allowedRoles={['hr_manager']}>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Appraisal Groups</h1>
            <p className="text-muted-foreground mt-2">
              Manage employee groups for performance evaluations
            </p>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
            setIsCreateModalOpen(open);
            if (!open) {
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="create-group-btn">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingGroup ? "Edit Appraisal Group" : "Create New Appraisal Group"}
                </DialogTitle>
                <DialogDescription>
                  {editingGroup 
                    ? "Update the details of your appraisal group."
                    : "Create a new group to organize employees for performance evaluations."
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Group Name</label>
                  <Input
                    placeholder="Enter group name..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="input-group-name"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Enter group description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    data-testid="input-group-description"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1"
                  data-testid="cancel-group-btn"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrUpdate}
                  className="flex-1"
                  disabled={!formData.name.trim() || createGroupMutation.isPending || updateGroupMutation.isPending}
                  data-testid="submit-group-btn"
                >
                  {editingGroup ? "Update Group" : "Create Group"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by group name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-groups"
              />
            </div>
          </CardContent>
        </Card>


        {/* Groups List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Appraisal Groups ({filteredGroups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingGroups ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading appraisal groups...</div>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {searchQuery ? "No groups found" : "No appraisal groups yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Try adjusting your search criteria."
                    : "Create your first appraisal group to organize employees for evaluations."
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsCreateModalOpen(true)} data-testid="empty-state-create-btn">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGroups.map((group) => (
                  <Card key={group.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold" data-testid={`group-name-${group.id}`}>
                            {group.name}
                          </h3>
                          <Badge variant="secondary" data-testid={`group-count-${group.id}`}>
                            {group.members.length} members
                          </Badge>
                        </div>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mb-2" data-testid={`group-description-${group.id}`}>
                            {group.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(group.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddEmployees(group.id)}
                          data-testid={`add-employees-${group.id}`}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add Employees
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(group)}
                          data-testid={`edit-group-${group.id}`}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(group.id)}
                          data-testid={`delete-group-${group.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    {/* Group Members */}
                    {group.members.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Group Members</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {group.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-2 bg-muted rounded"
                              data-testid={`member-${group.id}-${member.id}`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {member.email}
                                </p>
                                {member.department && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {member.department}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(group.id, member.id)}
                                className="h-6 w-6 p-0 ml-2"
                                data-testid={`remove-member-${group.id}-${member.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Selection Dialog */}
        <Dialog open={isEmployeeSelectOpen} onOpenChange={setIsEmployeeSelectOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Employees to Group</DialogTitle>
              <DialogDescription>
                Select employees to add to the appraisal group. Use filters to find specific employees.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Employee Filters */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Employee Name/Code</label>
                    <Input
                      placeholder="Enter name or code..."
                      value={draftFilters.nameOrCode}
                      onChange={(e) => setDraftFilters({ ...draftFilters, nameOrCode: e.target.value })}
                      data-testid="dialog-filter-name-code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <Input
                      placeholder="Enter location..."
                      value={draftFilters.location}
                      onChange={(e) => setDraftFilters({ ...draftFilters, location: e.target.value })}
                      data-testid="dialog-filter-location"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Department</label>
                    <Input
                      placeholder="Enter department..."
                      value={draftFilters.department}
                      onChange={(e) => setDraftFilters({ ...draftFilters, department: e.target.value })}
                      data-testid="dialog-filter-department"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Level</label>
                    <Input
                      placeholder="Enter level..."
                      value={draftFilters.level}
                      onChange={(e) => setDraftFilters({ ...draftFilters, level: e.target.value })}
                      data-testid="dialog-filter-level"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Grade</label>
                    <Input
                      placeholder="Enter grade..."
                      value={draftFilters.grade}
                      onChange={(e) => setDraftFilters({ ...draftFilters, grade: e.target.value })}
                      data-testid="dialog-filter-grade"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Reporting Manager</label>
                    <Input
                      placeholder="Enter manager name..."
                      value={draftFilters.reportingManager}
                      onChange={(e) => setDraftFilters({ ...draftFilters, reportingManager: e.target.value })}
                      data-testid="dialog-filter-reporting-manager"
                    />
                  </div>
                </div>
                
                {/* Search Button and Clear Filters */}
                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      // Apply the draft filters to the applied filters to trigger search
                      setAppliedFilters({ ...draftFilters });
                    }}
                    className="flex items-center gap-2"
                    data-testid="dialog-search-employees-btn"
                  >
                    <Search className="h-4 w-4" />
                    Search Employees
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Clear both draft and applied filters
                      const emptyFilters = {
                        nameOrCode: "",
                        location: "",
                        department: "",
                        level: "",
                        grade: "",
                        reportingManager: "",
                      };
                      setDraftFilters(emptyFilters);
                      setAppliedFilters(emptyFilters);
                    }}
                    data-testid="dialog-clear-filters-btn"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
              
              {/* Employee List */}
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <input
                          type="checkbox"
                          checked={selectedEmployees.length === availableEmployees.length && availableEmployees.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees(availableEmployees.map(emp => emp.id));
                            } else {
                              setSelectedEmployees([]);
                            }
                          }}
                          data-testid="select-all-employees"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(employee.id)}
                            onChange={() => handleEmployeeSelection(employee.id)}
                            data-testid={`select-employee-${employee.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.designation}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.department || '-'}</TableCell>
                        <TableCell>{employee.code || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {availableEmployees.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {Object.values(appliedFilters).some(filter => filter.trim()) 
                    ? "No employees found matching your filter criteria."
                    : "All employees are already in this group."
                  }
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-muted-foreground">
                {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEmployeeSelectOpen(false);
                    setSelectedEmployees([]);
                    setSelectedGroupForEmployees(null);
                    setDraftFilters({
                      nameOrCode: "",
                      location: "",
                      department: "",
                      level: "",
                      grade: "",
                      reportingManager: "",
                    });
                    setAppliedFilters({
                      nameOrCode: "",
                      location: "",
                      department: "",
                      level: "",
                      grade: "",
                      reportingManager: "",
                    });
                  }}
                  data-testid="cancel-employee-selection"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAddEmployees}
                  disabled={selectedEmployees.length === 0 || addMembersMutation.isPending}
                  data-testid="confirm-add-employees"
                >
                  Add {selectedEmployees.length} Employee{selectedEmployees.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}