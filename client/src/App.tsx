import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TourProvider } from "@/contexts/TourContext";
import { TourModal } from "@/components/TourModal";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { checkAndPerformSSOLogin } from "@/lib/ssoAuth";
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
import InitiateAppraisal from "@/pages/InitiateAppraisal";
import ReviewAppraisal from "@/pages/ReviewAppraisal";
import Evaluations from "@/pages/Evaluations";
import ManagerSubmissions from "@/pages/ManagerSubmissions";
import Meetings from "@/pages/Meetings";
import HRMeetingsView from "@/pages/HRMeetingsView";
import CalibrateRatings from "@/pages/CalibrateRatings";
import DevelopmentGoals from "@/pages/DevelopmentGoals";
import Analytics from "@/pages/Analytics";
import FeedbackRequests from "@/pages/FeedbackRequests";
import FeedbackRequestForm from "@/pages/FeedbackRequestForm";
import MemberDevelopmentGoals from "@/pages/MemberDevelopmentGoals";
import Settings from "@/pages/Settings";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/dev" component={DevLogin} />
          <Route path="/login" component={Landing} />
          <Route path="/company/:companyUrl" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/companies" component={CompanyManagement} />
          <Route path="/users" component={EmployeeManagement} />
          <Route path="/locations" component={LocationManagement} />
          <Route path="/departments" component={DepartmentManagement} />
          <Route path="/questionnaires" component={QuestionnaireTemplates} />
          <Route
            path="/questionnaire-templates"
            component={QuestionnaireTemplates}
          />
          <Route
            path="/publish-questionnaires"
            component={PublishQuestionnaires}
          />
          {/* Levels and Grades routes disabled
          <Route path="/levels" component={LevelManagement} />
          <Route path="/grades" component={GradeManagement} />
          */}
          <Route
            path="/appraisal-cycles"
            component={AppraisalCycleManagement}
          />
          <Route
            path="/review-frequencies"
            component={ReviewFrequencyManagement}
          />
          <Route
            path="/frequency-calendars"
            component={FrequencyCalendarManagement}
          />
          <Route
            path="/frequency-calendar-details"
            component={FrequencyCalendarDetailsManagement}
          />
          <Route path="/performance-reviews" component={PerformanceReviews} />
          <Route path="/review-progress" component={ReviewProgress} />
          <Route path="/appraisal-groups" component={AppraisalGroups} />
          <Route path="/initiate-appraisal" component={InitiateAppraisal} />
          <Route path="/review-appraisal" component={ReviewAppraisal} />
          <Route path="/evaluations" component={Evaluations} />
          <Route path="/manager-submissions" component={ManagerSubmissions} />
          <Route
            path="/member-development-goals"
            component={MemberDevelopmentGoals}
          />
          <Route path="/meetings" component={Meetings} />
          <Route path="/development-goals" component={DevelopmentGoals} />
          <Route path="/feedback-requests" component={FeedbackRequests} />
          <Route
            path="/feedback-requests/:id"
            component={FeedbackRequestForm}
          />
          <Route path="/hr-meetings" component={HRMeetingsView} />
          <Route path="/calibrate-ratings" component={CalibrateRatings} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [ssoChecking, setSsoChecking] = useState(true);

  // Check for HRsuite SSO session on app load
  useEffect(() => {
    const checkSSO = async () => {
      try {
        // Only check SSO if not already authenticated
        if (!isLoading && !isAuthenticated) {
          console.log("[App] Checking for HRsuite SSO session...");
          await checkAndPerformSSOLogin();
        }
      } catch (error) {
        console.error("[App] SSO check failed:", error);
      } finally {
        setSsoChecking(false);
      }
    };

    // Small delay to ensure storage is ready
    const timer = setTimeout(checkSSO, 100);
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

  // Show loading while checking SSO
  const showLoading = isLoading || (ssoChecking && !isAuthenticated);

  return (
    <>
      <Toaster />
      {showLoading ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20">
          <div className="flex flex-col items-center space-y-6">
            {/* Loading Spinner */}
            <div className="relative">
              <div className="w-12 h-12 border-4 border-muted rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>

            {/* Loading Message */}
            <p className="text-muted-foreground text-sm">
              Setting up application, please wait...
            </p>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <Router />
      ) : (
        <TourProvider>
          <Layout>
            <Router />
          </Layout>
          <TourModal />
        </TourProvider>
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter hook={useHashLocation}>
          <AppContent />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
