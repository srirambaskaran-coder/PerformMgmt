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
import { z } from "zod";
import {
  insertAppraisalCycleSchema,
  type AppraisalCycle,
  type InsertAppraisalCycle,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getClientIdFromSession } from "@/lib/ssoAuth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTour } from "@/contexts/TourContext";
import { RoleGuard } from "@/components/RoleGuard";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Plus,
  Search,
  Edit,
  Ban,
  Repeat,
  Tag,
  Clock,
  CalendarDays,
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

export default function AppraisalCycleManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<AppraisalCycle | null>(null);
  const [tourDemoCycle, setTourDemoCycle] = useState<AppraisalCycle | null>(
    null,
  );
  const [deleteCycleId, setDeleteCycleId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { isRunning: isTourMode, currentAction, clearAction } = useTour();

  // Data queries
  const { data: cycles = [], isLoading } = useQuery<AppraisalCycle[]>({
    queryKey: ["/api/appraisal-cycles"],
    select: (data: any[]) => {
      return data.map((cycle: any) => ({
        id: cycle.Id,
        code: cycle.Code,
        description: cycle.Description,
        fromDate: cycle.FromDate,
        toDate: cycle.ToDate,
        status: cycle.Status ? "active" : "inactive",
        companyId: cycle.CompanyId,
        createdBy: cycle.CreatedBy,
        createdOn: cycle.CreatedOn,
        lastUpdatedBy: cycle.LastUpdatedBy,
        lastUpdatedOn: cycle.LastUpdatedOn,
        createdAt: cycle.CreatedOn,
        updatedAt: cycle.LastUpdatedOn,
        createdById: cycle.CreatedBy || "",
      }));
    },
  });

  // Mutations
  const createCycleMutation = useMutation({
    mutationFn: async (cycleData: InsertAppraisalCycle) => {
      const payload = {
        Code: cycleData.code,
        Description: cycleData.description,
        FromDate: cycleData.fromDate,
        ToDate: cycleData.toDate,
        Status:
          cycleData.status === "active"
            ? true
            : cycleData.status === "inactive"
              ? false
              : cycleData.status,
        ClientId: getClientIdFromSession(),
      };
      await apiRequest("POST", "/api/appraisal-cycles", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appraisal-cycles"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Appraisal cycle created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating appraisal cycle:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error)
          ? "Access denied"
          : "Failed to create appraisal cycle",
        variant: "destructive",
      });
    },
  });

  const updateCycleMutation = useMutation({
    mutationFn: async ({
      id,
      cycleData,
    }: {
      id: string;
      cycleData: Partial<InsertAppraisalCycle>;
    }) => {
      const payload: any = {};
      if (cycleData.code !== undefined) payload.Code = cycleData.code;
      if (cycleData.description !== undefined)
        payload.Description = cycleData.description;
      if (cycleData.fromDate !== undefined)
        payload.FromDate = cycleData.fromDate;
      if (cycleData.toDate !== undefined) payload.ToDate = cycleData.toDate;
      if (cycleData.status !== undefined) {
        payload.Status =
          cycleData.status === "active"
            ? true
            : cycleData.status === "inactive"
              ? false
              : cycleData.status;
      }
      payload.ClientId = getClientIdFromSession();
      await apiRequest("PUT", `/api/appraisal-cycles/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appraisal-cycles"] });
      setEditingCycle(null);
      resetForm();
      toast({
        title: "Success",
        description: "Appraisal cycle updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating appraisal cycle:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error)
          ? "Access denied"
          : "Failed to update appraisal cycle",
        variant: "destructive",
      });
    },
  });

  const deleteCycleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/appraisal-cycles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appraisal-cycles"] });
      toast({
        title: "Success",
        description: "Appraisal cycle deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting appraisal cycle:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error)
          ? "Access denied"
          : "Failed to delete appraisal cycle",
        variant: "destructive",
      });
    },
  });

  // Enhanced schema with date range validation
  const enhancedSchema = insertAppraisalCycleSchema.refine(
    (data) => data.toDate >= data.fromDate,
    {
      path: ["toDate"],
      message: "To date must be on or after from date",
    },
  );

  // Form handling
  const form = useForm<InsertAppraisalCycle>({
    resolver: zodResolver(enhancedSchema),
    defaultValues: {
      code: "",
      fromDate: new Date(),
      toDate: new Date(),
      description: "",
      status: "active",
    },
  });

  const resetForm = () => {
    form.reset({
      code: "",
      fromDate: new Date(),
      toDate: new Date(),
      description: "",
      status: "active",
    });
  };

  // Tour action handlers
  useEffect(() => {
    if (!isTourMode || !currentAction) return;

    if (currentAction === "openAppraisalCycleForm") {
      setEditingCycle(null);
      setIsCreateModalOpen(true);
      // Fill demo data after modal opens
      setTimeout(() => {
        const fromDate = new Date(2026, 0, 1); // Jan 1, 2026
        const toDate = new Date(2026, 11, 31); // Dec 31, 2026
        form.setValue("code", "DEMO-2026");
        form.setValue("fromDate", fromDate);
        form.setValue("toDate", toDate);
        form.setValue(
          "description",
          "Annual Review 2026 - Demo data created during tour",
        );
        form.setValue("status", "active");
      }, 200);
      clearAction();
    } else if (currentAction === "saveAppraisalCycleAndClose") {
      // Close modal and add demo cycle
      setIsCreateModalOpen(false);
      resetForm();
      // Add demo cycle to display
      setTourDemoCycle({
        id: 9999,
        code: "DEMO-2026",
        description: "Annual Review 2026 - Demo data created during tour",
        fromDate: new Date(2026, 0, 1),
        toDate: new Date(2026, 11, 31),
        status: "active",
        companyId: currentUser?.companyId
          ? Number(currentUser.companyId)
          : null,
        createdBy: null,
        createdOn: new Date().toISOString(),
        lastUpdatedBy: null,
        lastUpdatedOn: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: "Tour Demo",
      } as AppraisalCycle);
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
      setTourDemoCycle(null);
      setIsCreateModalOpen(false);
      resetForm();
    };

    window.addEventListener("tourEnded", handleTourEnd);
    return () => window.removeEventListener("tourEnded", handleTourEnd);
  }, [resetForm]);

  const handleEdit = (cycle: AppraisalCycle) => {
    setEditingCycle(cycle);
    form.reset({
      code: cycle.code,
      fromDate: cycle.fromDate ? new Date(cycle.fromDate) : new Date(),
      toDate: cycle.toDate ? new Date(cycle.toDate) : new Date(),
      description: cycle.description || "",
      status: cycle.status,
    });
  };

  const onSubmit = (data: InsertAppraisalCycle) => {
    if (editingCycle) {
      updateCycleMutation.mutate({
        id: editingCycle.id,
        cycleData: data,
      });
    } else {
      createCycleMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteCycleId(id);
  };

  const confirmDelete = () => {
    if (deleteCycleId) {
      deleteCycleMutation.mutate(deleteCycleId);
      setDeleteCycleId(null);
    }
  };

  // Filtering logic - include tour demo cycle if in tour mode
  const allCycles = tourDemoCycle ? [tourDemoCycle, ...cycles] : cycles;
  const filteredCycles = (allCycles || []).filter((cycle: AppraisalCycle) => {
    const matchesSearch =
      (cycle.code &&
        cycle.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cycle.description &&
        cycle.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilters.length === 0 ||
      (cycle.status && statusFilters.includes(cycle.status));
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date | null) => {
    return date ? new Date(date).toLocaleDateString() : "Not set";
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="container mx-auto py-6 appraisal-cycle-list">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Appraisal Cycle Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage performance appraisal cycles with defined start and end
              dates for systematic reviews
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
                data-testid="button-create-cycle"
                onClick={() => resetForm()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Appraisal Cycle
              </Button>
            </DialogTrigger>
            <DialogContent
              className={cn("max-w-2xl", isTourMode && "z-[9997]")}
              data-testid="dialog-create-cycle"
            >
              <DialogHeader>
                <DialogTitle>
                  {editingCycle
                    ? "Edit Appraisal Cycle"
                    : "Create New Appraisal Cycle"}
                </DialogTitle>
                <DialogDescription>
                  {editingCycle
                    ? "Update the appraisal cycle details"
                    : "Define a new performance appraisal cycle with specific dates and objectives"}
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
                          <FormLabel>Cycle Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., CY2024, Q4-2024, ANNUAL-24"
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fromDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Date</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              value={
                                field.value
                                  ? formatDateForInput(field.value)
                                  : ""
                              }
                              onChange={(e) =>
                                field.onChange(parseLocalDate(e.target.value))
                              }
                              data-testid="input-from-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="toDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To Date</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              value={
                                field.value
                                  ? formatDateForInput(field.value)
                                  : ""
                              }
                              onChange={(e) =>
                                field.onChange(parseLocalDate(e.target.value))
                              }
                              data-testid="input-to-date"
                            />
                          </FormControl>
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
                            placeholder="Describe the objectives, scope, and goals for this appraisal cycle..."
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
                        setEditingCycle(null);
                        resetForm();
                      }}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createCycleMutation.isPending ||
                        updateCycleMutation.isPending
                      }
                      data-testid="button-submit"
                    >
                      {createCycleMutation.isPending ||
                      updateCycleMutation.isPending
                        ? "Saving..."
                        : editingCycle
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

        {/* Cycles List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8" data-testid="loading-state">
              <p>Loading appraisal cycles...</p>
            </div>
          ) : filteredCycles.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-state">
              <Repeat className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium">No appraisal cycles found</p>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || statusFilters.length > 0
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first appraisal cycle"}
              </p>
            </div>
          ) : (
            filteredCycles.map((cycle: AppraisalCycle) => (
              <Card
                key={cycle.id}
                data-testid={
                  cycle.id === 9999
                    ? "tour-demo-cycle"
                    : `card-cycle-${cycle.id}`
                }
                className={
                  cycle.id === 9999
                    ? "border-2 border-primary bg-primary/5"
                    : ""
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Repeat className="w-5 h-5 text-purple-600" />
                        <CardTitle
                          className="text-lg"
                          data-testid={`text-code-${cycle.id}`}
                        >
                          {cycle.code}
                        </CardTitle>
                        <Badge
                          variant={
                            cycle.status === "active" ? "default" : "secondary"
                          }
                        >
                          {cycle.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(cycle)}
                        data-testid={`button-edit-${cycle.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(cycle.id)}
                        disabled={deleteCycleMutation.isPending}
                        data-testid={`button-delete-${cycle.id}`}
                        title="Mark Inactive"
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>
                        Duration: {formatDate(cycle.fromDate)} -{" "}
                        {formatDate(cycle.toDate)}
                      </span>
                    </div>
                    {cycle.description && (
                      <>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          <span>Description</span>
                        </div>
                        <p className="pl-6">{cycle.description}</p>
                      </>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        Created:{" "}
                        {cycle.createdAt
                          ? new Date(cycle.createdAt).toLocaleDateString()
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog - Single Instance */}
        <Dialog
          open={!!editingCycle}
          onOpenChange={(open) => !open && setEditingCycle(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Appraisal Cycle</DialogTitle>
              <DialogDescription>
                Update the appraisal cycle details
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
                        <FormLabel>Cycle Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., CY2024, Q4-2024, ANNUAL-24"
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Date</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            value={
                              field.value ? formatDateForInput(field.value) : ""
                            }
                            onChange={(e) =>
                              field.onChange(new Date(e.target.value))
                            }
                            data-testid="input-edit-from-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="toDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Date</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            value={
                              field.value ? formatDateForInput(field.value) : ""
                            }
                            onChange={(e) =>
                              field.onChange(new Date(e.target.value))
                            }
                            data-testid="input-edit-to-date"
                          />
                        </FormControl>
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
                          placeholder="Describe the objectives, scope, and goals for this appraisal cycle..."
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
                    onClick={() => setEditingCycle(null)}
                    data-testid="button-edit-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateCycleMutation.isPending}
                    data-testid="button-edit-submit"
                  >
                    {updateCycleMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog
        open={!!deleteCycleId}
        onOpenChange={(open) => !open && setDeleteCycleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make Appraisal Cycle Inactive</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to make this appraisal cycle inactive?
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
