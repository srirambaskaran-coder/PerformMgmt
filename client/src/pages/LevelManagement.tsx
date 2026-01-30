import { useState, useEffect, useCallback, useRef } from "react";
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
  insertLevelSchema,
  type Level,
  type InsertLevel,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getClientIdFromSession } from "@/lib/ssoAuth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/RoleGuard";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTour } from "@/contexts/TourContext";
import {
  Plus,
  Search,
  Edit,
  Ban,
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
  const [tourDemoLevel, setTourDemoLevel] = useState<Level | null>(null);
  const [deleteLevelId, setDeleteLevelId] = useState<string | null>(null);

  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { isTourMode, currentAction, clearAction } = useTour();

  // Track previous tour mode to detect when tour ends
  const prevTourModeRef = useRef(isTourMode);

  // Form handling - must be defined before useEffect that uses it
  const form = useForm<InsertLevel>({
    resolver: zodResolver(insertLevelSchema),
    defaultValues: {
      code: "",
      description: "",
      status: "active",
    },
  });

  const resetForm = useCallback(() => {
    form.reset({
      code: "",
      description: "",
      status: "active",
    });
  }, [form]);

  // Handle tour actions
  useEffect(() => {
    // Only clean up when tour mode changes from true to false (tour ends)
    if (prevTourModeRef.current && !isTourMode) {
      setTourDemoLevel(null);
      setIsCreateModalOpen(false);
      resetForm();
    }
    prevTourModeRef.current = isTourMode;

    if (!isTourMode) {
      return;
    }

    if (currentAction === "openLevelForm") {
      // Open modal and fill with demo data
      resetForm();
      setIsCreateModalOpen(true);
      // Fill form after dialog opens
      setTimeout(() => {
        form.setValue("code", "DEMO-SR");
        form.setValue(
          "description",
          "Senior Level - Demo data created during tour",
        );
        form.setValue("status", "active");
      }, 200);
      clearAction();
    } else if (currentAction === "saveLevelAndClose") {
      // Close modal and add demo level
      setIsCreateModalOpen(false);
      resetForm();
      // Add demo level to display
      setTourDemoLevel({
        id: 9999,
        code: "DEMO-SR",
        description: "Senior Level - Demo data created during tour",
        status: "active",
        companyId: currentUser?.companyId
          ? Number(currentUser.companyId)
          : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: null,
        createdByName: "Tour Demo",
        lastUpdatedBy: null,
      });
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
      setTourDemoLevel(null);
      setIsCreateModalOpen(false);
      resetForm();
    };

    window.addEventListener("tourEnded", handleTourEnd);
    return () => window.removeEventListener("tourEnded", handleTourEnd);
  }, [resetForm]);

  // Data queries
  const { data: levels = [], isLoading } = useQuery<Level[]>({
    queryKey: ["/api/levels"],
    select: (data: any[]) => {
      return data.map((level: any) => ({
        id: level.Id,
        code: level.Code,
        description: level.Description,
        status: level.Status ? "active" : "inactive",
        companyId: level.CompanyId,
        createdAt: level.CreatedOn,
        updatedAt: level.LastUpdatedOn,
        createdBy: level.CreatedBy,
        createdByName: level.CreatedByName,
        lastUpdatedBy: level.LastUpdatedBy,
      }));
    },
  });

  // Mutations
  const createLevelMutation = useMutation({
    mutationFn: async (levelData: InsertLevel) => {
      // Transform to PascalCase and convert status to boolean
      const payload = {
        Code: levelData.code,
        Description: levelData.description,
        Status:
          levelData.status === "active"
            ? true
            : levelData.status === "inactive"
              ? false
              : levelData.status,
        ClientId: getClientIdFromSession(),
      };
      await apiRequest("POST", "/api/levels", payload);
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
      // Transform to PascalCase and convert status to boolean
      const payload: any = {};
      if (levelData.code !== undefined) payload.Code = levelData.code;
      if (levelData.description !== undefined)
        payload.Description = levelData.description;
      if (levelData.status !== undefined) {
        payload.Status =
          levelData.status === "active"
            ? true
            : levelData.status === "inactive"
              ? false
              : levelData.status;
      }
      if (levelData.companyId !== undefined) {
        payload.ClientId = getClientIdFromSession();
      }
      await apiRequest("PUT", `/api/levels/${id}`, payload);
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
    setDeleteLevelId(id);
  };

  const confirmDelete = () => {
    if (deleteLevelId) {
      deleteLevelMutation.mutate(deleteLevelId);
      setDeleteLevelId(null);
    }
  };

  // Filtering logic - include tour demo level if in tour mode
  const allLevels = tourDemoLevel ? [tourDemoLevel, ...levels] : levels;
  const filteredLevels = allLevels.filter((level) => {
    const matchesSearch =
      (level.code &&
        level.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (level.description &&
        level.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilters.length === 0 ||
      (level.status && statusFilters.includes(level.status));
    return matchesSearch && matchesStatus;
  });

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="container mx-auto py-6 level-list">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Level Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage organizational levels for employee categorization and
            evaluation purposes
          </p>
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
              <Card
                key={level.id}
                data-testid={
                  level.id === 9999
                    ? "tour-demo-level"
                    : `card-level-${level.id}`
                }
                className={
                  level.id === 9999
                    ? "border-2 border-primary bg-primary/5"
                    : ""
                }
              >
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
                      {/* {level.description && (
                        <CardDescription
                          data-testid={`text-description-${level.id}`}
                        >
                          {level.description}
                        </CardDescription>
                      )} */}
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
                          {level.createdByName && ` by ${level.createdByName}`}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteLevelId}
        onOpenChange={(open) => !open && setDeleteLevelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make Level Inactive</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to make this level inactive?
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
