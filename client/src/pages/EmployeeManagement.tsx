import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema, type User, type InsertUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Search, Filter, Edit, Trash2, Key } from "lucide-react";

export default function EmployeeManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin';

  // Build query string from filters
  const queryParams = new URLSearchParams();
  if (roleFilter && roleFilter !== "all") queryParams.set("role", roleFilter);
  if (statusFilter && statusFilter !== "all") queryParams.set("status", statusFilter);
  const queryString = queryParams.toString();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: queryString 
      ? ["/api/users", queryString] 
      : ["/api/users"],
  });

  const { data: locations = [] } = useQuery<any[]>({
    queryKey: ["/api/locations"],
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
  });

  const { data: levels = [] } = useQuery<any[]>({
    queryKey: ["/api/levels"],
  });

  const { data: grades = [] } = useQuery<any[]>({
    queryKey: ["/api/grades"],
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/departments"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      await apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ predicate: (query) => 
        Array.isArray(query.queryKey) && query.queryKey[0] === "/api/users" 
      });
      setIsCreateModalOpen(false);
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: string; userData: Partial<InsertUser> }) => {
      await apiRequest("PUT", `/api/users/${id}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ predicate: (query) => 
        Array.isArray(query.queryKey) && query.queryKey[0] === "/api/users" 
      });
      setEditingUser(null);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ predicate: (query) => 
        Array.isArray(query.queryKey) && query.queryKey[0] === "/api/users" 
      });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Create a schema that handles empty passwords properly for updates
  const flexibleUserSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    code: z.string().min(1, "Employee code is required"),
    designation: z.string().optional(),
    mobileNumber: z.string().optional(),
    locationId: z.string().nullable().optional(),
    companyId: z.string().nullable().optional(),
    levelId: z.string().nullable().optional(),
    gradeId: z.string().nullable().optional(),
    reportingManagerId: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    role: z.enum(['super_admin', 'admin', 'hr_manager', 'employee', 'manager']),
    roles: z.array(z.enum(['super_admin', 'admin', 'hr_manager', 'employee', 'manager'])).optional().default(['employee']),
    status: z.enum(['active', 'inactive']).default('active'),
    password: z.union([
      z.string().min(8, "Password must be at least 8 characters"),
      z.literal("").transform(() => undefined)
    ]).optional(),
    confirmPassword: z.union([
      z.string(),
      z.literal("").transform(() => undefined)
    ]).optional(),
  }).refine((data) => {
    // If either password field is provided, both must be provided and match
    if (data.password || data.confirmPassword) {
      return data.password && data.confirmPassword && data.password === data.confirmPassword;
    }
    return true;
  }, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  const form = useForm<InsertUser>({
    resolver: zodResolver(flexibleUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      code: "",
      designation: "",
      mobileNumber: "",
      locationId: "none",
      companyId: "none",
      levelId: "none",
      gradeId: "none",
      reportingManagerId: "none",
      role: "employee",
      roles: ["employee"],
      status: "active",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: InsertUser) => {
    // Convert "none" placeholder values to null
    const processedData = {
      ...data,
      locationId: data.locationId === "none" ? null : data.locationId,
      companyId: data.companyId === "none" ? null : data.companyId,
      levelId: data.levelId === "none" ? null : data.levelId,
      gradeId: data.gradeId === "none" ? null : data.gradeId,
      reportingManagerId: data.reportingManagerId === "none" ? null : data.reportingManagerId,
      department: data.department === "none" ? null : data.department,
    };

    if (editingUser) {
      // For updates, only include password fields if they're actually filled in
      const updateData = { ...processedData };
      
      // Remove password fields if they're empty (to avoid triggering password update logic)
      if (!data.password && !data.confirmPassword) {
        delete updateData.password;
        delete updateData.confirmPassword;
      }
      
      updateUserMutation.mutate({ id: editingUser.id, userData: updateData });
    } else {
      createUserMutation.mutate(processedData);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      code: user.code || "",
      designation: user.designation || "",
      mobileNumber: user.mobileNumber || "",
      locationId: user.locationId || "none",
      companyId: user.companyId || "none",
      levelId: user.levelId || "none",
      gradeId: user.gradeId || "none",
      reportingManagerId: user.reportingManagerId || "none",
      role: user.role || "employee",
      roles: (user as any).roles || [user.role] || ["employee"],
      status: user.status || "active",
      password: "",
      confirmPassword: "",
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchQuery === "" || 
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const resetForm = () => {
    setEditingUser(null);
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      code: "",
      designation: "",
      mobileNumber: "",
      locationId: "none",
      companyId: "none",
      levelId: "none",
      gradeId: "none",
      reportingManagerId: "none",
      role: "employee",
      roles: ["employee"],
      status: "active",
      password: "",
      confirmPassword: "",
    });
  };

  return (
    <RoleGuard allowedRoles={["super_admin", "admin"]}>
      <div className="space-y-6" data-testid="employee-management">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">User Management</h1>
            <p className="text-muted-foreground">Manage user profiles and roles</p>
          </div>
          <Dialog open={isCreateModalOpen || !!editingUser} onOpenChange={(open) => {
            if (!open) {
              setIsCreateModalOpen(false);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateModalOpen(true)} data-testid="add-user-button">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                <DialogDescription>
                  {editingUser ? "Update user information" : "Create a new user profile"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} value={field.value ?? ""} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee Code</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} data-testid="input-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="designation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Designation</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} data-testid="input-designation" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} data-testid="input-mobile" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="locationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-location">
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Location</SelectItem>
                              {locations.map((location: any) => (
                                <SelectItem key={location.id} value={location.id}>
                                  {location.name} ({location.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-company">
                                <SelectValue placeholder="Select company" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Company</SelectItem>
                              {companies.map((company: any) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-department">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Department</SelectItem>
                              {departments.map((department: any) => (
                                <SelectItem key={department.id} value={department.code}>
                                  {department.description} ({department.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="levelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-level">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Level</SelectItem>
                              {levels.map((level: any) => (
                                <SelectItem key={level.id} value={level.id}>
                                  {level.description} ({level.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gradeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-grade">
                                <SelectValue placeholder="Select grade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Grade</SelectItem>
                              {grades.map((grade: any) => (
                                <SelectItem key={grade.id} value={grade.id}>
                                  {grade.description} ({grade.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="reportingManagerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reporting Manager</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? "none"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-manager">
                                <SelectValue placeholder="Select reporting manager" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Manager</SelectItem>
                              {users.filter((user: any) => user.id !== editingUser?.id).map((user: any) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName} ({user.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          <Select onValueChange={field.onChange} value={field.value ?? "active"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
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
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="roles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Roles</FormLabel>
                          <div className="space-y-2" data-testid="select-roles">
                            {[
                              { value: "employee", label: "Employee" },
                              { value: "manager", label: "Manager" },
                              { value: "hr_manager", label: "HR Manager" },
                              { value: "admin", label: "Administrator" },
                              { value: "super_admin", label: "Super Administrator" }
                            ].map((role) => (
                              <div key={role.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={role.value}
                                  checked={field.value?.includes(role.value as "super_admin" | "admin" | "hr_manager" | "employee" | "manager")}
                                  onCheckedChange={(checked) => {
                                    const currentRoles = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentRoles, role.value]);
                                    } else {
                                      field.onChange(currentRoles.filter((r: string) => r !== role.value));
                                    }
                                  }}
                                  data-testid={`checkbox-role-${role.value}`}
                                />
                                <label
                                  htmlFor={role.value}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {role.label}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Password fields - for Super Admin and Admin */}
                  {(isSuperAdmin || isAdmin) && (
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Key className="h-4 w-4" />
                        <h3 className="text-lg font-medium">{editingUser ? "Change Password" : "Set Password"}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Enter new password"
                                  {...field}
                                  data-testid="input-password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Confirm new password"
                                  {...field}
                                  data-testid="input-confirm-password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {editingUser 
                          ? "Leave password fields empty if you don't want to change the password."
                          : "Set a password for the new user account."
                        }
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={createUserMutation.isPending || updateUserMutation.isPending}
                      data-testid="submit-user"
                    >
                      {editingUser ? "Update User" : "Create User"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-employees"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]" data-testid="filter-role">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="hr_manager">HR Manager</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="super_admin">Super Administrator</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="filter-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <CardDescription>
              {filteredUsers.length} employee{filteredUsers.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No employees found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/20 transition-colors"
                    data-testid={`user-row-${user.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`user-name-${user.id}`}>
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.designation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                        {user.role?.replace('_', ' ')}
                      </Badge>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          data-testid={`edit-user-${user.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          data-testid={`delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
