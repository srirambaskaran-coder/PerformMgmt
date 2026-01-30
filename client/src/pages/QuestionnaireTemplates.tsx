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
  insertQuestionnaireTemplateSchema,
  type QuestionnaireTemplate,
  type InsertQuestionnaireTemplate,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getClientIdFromSession } from "@/lib/ssoAuth";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { useTour } from "@/contexts/TourContext";
import {
  Copy,
  Edit,
  FileText,
  GripVertical,
  Minus,
  Plus,
  Search,
  Ban,
  Check,
  ChevronDown,
  X as XIcon,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

interface Question {
  id: string;
  text: string;
  type: "text" | "rating" | "textarea";
  required: boolean;
}

interface SortableQuestionProps {
  question: Question;
  index: number;
  updateQuestion: (id: string, field: keyof Question, value: any) => void;
  removeQuestion: (id: string) => void;
}

function SortableQuestion({
  question,
  index,
  updateQuestion,
  removeQuestion,
}: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
    // Add data for better drag detection
    data: {
      type: "Question",
      question,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "z-50" : ""}`}
    >
      <Card
        className={`p-4 ${
          isDragging ? "shadow-lg ring-2 ring-primary/20 bg-background" : ""
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 touch-none"
                data-testid={`drag-handle-${question.id}`}
                aria-label={`Drag to reorder question ${index + 1}`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>
              <h4 className="font-medium">Question {index + 1}</h4>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeQuestion(question.id)}
              data-testid={`remove-question-${question.id}`}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                placeholder="Enter question text..."
                value={question.text}
                onChange={(e) =>
                  updateQuestion(question.id, "text", e.target.value)
                }
                data-testid={`input-question-text-${question.id}`}
              />
            </div>
            <Select
              value={question.type}
              onValueChange={(value) =>
                updateQuestion(question.id, "type", value)
              }
            >
              <SelectTrigger
                data-testid={`select-question-type-${question.id}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Long Text</SelectItem>
                <SelectItem value="rating">Rating (1-5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 mt-3">
            <Checkbox
              id={`required-${question.id}`}
              checked={question.required}
              onCheckedChange={(checked) =>
                updateQuestion(question.id, "required", checked)
              }
              data-testid={`checkbox-question-required-${question.id}`}
            />
            <label
              htmlFor={`required-${question.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Required
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function QuestionnaireTemplates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [companyFilters, setCompanyFilters] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<QuestionnaireTemplate | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [tourDemoQuestionnaire, setTourDemoQuestionnaire] =
    useState<QuestionnaireTemplate | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { isRunning: isTourMode, currentAction, clearAction } = useTour();
  const currentUserRole =
    (currentUser as any)?.role || (currentUser as any)?.Role || "";
  const isSuperAdmin = currentUserRole === "super_admin";
  const currentUserCompanyId =
    (currentUser as any)?.companyId || (currentUser as any)?.CompanyId;

  const { data: templatesRaw = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/questionnaire-templates"],
  });

  // Normalize templates to handle API response with uppercase keys
  const templates: QuestionnaireTemplate[] = templatesRaw.map(
    (template: any) => ({
      id: template.Id || template.id,
      name: template.Name || template.name,
      description: template.Description || template.description,
      companyId:
        template.ClientId || template.CompanyId || template.companyId
          ? String(template.ClientId || template.CompanyId || template.companyId)
          : null,
      applicableLevelId:
        template.ApplicableLevelId || template.applicableLevelId
          ? String(template.ApplicableLevelId || template.applicableLevelId)
          : null,
      applicableGradeId:
        template.ApplicableGradeId || template.applicableGradeId
          ? String(template.ApplicableGradeId || template.applicableGradeId)
          : null,
      applicableLocationId:
        template.ApplicableLocationId || template.applicableLocationId
          ? String(
              template.ApplicableLocationId || template.applicableLocationId,
            )
          : null,
      // sendOnMail: template.SendOnMail || template.sendOnMail,
      status: template.Status ? "active" : "inactive",
      questions:
        typeof template.Questions === "string"
          ? JSON.parse(template.Questions || "[]").map((q: any) => ({
              id: q.Id || q.id,
              text: q.Text || q.text,
              type: q.Type || q.type,
              required: q.Required ?? q.required,
              options: q.Options || q.options,
            }))
          : template.questions || [],
      createdBy: template.CreatedBy || template.createdBy,
      createdAt: template.CreatedOn || template.createdAt,
      updatedBy: template.LastUpdatedBy || template.updatedBy,
      updatedAt: template.LastUpdatedOn || template.updatedAt,
    }),
  );

  const { data: locations = [] } = useQuery<any[]>({
    queryKey: ["/api/locations"],
    select: (data: any[]) => {
      return data.map((location: any) => ({
        id: String(location.Id),
        name: location.LocationName || location.Name,
        code: location.LocationCode || location.Code,
        companyId: String(
          location.ClientID || location.CompanyId || location.companyId || ""
        ),
        status: location.Status === 1 || location.Status === true,
      }));
    },
  });

  const { data: levels = [] } = useQuery<any[]>({
    queryKey: ["/api/levels"],
    select: (data: any[]) => {
      return data.map((level: any) => ({
        id: String(level.Id),
        code: level.Code,
        name: level.Name,
        companyId: String(level.ClientId || level.CompanyId || level.companyId || ""),
        status: level.Status === 1 || level.Status === true,
      }));
    },
  });

  const { data: grades = [] } = useQuery<any[]>({
    queryKey: ["/api/grades"],
    select: (data: any[]) => {
      return data.map((grade: any) => ({
        id: String(grade.Id),
        code: grade.Code,
        description: grade.Description,
        companyId: String(grade.ClientId || grade.CompanyId || grade.companyId || ""),
        status: grade.Status === 1 || grade.Status === true,
      }));
    },
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
    select: (data: any[]) => {
      return data.map((company: any) => ({
        id: String(company.Id || company.id),
        name: company.Name || company.name,
      }));
    },
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: isSuperAdmin,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: InsertQuestionnaireTemplate) => {
      // Transform to PascalCase and convert status to boolean
      const payload = {
        Name: templateData.name,
        Description: templateData.description,
        ClientId: getClientIdFromSession(),
        ApplicableLevelId: templateData.applicableLevelId
          ? Number(templateData.applicableLevelId)
          : null,
        ApplicableGradeId: templateData.applicableGradeId
          ? Number(templateData.applicableGradeId)
          : null,
        ApplicableLocationId: templateData.applicableLocationId
          ? Number(templateData.applicableLocationId)
          : null,
        Questions: templateData.questions?.map((q: any) => ({
          Id: q.id,
          Text: q.text,
          Type: q.type,
          Required: q.required,
          Options: q.options,
        })),
        Status:
          templateData.status === "active"
            ? true
            : templateData.status === "inactive"
              ? false
              : templateData.status,
      };
      await apiRequest("POST", "/api/questionnaire-templates", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/questionnaire-templates"],
      });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Questionnaire template created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating questionnaire template:", error);
      toast({
        title: "Error",
        description: "Failed to create questionnaire template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({
      id,
      templateData,
    }: {
      id: string;
      templateData: Partial<InsertQuestionnaireTemplate>;
    }) => {
      // Transform to PascalCase and convert status to boolean
      const payload: any = {};
      if (templateData.name !== undefined) payload.Name = templateData.name;
      if (templateData.description !== undefined)
        payload.Description = templateData.description;
      if (templateData.companyId !== undefined)
        payload.ClientId = getClientIdFromSession();
      if (templateData.applicableLevelId !== undefined)
        payload.ApplicableLevelId = templateData.applicableLevelId
          ? Number(templateData.applicableLevelId)
          : null;
      if (templateData.applicableGradeId !== undefined)
        payload.ApplicableGradeId = templateData.applicableGradeId
          ? Number(templateData.applicableGradeId)
          : null;
      if (templateData.applicableLocationId !== undefined)
        payload.ApplicableLocationId = templateData.applicableLocationId
          ? Number(templateData.applicableLocationId)
          : null;
      if (templateData.questions !== undefined) {
        payload.Questions = templateData.questions?.map((q: any) => ({
          Id: q.id,
          Text: q.text,
          Type: q.type,
          Required: q.required,
          Options: q.options,
        }));
      }
      if (templateData.status !== undefined) {
        payload.Status =
          templateData.status === "active"
            ? true
            : templateData.status === "inactive"
              ? false
              : templateData.status;
      }
      await apiRequest("PUT", `/api/questionnaire-templates/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/questionnaire-templates"],
      });
      setEditingTemplate(null);
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Questionnaire template updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating questionnaire template:", error);
      toast({
        title: "Error",
        description: "Failed to update questionnaire template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/questionnaire-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/questionnaire-templates"],
      });
      toast({
        title: "Success",
        description: "Questionnaire template deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete questionnaire template",
        variant: "destructive",
      });
    },
  });

  const copyTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await apiRequest(
        "POST",
        `/api/questionnaire-templates/${templateId}/copy`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/questionnaire-templates"],
      });
      toast({
        title: "Success",
        description: "Template copied successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to copy this template",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to copy template",
          variant: "destructive",
        });
      }
    },
  });

  const form = useForm<InsertQuestionnaireTemplate>({
    resolver: zodResolver(insertQuestionnaireTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      companyId: null,
      applicableLevelId: null,
      applicableGradeId: null,
      applicableLocationId: null,
      questions: [],
      status: "active",
    },
  });

  // Watch the selected company ID for filtering dependent dropdowns
  const selectedCompanyId = form.watch("companyId");

  // Determine the effective company ID for filtering (use selected or current user's company)
  const effectiveCompanyId = selectedCompanyId || (!isSuperAdmin && currentUserCompanyId ? String(currentUserCompanyId) : null);

  // Filter locations, levels, and grades based on selected company or current user's company
  const filteredLocations =
    effectiveCompanyId
      ? locations.filter(
          (loc: any) => String(loc.companyId) === effectiveCompanyId && loc.status === true,
        )
      : locations.filter((loc: any) => loc.status === true);

  const filteredLevels =
    effectiveCompanyId
      ? levels.filter(
          (level: any) => String(level.companyId) === effectiveCompanyId && level.status === true,
        )
      : levels.filter((level: any) => level.status === true);

  const filteredGrades =
    effectiveCompanyId
      ? grades.filter(
          (grade: any) => String(grade.companyId) === effectiveCompanyId && grade.status === true,
        )
      : grades.filter((grade: any) => grade.status === true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newQuestions = arrayMove(questions, oldIndex, newIndex);
        setQuestions(newQuestions);
        // Sync form field with local state
        form.setValue("questions", newQuestions);
      }
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: "",
      type: "text",
      required: true,
    };
    const newQuestions = [...questions, newQuestion];
    setQuestions(newQuestions);
    // Sync form field with local state
    form.setValue("questions", newQuestions);
  };

  const removeQuestion = (id: string) => {
    const newQuestions = questions.filter((q) => q.id !== id);
    setQuestions(newQuestions);
    // Sync form field with local state
    form.setValue("questions", newQuestions);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    const newQuestions = questions.map((q) =>
      q.id === id ? { ...q, [field]: value } : q,
    );
    setQuestions(newQuestions);
    // Sync form field with local state
    form.setValue("questions", newQuestions);
  };

  const onSubmit = (data: InsertQuestionnaireTemplate) => {
    console.log("Form submitted", { data, questions, editingTemplate });
    const templateData = {
      ...data,
      questions: questions,
    };

    if (editingTemplate) {
      console.log("Updating template", editingTemplate.id, templateData);
      updateTemplateMutation.mutate({ id: editingTemplate.id, templateData });
    } else {
      console.log("Creating template", templateData);
      createTemplateMutation.mutate(templateData);
    }
  };

  const handleEdit = (template: QuestionnaireTemplate) => {
    console.log("Editing template", template);
    setEditingTemplate(template);
    setIsCreateModalOpen(true);
    const templateQuestions = (template.questions as Question[]) || [];
    console.log("Template questions", templateQuestions);
    form.reset({
      name: template.name,
      description: template.description || "",
      companyId: template.companyId ? String(template.companyId) : null,
      applicableLevelId: template.applicableLevelId
        ? String(template.applicableLevelId)
        : null,
      applicableGradeId: template.applicableGradeId
        ? String(template.applicableGradeId)
        : null,
      applicableLocationId: template.applicableLocationId
        ? String(template.applicableLocationId)
        : null,
      status: template.status || "active",
      questions: templateQuestions, // Include questions in form reset
    });
    setQuestions(templateQuestions);
  };

  const handleDelete = (id: string) => {
    setDeleteTemplateId(id);
  };

  const confirmDelete = () => {
    if (deleteTemplateId) {
      deleteTemplateMutation.mutate(deleteTemplateId);
      setDeleteTemplateId(null);
    }
  };

  const handleCopy = (id: string) => {
    copyTemplateMutation.mutate(id);
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setQuestions([]);
    form.reset({
      name: "",
      description: "",
      // For non-super admins, default to their company ID
      companyId:
        !isSuperAdmin && currentUserCompanyId
          ? String(currentUserCompanyId)
          : null,
      applicableLevelId: null,
      applicableGradeId: null,
      applicableLocationId: null,
      questions: [],
      status: "active",
    });
  };

  // Tour action handlers
  useEffect(() => {
    if (!isTourMode || !currentAction) return;

    if (currentAction === "openQuestionnaireForm") {
      setEditingTemplate(null);
      setIsCreateModalOpen(true);
      setQuestions([]);
      // Fill demo data after modal opens
      setTimeout(() => {
        form.setValue("name", "DEMO-ANNUAL-REVIEW");
        form.setValue(
          "description",
          "Annual Performance Review - Demo data created during tour",
        );
        form.setValue("status", "active");
        if (!isSuperAdmin && currentUserCompanyId) {
          form.setValue("companyId", String(currentUserCompanyId));
        }
      }, 200);
      clearAction();
    } else if (currentAction === "addQuestionnaireQuestion") {
      // Add a demo question
      const demoQuestion: Question = {
        id: "demo-q-" + Date.now().toString(),
        text: "What are your key accomplishments this review period?",
        type: "textarea",
        required: true,
      };
      const newQuestions = [...questions, demoQuestion];
      setQuestions(newQuestions);
      form.setValue("questions", newQuestions);
      // Add minimal delay to let the question render before clearing action
      setTimeout(() => {
        clearAction();
      }, 100);
    } else if (currentAction === "saveQuestionnaireAndClose") {
      // Close modal and add demo questionnaire
      setIsCreateModalOpen(false);
      resetForm();
      // Add demo questionnaire to display
      setTourDemoQuestionnaire({
        id: 9999,
        name: "DEMO-ANNUAL-REVIEW",
        description:
          "Annual Performance Review - Demo data created during tour",
        companyId:
          !isSuperAdmin && currentUserCompanyId
            ? String(currentUserCompanyId)
            : null,
        applicableLevelId: null,
        applicableGradeId: null,
        applicableLocationId: null,
        questions: questions, // Include the questions that were added during tour
        status: "active",
        createdOn: new Date().toISOString(),
        lastUpdatedOn: new Date().toISOString(),
        createdBy: null,
        lastUpdatedBy: null,
      } as QuestionnaireTemplate);
      clearAction();
    }
  }, [
    currentAction,
    isTourMode,
    clearAction,
    form,
    isSuperAdmin,
    currentUserCompanyId,
    resetForm,
    questions,
  ]);

  // Clean up tour demo data when tour ends
  useEffect(() => {
    const handleTourEnd = () => {
      setTourDemoQuestionnaire(null);
      setIsCreateModalOpen(false);
      resetForm();
    };

    window.addEventListener("tourEnded", handleTourEnd);
    return () => window.removeEventListener("tourEnded", handleTourEnd);
  }, [resetForm]);

  // Update form companyId when currentUser loads (for admins)
  useEffect(() => {
    if (!isSuperAdmin && currentUserCompanyId && !editingTemplate) {
      form.setValue("companyId", String(currentUserCompanyId));
    }
  }, [isSuperAdmin, currentUserCompanyId, editingTemplate, form]);

  // Enrich templates with company information
  const enrichedTemplates = templates.map((template) => {
    if (template.companyId) {
      const company = companies.find((c: any) => c.id === template.companyId);
      return {
        ...template,
        companyName: company?.name || null,
      };
    }
    return template;
  });

  // Include tour demo questionnaire if in tour mode
  const allTemplates = tourDemoQuestionnaire
    ? [tourDemoQuestionnaire, ...enrichedTemplates]
    : enrichedTemplates;

  const filteredTemplates = allTemplates.filter((template) => {
    // For non-super admins, only show templates from their company
    if (!isSuperAdmin && currentUserCompanyId) {
      const matchesUserCompany =
        template.companyId === String(currentUserCompanyId);
      if (!matchesUserCompany) return false;
    }

    const matchesSearch =
      searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilters.length === 0 ||
      (template.status && statusFilters.includes(template.status));

    const matchesCompany =
      companyFilters.length === 0 ||
      (template.companyId && companyFilters.includes(template.companyId));

    return matchesSearch && matchesStatus && matchesCompany;
  });

  return (
    <RoleGuard allowedRoles={["super_admin", "admin", "hr_manager"]}>
      <div
        className="space-y-6 questionnaire-list"
        data-testid="questionnaire-templates"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Questionnaire Templates</h1>
            <p className="text-muted-foreground">
              Manage performance review questionnaire templates
            </p>
          </div>
          <Dialog
            open={isCreateModalOpen || !!editingTemplate}
            onOpenChange={(open) => {
              // Prevent closing during tour mode
              if (isTourMode && !open) return;
              // Only close dialog if user explicitly wants to close it, not during form interactions
              if (
                !open &&
                !updateTemplateMutation.isPending &&
                !createTemplateMutation.isPending
              ) {
                setIsCreateModalOpen(false);
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                data-testid="button-create-questionnaire"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent
              className={cn(
                "max-w-4xl max-h-[90vh] overflow-y-auto",
                isTourMode && "z-[9997]",
              )}
              data-testid="dialog-create-questionnaire"
            >
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Edit Template" : "Add New Template"}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplate
                    ? "Update questionnaire template"
                    : "Create a new questionnaire template"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit, (errors) => {
                    console.error("Form validation errors:", errors);
                  })}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Q4 2023 Employee Review"
                            data-testid="input-template-name"
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
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Template description..."
                            data-testid="input-description"
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
                          value={field.value || ""}
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

                  {/* Enhanced Fields */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Applicability Settings
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="companyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <Select
                              onValueChange={(v) => field.onChange(v || null)}
                              value={field.value ?? ""}
                              disabled={!isSuperAdmin}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-company">
                                  <SelectValue placeholder="Select Company" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {companies.map((company: any) => (
                                  <SelectItem
                                    key={company.id}
                                    value={String(company.id)}
                                  >
                                    {company.name}
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
                        name="applicableLevelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Applicable Level</FormLabel>
                            <Select
                              onValueChange={(v) => field.onChange(v || null)}
                              value={field.value ?? ""}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-applicable-level">
                                  <SelectValue placeholder="All Levels" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                {filteredLevels.map((level: any) => (
                                  <SelectItem key={level.id} value={level.id}>
                                    {level.name}
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
                        name="applicableGradeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Applicable Grade</FormLabel>
                            <Select
                              onValueChange={(v) => field.onChange(v || null)}
                              value={field.value ?? ""}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-applicable-grade">
                                  <SelectValue placeholder="All Grades" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all">All Grades</SelectItem>
                                {filteredGrades.map((grade: any) => (
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
                      <FormField
                        control={form.control}
                        name="applicableLocationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Applicable Location</FormLabel>
                            <Select
                              onValueChange={(v) => field.onChange(v || null)}
                              value={field.value ?? ""}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-applicable-location">
                                  <SelectValue placeholder="All Locations" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all">
                                  All Locations
                                </SelectItem>
                                {filteredLocations.map((location: any) => (
                                  <SelectItem
                                    key={location.id}
                                    value={location.id}
                                  >
                                    {location.name} ({location.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Questions Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Questions</h3>
                      <Button
                        type="button"
                        onClick={addQuestion}
                        variant="outline"
                        size="sm"
                        data-testid="add-question"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>

                    {questions.length > 0 ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={[...questions].reverse().map((q) => q.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {[...questions].reverse().map((question) => {
                              // Get the original index from the questions array for correct numbering
                              const originalIndex = questions.findIndex(
                                (q) => q.id === question.id,
                              );
                              return (
                                <SortableQuestion
                                  key={question.id}
                                  question={question}
                                  index={originalIndex}
                                  updateQuestion={updateQuestion}
                                  removeQuestion={removeQuestion}
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          No questions added yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Click "Add Question" to get started
                        </p>
                      </div>
                    )}
                  </div>

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
                      disabled={
                        createTemplateMutation.isPending ||
                        updateTemplateMutation.isPending
                      }
                      data-testid="submit-template"
                    >
                      {editingTemplate ? "Update Template" : "Create Template"}
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
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-templates"
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

              {isSuperAdmin && (
                <MultiSelect
                  options={companies.map((company: any) => ({
                    value: company.id,
                    label: company.name,
                  }))}
                  selected={companyFilters}
                  onChange={setCompanyFilters}
                  placeholder="All Companies"
                  label="companies"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded mb-4"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredTemplates.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">
                No templates found
              </p>
              <p className="text-muted-foreground text-sm">
                Create your first questionnaire template
              </p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <Card
                key={template.id}
                data-testid={
                  template.id === 9999
                    ? "tour-demo-questionnaire"
                    : `template-card-${template.id}`
                }
                className={cn(
                  "relative",
                  template.id === 9999 &&
                    "border-2 border-primary bg-primary/5",
                )}
              >
                <CardContent className="p-6 pt-12">
                  {/* Action buttons positioned at top-right corner */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <RoleGuard
                      allowedRoles={["super_admin", "admin", "hr_manager"]}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(template.id)}
                        disabled={copyTemplateMutation.isPending}
                        data-testid={`copy-template-${template.id}`}
                        title="Copy Template"
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </RoleGuard>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      data-testid={`edit-template-${template.id}`}
                      title="Edit Template"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      data-testid={`delete-template-${template.id}`}
                      title="Make Inactive"
                      className="h-8 w-8 p-0"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Card content */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3
                          className="font-semibold truncate"
                          data-testid={`template-name-${template.id}`}
                        >
                          {template.name}
                        </h3>
                        {(template as any).companyName && (
                          <Badge
                            variant="outline"
                            className="text-xs flex-shrink-0"
                          >
                            {(template as any).companyName}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge
                          variant={
                            template.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {template.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {template.description && <p>{template.description}</p>}
                    <p>
                      Questions:{" "}
                      {Array.isArray(template.questions)
                        ? template.questions.length
                        : 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTemplateId}
        onOpenChange={(open) => !open && setDeleteTemplateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make Questionnaire Template Inactive</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to make this questionnaire template inactive?
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
