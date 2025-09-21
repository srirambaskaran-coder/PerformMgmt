import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAppraisalCycleSchema, type AppraisalCycle, type InsertAppraisalCycle } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Search, Edit, Trash2, Repeat, Tag, Clock, CalendarDays } from "lucide-react";

export default function AppraisalCycleManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<AppraisalCycle | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries
  const { data: cycles = [], isLoading } = useQuery<AppraisalCycle[]>({
    queryKey: ["/api/appraisal-cycles"],
  });

  // Mutations
  const createCycleMutation = useMutation({
    mutationFn: async (cycleData: InsertAppraisalCycle) => {
      await apiRequest("POST", "/api/appraisal-cycles", cycleData);
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
        description: isUnauthorizedError(error) ? "Access denied" : "Failed to create appraisal cycle",
        variant: "destructive",
      });
    },
  });

  const updateCycleMutation = useMutation({
    mutationFn: async ({ id, cycleData }: { id: string; cycleData: Partial<InsertAppraisalCycle> }) => {
      await apiRequest("PUT", `/api/appraisal-cycles/${id}`, cycleData);
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
        description: isUnauthorizedError(error) ? "Access denied" : "Failed to update appraisal cycle",
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
        description: isUnauthorizedError(error) ? "Access denied" : "Failed to delete appraisal cycle",
        variant: "destructive",
      });
    },
  });

  // Enhanced schema with date range validation
  const enhancedSchema = insertAppraisalCycleSchema.refine(
    (data) => data.toDate >= data.fromDate,
    {
      path: ['toDate'],
      message: 'To date must be on or after from date'
    }
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
    if (confirm("Are you sure you want to delete this appraisal cycle?")) {
      deleteCycleMutation.mutate(id);
    }
  };

  // Filtering logic
  const filteredCycles = cycles.filter((cycle) => {
    const matchesSearch = cycle.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (cycle.description && cycle.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || cycle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date | null) => {
    return date ? new Date(date).toLocaleDateString() : 'Not set';
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Appraisal Cycle Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage performance appraisal cycles with defined start and end dates for systematic reviews
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-cycle" onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Appraisal Cycle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCycle ? "Edit Appraisal Cycle" : "Create New Appraisal Cycle"}
                </DialogTitle>
                <DialogDescription>
                  {editingCycle ? "Update the appraisal cycle details" : "Define a new performance appraisal cycle with specific dates and objectives"}
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
                              value={field.value ? formatDateForInput(field.value) : ''}
                              onChange={(e) => field.onChange(parseLocalDate(e.target.value))}
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
                              value={field.value ? formatDateForInput(field.value) : ''}
                              onChange={(e) => field.onChange(parseLocalDate(e.target.value))}
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
                      disabled={createCycleMutation.isPending || updateCycleMutation.isPending}
                      data-testid="button-submit"
                    >
                      {createCycleMutation.isPending || updateCycleMutation.isPending ? "Saving..." : 
                       editingCycle ? "Update" : "Create"}
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
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Get started by creating your first appraisal cycle"}
              </p>
            </div>
          ) : (
            filteredCycles.map((cycle) => (
              <Card key={cycle.id} data-testid={`card-cycle-${cycle.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Repeat className="w-5 h-5 text-purple-600" />
                        <CardTitle className="text-lg" data-testid={`text-code-${cycle.id}`}>
                          {cycle.code}
                        </CardTitle>
                        <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'}>
                          {cycle.status}
                        </Badge>
                      </div>
                      {cycle.description && (
                        <CardDescription data-testid={`text-description-${cycle.id}`}>
                          {cycle.description}
                        </CardDescription>
                      )}
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
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>Duration: {formatDate(cycle.fromDate)} - {formatDate(cycle.toDate)}</span>
                    </div>
                    {cycle.description && (
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        <span>Description</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <Clock className="w-4 h-4" />
                      <span>Created: {cycle.createdAt ? new Date(cycle.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog - Single Instance */}
        <Dialog open={!!editingCycle} onOpenChange={(open) => !open && setEditingCycle(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Appraisal Cycle</DialogTitle>
              <DialogDescription>
                Update the appraisal cycle details
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
                            value={field.value ? formatDateForInput(field.value) : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
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
                            value={field.value ? formatDateForInput(field.value) : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
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
    </RoleGuard>
  );
}