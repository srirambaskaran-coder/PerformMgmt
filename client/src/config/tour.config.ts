import { Step } from "react-joyride";

// Admin role tour steps
export const adminTourSteps: Step[] = [
  {
    target: "body",
    content:
      "Welcome to the Performance Management System! Let's take a quick tour to help you get started.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[href="/dashboard"]',
    content:
      "This is your Dashboard - your central hub for overview and quick access to key metrics and recent activities.",
    placement: "right",
  },
  {
    target: '[href="/analytics"]',
    content:
      "Analytics provides comprehensive insights and reports on performance data across your organization.",
    placement: "right",
  },
  {
    target: '[href="/companies"]',
    content:
      "Manage company information, settings, and organizational structure here.",
    placement: "right",
  },
  {
    target: '[href="/locations"]',
    content: "Add and manage office locations for your organization.",
    placement: "right",
  },
  {
    target: '[href="/departments"]',
    content: "Create and organize departments within your company structure.",
    placement: "right",
  },
  {
    target: '[href="/grades"]',
    content:
      "Define employee grades and levels for your organization hierarchy.",
    placement: "right",
  },
  {
    target: '[href="/levels"]',
    content: "Manage job levels and classifications for your employees.",
    placement: "right",
  },
  {
    target: '[href="/employees"]',
    content:
      "The heart of your system - manage employee profiles, assignments, and details here.",
    placement: "right",
  },
  {
    target: '[href="/appraisal-cycles"]',
    content:
      "Set up and manage appraisal cycles - define review periods and schedules.",
    placement: "right",
  },
  {
    target: '[href="/review-frequencies"]',
    content: "Configure how often reviews should occur and their timing.",
    placement: "right",
  },
  {
    target: '[href="/frequency-calendars"]',
    content: "Set specific dates and schedules for review periods.",
    placement: "right",
  },
  {
    target: '[href="/questionnaire-templates"]',
    content:
      "Create and customize questionnaire templates for different types of evaluations.",
    placement: "right",
  },
  {
    target: '[href="/publish-questionnaires"]',
    content: "Publish questionnaires to make them available for appraisals.",
    placement: "right",
  },
  {
    target: '[href="/appraisal-groups"]',
    content:
      "Organize employees into appraisal groups for streamlined reviews.",
    placement: "right",
  },
  {
    target: '[href="/initiate-appraisal"]',
    content:
      "Start new appraisal processes for individuals or groups of employees.",
    placement: "right",
  },
  {
    target: '[href="/settings"]',
    content:
      "Configure system settings, email notifications, and company branding.",
    placement: "right",
  },
  {
    target: "body",
    content:
      "That's it! You're ready to manage your organization's performance reviews. You can restart this tour anytime from Settings.",
    placement: "center",
  },
];

// Tour styles to match the application theme
export const tourStyles = {
  options: {
    arrowColor: "hsl(var(--popover))",
    backgroundColor: "hsl(var(--popover))",
    overlayColor: "rgba(0, 0, 0, 0.5)",
    primaryColor: "hsl(var(--primary))",
    textColor: "hsl(var(--popover-foreground))",
    zIndex: 10000,
  },
  buttonNext: {
    backgroundColor: "hsl(var(--primary))",
    color: "hsl(var(--primary-foreground))",
    borderRadius: "var(--radius)",
    fontSize: "14px",
    padding: "8px 16px",
  },
  buttonBack: {
    color: "hsl(var(--muted-foreground))",
    marginRight: "8px",
  },
  buttonSkip: {
    color: "hsl(var(--muted-foreground))",
  },
  tooltip: {
    borderRadius: "var(--radius)",
    fontSize: "14px",
    padding: "16px",
  },
  tooltipContent: {
    padding: "8px 0",
  },
  tooltipTitle: {
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "8px",
  },
};
