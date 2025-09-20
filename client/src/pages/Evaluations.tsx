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
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  ClipboardList, 
  Calendar, 
  Download, 
  Send, 
  Eye, 
  CheckCircle, 
  Clock,
  Star,
  FileText
} from "lucide-react";
import type { Evaluation, User as UserType, ReviewCycle } from "@shared/schema";

interface EvaluationWithDetails extends Evaluation {
  employee?: UserType;
  manager?: UserType;
  reviewCycle?: ReviewCycle;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'rating' | 'textarea';
  required: boolean;
}

export default function Evaluations() {
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationWithDetails | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: evaluations = [], isLoading } = useQuery<EvaluationWithDetails[]>({
    queryKey: ["/api/evaluations", { employeeId: user?.id }],
  });

  const submitEvaluationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/evaluations/${id}`, {
        selfEvaluationData: data,
        selfEvaluationSubmittedAt: new Date(),
        status: 'in_progress',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
      setIsViewModalOpen(false);
      toast({
        title: "Success",
        description: "Evaluation submitted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit evaluation",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    defaultValues: responses,
  });

  const handleViewEvaluation = (evaluation: EvaluationWithDetails) => {
    setSelectedEvaluation(evaluation);
    setIsViewModalOpen(true);
    
    // Load existing responses if available
    if (evaluation.selfEvaluationData) {
      setResponses(evaluation.selfEvaluationData as Record<string, any>);
      form.reset(evaluation.selfEvaluationData as Record<string, any>);
    }
  };

  const onSubmit = (data: any) => {
    if (selectedEvaluation) {
      submitEvaluationMutation.mutate({ id: selectedEvaluation.id, data });
    }
  };

  const getStatusIcon = (evaluation: EvaluationWithDetails) => {
    if (evaluation.selfEvaluationSubmittedAt) {
      return <CheckCircle className="h-4 w-4 text-accent" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (evaluation: EvaluationWithDetails) => {
    if (evaluation.finalizedAt) return "Completed";
    if (evaluation.managerEvaluationSubmittedAt) return "Manager Review Complete";
    if (evaluation.selfEvaluationSubmittedAt) return "Self Evaluation Complete";
    return "Pending";
  };

  const getStatusVariant = (evaluation: EvaluationWithDetails) => {
    if (evaluation.finalizedAt) return "default";
    if (evaluation.managerEvaluationSubmittedAt) return "secondary";
    if (evaluation.selfEvaluationSubmittedAt) return "outline";
    return "destructive";
  };

  // Sample questions for demonstration
  const sampleQuestions: Question[] = [
    { id: "1", text: "What went well during this cycle?", type: "textarea", required: true },
    { id: "2", text: "Projects/tasks you worked on", type: "textarea", required: true },
    { id: "3", text: "Challenges faced and how you addressed them", type: "textarea", required: true },
    { id: "4", text: "Areas for improvement", type: "textarea", required: true },
    { id: "5", text: "Skills learned or enhanced", type: "textarea", required: true },
    { id: "6", text: "Support/resources needed", type: "textarea", required: true },
    { id: "7", text: "Overall performance rating (1–5)", type: "rating", required: true },
  ];

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'textarea':
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={question.id}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{question.text}</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter your response..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'rating':
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={question.id}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{question.text}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1 - Below Expectations</SelectItem>
                    <SelectItem value="2">2 - Meets Some Expectations</SelectItem>
                    <SelectItem value="3">3 - Meets Expectations</SelectItem>
                    <SelectItem value="4">4 - Exceeds Expectations</SelectItem>
                    <SelectItem value="5">5 - Outstanding</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      default:
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={question.id}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{question.text}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter your response..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
    }
  };

  return (
    <RoleGuard allowedRoles={["employee", "manager"]}>
      <div className="space-y-6" data-testid="evaluations">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">My Evaluations</h1>
            <p className="text-muted-foreground">Complete your performance evaluations</p>
          </div>
        </div>

        {/* Evaluations List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : evaluations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">No evaluations assigned</p>
                <p className="text-muted-foreground text-sm">Your performance evaluations will appear here</p>
              </CardContent>
            </Card>
          ) : (
            evaluations.map((evaluation) => (
              <Card key={evaluation.id} data-testid={`evaluation-card-${evaluation.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold" data-testid={`evaluation-title-${evaluation.id}`}>
                          Performance Review - {evaluation.reviewCycle?.name || 'Review Cycle'}
                        </h3>
                        <Badge variant={getStatusVariant(evaluation)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(evaluation)}
                            <span>{getStatusText(evaluation)}</span>
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Due: {evaluation.reviewCycle?.endDate ? new Date(evaluation.reviewCycle.endDate).toLocaleDateString() : 'TBD'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Manager: {evaluation.manager?.firstName} {evaluation.manager?.lastName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {evaluation.overallRating && (
                            <>
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span>Rating: {evaluation.overallRating}/5</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Progress indicators */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Self Evaluation:</span>
                          {evaluation.selfEvaluationSubmittedAt ? (
                            <span className="text-accent font-medium">Completed</span>
                          ) : (
                            <span className="text-yellow-600 font-medium">Pending</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Manager Review:</span>
                          {evaluation.managerEvaluationSubmittedAt ? (
                            <span className="text-accent font-medium">Completed</span>
                          ) : (
                            <span className="text-muted-foreground font-medium">Pending</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Meeting:</span>
                          {evaluation.meetingCompletedAt ? (
                            <span className="text-accent font-medium">Completed</span>
                          ) : (
                            <span className="text-muted-foreground font-medium">Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewEvaluation(evaluation)}
                        data-testid={`view-evaluation-${evaluation.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {evaluation.selfEvaluationSubmittedAt ? 'View' : 'Start'}
                      </Button>
                      {evaluation.selfEvaluationSubmittedAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`export-evaluation-${evaluation.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Evaluation Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Performance Evaluation</DialogTitle>
              <DialogDescription>
                Complete your self-evaluation by answering the questions below
              </DialogDescription>
            </DialogHeader>
            
            {selectedEvaluation && (
              <div className="space-y-6">
                {/* Evaluation Info */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedEvaluation.reviewCycle?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Manager: {selectedEvaluation.manager?.firstName} {selectedEvaluation.manager?.lastName}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Questions Form */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {sampleQuestions.map(renderQuestion)}
                    
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsViewModalOpen(false)}
                        className="flex-1"
                      >
                        Save Draft
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={submitEvaluationMutation.isPending || !!selectedEvaluation.selfEvaluationSubmittedAt}
                        data-testid="submit-evaluation"
                      >
                        {selectedEvaluation.selfEvaluationSubmittedAt ? 'Already Submitted' : 'Submit Evaluation'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
