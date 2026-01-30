import React, { createContext, useContext, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface TourContextType {
  isRunning: boolean;
  isTourMode: boolean; // For checking if we're in tour mode (for dummy data)
  currentStep: number;
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  totalSteps: number;
  triggerAction: (action: string) => void;
  currentAction: string | null;
  clearAction: () => void;
  tourSteps: TourStep[]; // Add current tour steps to context
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export interface TourStep {
  id: string;
  route: string;
  title: string;
  content: string;
  target?: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  highlightPadding?: number;
  showActions?: boolean;
  actionText?: string;
  // For interactive steps
  targetSelector?: string; // CSS selector for the element to highlight
  action?: string; // Action to trigger (e.g., "openCreateModal", "fillForm")
  autoProgress?: boolean; // Auto progress to next step after action
}

// Admin tour steps with navigation and interactive elements
export const adminTourSteps: TourStep[] = [
  {
    id: "welcome",
    route: "/settings",
    title: "Welcome to Performance Management System! 🎉",
    content:
      "Let's take a guided tour of the application to help you understand how to manage your organization's performance reviews effectively.\n\nThis tour will show you how to create and manage data with live demonstrations!",
    placement: "center",
  },
  {
    id: "dashboard",
    route: "/",
    title: "Dashboard Overview",
    content:
      "This is your Dashboard - the central hub where you can see key metrics, recent activities, and quick access to important features.",
    placement: "bottom",
  },
  {
    id: "locations",
    route: "/locations",
    title: "Location Management",
    content:
      "Here you can manage all your organization's office locations. Locations help organize employees by their physical work location.",
    placement: "top",
  },
  {
    id: "departments",
    route: "/departments",
    title: "Department Management",
    content:
      "Manage your organizational departments here. Each department can have multiple employees and helps structure your organization.",
    placement: "top",
  },
  {
    id: "levels",
    route: "/levels",
    title: "Level Management",
    content:
      "Define job levels for your organization (e.g., Junior, Senior, Lead, Manager). Levels help categorize employees and set up appropriate review criteria.\n\nLet's see how to create a new level!",
    placement: "top",
    showActions: true,
    actionText: "Click 'Next' to see how to create a level.",
  },
  // {
  //   id: "levels-create-button",
  //   route: "/levels",
  //   title: "Create Level Button",
  //   content:
  //     "This is the 'Create Level' button. Click it to add a new job level to your organization.\n\nLet's open the form and see how it works!",
  //   targetSelector: "[data-testid='button-create-level']",
  //   placement: "bottom",
  //   showActions: true,
  //   actionText: "Click 'Next' to open the create form!",
  // },
  // {
  //   id: "levels-create-form",
  //   route: "/levels",
  //   title: "Level Creation Form",
  //   content:
  //     "This is the create form where you enter level details:\n\n• Level Code: A unique identifier (e.g., 'SR' for Senior)\n• Description: What this level means\n• Status: Active or Inactive\n\nWe've pre-filled sample data for you!",
  //   targetSelector: "[data-testid='dialog-create-level']",
  //   placement: "left",
  //   showActions: true,
  //   actionText: "Review the sample data. Click 'Next' to proceed!",
  //   action: "openLevelForm",
  // },
  // {
  //   id: "levels-ready-create",
  //   route: "/levels",
  //   title: "Ready to Create",
  //   content:
  //     "Now we'll save this demo level by clicking the 'Create' button.\n\nIn the real application, this would save the data to your database.",
  //   targetSelector: "[data-testid='button-submit']",
  //   placement: "top",
  //   showActions: true,
  //   actionText: "Click 'Next' to save the demo level!",
  // },
  // {
  //   id: "levels-created",
  //   route: "/levels",
  //   title: "Level Created! ✅",
  //   content:
  //     "Excellent! The demo level 'DEMO-SR' was created successfully!\n\nYou can see it highlighted at the top of the list. This is how new levels appear after creation.",
  //   targetSelector: "[data-testid='tour-demo-level']",
  //   placement: "bottom",
  //   action: "saveLevelAndClose",
  // },
  // Grade Management - Interactive
  {
    id: "grades",
    route: "/grades",
    title: "Grade Management",
    content:
      "Grades define employee pay bands and responsibility levels (e.g., Grade 1, Grade 2).\n\nThis is essential for salary structures and career progression.",
    placement: "right",
  },
  {
    id: "grades-create-button",
    route: "/grades",
    title: "Create Grade Button",
    content:
      "Click this button to create a new grade. Let's walk through the form together!",
    targetSelector: "[data-testid='button-create-grade']",
    placement: "bottom",
  },
  {
    id: "grades-form",
    route: "/grades",
    title: "Grade Creation Form",
    content:
      "This is the form to create a new grade:\n\n• Grade Code: A unique identifier (e.g., 'G1' for Grade 1)\n• Description: What this grade means\n• Status: Active or Inactive\n\nWe've pre-filled sample data for you!",
    targetSelector: "[data-testid='dialog-create-grade']",
    placement: "left",
    action: "openGradeForm",
    showActions: true,
    actionText: "Review the sample data. Click 'Next' to proceed!",
  },
  {
    id: "grades-ready-create",
    route: "/grades",
    title: "Ready to Create",
    content:
      "Now we'll save this demo grade by clicking the 'Create' button.\n\nIn the real application, this would save to your database.",
    targetSelector: "[data-testid='button-submit']",
    placement: "top",
    showActions: true,
    actionText: "Click 'Next' to save the demo grade!",
  },
  {
    id: "grades-created",
    route: "/grades",
    title: "Grade Created! ✅",
    content:
      "The demo grade 'DEMO-G1' was created successfully!\n\nYou can see it highlighted at the top of the list.",
    targetSelector: "[data-testid='tour-demo-grade']",
    placement: "bottom",
    action: "saveGradeAndClose",
  },
  // User Management
  {
    id: "users",
    route: "/users",
    title: "User Management",
    content:
      "This is where you manage all employees in your organization.\n\nYou can add new users, assign them to departments, set their roles, and manage profiles.",
    placement: "top",
  },
  // Appraisal Cycles - Interactive
  {
    id: "appraisal-cycles",
    route: "/appraisal-cycles",
    title: "Appraisal Cycles",
    content:
      "Appraisal cycles define review periods (e.g., 'Annual Review 2026').\n\nThis is the foundation of your performance review process.",
    placement: "right",
  },
  {
    id: "appraisal-cycles-create-button",
    route: "/appraisal-cycles",
    title: "Create Appraisal Cycle",
    content:
      "Click this button to create a new appraisal cycle. Let's create one together!",
    targetSelector: "[data-testid='button-create-cycle']",
    placement: "bottom",
  },
  {
    id: "appraisal-cycles-form",
    route: "/appraisal-cycles",
    title: "Appraisal Cycle Form",
    content:
      "Create an appraisal cycle with:\n\n• Cycle Code: A unique identifier\n• From/To Dates: The review period\n• Description: Details about this cycle\n• Status: Active or Inactive\n\nSample data has been filled!",
    targetSelector: "[data-testid='dialog-create-cycle']",
    placement: "left",
    action: "openAppraisalCycleForm",
    showActions: true,
    actionText: "Review the sample data. Click 'Next' to proceed!",
  },
  {
    id: "appraisal-cycles-ready-create",
    route: "/appraisal-cycles",
    title: "Ready to Create",
    content:
      "Now we'll save this demo appraisal cycle.\n\nThis will be the basis for scheduling reviews.",
    targetSelector: "[data-testid='button-submit']",
    placement: "top",
    showActions: true,
    actionText: "Click 'Next' to save the demo cycle!",
  },
  {
    id: "appraisal-cycles-created",
    route: "/appraisal-cycles",
    title: "Cycle Created! ✅",
    content:
      "The demo appraisal cycle 'DEMO-2026' was created!\n\nYou can see it highlighted at the top of the list.",
    targetSelector: "[data-testid='tour-demo-cycle']",
    placement: "bottom",
    action: "saveAppraisalCycleAndClose",
  },
  // Review Frequencies - Interactive
  {
    id: "review-frequencies",
    route: "/review-frequencies",
    title: "Review Frequencies",
    content:
      "Review frequencies define how often performance reviews occur.\n\nCommon frequencies: Monthly, Quarterly, Semi-Annual, Annual.",
    placement: "right",
  },
  {
    id: "review-frequencies-create-button",
    route: "/review-frequencies",
    title: "Create Review Frequency",
    content:
      "Click this button to create a new review frequency. Let's create one!",
    targetSelector: "[data-testid='button-create-frequency']",
    placement: "bottom",
  },
  {
    id: "review-frequencies-form",
    route: "/review-frequencies",
    title: "Frequency Creation Form",
    content:
      "Create a review frequency with:\n\n• Frequency Code: Identifier (e.g., 'QUARTERLY')\n• Description: Explains the frequency\n• Status: Active or Inactive\n\nSample data has been filled!",
    targetSelector: "[data-testid='dialog-create-frequency']",
    placement: "left",
    action: "openReviewFrequencyForm",
    showActions: true,
    actionText: "Review the sample data. Click 'Next' to proceed!",
  },
  {
    id: "review-frequencies-ready-create",
    route: "/review-frequencies",
    title: "Ready to Create",
    content: "Now we'll save this demo review frequency.",
    targetSelector: "[data-testid='button-submit']",
    placement: "top",
    showActions: true,
    actionText: "Click 'Next' to save the demo frequency!",
  },
  {
    id: "review-frequencies-created",
    route: "/review-frequencies",
    title: "Frequency Created! ✅",
    content:
      "The demo frequency 'DEMO-QUARTERLY' was created!\n\nYou can see it highlighted at the top of the list.",
    targetSelector: "[data-testid='tour-demo-frequency']",
    placement: "bottom",
    action: "saveReviewFrequencyAndClose",
  },
  // Frequency Calendars - Interactive
  {
    id: "frequency-calendars",
    route: "/frequency-calendars",
    title: "Frequency Calendars",
    content:
      "Frequency calendars combine appraisal cycles with review frequencies to schedule when specific reviews take place.\n\nThis connects all the pieces together!",
    placement: "right",
  },
  {
    id: "frequency-calendars-create-button",
    route: "/frequency-calendars",
    title: "Create Frequency Calendar",
    content:
      "Click this button to create a new frequency calendar. Let's create one!",
    targetSelector: "[data-testid='button-create-calendar']",
    placement: "bottom",
  },
  {
    id: "frequency-calendars-form",
    route: "/frequency-calendars",
    title: "Calendar Creation Form",
    content:
      "Create a frequency calendar with:\n\n• Calendar Code: Unique identifier\n• Appraisal Cycle: Which cycle to use\n• Review Frequency: How often reviews occur\n• Status: Active or Inactive\n\nSample data has been filled!",
    targetSelector: "[data-testid='dialog-create-calendar']",
    placement: "left",
    action: "openFrequencyCalendarForm",
    showActions: true,
    actionText: "Review the sample data. Click 'Next' to proceed!",
  },
  {
    id: "frequency-calendars-ready-create",
    route: "/frequency-calendars",
    title: "Ready to Create",
    content: "Now we'll save this demo frequency calendar.",
    targetSelector: "[data-testid='button-submit']",
    placement: "top",
    showActions: true,
    actionText: "Click 'Next' to save the demo calendar!",
  },
  {
    id: "frequency-calendars-created",
    route: "/frequency-calendars",
    title: "Calendar Created! ✅",
    content:
      "The demo frequency calendar 'DEMO-Q1-2026' was created!\n\nYou can see it highlighted at the top of the list.",
    targetSelector: "[data-testid='tour-demo-calendar']",
    placement: "bottom",
    action: "saveFrequencyCalendarAndClose",
  },
  // Calendar Details - Interactive
  {
    id: "calendar-details",
    route: "/frequency-calendar-details",
    title: "Calendar Details",
    content:
      "Calendar details configure specific settings for each calendar period.\n\nThis includes deadlines, grace periods, and notification schedules.",
    placement: "right",
  },
  {
    id: "calendar-details-create-button",
    route: "/frequency-calendar-details",
    title: "Create Calendar Detail",
    content:
      "Click this button to add details to a frequency calendar. Let's create one!",
    targetSelector: "[data-testid='button-create-detail']",
    placement: "bottom",
  },
  {
    id: "calendar-details-form",
    route: "/frequency-calendar-details",
    title: "Calendar Detail Form",
    content:
      "Add calendar details with:\n\n• Period Name: Name for this period\n• Frequency Calendar: Which calendar this belongs to\n• Start/End Dates: When this period runs\n• Status: Active or Inactive\n\nSample data has been filled!",
    targetSelector: "[data-testid='dialog-create-detail']",
    placement: "left",
    action: "openCalendarDetailForm",
    showActions: true,
    actionText: "Review the sample data. Click 'Next' to proceed!",
  },
  {
    id: "calendar-details-ready-create",
    route: "/frequency-calendar-details",
    title: "Ready to Create",
    content: "Now we'll save this demo calendar detail.",
    targetSelector: "[data-testid='button-submit']",
    placement: "top",
    showActions: true,
    actionText: "Click 'Next' to save the demo detail!",
  },
  {
    id: "calendar-details-created",
    route: "/frequency-calendar-details",
    title: "Detail Created! ✅",
    content:
      "The demo calendar detail was created successfully!\n\nYou can see it highlighted at the top of the list.",
    targetSelector: "[data-testid='tour-demo-detail']",
    placement: "bottom",
    action: "saveCalendarDetailAndClose",
  },
  // Questionnaires - Interactive
  {
    id: "questionnaires",
    route: "/questionnaires",
    title: "Questionnaire Templates",
    content:
      "Questionnaire templates are the forms used for performance reviews.\n\nYou can create custom questions and organize them into sections.",
    placement: "right",
  },
  {
    id: "questionnaires-create-button",
    route: "/questionnaires",
    title: "Create Questionnaire",
    content:
      "Click this button to create a new questionnaire template. Let's create one!",
    targetSelector: "[data-testid='button-create-questionnaire']",
    placement: "bottom",
  },
  {
    id: "questionnaires-form",
    route: "/questionnaires",
    title: "Questionnaire Form",
    content:
      "Create a questionnaire with:\n\n• Template Name: Name for this questionnaire\n• Description: What this questionnaire is for\n• Status: Active or Inactive\n\nSample data has been filled!",
    targetSelector: "[data-testid='dialog-create-questionnaire']",
    placement: "left",
    action: "openQuestionnaireForm",
    showActions: true,
    actionText:
      "Review the sample data. Click 'Next' to see how to add questions!",
  },
  {
    id: "questionnaires-add-question-button",
    route: "/questionnaires",
    title: "Add Questions",
    content:
      "A questionnaire needs questions! Click the 'Add Question' button to add a question to this template.",
    targetSelector: "[data-testid='add-question']",
    placement: "left",
    showActions: true,
    actionText: "Click 'Next' to add a sample question!",
  },
  {
    id: "questionnaires-question-form",
    route: "/questionnaires",
    title: "Question Details",
    content:
      "Each question has:\n\n• Question Text: The question to ask\n• Type: Text, Long Text, or Rating (1-5)\n• Drag handle: Reorder questions\n\nA sample question has been added!",
    targetSelector: "[data-testid^='drag-handle-']",
    placement: "right",
    action: "addQuestionnaireQuestion",
    showActions: true,
    actionText: "Review the question. Click 'Next' to save this template!",
  },
  {
    id: "questionnaires-ready-create",
    route: "/questionnaires",
    title: "Ready to Save",
    content:
      "Now we'll save this demo questionnaire template with its question.",
    targetSelector: "[data-testid='submit-template']",
    placement: "top",
    showActions: true,
    actionText: "Click 'Next' to save the demo questionnaire!",
  },
  {
    id: "questionnaires-created",
    route: "/questionnaires",
    title: "Questionnaire Created! ✅",
    content:
      "The demo questionnaire 'DEMO-ANNUAL-REVIEW' was created!\n\nYou can see it highlighted at the top of the list.",
    targetSelector: "[data-testid='tour-demo-questionnaire']",
    placement: "bottom",
    action: "saveQuestionnaireAndClose",
  },
  {
    id: "complete",
    route: "/settings",
    title: "Tour Complete! 🎊",
    content:
      "Congratulations! You've completed the application tour. You now know how to:\n\n• Manage locations, departments, levels, and grades\n• Create and manage users\n• Set up appraisal cycles and review schedules\n• Configure calendar details\n• Design questionnaires for evaluations\n\nYou can restart this tour anytime from the Settings page. Happy reviewing!",
    placement: "center",
  },
];

// HR Manager tour steps - focused on appraisal management and reviews with interactive demos
export const hrManagerTourSteps: TourStep[] = [
  {
    id: "welcome",
    route: "/settings",
    title: "Welcome HR Manager! 👋",
    content:
      "Let's take a guided tour to help you understand your HR Management capabilities.\n\nThis tour will show you how to manage appraisals, monitor progress, and analyze performance with live demonstrations!",
    placement: "center",
  },
  {
    id: "dashboard-menu",
    route: "/",
    title: "Dashboard",
    content:
      "This is your Dashboard. It shows an overview of:\n\n• Active appraisal cycles\n• Pending reviews and submissions\n• Recent activities\n• Quick actions and metrics",
    targetSelector: "[data-testid='nav-dashboard']",
    placement: "right",
  },
  {
    id: "appraisal-groups-menu",
    route: "/appraisal-groups",
    title: "Appraisal Groups",
    content:
      "Appraisal Groups help you organize employees for streamlined reviews.\n\nLet's create a group together!",
    targetSelector: "[data-testid='nav-appraisal-groups']",
    placement: "right",
  },
  {
    id: "appraisal-groups-create-button",
    route: "/appraisal-groups",
    title: "Create Group Button",
    content: "Click this button to create a new appraisal group.",
    targetSelector: "[data-testid='create-group-btn']",
    placement: "bottom",
  },
  {
    id: "appraisal-groups-form-open",
    route: "/appraisal-groups",
    title: "Group Form",
    content:
      "The create group form opens. Fill in:\n\n• Group Name: Identify your group\n• Description: Purpose of this group\n\nSample data has been filled for you!",
    targetSelector: "[data-testid='dialog-create-group']",
    placement: "left",
    action: "openAppraisalGroupForm",
    showActions: true,
    actionText: "Review the form. Click 'Next' to see the Create button!",
  },
  {
    id: "appraisal-groups-submit-button",
    route: "/appraisal-groups",
    title: "Create Group Button",
    content: "Click this 'Create Group' button to save the appraisal group.",
    targetSelector: "[data-testid='submit-group-btn']",
    placement: "top",
    showActions: true,
    actionText: "Click 'Next' to save and create the group!",
  },
  {
    id: "appraisal-groups-list",
    route: "/appraisal-groups",
    title: "Group Created! ✅",
    content:
      "The demo group 'DEMO-HR-GROUP' was created!\n\nYou can see it in the list below. Now let's add employees to this group.",
    targetSelector: "[data-testid='tour-demo-group']",
    placement: "bottom",
    action: "saveAppraisalGroupAndClose",
  },
  {
    id: "appraisal-groups-add-employees-btn",
    route: "/appraisal-groups",
    title: "Add Employees Button",
    content: "Click 'Add Employees' to add team members to this group.",
    targetSelector: "[data-testid='tour-demo-add-employees']",
    placement: "left",
    action: "prepareAddEmployees",
  },
  {
    id: "appraisal-groups-employee-dialog-open",
    route: "/appraisal-groups",
    title: "Employee Selection Dialog",
    content:
      "This dialog allows you to select employees:\n\n• Filter by name, location, department\n• Use checkboxes to select employees",
    targetSelector: "[role='dialog']",
    placement: "left",
    action: "openAddEmployeesDialog",
    showActions: true,
    actionText: "Click 'Next' to see the employee list!",
  },
  {
    id: "appraisal-groups-employee-list",
    route: "/appraisal-groups",
    title: "Employee List",
    content:
      "Here's the employee list. Use checkboxes to select employees you want to add to the group.\n\nYou can select multiple employees at once.",
    targetSelector: "[data-testid='employee-list-container']",
    placement: "left",
    action: "keepEmployeeDialogOpen",
    showActions: true,
    actionText: "Click 'Next' to see the Add button!",
  },
  {
    id: "appraisal-groups-add-selected-btn",
    route: "/appraisal-groups",
    title: "Add Employees Button",
    content:
      "After selecting employees, click this button to add them to the group.",
    targetSelector: "[data-testid='add-selected-btn']",
    placement: "top",
    action: "keepEmployeeDialogOpen",
    showActions: true,
    actionText: "Click 'Next' to continue!",
  },
  {
    id: "appraisal-groups-employees-done",
    route: "/appraisal-groups",
    title: "Add Employees Complete! ✅",
    content:
      "You now know how to create groups and add employees!\n\nLet's move on to initiating appraisals.",
    action: "closeAddEmployeesDialog",
    placement: "center",
  },
  {
    id: "initiate-appraisal-menu",
    route: "/initiate-appraisal",
    title: "Initiate Appraisal Menu",
    content: "This is where you start new appraisal processes for your groups.",
    targetSelector: "[data-testid='nav-initiate-appraisal']",
    placement: "right",
  },
  {
    id: "initiate-appraisal-button",
    route: "/initiate-appraisal",
    title: "Initiate Appraisal Button",
    content:
      "Click 'Initiate Appraisal' on any group to start the appraisal process.",
    targetSelector: "[data-testid^='initiate-btn-']",
    placement: "left",
  },
  {
    id: "initiate-appraisal-form",
    route: "/initiate-appraisal",
    title: "Appraisal Form",
    content:
      "The initiate appraisal form opens.\n\nConfigure:\n• Appraisal Type\n• Frequency Calendar\n• Timeline settings",
    targetSelector: "[role='dialog']",
    placement: "left",
    action: "openInitiateAppraisalForm",
    showActions: true,
    actionText: "Review the options. Click 'Next'!",
  },
  {
    id: "initiate-appraisal-type",
    route: "/initiate-appraisal",
    title: "Appraisal Type",
    content:
      "Select the appraisal type:\n\n• SMART Objectives\n• KPI Based\n• 360 Degree Feedback\n• OKR Based",
    targetSelector: "[data-testid='select-appraisal-type']",
    placement: "left",
    showActions: true,
    actionText: "Click 'Next' to see publish options!",
  },
  {
    id: "initiate-appraisal-publish",
    route: "/initiate-appraisal",
    title: "Publish Options",
    content:
      "Choose when to publish:\n\n• Publish Now - Start immediately\n• As Per Calendar - Follow schedule",
    targetSelector: "[data-testid='publish-options-section']",
    placement: "left",
    showActions: true,
    actionText: "Click 'Next' to see the submit button!",
  },
  {
    id: "initiate-appraisal-submit",
    route: "/initiate-appraisal",
    title: "Initiate Appraisal Button",
    content:
      "Click 'Initiate Appraisal' to start the appraisal process for this group.",
    targetSelector: "[data-testid='initiate-submit-btn']",
    placement: "top",
    showActions: true,
    actionText: "Click 'Next' to continue the tour!",
  },
  {
    id: "initiate-appraisal-done",
    route: "/initiate-appraisal",
    title: "Initiate Complete! ✅",
    content:
      "You now know how to initiate appraisals!\n\nLet's continue to the other features.",
    action: "closeInitiateAppraisalForm",
    placement: "center",
  },
  {
    id: "review-progress-menu",
    route: "/review-appraisal",
    title: "Review Progress",
    content:
      "Monitor ongoing reviews here:\n\n• Track submission status\n• Check completion rates\n• Send reminders\n• View detailed progress",
    targetSelector: "[data-testid='nav-review-appraisal']",
    placement: "right",
  },
  {
    id: "hr-meetings-menu",
    route: "/hr-meetings",
    title: "View Meetings",
    content:
      "Monitor all review meetings:\n\n• View scheduled meetings\n• Track meeting completion\n• Review outcomes",
    targetSelector: "[data-testid='nav-hr-meetings']",
    placement: "right",
  },
  {
    id: "calibrate-ratings-menu",
    route: "/calibrate-ratings",
    title: "Calibrate Ratings",
    content:
      "Ensure rating consistency:\n\n• Compare ratings across teams\n• Adjust for fairness\n• Maintain standards",
    targetSelector: "[data-testid='nav-calibrate-ratings']",
    placement: "right",
  },
  {
    id: "analytics-menu",
    route: "/analytics",
    title: "Analytics & Reports",
    content:
      "Access comprehensive analytics:\n\n• Performance trends\n• Department comparisons\n• Rating distributions",
    targetSelector: "[data-testid='nav-analytics']",
    placement: "right",
  },
  {
    id: "questionnaires-menu",
    route: "/questionnaires",
    title: "Questionnaire Templates",
    content:
      "Questionnaire templates are the forms used for performance reviews.\n\nLet's create one together!",
    targetSelector: "[data-testid='nav-questionnaires']",
    placement: "right",
  },
  {
    id: "questionnaires-create-button",
    route: "/questionnaires",
    title: "Create Questionnaire",
    content:
      "Click this button to create a new questionnaire template. Let's create one!",
    targetSelector: "[data-testid='button-create-questionnaire']",
    placement: "bottom",
  },
  {
    id: "questionnaires-form",
    route: "/questionnaires",
    title: "Questionnaire Form",
    content:
      "Create a questionnaire with:\n\n• Template Name: Name for this questionnaire\n• Description: What this questionnaire is for\n• Status: Active or Inactive\n\nSample data has been filled!",
    targetSelector: "[data-testid='dialog-create-questionnaire']",
    placement: "left",
    action: "openQuestionnaireForm",
    showActions: true,
    actionText: "Review the sample data. Click 'Next' to add questions!",
  },
  {
    id: "questionnaires-add-question-button",
    route: "/questionnaires",
    title: "Add Questions",
    content:
      "A questionnaire needs questions! Click the 'Add Question' button to add a question to this template.",
    targetSelector: "[data-testid='add-question']",
    placement: "left",
    showActions: true,
    actionText: "Click 'Next' to add a sample question!",
  },
  {
    id: "questionnaires-question-form",
    route: "/questionnaires",
    title: "Question Details",
    content:
      "Each question has:\n\n• Question Text: The question to ask\n• Type: Text, Long Text, or Rating (1-5)\n• Drag handle: Reorder questions\n\nA sample question has been added!",
    targetSelector: "[data-testid^='drag-handle-']",
    placement: "right",
    action: "addQuestionnaireQuestion",
    showActions: true,
    actionText: "Review the question. Click 'Next' to save!",
  },
  {
    id: "questionnaires-ready-create",
    route: "/questionnaires",
    title: "Ready to Save",
    content:
      "Now we'll save this demo questionnaire template with its question.",
    targetSelector: "[data-testid='submit-template']",
    placement: "top",
    showActions: true,
    actionText: "Click 'Next' to save the questionnaire!",
  },
  {
    id: "questionnaires-created",
    route: "/questionnaires",
    title: "Questionnaire Created! ✅",
    content:
      "The demo questionnaire 'DEMO-HR-REVIEW' was created!\n\nYou can see it in the list.",
    targetSelector: "[data-testid='tour-demo-questionnaire']",
    placement: "bottom",
    action: "saveQuestionnaireAndClose",
  },
  {
    id: "complete",
    route: "/settings",
    title: "Tour Complete! 🎉",
    content:
      "Excellent! You now know how to:\n\n• Create and manage appraisal groups\n• Add employees to groups\n• Initiate appraisals\n• Create questionnaire templates\n• Monitor progress and reviews\n\nYou can restart this tour anytime from Settings!",
    placement: "center",
  },
];

// Manager tour steps - focused on team evaluation and development
export const managerTourSteps: TourStep[] = [
  // Welcome and Navigation
  {
    id: "welcome",
    route: "/settings",
    title: "Welcome Manager! 👋",
    content:
      "Let's explore how to manage your team's performance evaluations.\n\nThis tour will guide you through the complete review workflow!",
    placement: "center",
  },
  {
    id: "dashboard",
    route: "/",
    title: "Manager Dashboard",
    content:
      "Your dashboard provides an overview of:\n\n• Pending submissions to review\n• Team evaluation status\n• Upcoming meetings\n• Development goals progress",
    targetSelector: "[data-testid='nav-dashboard']",
    placement: "right",
  },
  {
    id: "submissions-menu",
    route: "/manager-submissions",
    title: "Team Submissions",
    content:
      "This is your main workspace for reviewing team evaluations.\n\nLet's explore the submission management!",
    targetSelector: "[data-testid='nav-manager-submissions']",
    placement: "right",
    action: "showDemoSubmissions",
  },
  // Pending Tab - Review Flow
  {
    id: "pending-tab",
    route: "/manager-submissions",
    title: "Pending Reviews Tab",
    content:
      "The Pending tab shows submissions waiting for your review.\n\nDemo submissions have been loaded for this tour!",
    targetSelector: "[data-testid='tab-pending']",
    placement: "bottom",
  },
  {
    id: "submission-card",
    route: "/manager-submissions",
    title: "Submission Card",
    content:
      "Each card displays:\n\n• Employee name and role\n• Submission date\n• Current status\n• Review actions",
    targetSelector: "[data-testid='submission-card-0']",
    placement: "right",
  },
  {
    id: "review-button",
    route: "/manager-submissions",
    title: "Review Submission Button",
    content:
      "Click 'Review Submission' to open the evaluation form.\n\nClick Next to open the form!",
    targetSelector: "[data-testid='review-btn-0']",
    placement: "left",
  },
  // Evaluation Dialog
  {
    id: "evaluation-dialog",
    route: "/manager-submissions",
    title: "Evaluation Form",
    content:
      "This dialog shows:\n\n• Employee's self-assessment\n• Questions to evaluate\n• Space for your feedback\n\nReview and provide your assessment!",
    targetSelector: "[data-testid='evaluation-dialog']",
    placement: "left",
    action: "openReviewDialog",
  },
  {
    id: "final-rating",
    route: "/manager-submissions",
    title: "Final Rating",
    content:
      "Select the overall performance rating:\n\n• 1 - Below Expectations\n• 2 - Partially Meets\n• 3 - Meets Expectations\n• 4 - Exceeds Expectations\n• 5 - Outstanding",
    targetSelector: "[data-testid='final-rating-select']",
    placement: "right",
  },
  {
    id: "submit-review",
    route: "/manager-submissions",
    title: "Submit Review",
    content:
      "Click to submit your review.\n\nThe evaluation will move to the 'Reviewed' tab!",
    targetSelector: "[data-testid='submit-review-button']",
    placement: "top",
  },
  // Reviewed Tab - Meeting & Notes Flow
  {
    id: "reviewed-tab",
    route: "/manager-submissions",
    title: "Reviewed Tab",
    content:
      "After submitting your review, evaluations appear here.\n\nNext steps: Schedule meeting → Add notes → Complete evaluation",
    targetSelector: "[data-testid='tab-reviewed']",
    placement: "bottom",
    action: "closeReviewAndSwitchToReviewed",
  },
  {
    id: "reviewed-card",
    route: "/manager-submissions",
    title: "Reviewed Submission",
    content:
      "This card shows a reviewed submission with available actions:\n\n• Schedule Meeting\n• Edit Notes\n• Complete Evaluation",
    targetSelector: "[data-testid='submission-card-0']",
    placement: "right",
  },
  {
    id: "schedule-meeting-btn",
    route: "/manager-submissions",
    title: "Schedule 1-on-1 Meeting",
    content:
      "Click this button to schedule a meeting to discuss:\n\n• Performance feedback\n• Development areas\n• Career goals\n\nClick Next to open the scheduler!",
    targetSelector: "[data-testid='schedule-meeting-btn-0']",
    placement: "left",
  },
  // Meeting Dialog
  {
    id: "meeting-dialog",
    route: "/manager-submissions",
    title: "Meeting Scheduler",
    content:
      "Set up the meeting details:\n\n• Date and time\n• Meeting title\n• Agenda description\n\nThe employee will receive a calendar invite!",
    targetSelector: "[data-testid='meeting-dialog']",
    placement: "left",
    action: "openMeetingDialog",
  },
  {
    id: "meeting-date",
    route: "/manager-submissions",
    title: "Select Date",
    content:
      "Pick a suitable date for the 1-on-1 meeting.\n\nChoose a time that works for both parties!",
    targetSelector: "[data-testid='meeting-date-picker']",
    placement: "right",
  },
  {
    id: "meeting-submit",
    route: "/manager-submissions",
    title: "Schedule Meeting",
    content:
      "Click to schedule and send the invite!\n\nThe meeting will be added to calendars.",
    targetSelector: "[data-testid='schedule-meeting-submit']",
    placement: "top",
  },
  // Notes Dialog
  {
    id: "notes-intro",
    route: "/manager-submissions",
    title: "Meeting Notes",
    content:
      "After the meeting, document your discussion.\n\nClick Next to open the notes dialog!",
    targetSelector: "[data-testid='submission-card-0']",
    placement: "right",
    action: "closeMeetingDialog",
  },
  {
    id: "notes-dialog",
    route: "/manager-submissions",
    title: "Meeting Notes Dialog",
    content:
      "Document the meeting:\n\n• Discussion highlights\n• Action items\n• Follow-up tasks\n• Commitments made",
    targetSelector: "[data-testid='meeting-notes-dialog']",
    placement: "left",
    action: "openNotesDialog",
  },
  {
    id: "notes-textarea",
    route: "/manager-submissions",
    title: "Add Notes",
    content:
      "Enter detailed notes about the meeting discussion.\n\nThese help track progress and agreements!",
    targetSelector: "[data-testid='meeting-notes-textarea']",
    placement: "right",
  },
  {
    id: "save-notes",
    route: "/manager-submissions",
    title: "Save Notes",
    content:
      "Save your meeting notes.\n\nYou can choose to share them with the employee!",
    targetSelector: "[data-testid='save-notes-button']",
    placement: "top",
  },
  // Completed Tab
  {
    id: "completed-tab",
    route: "/manager-submissions",
    title: "Completed Tab",
    content:
      "Finalized evaluations appear in the Completed tab.\n\nThese have gone through the full review cycle!",
    targetSelector: "[data-testid='tab-completed']",
    placement: "bottom",
    action: "closeNotesAndSwitchToCompleted",
  },
  {
    id: "completed-card",
    route: "/manager-submissions",
    title: "Completed Evaluation ✅",
    content:
      "Completed evaluations show:\n\n• Final rating\n• Meeting details\n• All notes and feedback\n• Complete history",
    targetSelector: "[data-testid='submission-card-0']",
    placement: "right",
  },
  // Development Goals
  {
    id: "member-goals-menu",
    route: "/member-development-goals",
    title: "Team Development Goals",
    content:
      "Monitor and guide your team's professional growth.\n\nTrack their development goals and progress!",
    targetSelector: "[data-testid='nav-member-development-goals']",
    placement: "right",
  },
  {
    id: "team-goals-overview",
    route: "/member-development-goals",
    title: "Goals Overview",
    content:
      "View all your team members' goals:\n\n• Goal descriptions and targets\n• Progress tracking\n• Due dates\n• Status updates\n\nDemo goals will now appear!",
    targetSelector: "[data-testid='member-development-goals']",
    placement: "top",
    action: "showDemoGoals",
  },
  {
    id: "employee-goals",
    route: "/member-development-goals",
    title: "Employee Goals",
    content:
      "Each team member's goals are grouped together.\n\nExpand to see their individual development goals!",
    targetSelector: "[data-testid='employee-goals-0']",
    placement: "right",
    action: "expandFirstEmployee",
  },
  {
    id: "goal-card",
    route: "/member-development-goals",
    title: "Individual Goal",
    content:
      "Each goal shows:\n\n• Goal title and description\n• Planned outcome\n• Target completion date\n• Progress percentage",
    targetSelector: "[data-testid='goal-card-0-0']",
    placement: "right",
  },
  {
    id: "goal-progress",
    route: "/member-development-goals",
    title: "Track Progress",
    content:
      "Monitor progress visually:\n\n• Progress bar shows completion %\n• Green indicates on track\n• Help team members by providing guidance\n• Celebrate achievements!",
    targetSelector: "[data-testid='progress-bar-0-0']",
    placement: "top",
  },
  // Meetings
  {
    id: "meetings-menu",
    route: "/meetings",
    title: "Meetings Management",
    content:
      "Manage all your 1-on-1 meetings with team members.\n\nKeep track of discussions and follow-ups!",
    targetSelector: "[data-testid='nav-meetings']",
    placement: "right",
  },
  {
    id: "meetings-page",
    route: "/meetings",
    title: "Scheduled Meetings",
    content:
      "See all scheduled meetings:\n\n• Meeting date and time\n• Team member name\n• Meeting status\n• Action buttons\n\nDemo meetings will now appear!",
    targetSelector: "[data-testid='meetings']",
    placement: "top",
    action: "showDemoMeetings",
  },
  {
    id: "meeting-card",
    route: "/meetings",
    title: "Meeting Details",
    content:
      "Each meeting shows:\n\n• Participant information\n• Scheduled date and time\n• Current status\n• Available actions",
    targetSelector: "[data-testid='meeting-row-demo-meeting-1']",
    placement: "right",
  },
  {
    id: "complete-meeting",
    route: "/meetings",
    title: "Complete Review",
    content:
      "After conducting the meeting:\n\n• Click 'Complete Review'\n• Add meeting notes\n• Update final rating if needed\n• Finalize the evaluation",
    targetSelector: "[data-testid='complete-review-demo-meeting-1']",
    placement: "top",
  },
  {
    id: "complete",
    route: "/settings",
    title: "Tour Complete! 🎉",
    content:
      "Excellent! You now know how to:\n\n• Review team submissions\n• Complete evaluations with ratings\n• Schedule and manage meetings\n• Add meeting notes\n• Track team development goals\n\nYou can restart this tour anytime from Settings. Good luck managing your team's performance!",
    placement: "center",
  },
];

// Employee tour steps - focused on self-evaluation and development
export const employeeTourSteps: TourStep[] = [
  {
    id: "welcome",
    route: "/settings",
    title: "Welcome to Your Performance Journey! 👋",
    content:
      "Let's take a guided tour to help you understand how to use the Performance Management System effectively.\n\nThis tour will show you how to:\n• Complete your evaluations\n• Manage meetings with your manager\n• Track your development goals\n• View your performance progress",
    placement: "center",
  },
  // Dashboard Section
  {
    id: "dashboard",
    route: "/",
    title: "Your Dashboard",
    content:
      "Welcome to your dashboard! This is your command center where you can:\n\n• See your current evaluation status\n• View upcoming meetings and tasks\n• Track development goals progress\n• Access quick actions to complete evaluations",
    placement: "top",
  },
  // Evaluations Section
  {
    id: "evaluations-page",
    route: "/evaluations",
    title: "My Evaluations",
    content:
      "This is where you complete your self-evaluations and track the review process.\n\nLet's see how to complete an evaluation with demo data!",
    placement: "top",
    action: "showDemoEvaluations",
  },
  {
    id: "evaluations-card",
    route: "/evaluations",
    title: "Evaluation Card",
    content:
      "Each evaluation card shows:\n\n• Appraisal cycle and period\n• Status (pending, in progress, completed)\n• Deadlines and important dates\n• Actions available to you",
    targetSelector: "[data-testid='evaluation-card-demo-eval-1']",
    placement: "top",
  },
  {
    id: "evaluations-start-button",
    route: "/evaluations",
    title: "Start Button",
    content:
      "Click the 'Start' button to begin your self-evaluation.\n\nClick Next to open the evaluation form!",
    targetSelector: "[data-testid='view-evaluation-demo-eval-1']",
    placement: "left",
  },
  {
    id: "evaluations-form",
    route: "/evaluations",
    title: "Evaluation Form",
    content:
      "This is your evaluation form with:\n\n• Rating questions (1-5 scale)\n• Text responses for detailed feedback\n\nAnswer all questions honestly and thoroughly.",
    targetSelector: "[data-testid='evaluation-dialog']",
    placement: "left",
    action: "openDemoEvaluation",
  },
  {
    id: "evaluations-rating",
    route: "/evaluations",
    title: "Rating Questions",
    content:
      "For rating questions:\n\n• Select a score from 1-5\n• Add supporting comments in the Self Assessment field below\n\nClick Next to see a sample filled response!",
    targetSelector: "[data-testid='rating-card-questionnaire-1_q1']",
    placement: "right",
  },
  {
    id: "evaluations-demo-filled",
    route: "/evaluations",
    title: "Sample Response Filled",
    content:
      "We've filled in sample responses:\n\n• Rating: 4 (Exceeds Expectations)\n• Detailed achievement description\n\nScroll down to see more questions. Use specific examples in your real evaluation!",
    targetSelector: "[data-testid='evaluation-dialog']",
    placement: "left",
    action: "fillDemoData",
  },
  {
    id: "evaluations-save",
    route: "/evaluations",
    title: "Save Your Progress",
    content:
      "You can save your evaluation as a draft and come back later to complete it.\n\nThis is helpful if you need more time to think about your responses!",
    targetSelector: "[data-testid='save-draft-btn']",
    placement: "top",
  },
  {
    id: "evaluations-submit",
    route: "/evaluations",
    title: "Submit Evaluation",
    content:
      "Once you've answered all questions, click 'Submit Evaluation'.\n\nAfter submission:\n• Your manager will be notified\n• They will review and add their assessment\n• A meeting will be scheduled to discuss",
    targetSelector: "[data-testid='submit-evaluation']",
    placement: "top",
  },
  {
    id: "evaluations-close",
    route: "/evaluations",
    title: "Evaluation Complete",
    content:
      "Great! You now understand how to complete your self-evaluation.\n\nLet's explore other features of the system.",
    placement: "center",
    action: "closeDemoEvaluation",
  },
  // Meetings Section - First highlight sidebar menu
  {
    id: "meetings-menu",
    route: "/evaluations",
    title: "Meetings Menu",
    content:
      "Click on 'Meetings' in the sidebar to view and manage your performance review meetings with your manager.\n\nThis is where you'll see scheduled meetings and past meeting notes.",
    targetSelector: "[data-testid='nav-meetings']",
    placement: "right",
  },
  {
    id: "meetings-page",
    route: "/meetings",
    title: "Review Meetings",
    content:
      "This is where you manage your performance review meetings with your manager.\n\nLet's add some demo meetings to show you how it works!",
    targetSelector: "[data-testid='meetings']",
    placement: "top",
    action: "showDemoMeetings",
  },
  {
    id: "meetings-stats",
    route: "/meetings",
    title: "Meeting Statistics",
    content:
      "At a glance, see your meeting status:\n\n• Total meetings across all review periods\n• Scheduled meetings awaiting discussion\n• Completed meetings with documented outcomes",
    targetSelector: "[data-testid='total-meetings']",
    placement: "bottom",
  },
  {
    id: "meetings-scheduled",
    route: "/meetings",
    title: "Upcoming Meeting",
    content:
      "Here's your upcoming meeting with your manager:\n\n• Meeting date and time clearly displayed\n• Status badge shows 'Scheduled'\n• You'll meet with your manager to discuss your performance\n\nPrepare by reviewing your self-evaluation responses!",
    targetSelector: "[data-testid='meeting-row-demo-employee-meeting-1']",
    placement: "top",
  },
  {
    id: "meetings-completed",
    route: "/meetings",
    title: "Completed Meeting",
    content:
      "Completed meetings show:\n\n• Your manager's feedback and notes (when shared)\n• Final rating from the discussion\n• Meeting completion date\n• Status badge shows 'Completed'\n\nUse this feedback to set development goals!",
    targetSelector: "[data-testid='meeting-row-demo-employee-meeting-2']",
    placement: "top",
  },
  // Development Goals Section - First highlight sidebar menu
  {
    id: "dev-goals-menu",
    route: "/meetings",
    title: "Development Goals Menu",
    content:
      "Click on 'Development Goals' in the sidebar to track your professional growth.\n\nSet goals based on feedback from your evaluations and meetings.",
    targetSelector: "[data-testid='nav-development-goals']",
    placement: "right",
  },
  {
    id: "dev-goals-page",
    route: "/development-goals",
    title: "My Development Goals",
    content:
      "Track and manage your professional development goals.\n\nGoals help you focus on areas for improvement and career growth.\n\nYou can see your existing goals here organized by evaluation cycle.",
    targetSelector: "[data-testid='development-goals']",
    placement: "top",
  },
  {
    id: "dev-goals-add-button",
    route: "/development-goals",
    title: "Add New Goal",
    content:
      "Click 'Add Goal' to create a new development goal.\n\nGoals are linked to completed evaluation meetings, helping you track improvement areas identified during your reviews.",
    targetSelector: "[data-testid='button-add-goal']",
    placement: "left",
  },
  {
    id: "dev-goals-form",
    route: "/development-goals",
    title: "Create Goal Form",
    content:
      "Fill out the goal creation form:\n\n• Select a completed evaluation to link this goal to\n• Describe your development goal clearly\n• Define the expected outcome\n• Set a target completion date\n\nWell-defined goals help track your professional growth!",
    targetSelector: "[data-testid='dialog-create-goal']",
    placement: "left",
    action: "openCreateGoalDialog",
  },
  {
    id: "dev-goals-create-button",
    route: "/development-goals",
    title: "Create Goal Button",
    content:
      "After filling out all the fields, click 'Create Goal' to save your new development goal.\n\nYour goal will appear in the list organized by evaluation cycle.",
    targetSelector: "[data-testid='button-submit-goal']",
    placement: "top",
  },
  {
    id: "dev-goals-goal-card",
    route: "/development-goals",
    title: "Goal Card",
    content:
      "Each goal card shows:\n\n• Goal description and planned outcome\n• Progress bar showing completion percentage\n• Target date for completion\n• Edit and delete options\n\nRegularly update your progress to track achievements!",
    targetSelector: "[data-testid='goal-card-demo-goal-1']",
    placement: "top",
    action: "closeCreateGoalDialog",
  },
  {
    id: "dev-goals-edit-button",
    route: "/development-goals",
    title: "Edit Goal",
    content:
      "Click 'Edit' to update your goal details and track progress.\n\nYou can modify the description, outcome, target date, and most importantly - update your progress percentage!",
    targetSelector: "[data-testid='button-edit-goal-demo-goal-1']",
    placement: "left",
  },
  {
    id: "dev-goals-progress-slider",
    route: "/development-goals",
    title: "Update Progress",
    content:
      "Use the progress slider to update how much of your goal you've completed.\n\nRegular progress updates help you and your manager see your growth over time!",
    targetSelector: "[data-testid='slider-progress']",
    placement: "top",
    action: "openEditGoalDialog",
  },
  {
    id: "dev-goals-update-button",
    route: "/development-goals",
    title: "Save Updates",
    content:
      "Click 'Update Goal' to save your changes.\n\nConsistent tracking demonstrates your commitment to professional development!",
    targetSelector: "[data-testid='button-update-goal']",
    placement: "top",
  },
  // Settings Section - Show sidebar menu and end tour
  {
    id: "settings-menu",
    route: "/development-goals",
    title: "Settings Menu 🎉",
    content:
      "This is the Settings menu where you can access your account preferences and configuration options.\n\nYou can also restart this tour from Settings anytime!\n\n✓ Complete self-evaluations thoroughly\n✓ Prepare for and track review meetings\n✓ Manage your development goals\n✓ Navigate your performance dashboard\n\nCongratulations! You've completed the tour. Best of luck on your performance journey!",
    targetSelector: "[data-testid='nav-settings']",
    placement: "right",
    action: "closeEditGoalDialog",
  },
];

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Select tour steps based on user role
  const tourSteps = React.useMemo(() => {
    const userRole = user?.activeRole || user?.role;
    console.log("Tour: User role detected:", userRole);

    if (userRole) {
      const normalizedRole = userRole.toLowerCase().replace(/[\s_-]/g, "");

      // HR Manager: hr_manager, hrmanager, "HR Manager"
      if (normalizedRole === "hrmanager" || normalizedRole === "hr") {
        console.log("Tour: Using HR Manager tour steps");
        return hrManagerTourSteps;
      }

      // Manager: manager
      if (normalizedRole === "manager") {
        console.log("Tour: Using Manager tour steps");
        return managerTourSteps;
      }

      // Employee: employee
      if (normalizedRole === "employee") {
        console.log("Tour: Using Employee tour steps");
        return employeeTourSteps;
      }

      // Super Admin: super_admin, superadmin
      if (normalizedRole === "superadmin") {
        console.log("Tour: Using Admin tour steps (Super Admin)");
        return adminTourSteps;
      }

      // Admin: admin
      if (normalizedRole === "admin") {
        console.log("Tour: Using Admin tour steps");
        return adminTourSteps;
      }
    }

    // Default to employee tour for unknown roles
    console.log("Tour: Using Employee tour steps (default)");
    return employeeTourSteps;
  }, [user]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsRunning(true);
    setCurrentAction(null);
  }, []);

  const stopTour = useCallback(() => {
    setIsRunning(false);
    setCurrentStep(0);
    setCurrentAction(null);
    // Dispatch event to clean up any tour-related state in components
    window.dispatchEvent(new CustomEvent("tourEnded"));
  }, []);

  const triggerAction = useCallback((action: string) => {
    setCurrentAction(action);
  }, []);

  const clearAction = useCallback(() => {
    setCurrentAction(null);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      const currentStepData = tourSteps[currentStep];
      const nextIndex = currentStep + 1;
      const nextStepData = tourSteps[nextIndex];

      // Trigger action for the next step if it has one
      if (nextStepData.action) {
        setCurrentAction(nextStepData.action);
      } else {
        setCurrentAction(null);
      }

      // Navigate to the route for the next step if different
      if (currentStepData.route !== nextStepData.route) {
        setLocation(nextStepData.route);
        // Longer delay when navigating to allow page to render
        setTimeout(() => {
          setCurrentStep(nextIndex);
        }, 400);
      } else {
        // Same page, shorter delay
        setTimeout(() => {
          setCurrentStep(nextIndex);
        }, 100);
      }
    } else {
      stopTour();
    }
  }, [currentStep, setLocation, stopTour, tourSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const currentStepData = tourSteps[currentStep];
      const prevIndex = currentStep - 1;
      const prevStepData = tourSteps[prevIndex];

      // Clear any current action
      setCurrentAction(null);

      // Navigate to the route for the previous step if different
      if (currentStepData.route !== prevStepData.route) {
        setLocation(prevStepData.route);
        setTimeout(() => {
          setCurrentStep(prevIndex);
        }, 400);
      } else {
        setTimeout(() => {
          setCurrentStep(prevIndex);
        }, 100);
      }
    }
  }, [currentStep, setLocation, tourSteps]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < tourSteps.length) {
        const stepData = tourSteps[step];
        setLocation(stepData.route);

        if (stepData.action) {
          setCurrentAction(stepData.action);
        } else {
          setCurrentAction(null);
        }

        setTimeout(() => {
          setCurrentStep(step);
        }, 300);
      }
    },
    [setLocation, tourSteps],
  );

  return (
    <TourContext.Provider
      value={{
        isRunning,
        isTourMode: isRunning,
        currentStep,
        startTour,
        stopTour,
        nextStep,
        prevStep,
        goToStep,
        totalSteps: tourSteps.length,
        triggerAction,
        currentAction,
        clearAction,
        tourSteps, // Provide current tour steps in context
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
