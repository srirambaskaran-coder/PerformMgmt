import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Edit, Search, Building2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RoleGuard } from "@/components/RoleGuard";
import { type Department, type InsertDepartment, insertDepartmentSchema } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function DepartmentManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries
  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Mutations
  const createDepartmentMutation = useMutation({
    mutationFn: async (departmentData: InsertDepartment) => {
      await apiRequest("POST", "/api/departments", departmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Department created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating department:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error) ? "Access denied" : "Failed to create department",
        variant: "destructive",
      });
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, departmentData }: { id: string; departmentData: Partial<InsertDepartment> }) => {
      await apiRequest("PUT", `/api/departments/${id}`, departmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setEditingDepartment(null);
      resetForm();
      toast({
        title: "Success",
        description: "Department updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating department:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error) ? "Access denied" : "Failed to update department",
        variant: "destructive",
      });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting department:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error) ? "Access denied" : "Failed to delete department",
        variant: "destructive",
      });
    },
  });

  // Form handling
  const form = useForm<InsertDepartment>({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      code: "",
      description: "",
      status: "active",
    },
  });

  const resetForm = () => {
    form.reset({
      code: "",
      description: "",
      status: "active",
    });
  };

  const onSubmit = async (data: InsertDepartment) => {
    if (editingDepartment) {
      await updateDepartmentMutation.mutateAsync({
        id: editingDepartment.id,
        departmentData: data,
      });
    } else {
      await createDepartmentMutation.mutateAsync(data);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    form.reset({
      code: department.code,
      description: department.description,
      status: department.status,
    });
  };

  const handleCloseModal = () => {
    setEditingDepartment(null);
    setIsCreateModalOpen(false);
    resetForm();
  };

  // Filter departments based on search and status
  const filteredDepartments = departments.filter((department) => {
    const matchesSearch = searchQuery === "" || 
      department.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      department.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || department.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Department Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage company departments for organizational structure
            </p>
          </div>
          <Dialog 
            open={isCreateModalOpen || editingDepartment !== null} 
            onOpenChange={(open) => !open && handleCloseModal()}
          >
            <DialogTrigger asChild>
              <Button 
                onClick={() => setIsCreateModalOpen(true)} 
                data-testid="button-add-department"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingDepartment ? "Edit Department" : "Add New Department"}
                </DialogTitle>
                <DialogDescription>
                  {editingDepartment 
                    ? "Update the department information below." 
                    : "Enter the details for the new department."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., HR, IT, FIN" 
                            {...field} 
                            data-testid="input-department-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Human Resources Department" 
                            {...field} 
                            data-testid="input-department-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value ?? "active"}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-department-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCloseModal}
                      data-testid="button-cancel-department"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
                      data-testid="button-save-department"
                    >
                      {createDepartmentMutation.isPending || updateDepartmentMutation.isPending 
                        ? "Saving..." 
                        : editingDepartment ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-departments"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-filter-status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Department List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDepartments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No departments found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery || statusFilter !== "all" 
                  ? "No departments match your current filters." 
                  : "Start by creating your first department."}
              </p>
              {searchQuery === "" && statusFilter === "all" && (
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  data-testid="button-create-first-department"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Department
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map((department) => (
              <Card key={department.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-department-code-${department.id}`}>
                        {department.code}
                      </CardTitle>
                      <CardDescription className="mt-1" data-testid={`text-department-description-${department.id}`}>
                        {department.description}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={department.status === "active" ? "default" : "secondary"}
                      data-testid={`badge-department-status-${department.id}`}
                    >
                      {department.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator className="my-3" />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(department)}
                      data-testid={`button-edit-department-${department.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDepartmentMutation.mutate(department.id)}
                      disabled={deleteDepartmentMutation.isPending}
                      data-testid={`button-delete-department-${department.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}