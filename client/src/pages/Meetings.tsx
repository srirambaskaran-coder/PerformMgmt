import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Calendar, 
  Plus, 
  Video, 
  Clock, 
  User, 
  FileText,
  CheckCircle,
  CalendarCheck,
  CalendarX
} from "lucide-react";
import type { Evaluation, User as UserType } from "@shared/schema";

interface EvaluationWithDetails extends Evaluation {
  employee?: UserType;
  manager?: UserType;
}

export default function Meetings() {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationWithDetails | null>(null);
  const [meetingNotes, setMeetingNotes] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch evaluations where the user is either employee or manager
  const { data: evaluations = [], isLoading } = useQuery<EvaluationWithDetails[]>({
    queryKey: ["/api/evaluations"],
    select: (data) => data.filter(evaluation => 
      evaluation.employeeId === user?.id || evaluation.managerId === user?.id
    ),
  });

  const scheduleMeetingMutation = useMutation({
    mutationFn: async ({ id, meetingDate }: { id: string; meetingDate: Date }) => {
      await apiRequest("PUT", `/api/evaluations/${id}`, {
        meetingScheduledAt: meetingDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
      setIsScheduleModalOpen(false);
      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive",
      });
    },
  });

  const completeMeetingMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      await apiRequest("PUT", `/api/evaluations/${id}`, {
        meetingNotes: notes,
        meetingCompletedAt: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
      toast({
        title: "Success",
        description: "Meeting completed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete meeting",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    defaultValues: {
      meetingDate: "",
      meetingTime: "",
    },
  });

  const handleScheduleMeeting = (evaluation: EvaluationWithDetails) => {
    setSelectedEvaluation(evaluation);
    setIsScheduleModalOpen(true);
  };

  const onSubmitSchedule = (data: any) => {
    if (selectedEvaluation) {
      const meetingDateTime = new Date(`${data.meetingDate}T${data.meetingTime}`);
      scheduleMeetingMutation.mutate({ 
        id: selectedEvaluation.id, 
        meetingDate: meetingDateTime 
      });
    }
  };

  const handleCompleteMeeting = (evaluationId: string, notes: string) => {
    completeMeetingMutation.mutate({ id: evaluationId, notes });
  };

  const getMeetingStatus = (evaluation: EvaluationWithDetails) => {
    if (evaluation.meetingCompletedAt) return "completed";
    if (evaluation.meetingScheduledAt) return "scheduled";
    return "not_scheduled";
  };

  const getMeetingStatusBadge = (evaluation: EvaluationWithDetails) => {
    const status = getMeetingStatus(evaluation);
    switch (status) {
      case "completed":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "scheduled":
        return <Badge variant="secondary"><CalendarCheck className="h-3 w-3 mr-1" />Scheduled</Badge>;
      default:
        return <Badge variant="outline"><CalendarX className="h-3 w-3 mr-1" />Not Scheduled</Badge>;
    }
  };

  const canScheduleMeeting = (evaluation: EvaluationWithDetails) => {
    // Only show evaluations that have both self and manager evaluations completed
    return evaluation.selfEvaluationSubmittedAt && evaluation.managerEvaluationSubmittedAt && !evaluation.meetingCompletedAt;
  };

  const eligibleEvaluations = evaluations.filter(canScheduleMeeting);

  return (
    <RoleGuard allowedRoles={["employee", "manager"]}>
      <div className="space-y-6" data-testid="meetings">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Performance Review Meetings</h1>
            <p className="text-muted-foreground">Schedule and manage one-on-one performance review meetings</p>
          </div>
        </div>

        {/* Meeting Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Meetings</p>
                  <p className="text-2xl font-bold" data-testid="total-meetings">
                    {evaluations.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold" data-testid="scheduled-meetings">
                    {evaluations.filter(e => e.meetingScheduledAt && !e.meetingCompletedAt).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold" data-testid="completed-meetings">
                    {evaluations.filter(e => e.meetingCompletedAt).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meetings List */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Review Meetings</CardTitle>
            <CardDescription>
              Meetings for evaluations ready for discussion
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : eligibleEvaluations.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">No meetings ready to schedule</p>
                <p className="text-muted-foreground text-sm">
                  Meetings become available after both employee and manager complete their evaluations
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {eligibleEvaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/20 transition-colors"
                    data-testid={`meeting-row-${evaluation.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-medium" data-testid={`meeting-participants-${evaluation.id}`}>
                            {user?.id === evaluation.employeeId ? (
                              <>Meeting with {evaluation.manager?.firstName} {evaluation.manager?.lastName}</>
                            ) : (
                              <>{evaluation.employee?.firstName} {evaluation.employee?.lastName} - Performance Review</>
                            )}
                          </p>
                          {getMeetingStatusBadge(evaluation)}
                        </div>
                        
                        {evaluation.meetingScheduledAt && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(evaluation.meetingScheduledAt).toLocaleDateString()} at{' '}
                              {new Date(evaluation.meetingScheduledAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        )}

                        {evaluation.meetingCompletedAt && evaluation.meetingNotes && (
                          <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm font-medium mb-1">Meeting Notes:</p>
                            <p className="text-sm text-muted-foreground">{evaluation.meetingNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {!evaluation.meetingScheduledAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleScheduleMeeting(evaluation)}
                          data-testid={`schedule-meeting-${evaluation.id}`}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule
                        </Button>
                      )}
                      
                      {evaluation.meetingScheduledAt && !evaluation.meetingCompletedAt && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`join-meeting-${evaluation.id}`}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Join
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const notes = prompt("Enter meeting notes:");
                              if (notes) {
                                handleCompleteMeeting(evaluation.id, notes);
                              }
                            }}
                            data-testid={`complete-meeting-${evaluation.id}`}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
                        </div>
                      )}
                      
                      {evaluation.meetingCompletedAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          data-testid={`meeting-completed-${evaluation.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Meeting Modal */}
        <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Meeting</DialogTitle>
              <DialogDescription>
                Schedule a one-on-one performance review meeting
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitSchedule)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="meetingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          min={new Date().toISOString().split('T')[0]}
                          data-testid="input-meeting-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="meetingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field}
                          data-testid="input-meeting-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={scheduleMeetingMutation.isPending}
                    data-testid="submit-schedule-meeting"
                  >
                    Schedule Meeting
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
