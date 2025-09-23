import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import DevLogin from "@/pages/DevLogin";
import Dashboard from "@/pages/Dashboard";
import CompanyManagement from "@/pages/CompanyManagement";
import EmployeeManagement from "@/pages/EmployeeManagement";
import LocationManagement from "@/pages/LocationManagement";
import DepartmentManagement from "@/pages/DepartmentManagement";
import QuestionnaireTemplates from "@/pages/QuestionnaireTemplates";
import PublishQuestionnaires from "@/pages/PublishQuestionnaires";
import LevelManagement from "@/pages/LevelManagement";
import GradeManagement from "@/pages/GradeManagement";
import AppraisalCycleManagement from "@/pages/AppraisalCycleManagement";
import ReviewFrequencyManagement from "@/pages/ReviewFrequencyManagement";
import FrequencyCalendarManagement from "@/pages/FrequencyCalendarManagement";
import FrequencyCalendarDetailsManagement from "@/pages/FrequencyCalendarDetailsManagement";
import PerformanceReviews from "@/pages/PerformanceReviews";
import ReviewProgress from "@/pages/ReviewProgress";
import AppraisalGroups from "@/pages/AppraisalGroups";
import Evaluations from "@/pages/Evaluations";
import Meetings from "@/pages/Meetings";
import Settings from "@/pages/Settings";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={import.meta.env.DEV ? DevLogin : Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/companies" component={CompanyManagement} />
          <Route path="/users" component={EmployeeManagement} />
          <Route path="/locations" component={LocationManagement} />
          <Route path="/departments" component={DepartmentManagement} />
          <Route path="/questionnaires" component={QuestionnaireTemplates} />
          <Route path="/questionnaire-templates" component={QuestionnaireTemplates} />
          <Route path="/publish-questionnaires" component={PublishQuestionnaires} />
          <Route path="/levels" component={LevelManagement} />
          <Route path="/grades" component={GradeManagement} />
          <Route path="/appraisal-cycles" component={AppraisalCycleManagement} />
          <Route path="/review-frequencies" component={ReviewFrequencyManagement} />
          <Route path="/frequency-calendars" component={FrequencyCalendarManagement} />
          <Route path="/frequency-calendar-details" component={FrequencyCalendarDetailsManagement} />
          <Route path="/performance-reviews" component={PerformanceReviews} />
          <Route path="/review-progress" component={ReviewProgress} />
          <Route path="/appraisal-groups" component={AppraisalGroups} />
          <Route path="/evaluations" component={Evaluations} />
          <Route path="/meetings" component={Meetings} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <Toaster />
      {isLoading || !isAuthenticated ? (
        <Router />
      ) : (
        <Layout>
          <Router />
        </Layout>
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
