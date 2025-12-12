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
  CalendarDays,
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
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { insertFrequencyCalendarDetailsSchema } from "@shared/schema";
import { z } from "zod";
import type {
  FrequencyCalendarDetails,
  InsertFrequencyCalendarDetails,
  FrequencyCalendar,
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

export default function FrequencyCalendarDetailsManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDetails, setEditingDetails] =
    useState<FrequencyCalendarDetails | null>(null);

  // Fetch frequency calendar details
  const {
    data: calendarDetails = [],
    isLoading,
    error,
  } = useQuery<FrequencyCalendarDetails[]>({
    queryKey: ["/api/frequency-calendar-details"],
  });

  // Fetch frequency calendars for dropdown
  const { data: frequencyCalendars = [], isLoading: isLoadingCalendars } =
    useQuery<FrequencyCalendar[]>({
      queryKey: ["/api/frequency-calendars"],
    });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertFrequencyCalendarDetails) =>
      apiRequest("POST", "/api/frequency-calendar-details", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/frequency-calendar-details"],
      });
      toast({
        title: "Success",
        description: "Calendar details created successfully",
      });
      resetForm();
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create calendar details",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: InsertFrequencyCalendarDetails;
    }) => apiRequest("PUT", `/api/frequency-calendar-details/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/frequency-calendar-details"],
      });
      toast({
        title: "Success",
        description: "Calendar details updated successfully",
      });
      setEditingDetails(null);
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update calendar details",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/frequency-calendar-details/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/frequency-calendar-details"],
      });
      toast({
        title: "Success",
        description: "Calendar details deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete calendar details",
        variant: "destructive",
      });
    },
  });

  // Enhanced schema with date range validation
  const enhancedSchema = insertFrequencyCalendarDetailsSchema.refine(
    (data) => data.endDate >= data.startDate,
    {
      path: ["endDate"],
      message: "End date must be on or after start date",
    }
  );

  // Form handling
  const form = useForm<InsertFrequencyCalendarDetails>({
    resolver: zodResolver(enhancedSchema),
    defaultValues: {
      frequencyCalendarId: "",
      displayName: "",
      startDate: new Date(),
      endDate: new Date(),
      status: "active",
    },
  });

  const resetForm = () => {
    form.reset({
      frequencyCalendarId: "",
      displayName: "",
      startDate: new Date(),
      endDate: new Date(),
      status: "active",
    });
  };

  const handleEdit = (details: FrequencyCalendarDetails) => {
    setEditingDetails(details);
    form.reset({
      frequencyCalendarId: details.frequencyCalendarId,
      displayName: details.displayName,
      startDate: details.startDate ? new Date(details.startDate) : new Date(),
      endDate: details.endDate ? new Date(details.endDate) : new Date(),
      status: details.status,
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete these calendar details?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: InsertFrequencyCalendarDetails) => {
    if (editingDetails) {
      updateMutation.mutate({ id: editingDetails.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Filtering logic
  const filteredDetails = calendarDetails.filter((details) => {
    const matchesSearch = details.displayName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilters.length === 0 ||
      (details.status && statusFilters.includes(details.status));
    return matchesSearch && matchesStatus;
  });

  // Helper functions
  const getCalendarName = (id: string) => {
    const calendar = frequencyCalendars.find((c) => c.id === id);
    return calendar ? calendar.code : "Unknown";
  };

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

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-destructive">Failed to load calendar details</p>
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
              Calendar Details Management
            </h1>
            <p className="text-muted-foreground">
              Manage detailed calendar periods and date ranges
            </p>
          </div>
          <Dialog
            open={isCreateModalOpen}
            onOpenChange={(open) => {
              setIsCreateModalOpen(open);
              if (!open) {
                setEditingDetails(null);
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-create">
                <Plus className="h-4 w-4" />
                Create Calendar Details
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingDetails
                    ? "Edit Calendar Details"
                    : "Create Calendar Details"}
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
                      name="frequencyCalendarId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency Calendar</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? ""}
                          >
                            <FormControl>
                              <SelectTrigger
                                data-testid="select-frequency-calendar"
                                disabled={isLoadingCalendars}
                              >
                                <SelectValue
                                  placeholder={
                                    isLoadingCalendars
                                      ? "Loading calendars..."
                                      : "Select calendar"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {frequencyCalendars.map((calendar) => (
                                <SelectItem
                                  key={calendar.id}
                                  value={calendar.id}
                                >
                                  {calendar.code}
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
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Q1 Review Period, Annual Assessment 2024"
                            data-testid="input-display-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
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
                              data-testid="input-start-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
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
                              data-testid="input-end-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                        : editingDetails
                        ? "Update"
                        : "Create"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setEditingDetails(null);
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
              placeholder="Search by display name..."
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
        ) : filteredDetails.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || statusFilters.length > 0
                ? "No calendar details found"
                : "No calendar details yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilters.length > 0
                ? "Try adjusting your search or filter criteria"
                : "Create your first calendar details to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDetails.map((details) => (
              <Card
                key={details.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-purple-600" />
                      <div>
                        <CardTitle
                          className="text-lg"
                          data-testid={`text-display-name-${details.id}`}
                        >
                          {details.displayName}
                        </CardTitle>
                        <Badge
                          variant={
                            details.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          data-testid={`badge-status-${details.id}`}
                        >
                          {details.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(details)}
                        data-testid={`button-edit-${details.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(details.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${details.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex flex-col gap-1 text-sm">
                    <span>
                      <strong>Calendar:</strong>{" "}
                      {getCalendarName(details.frequencyCalendarId)}
                    </span>
                    <span>
                      <strong>Period:</strong> {formatDate(details.startDate)} -{" "}
                      {formatDate(details.endDate)}
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
