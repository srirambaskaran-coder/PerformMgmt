import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPublishQuestionnaireSchema, type PublishQuestionnaire, type InsertPublishQuestionnaire } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Search, Edit, Trash2, Send, Calendar, Clock, FileText } from "lucide-react";

export default function PublishQuestionnaires() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<PublishQuestionnaire | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries
  const { data: questionnaires = [], isLoading } = useQuery<PublishQuestionnaire[]>({
    queryKey: ["/api/publish-questionnaires"],
  });

  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/questionnaire-templates"],
  });

  const { data: calendars = [] } = useQuery<any[]>({
    queryKey: ["/api/frequency-calendars"],
  });

  // Mutations
  const createQuestionnaireMutation = useMutation({
    mutationFn: async (questionnaireData: InsertPublishQuestionnaire) => {
      await apiRequest("POST", "/api/publish-questionnaires", questionnaireData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publish-questionnaires"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Publish questionnaire created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating publish questionnaire:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error) ? "Access denied" : "Failed to create publish questionnaire",
        variant: "destructive",
      });
    },
  });

  const updateQuestionnaireMutation = useMutation({
    mutationFn: async ({ id, questionnaireData }: { id: string; questionnaireData: Partial<InsertPublishQuestionnaire> }) => {
      await apiRequest("PUT", `/api/publish-questionnaires/${id}`, questionnaireData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publish-questionnaires"] });
      setEditingQuestionnaire(null);
      resetForm();
      toast({
        title: "Success",
        description: "Publish questionnaire updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating publish questionnaire:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error) ? "Access denied" : "Failed to update publish questionnaire",
        variant: "destructive",
      });
    },
  });

  const deleteQuestionnaireMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/publish-questionnaires/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publish-questionnaires"] });
      toast({
        title: "Success",
        description: "Publish questionnaire deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting publish questionnaire:", error);
      toast({
        title: "Error",
        description: isUnauthorizedError(error) ? "Access denied" : "Failed to delete publish questionnaire",
        variant: "destructive",
      });
    },
  });

  // Form handling
  const form = useForm<InsertPublishQuestionnaire>({
    resolver: zodResolver(insertPublishQuestionnaireSchema),
    defaultValues: {
      code: "",
      displayName: "",
      templateId: "",
      publishType: "now",
      frequencyCalendarId: null,
      status: "active",
    },
  });

  const resetForm = () => {
    form.reset({
      code: "",
      displayName: "",
      templateId: "",
      publishType: "now",
      frequencyCalendarId: null,
      status: "active",
    });
  };

  const handleEdit = (questionnaire: PublishQuestionnaire) => {
    setEditingQuestionnaire(questionnaire);
    form.reset({
      code: questionnaire.code,
      displayName: questionnaire.displayName,
      templateId: questionnaire.templateId,
      publishType: questionnaire.publishType,
      frequencyCalendarId: questionnaire.frequencyCalendarId || null,
      status: questionnaire.status,
    });
  };

  const onSubmit = (data: InsertPublishQuestionnaire) => {
    if (editingQuestionnaire) {
      updateQuestionnaireMutation.mutate({
        id: editingQuestionnaire.id,
        questionnaireData: data,
      });
    } else {
      createQuestionnaireMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this publish questionnaire?")) {
      deleteQuestionnaireMutation.mutate(id);
    }
  };

  // Filtering logic
  const filteredQuestionnaires = questionnaires.filter((questionnaire) => {
    const matchesSearch = questionnaire.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         questionnaire.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || questionnaire.status === statusFilter;
    const matchesType = typeFilter === "all" || questionnaire.publishType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getPublishTypeIcon = (type: string) => {
    return type === 'now' ? Clock : Calendar;
  };

  const getPublishTypeBadge = (type: string) => {
    return type === 'now' ? 
      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
        <Clock className="w-3 h-3 mr-1" />
        Immediate
      </Badge> :
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
        <Calendar className="w-3 h-3 mr-1" />
        Scheduled
      </Badge>;
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Publish Questionnaires</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and schedule questionnaire publishing for performance reviews
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-questionnaire" onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Publish Questionnaire
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestionnaire ? "Edit Publish Questionnaire" : "Create New Publish Questionnaire"}
                </DialogTitle>
                <DialogDescription>
                  {editingQuestionnaire ? "Update the questionnaire publishing configuration" : "Configure a new questionnaire for publishing"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g., Q2024-ANNUAL" 
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

                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., Annual Performance Review 2024" 
                            data-testid="input-display-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Questionnaire Template</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-template">
                              <SelectValue placeholder="Select questionnaire template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map((template: any) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
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
                    name="publishType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publishing Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? "now"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-publish-type">
                              <SelectValue placeholder="Select publishing type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="now">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                Publish Now
                              </div>
                            </SelectItem>
                            <SelectItem value="as_per_calendar">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Schedule via Calendar
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("publishType") === "as_per_calendar" && (
                    <FormField
                      control={form.control}
                      name="frequencyCalendarId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency Calendar</FormLabel>
                          <Select onValueChange={(v) => field.onChange(v || null)} value={field.value ?? ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-frequency-calendar">
                                <SelectValue placeholder="Select frequency calendar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {calendars.map((calendar: any) => (
                                <SelectItem key={calendar.id} value={calendar.id}>
                                  {calendar.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setEditingQuestionnaire(null);
                        resetForm();
                      }}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createQuestionnaireMutation.isPending || updateQuestionnaireMutation.isPending}
                      data-testid="button-submit"
                    >
                      {createQuestionnaireMutation.isPending || updateQuestionnaireMutation.isPending ? "Saving..." : 
                       editingQuestionnaire ? "Update" : "Create"}
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
              placeholder="Search by name or code..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="filter-status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48" data-testid="filter-type">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="now">Immediate</SelectItem>
              <SelectItem value="as_per_calendar">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Questionnaires List */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8" data-testid="loading-state">
              <p>Loading publish questionnaires...</p>
            </div>
          ) : filteredQuestionnaires.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-state">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium">No publish questionnaires found</p>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Get started by creating your first publish questionnaire"}
              </p>
            </div>
          ) : (
            filteredQuestionnaires.map((questionnaire) => (
              <Card key={questionnaire.id} data-testid={`card-questionnaire-${questionnaire.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg" data-testid={`text-name-${questionnaire.id}`}>
                          {questionnaire.displayName}
                        </CardTitle>
                        {questionnaire.publishType && getPublishTypeBadge(questionnaire.publishType)}
                        <Badge variant={questionnaire.status === 'active' ? 'default' : 'secondary'}>
                          {questionnaire.status}
                        </Badge>
                      </div>
                      <CardDescription data-testid={`text-code-${questionnaire.id}`}>
                        Code: {questionnaire.code}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(questionnaire)}
                            data-testid={`button-edit-${questionnaire.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Publish Questionnaire</DialogTitle>
                            <DialogDescription>
                              Update the questionnaire publishing configuration
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="code"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Code</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          placeholder="e.g., Q2024-ANNUAL" 
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
                                      <Select onValueChange={field.onChange} value={field.value ?? "active"}>
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
                                name="displayName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Display Name</FormLabel>
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        placeholder="e.g., Annual Performance Review 2024" 
                                        data-testid="input-edit-display-name"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="templateId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Questionnaire Template</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-edit-template">
                                          <SelectValue placeholder="Select questionnaire template" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {templates.map((template: any) => (
                                          <SelectItem key={template.id} value={template.id}>
                                            {template.name}
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
                                name="publishType"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Publishing Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? "now"}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-edit-publish-type">
                                          <SelectValue placeholder="Select publishing type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="now">
                                          <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-2" />
                                            Publish Now
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="as_per_calendar">
                                          <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Schedule via Calendar
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {form.watch("publishType") === "as_per_calendar" && (
                                <FormField
                                  control={form.control}
                                  name="frequencyCalendarId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Frequency Calendar</FormLabel>
                                      <Select onValueChange={(v) => field.onChange(v || null)} value={field.value ?? ""}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-edit-frequency-calendar">
                                            <SelectValue placeholder="Select frequency calendar" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {calendars.map((calendar: any) => (
                                            <SelectItem key={calendar.id} value={calendar.id}>
                                              {calendar.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}

                              <div className="flex justify-end space-x-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={() => setEditingQuestionnaire(null)}
                                  data-testid="button-edit-cancel"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  disabled={updateQuestionnaireMutation.isPending}
                                  data-testid="button-edit-submit"
                                >
                                  {updateQuestionnaireMutation.isPending ? "Updating..." : "Update"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(questionnaire.id)}
                        disabled={deleteQuestionnaireMutation.isPending}
                        data-testid={`button-delete-${questionnaire.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Template: {templates.find((t: any) => t.id === questionnaire.templateId)?.name || 'Unknown'}</span>
                    </div>
                    {questionnaire.publishType === 'as_per_calendar' && questionnaire.frequencyCalendarId && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Calendar: {calendars.find((c: any) => c.id === questionnaire.frequencyCalendarId)?.name || 'Unknown'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Created: {questionnaire.createdAt ? new Date(questionnaire.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}