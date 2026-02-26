import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Edit,
  Search,
  Building2,
  Plus,
  Check,
  ChevronDown,
  X as XIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getClientIdFromSession } from "@/lib/ssoAuth";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/hooks/useAuth";
import {
  type Department,
  type InsertDepartment,
  insertDepartmentSchema,
} from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { cn } from "@/lib/utils";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Multi-select filter component
interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  label?: string;
}

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  label,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between hover:bg-transparent"
        >
          {selected.length > 0 ? (
            <span className="truncate">
              {selected.length} {label || "items"} selected
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer data-[selected=true]:bg-blue-400 dark:data-[selected=true]:bg-blue-900 hover:!bg-blue-400 dark:hover:!bg-blue-900"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Checkbox
                      checked={selected.includes(option.value)}
                      onCheckedChange={() => handleSelect(option.value)}
                    />
                    <span>{option.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {selected.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleClear}
              >
                Clear filters
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function DepartmentManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Data queries
  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    select: (data: any) => {
      // API returns {departments: [...]} - unwrap it
      const deptArray = data?.departments || data;
      if (!Array.isArray(deptArray)) return [];
      return deptArray.map((dept: any) => ({
        id: String(dept.Id),
        code: dept.Code || "",
        description: dept.Name || "", // API uses Name for description
        status: dept.Status === true ? "active" : "inactive",
        companyId: dept.ClientId ? String(dept.ClientId) : null,
        headOfDepartment: dept.HeadOfTheDepartment || null,
        createdOn: dept.CreatedOn,
        lastUpdatedOn: dept.LastUpdatedOn,
        createdBy: dept.CreatedBy,
        lastUpdatedBy: dept.LastUpdatedBy,
      }));
    },
  });

  // Mutations
  const createDepartmentMutation = useMutation({
    mutationFn: async (departmentData: InsertDepartment) => {
      // Transform to PascalCase and convert status to boolean
      const payload = {
        Code: departmentData.code,
        Name: departmentData.description, // API uses Name, not Description
        Status:
          departmentData.status === "active"
            ? true
            : departmentData.status === "inactive"
              ? false
              : departmentData.status,
        ClientId: getClientIdFromSession(),
      };
      await apiRequest("POST", "/api/departments", payload);
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
        description: isUnauthorizedError(error)
          ? "Access denied"
          : "Failed to create department",
        variant: "destructive",
      });
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async ({
      id,
      departmentData,
    }: {
      id: string;
      departmentData: Partial<InsertDepartment>;
    }) => {
      // Transform to PascalCase and convert status to boolean
      const payload: any = {};
      if (departmentData.code !== undefined) payload.Code = departmentData.code;
      if (departmentData.description !== undefined)
        payload.Name = departmentData.description; // API uses Name, not Description
      if (departmentData.status !== undefined) {
        payload.Status =
          departmentData.status === "active"
            ? true
            : departmentData.status === "inactive"
              ? false
              : departmentData.status;
      }
      if (departmentData.companyId !== undefined) {
        payload.ClientId = getClientIdFromSession();
      }
      await apiRequest("PUT", `/api/departments/${id}`, payload);
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
        description: isUnauthorizedError(error)
          ? "Access denied"
          : "Failed to update department",
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
        description: "Department marked as inactive",
      });
    },
    onError: (error) => {
      console.error("Error deleting department:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error)
          ? "Access denied"
          : "Failed to delete department",
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
    const matchesSearch =
      searchQuery === "" ||
      department.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      department.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilters.length === 0 ||
      (department.status && statusFilters.includes(department.status));

    return matchesSearch && matchesStatus;
  });

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div
        className="space-y-6 department-list"
        data-testid="department-management"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Department Management</h1>
            <p className="text-muted-foreground">
              Manage organizational departments
            </p>
          </div>
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
        <Dialog
          open={isCreateModalOpen || editingDepartment !== null}
          onOpenChange={(open) => !open && handleCloseModal()}
        >
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
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                    disabled={
                      createDepartmentMutation.isPending ||
                      updateDepartmentMutation.isPending
                    }
                    data-testid="button-save-department"
                  >
                    {createDepartmentMutation.isPending ||
                    updateDepartmentMutation.isPending
                      ? "Saving..."
                      : editingDepartment
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

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
                  placeholder="Search departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8"
                  data-testid="input-search-departments"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <MultiSelect
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                selected={statusFilters}
                onChange={setStatusFilters}
                placeholder="All Status"
                label="status"
              />
            </div>
          </CardContent>
        </Card>

        {/* Department List */}
        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
            <CardDescription>
              {filteredDepartments.length} department
              {filteredDepartments.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 animate-pulse"
                  >
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No departments found</p>
              </div>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDepartments.map((department) => (
                  <Card
                    key={department.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-6 w-6 text-primary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold truncate"
                              data-testid={`text-department-description-${department.id}`}
                            >
                              {department.description}
                            </h3>
                            <p
                              className="text-sm text-muted-foreground truncate"
                              data-testid={`text-department-code-${department.id}`}
                            >
                              {department.code}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            department.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          data-testid={`badge-department-status-${department.id}`}
                        >
                          {department.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments.map((department) => (
                    <TableRow
                      key={department.id}
                      data-testid={`department-table-row-${department.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary-foreground" />
                          </div>
                          <div>
                            <p
                              className="font-medium"
                              data-testid={`text-department-description-${department.id}`}
                            >
                              {department.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell
                        data-testid={`text-department-code-${department.id}`}
                      >
                        {department.code}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            department.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          data-testid={`badge-department-status-${department.id}`}
                        >
                          {department.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
