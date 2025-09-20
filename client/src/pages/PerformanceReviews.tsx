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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReviewCycleSchema, type ReviewCycle, type InsertReviewCycle, type User, type QuestionnaireTemplate } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Search, Calendar, Users, Send, Eye } from "lucide-react";

export default function PerformanceReviews() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviewCycles = [], isLoading } = useQuery<ReviewCycle[]>({
    queryKey: ["/api/review-cycles"],
  });

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/users", { role: "employee" }],
  });

  const { data: templates = [] } = useQuery<QuestionnaireTemplate[]>({
    queryKey: ["/api/questionnaire-templates"],
  });

  const createReviewCycleMutation = useMutation({
    mutationFn: async (cycleData: InsertReviewCycle) => {
      await apiRequest("POST", "/api/review-cycles", cycleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/review-cycles"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Success",
        description: "Review cycle created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create review cycle",
        variant: "destructive",
      });
    },
  });

  const sendInvitationsMutation = useMutation({
    mutationFn: async ({ employeeIds, reviewCycleId }: { employeeIds: string[]; reviewCycleId: string }) => {
      await apiRequest("POST", "/api/send-review-invitations", { employeeIds, reviewCycleId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Review invitations sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send review invitations",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertReviewCycle>({
    resolver: zodResolver(insertReviewCycleSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      questionnaireTemplateId: "",
      status: "active",
    },
  });

  const onSubmit = (data: InsertReviewCycle) => {
    createReviewCycleMutation.mutate(data);
  };

  const handleSendInvitations = (reviewCycleId: string) => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Please select employees to send invitations",
        variant: "destructive",
      });
      return;
    }
    sendInvitationsMutation.mutate({ employeeIds: selectedEmployees, reviewCycleId });
  };

  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      questionnaireTemplateId: "",
      status: "active",
    });
    setSelectedEmployees([]);
  };

  const filteredReviewCycles = reviewCycles.filter((cycle) => {
    const matchesSearch = searchQuery === "" || 
      cycle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cycle.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "" || cycle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <RoleGuard allowedRoles={["hr_manager"]}>
      <div className="space-y-6" data-testid="performance-reviews">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Performance Reviews</h1>
            <p className="text-muted-foreground">Manage performance review cycles and send invitations</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateModalOpen(true)} data-testid="start-review-cycle-button">
                <Plus className="h-4 w-4 mr-2" />
                Start Review Cycle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Start New Review Cycle</DialogTitle>
                <DialogDescription>
                  Create a new performance review cycle and select employees to participate
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Review Cycle Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Q4 2023 Performance Review" data-testid="input-cycle-name" />
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
                          <Textarea {...field} placeholder="Description of the review cycle..." data-testid="input-description" />
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
                              type="date" 
                              {...field}
                              value={field.value ? field.value.toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
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
                              type="date" 
                              {...field}
                              value={field.value ? field.value.toISOString().split('T')[0] : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                              data-testid="input-end-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="questionnaireTemplateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Questionnaire Template</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-template">
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map((template) => (
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

                  {/* Employee Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Select Employees</h3>
                    <div className="max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
                      {employees.map((employee) => (
                        <div key={employee.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={employee.id}
                            checked={selectedEmployees.includes(employee.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedEmployees([...selectedEmployees, employee.id]);
                              } else {
                                setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                              }
                            }}
                          />
                          <label htmlFor={employee.id} className="text-sm font-medium cursor-pointer">
                            {employee.firstName} {employee.lastName} - {employee.designation}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
                    </p>
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
                      disabled={createReviewCycleMutation.isPending}
                      data-testid="submit-review-cycle"
                    >
                      Start Review Cycle
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
                  placeholder="Search review cycles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-cycles"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="filter-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Review Cycles */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredReviewCycles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">No review cycles found</p>
                <p className="text-muted-foreground text-sm">Start your first performance review cycle</p>
              </CardContent>
            </Card>
          ) : (
            filteredReviewCycles.map((cycle) => (
              <Card key={cycle.id} data-testid={`cycle-card-${cycle.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold" data-testid={`cycle-name-${cycle.id}`}>
                          {cycle.name}
                        </h3>
                        <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'}>
                          {cycle.status}
                        </Badge>
                      </div>
                      {cycle.description && (
                        <p className="text-muted-foreground mb-3">{cycle.description}</p>
                      )}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendInvitations(cycle.id)}
                        disabled={sendInvitationsMutation.isPending}
                        data-testid={`send-invitations-${cycle.id}`}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Invitations
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`view-cycle-${cycle.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
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
