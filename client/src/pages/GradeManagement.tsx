import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertGradeSchema,
  type Grade,
  type InsertGrade,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getClientIdFromSession } from "@/lib/ssoAuth";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { useTour } from "@/contexts/TourContext";
import {
  Plus,
  Search,
  Edit,
  Ban,
  Award,
  Tag,
  Clock,
  Check,
  ChevronDown,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function GradeManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [tourDemoGrade, setTourDemoGrade] = useState<Grade | null>(null);
  const [deleteGradeId, setDeleteGradeId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { isRunning: isTourMode, currentAction, clearAction } = useTour();

  // Data queries
  const { data: grades = [], isLoading } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
    select: (data: any[]) => {
      return data.map((grade: any) => ({
        id: grade.Id,
        code: grade.Code,
        description: grade.Description,
        status: grade.Status ? "active" : "inactive",
        companyId: grade.CompanyId,
        createdOn: grade.CreatedOn,
        lastUpdatedOn: grade.LastUpdatedOn,
        createdBy: grade.CreatedBy,
        createdByName: grade.CreatedByName,
        lastUpdatedBy: grade.LastUpdatedBy,
      }));
    },
  });

  // Mutations
  const createGradeMutation = useMutation({
    mutationFn: async (gradeData: InsertGrade) => {
      // Transform to PascalCase and convert status to boolean
      const payload = {
        Code: gradeData.code,
        Description: gradeData.description,
        Status:
          gradeData.status === "active"
            ? true
            : gradeData.status === "inactive"
              ? false
              : gradeData.status,
        ClientId: getClientIdFromSession(),
      };
      await apiRequest("POST", "/api/grades", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Grade created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating grade:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error)
          ? "Access denied"
          : "Failed to create grade",
        variant: "destructive",
      });
    },
  });

  const updateGradeMutation = useMutation({
    mutationFn: async ({
      id,
      gradeData,
    }: {
      id: string;
      gradeData: Partial<InsertGrade>;
    }) => {
      // Transform to PascalCase and convert status to boolean
      const payload: any = {};
      if (gradeData.code !== undefined) payload.Code = gradeData.code;
      if (gradeData.description !== undefined)
        payload.Description = gradeData.description;
      if (gradeData.status !== undefined) {
        payload.Status =
          gradeData.status === "active"
            ? true
            : gradeData.status === "inactive"
              ? false
              : gradeData.status;
      }
      if (gradeData.companyId !== undefined) {
        payload.ClientId = getClientIdFromSession();
      }
      await apiRequest("PUT", `/api/grades/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      setEditingGrade(null);
      resetForm();
      toast({
        title: "Success",
        description: "Grade updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating grade:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error)
          ? "Access denied"
          : "Failed to update grade",
        variant: "destructive",
      });
    },
  });

  const deleteGradeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/grades/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({
        title: "Success",
        description: "Grade deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting grade:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error)
          ? "Access denied"
          : "Failed to delete grade",
        variant: "destructive",
      });
    },
  });

  // Form handling
  const form = useForm<InsertGrade>({
    resolver: zodResolver(insertGradeSchema),
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

  // Tour action handlers
  useEffect(() => {
    if (!isTourMode || !currentAction) return;

    if (currentAction === "openGradeForm") {
      setEditingGrade(null);
      setIsCreateModalOpen(true);
      // Fill demo data after modal opens
      setTimeout(() => {
        form.setValue("code", "DEMO-G1");
        form.setValue("description", "Grade 1 - Demo data created during tour");
        form.setValue("status", "active");
      }, 200);
      clearAction();
    } else if (currentAction === "saveGradeAndClose") {
      // Close modal and add demo grade
      setIsCreateModalOpen(false);
      resetForm();
      // Add demo grade to display
      setTourDemoGrade({
        id: 9999,
        code: "DEMO-G1",
        description: "Grade 1 - Demo data created during tour",
        status: "active",
        companyId: currentUser?.companyId
          ? Number(currentUser.companyId)
          : null,
        createdOn: new Date().toISOString(),
        lastUpdatedOn: new Date().toISOString(),
        createdBy: null,
        createdByName: "Tour Demo",
        lastUpdatedBy: null,
      } as Grade);
      clearAction();
    }
  }, [
    currentAction,
    isTourMode,
    clearAction,
    form,
    currentUser?.companyId,
    resetForm,
  ]);

  // Clean up tour demo data when tour ends
  useEffect(() => {
    const handleTourEnd = () => {
      setTourDemoGrade(null);
      setIsCreateModalOpen(false);
      resetForm();
    };

    window.addEventListener("tourEnded", handleTourEnd);
    return () => window.removeEventListener("tourEnded", handleTourEnd);
  }, [resetForm]);

  const handleEdit = (grade: Grade) => {
    setEditingGrade(grade);
    form.reset({
      code: grade.code,
      description: grade.description || "",
      status: grade.status,
    });
  };

  const onSubmit = (data: InsertGrade) => {
    if (editingGrade) {
      updateGradeMutation.mutate({
        id: editingGrade.id,
        gradeData: data,
      });
    } else {
      createGradeMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteGradeId(id);
  };

  const confirmDelete = () => {
    if (deleteGradeId) {
      deleteGradeMutation.mutate(deleteGradeId);
      setDeleteGradeId(null);
    }
  };

  // Filtering logic - include tour demo grade if in tour mode
  const allGrades = tourDemoGrade ? [tourDemoGrade, ...grades] : grades;
  const filteredGrades = allGrades.filter((grade) => {
    const matchesSearch =
      grade.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (grade.description &&
        grade.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilters.length === 0 ||
      (grade.status && statusFilters.includes(grade.status));
    return matchesSearch && matchesStatus;
  });

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="container mx-auto py-6 grade-list">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Grade Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage organizational grades for employee categorization and
              compensation structure
            </p>
          </div>
          <Dialog
            open={isCreateModalOpen}
            onOpenChange={(open) => {
              if (isTourMode && !open) return;
              setIsCreateModalOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button
                data-testid="button-create-grade"
                onClick={() => resetForm()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Grade
              </Button>
            </DialogTrigger>
            <DialogContent
              className={cn("max-w-2xl", isTourMode && "z-[9997]")}
              data-testid="dialog-create-grade"
            >
              <DialogHeader>
                <DialogTitle>
                  {editingGrade ? "Edit Grade" : "Create New Grade"}
                </DialogTitle>
                <DialogDescription>
                  {editingGrade
                    ? "Update the organizational grade details"
                    : "Define a new organizational grade for employee compensation and categorization"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., G1, G2, A1, B1"
                              data-testid="input-code"
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

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the responsibilities, compensation range, and requirements for this grade..."
                            className="min-h-24"
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setEditingGrade(null);
                        resetForm();
                      }}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createGradeMutation.isPending ||
                        updateGradeMutation.isPending
                      }
                      data-testid="button-submit"
                    >
                      {createGradeMutation.isPending ||
                      updateGradeMutation.isPending
                        ? "Saving..."
                        : editingGrade
                          ? "Update"
                          : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by code or description..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
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

        {/* Grades List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8" data-testid="loading-state">
              <p>Loading grades...</p>
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-state">
              <Award className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium">No grades found</p>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || statusFilters.length > 0
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first organizational grade"}
              </p>
            </div>
          ) : (
            filteredGrades.map((grade) => (
              <Card
                key={grade.id}
                data-testid={
                  grade.id === 9999
                    ? "tour-demo-grade"
                    : `card-grade-${grade.id}`
                }
                className={
                  grade.id === 9999
                    ? "border-2 border-primary bg-primary/5"
                    : ""
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-amber-600" />
                        <CardTitle
                          className="text-lg"
                          data-testid={`text-code-${grade.id}`}
                        >
                          {grade.code}
                        </CardTitle>
                        <Badge
                          variant={
                            grade.status === "active" ? "default" : "secondary"
                          }
                        >
                          {grade.status}
                        </Badge>
                      </div>
                      {grade.description && (
                        <CardDescription
                          data-testid={`text-description-${grade.id}`}
                        >
                          {grade.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(grade)}
                        data-testid={`button-edit-${grade.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(grade.id)}
                        disabled={deleteGradeMutation.isPending}
                        data-testid={`button-delete-${grade.id}`}
                        title="Mark Inactive"
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {grade.description && (
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        <span>Grade Description</span>
                      </div>
                      <p className="pl-6">{grade.description}</p>
                      <div className="flex items-center gap-2 pt-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Created:{" "}
                          {grade.createdOn
                            ? new Date(grade.createdOn).toLocaleDateString()
                            : "Unknown"}
                          {grade.createdByName && ` by ${grade.createdByName}`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog - Single Instance */}
        <Dialog
          open={!!editingGrade}
          onOpenChange={(open) => !open && setEditingGrade(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Grade</DialogTitle>
              <DialogDescription>
                Update the organizational grade details
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., G1, G2, A1, B1"
                            data-testid="input-edit-code"
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
                            <SelectTrigger data-testid="select-edit-status">
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the responsibilities, compensation range, and requirements for this grade..."
                          className="min-h-24"
                          data-testid="input-edit-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingGrade(null)}
                    data-testid="button-edit-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateGradeMutation.isPending}
                    data-testid="button-edit-submit"
                  >
                    {updateGradeMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteGradeId}
        onOpenChange={(open) => !open && setDeleteGradeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make Grade Inactive</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to make this grade inactive?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Make Inactive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleGuard>
  );
}
