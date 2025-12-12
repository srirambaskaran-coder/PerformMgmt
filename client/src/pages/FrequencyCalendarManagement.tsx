import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Check,
  ChevronDown,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { insertFrequencyCalendarSchema } from "@shared/schema";
import type {
  FrequencyCalendar,
  InsertFrequencyCalendar,
  AppraisalCycle,
  ReviewFrequency,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

export default function FrequencyCalendarManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] =
    useState<FrequencyCalendar | null>(null);

  // Fetch frequency calendars
  const {
    data: calendars = [],
    isLoading,
    error,
  } = useQuery<FrequencyCalendar[]>({
    queryKey: ["/api/frequency-calendars"],
  });

  // Fetch appraisal cycles for dropdown
  const { data: appraisalCycles = [] } = useQuery<AppraisalCycle[]>({
    queryKey: ["/api/appraisal-cycles"],
  });

  // Fetch review frequencies for dropdown
  const { data: reviewFrequencies = [] } = useQuery<ReviewFrequency[]>({
    queryKey: ["/api/review-frequencies"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertFrequencyCalendar) =>
      apiRequest("POST", "/api/frequency-calendars", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frequency-calendars"] });
      toast({
        title: "Success",
        description: "Frequency calendar created successfully",
      });
      resetForm();
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create frequency calendar",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertFrequencyCalendar }) =>
      apiRequest("PUT", `/api/frequency-calendars/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frequency-calendars"] });
      toast({
        title: "Success",
        description: "Frequency calendar updated successfully",
      });
      setEditingCalendar(null);
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update frequency calendar",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/frequency-calendars/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/frequency-calendars"] });
      toast({
        title: "Success",
        description: "Frequency calendar deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete frequency calendar",
        variant: "destructive",
      });
    },
  });

  // Form handling
  const form = useForm<InsertFrequencyCalendar>({
    resolver: zodResolver(insertFrequencyCalendarSchema),
    defaultValues: {
      code: "",
      description: "",
      appraisalCycleId: "",
      reviewFrequencyId: "",
      status: "active",
    },
  });

  const resetForm = () => {
    form.reset({
      code: "",
      description: "",
      appraisalCycleId: "",
      reviewFrequencyId: "",
      status: "active",
    });
  };

  const handleEdit = (calendar: FrequencyCalendar) => {
    setEditingCalendar(calendar);
    form.reset({
      code: calendar.code,
      description: calendar.description || "",
      appraisalCycleId: calendar.appraisalCycleId,
      reviewFrequencyId: calendar.reviewFrequencyId,
      status: calendar.status,
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this frequency calendar?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: InsertFrequencyCalendar) => {
    if (editingCalendar) {
      updateMutation.mutate({ id: editingCalendar.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Filtering logic
  const filteredCalendars = calendars.filter((calendar) => {
    const matchesSearch =
      calendar.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (calendar.description &&
        calendar.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilters.length === 0 ||
      (calendar.status && statusFilters.includes(calendar.status));
    return matchesSearch && matchesStatus;
  });

  // Helper functions
  const getAppraisalCycleName = (id: string) => {
    const cycle = appraisalCycles.find((c) => c.id === id);
    return cycle ? cycle.code : "Unknown";
  };

  const getReviewFrequencyName = (id: string) => {
    const frequency = reviewFrequencies.find((f) => f.id === id);
    return frequency ? frequency.code : "Unknown";
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-destructive">Failed to load frequency calendars</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Frequency Calendar Management
            </h1>
            <p className="text-muted-foreground">
              Manage frequency calendar configurations for your organization
            </p>
          </div>
          <Dialog
            open={isCreateModalOpen}
            onOpenChange={(open) => {
              setIsCreateModalOpen(open);
              if (!open) {
                setEditingCalendar(null);
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-create">
                <Plus className="h-4 w-4" />
                Create Frequency Calendar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCalendar
                    ? "Edit Frequency Calendar"
                    : "Create Frequency Calendar"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calendar Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., CAL-2024-Q1, FC-ANNUAL"
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
                      name="appraisalCycleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Appraisal Cycle</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? ""}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-appraisal-cycle">
                                <SelectValue placeholder="Select appraisal cycle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {appraisalCycles.map((cycle) => (
                                <SelectItem key={cycle.id} value={cycle.id}>
                                  {cycle.code}
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
                      name="reviewFrequencyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Review Frequency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? ""}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-review-frequency">
                                <SelectValue placeholder="Select review frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {reviewFrequencies.map((frequency) => (
                                <SelectItem
                                  key={frequency.id}
                                  value={frequency.id}
                                >
                                  {frequency.code}
                                </SelectItem>
                              ))}
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
                            placeholder="Describe this frequency calendar..."
                            rows={3}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={
                        createMutation.isPending || updateMutation.isPending
                      }
                      data-testid="button-submit"
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? "Saving..."
                        : editingCalendar
                        ? "Update"
                        : "Create"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setEditingCalendar(null);
                        resetForm();
                      }}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCalendars.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || statusFilters.length > 0
                ? "No frequency calendars found"
                : "No frequency calendars yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilters.length > 0
                ? "Try adjusting your search or filter criteria"
                : "Create your first frequency calendar to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCalendars.map((calendar) => (
              <Card
                key={calendar.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <div>
                        <CardTitle
                          className="text-lg"
                          data-testid={`text-code-${calendar.id}`}
                        >
                          {calendar.code}
                        </CardTitle>
                        <Badge
                          variant={
                            calendar.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          data-testid={`badge-status-${calendar.id}`}
                        >
                          {calendar.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(calendar)}
                        data-testid={`button-edit-${calendar.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(calendar.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${calendar.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <p
                    className="text-sm text-muted-foreground"
                    data-testid={`text-description-${calendar.id}`}
                  >
                    {calendar.description || "No description provided"}
                  </p>
                  <div className="flex flex-col gap-1 text-sm">
                    <span>
                      <strong>Cycle:</strong>{" "}
                      {getAppraisalCycleName(calendar.appraisalCycleId)}
                    </span>
                    <span>
                      <strong>Frequency:</strong>{" "}
                      {getReviewFrequencyName(calendar.reviewFrequencyId)}
                    </span>
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
