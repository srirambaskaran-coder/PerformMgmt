import { useEffect, useRef, useState, useCallback } from "react";
import { useTour } from "@/contexts/TourContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourModal() {
  const {
    isRunning,
    currentStep,
    stopTour,
    nextStep,
    prevStep,
    totalSteps,
    tourSteps,
  } = useTour();
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowDirection, setArrowDirection] = useState<
    "left" | "top" | "right" | "bottom"
  >("left");
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isCentered = step.placement === "center";

  // Add/remove tour-active class on body for CSS overrides
  useEffect(() => {
    if (isRunning) {
      document.body.classList.add("tour-active");
    } else {
      document.body.classList.remove("tour-active");
    }
    return () => {
      document.body.classList.remove("tour-active");
    };
  }, [isRunning]);

  // Handle escape key to close tour
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isRunning) {
        stopTour();
      }
      if (e.key === "ArrowRight" && isRunning) {
        nextStep();
      }
      if (e.key === "ArrowLeft" && isRunning && !isFirstStep) {
        prevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, stopTour, nextStep, prevStep, isFirstStep]);

  // Track retry count for finding elements
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  // Find target element and position modal
  const positionElements = useCallback(() => {
    if (!isRunning || isCentered) {
      setSpotlight(null);
      retryCountRef.current = 0;
      return;
    }

    let targetElement: HTMLElement | null = null;

    // Priority 1: Use targetSelector if specified
    if (step.targetSelector) {
      targetElement = document.querySelector(
        step.targetSelector,
      ) as HTMLElement;
    }

    // If target not found and we haven't exceeded retries, wait and try again
    // This handles cases where dialogs are being opened by actions
    if (
      !targetElement &&
      step.targetSelector &&
      retryCountRef.current < maxRetries
    ) {
      retryCountRef.current++;
      setTimeout(positionElements, 200);
      return;
    }

    // Priority 2: Fall back to sidebar menu item only after retries exhausted
    if (!targetElement) {
      const routeKey =
        step.route === "/" ? "dashboard" : step.route.replace("/", "");
      targetElement = document.querySelector(
        `[data-testid="nav-${routeKey}"]`,
      ) as HTMLElement;
    }

    // Reset retry count when we find an element
    retryCountRef.current = 0;

    if (!targetElement || !modalRef.current) {
      setSpotlight(null);
      return;
    }

    // Scroll element into view if needed
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });

    // Wait a bit for scroll then get position
    const rect = targetElement.getBoundingClientRect();
    const modalWidth = 400;
    const modalHeight = modalRef.current.offsetHeight || 280;
    const gap = 16;
    const spotlightPadding = 8;

    // Always show spotlight
    setSpotlight({
      top: rect.top - spotlightPadding,
      left: rect.left - spotlightPadding,
      width: rect.width + spotlightPadding * 2,
      height: rect.height + spotlightPadding * 2,
    });

    // Calculate best position for modal based on available space
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top: number;
    let left: number;
    let arrow: "left" | "top" | "right" | "bottom" = "left";

    // Check placement preference
    const placement = step.placement || "right";

    if (
      placement === "bottom" &&
      rect.bottom + gap + modalHeight < viewportHeight
    ) {
      // Position below
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - modalWidth / 2;
      arrow = "top";
    } else if (placement === "top" && rect.top - gap - modalHeight > 0) {
      // Position above
      top = rect.top - gap - modalHeight;
      left = rect.left + rect.width / 2 - modalWidth / 2;
      arrow = "bottom";
    } else if (placement === "left" && rect.left - gap - modalWidth > 0) {
      // Position to the left
      top = rect.top + rect.height / 2 - modalHeight / 2;
      left = rect.left - gap - modalWidth;
      arrow = "right";
    } else {
      // Default: position to the right
      top = rect.top + rect.height / 2 - modalHeight / 2;
      left = rect.right + gap;
      arrow = "left";

      // If not enough space on right, try left
      if (left + modalWidth > viewportWidth - gap) {
        if (rect.left - gap - modalWidth > 0) {
          left = rect.left - gap - modalWidth;
          arrow = "right";
        } else {
          // Position below as last resort
          top = rect.bottom + gap;
          left = Math.max(gap, rect.left + rect.width / 2 - modalWidth / 2);
          arrow = "top";
        }
      }
    }

    // Ensure modal stays within viewport
    top = Math.max(gap, Math.min(top, viewportHeight - modalHeight - gap));
    left = Math.max(gap, Math.min(left, viewportWidth - modalWidth - gap));

    setPosition({ top, left });
    setArrowDirection(arrow);
  }, [isRunning, step, isCentered]);

  // Position modal when step changes
  useEffect(() => {
    // Reset retry count when step changes
    retryCountRef.current = 0;

    if (!isRunning) {
      setSpotlight(null);
      return;
    }

    if (isCentered) {
      setSpotlight(null);
      return;
    }

    // Initial positioning - give time for actions to execute
    const timer1 = setTimeout(positionElements, 200);
    // Reposition after potential dialog animations
    const timer2 = setTimeout(positionElements, 600);
    // One more retry for slow-rendering elements
    const timer3 = setTimeout(positionElements, 1000);

    // Reposition on window resize
    window.addEventListener("resize", positionElements);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener("resize", positionElements);
    };
  }, [
    isRunning,
    currentStep,
    isCentered,
    positionElements,
    step.targetSelector,
  ]);

  if (!isRunning) return null;

  // Render arrow based on direction
  const renderArrow = () => {
    if (isCentered) return null;

    const arrowClasses = "absolute w-0 h-0";

    switch (arrowDirection) {
      case "left":
        return (
          <div
            className={cn(
              arrowClasses,
              "left-0 top-1/2 -translate-x-full -translate-y-1/2",
              "border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[12px] border-r-white dark:border-r-slate-900",
            )}
          />
        );
      case "right":
        return (
          <div
            className={cn(
              arrowClasses,
              "right-0 top-1/2 translate-x-full -translate-y-1/2",
              "border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[12px] border-l-white dark:border-l-slate-900",
            )}
          />
        );
      case "top":
        return (
          <div
            className={cn(
              arrowClasses,
              "top-0 left-1/2 -translate-y-full -translate-x-1/2",
              "border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-white dark:border-b-slate-900",
            )}
          />
        );
      case "bottom":
        return (
          <div
            className={cn(
              arrowClasses,
              "bottom-0 left-1/2 translate-y-full -translate-x-1/2",
              "border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-white dark:border-t-slate-900",
            )}
          />
        );
    }
  };

  return (
    <>
      {/* Backdrop with spotlight cutout */}
      <div
        className="fixed inset-0 z-[9990] bg-black/60"
        style={
          spotlight
            ? {
                clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${spotlight.left}px 100%, 
            ${spotlight.left}px ${spotlight.top}px, 
            ${spotlight.left + spotlight.width}px ${spotlight.top}px, 
            ${spotlight.left + spotlight.width}px ${spotlight.top + spotlight.height}px, 
            ${spotlight.left}px ${spotlight.top + spotlight.height}px, 
            ${spotlight.left}px 100%, 
            100% 100%, 
            100% 0%
          `,
                transition: "clip-path 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
              }
            : undefined
        }
        onClick={stopTour}
      />

      {/* Spotlight border/glow effect */}
      {spotlight && (
        <div
          className="fixed z-[9995] rounded-lg pointer-events-none"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow:
              "0 0 0 4px hsl(var(--primary)), 0 0 0 6px hsl(var(--primary) / 0.3), 0 0 30px 8px hsl(var(--primary) / 0.4)",
            animation: "spotlight-pulse 2s ease-in-out infinite",
            transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      )}

      {/* Tour Modal */}
      <div
        ref={modalRef}
        style={
          !isCentered
            ? {
                top: position.top,
                left: position.left,
                transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
              }
            : undefined
        }
        className={cn(
          "fixed z-[10000] pointer-events-auto",
          isCentered &&
            "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out",
        )}
      >
        {renderArrow()}

        <Card
          className={cn(
            "w-[90vw] shadow-2xl border-2 border-primary/20 bg-white dark:bg-slate-900 transition-all duration-300 ease-out",
            isCentered ? "max-w-lg" : "max-w-[400px]",
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Step {currentStep + 1} of {totalSteps}
                  </p>
                  <CardTitle className="text-lg leading-tight">
                    {step.title}
                  </CardTitle>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={stopTour}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close tour</span>
              </Button>
            </div>
            <Progress value={progress} className="h-1.5 mt-3" />
          </CardHeader>

          <CardContent className="pb-4">
            <div
              key={currentStep}
              className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed animate-in fade-in duration-300"
            >
              {step.content}
            </div>

            {step.showActions && step.actionText && (
              <div
                key={`action-${currentStep}`}
                className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300 delay-150"
              >
                <p className="text-sm text-primary font-medium flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  {step.actionText}
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between gap-2 pt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={stopTour}
              className="text-muted-foreground transition-all hover:scale-105"
            >
              Skip Tour
            </Button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  className="gap-1 transition-all hover:scale-105"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}

              <Button
                size="sm"
                onClick={nextStep}
                className="gap-1 transition-all hover:scale-105 hover:shadow-lg"
              >
                {isLastStep ? (
                  "Finish"
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
