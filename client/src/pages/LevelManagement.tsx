import { useState } from "react";
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
  insertLevelSchema,
  type Level,
  type InsertLevel,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Layers,
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

export default function LevelManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries
  const { data: levels = [], isLoading } = useQuery<Level[]>({
    queryKey: ["/api/levels"],
  });

  // Mutations
  const createLevelMutation = useMutation({
    mutationFn: async (levelData: InsertLevel) => {
      await apiRequest("POST", "/api/levels", levelData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/levels"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Level created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating level:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error)
          ? "Access denied"
          : "Failed to create level",
        variant: "destructive",
      });
    },
  });

  const updateLevelMutation = useMutation({
    mutationFn: async ({
      id,
      levelData,
    }: {
      id: string;
      levelData: Partial<InsertLevel>;
    }) => {
      await apiRequest("PUT", `/api/levels/${id}`, levelData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/levels"] });
      setEditingLevel(null);
      resetForm();
      toast({
        title: "Success",
        description: "Level updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating level:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error)
          ? "Access denied"
          : "Failed to update level",
        variant: "destructive",
      });
    },
  });

  const deleteLevelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/levels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/levels"] });
      toast({
        title: "Success",
        description: "Level deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting level:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error)
          ? "Access denied"
          : "Failed to delete level",
        variant: "destructive",
      });
    },
  });

  // Form handling
  const form = useForm<InsertLevel>({
    resolver: zodResolver(insertLevelSchema),
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

  const handleEdit = (level: Level) => {
    setEditingLevel(level);
    form.reset({
      code: level.code,
      description: level.description || "",
      status: level.status,
    });
  };

  const onSubmit = (data: InsertLevel) => {
    if (editingLevel) {
      updateLevelMutation.mutate({
        id: editingLevel.id,
        levelData: data,
      });
    } else {
      createLevelMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this level?")) {
      deleteLevelMutation.mutate(id);
    }
  };

  // Filtering logic
  const filteredLevels = levels.filter((level) => {
    const matchesSearch =
      level.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (level.description &&
        level.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilters.length === 0 ||
      (level.status && statusFilters.includes(level.status));
    return matchesSearch && matchesStatus;
  });

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Level Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage organizational levels for employee categorization and
              evaluation purposes
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="button-create-level"
                onClick={() => resetForm()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Level
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingLevel ? "Edit Level" : "Create New Level"}
                </DialogTitle>
                <DialogDescription>
                  {editingLevel
                    ? "Update the organizational level details"
                    : "Define a new organizational level for employee categorization"}
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
                          <FormLabel>Level Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., L1, L2, MGR, DIR"
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
                            placeholder="Describe the responsibilities and expectations for this level..."
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
                        setEditingLevel(null);
                        resetForm();
                      }}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createLevelMutation.isPending ||
                        updateLevelMutation.isPending
                      }
                      data-testid="button-submit"
                    >
                      {createLevelMutation.isPending ||
                      updateLevelMutation.isPending
                        ? "Saving..."
                        : editingLevel
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

        {/* Levels List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8" data-testid="loading-state">
              <p>Loading levels...</p>
            </div>
          ) : filteredLevels.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-state">
              <Layers className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium">No levels found</p>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || statusFilters.length > 0
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first organizational level"}
              </p>
            </div>
          ) : (
            filteredLevels.map((level) => (
              <Card key={level.id} data-testid={`card-level-${level.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-5 h-5 text-blue-600" />
                        <CardTitle
                          className="text-lg"
                          data-testid={`text-code-${level.id}`}
                        >
                          {level.code}
                        </CardTitle>
                        <Badge
                          variant={
                            level.status === "active" ? "default" : "secondary"
                          }
                        >
                          {level.status}
                        </Badge>
                      </div>
                      {level.description && (
                        <CardDescription
                          data-testid={`text-description-${level.id}`}
                        >
                          {level.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Dialog
                        open={!!editingLevel}
                        onOpenChange={(open) => !open && setEditingLevel(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(level)}
                            data-testid={`button-edit-${level.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Level</DialogTitle>
                            <DialogDescription>
                              Update the organizational level details
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
                                      <FormLabel>Level Code</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="e.g., L1, L2, MGR, DIR"
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
                                          <SelectItem value="active">
                                            Active
                                          </SelectItem>
                                          <SelectItem value="inactive">
                                            Inactive
                                          </SelectItem>
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
                                        placeholder="Describe the responsibilities and expectations for this level..."
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
                                  onClick={() => setEditingLevel(null)}
                                  data-testid="button-edit-cancel"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={updateLevelMutation.isPending}
                                  data-testid="button-edit-submit"
                                >
                                  {updateLevelMutation.isPending
                                    ? "Updating..."
                                    : "Update"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(level.id)}
                        disabled={deleteLevelMutation.isPending}
                        data-testid={`button-delete-${level.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {level.description && (
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        <span>Level Description</span>
                      </div>
                      <p className="pl-6">{level.description}</p>
                      <div className="flex items-center gap-2 pt-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          Created:{" "}
                          {level.createdAt
                            ? new Date(level.createdAt).toLocaleDateString()
                            : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
