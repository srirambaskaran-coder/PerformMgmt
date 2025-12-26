import { AlertTriangle, Mail, RefreshCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SystemErrorModalProps {
  isOpen: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

export function SystemErrorModal({
  isOpen,
  errorMessage,
  onRetry,
}: SystemErrorModalProps) {
  const handleContactSupport = () => {
    window.location.href =
      "mailto:support@example.com?subject=System Error - Performance Management System";
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center text-xl">
            System Error
          </DialogTitle>
          <DialogDescription className="text-center">
            We're experiencing technical difficulties
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive" className="border-destructive/50">
            <AlertDescription className="text-sm">
              {errorMessage ||
                "The system is currently unable to connect to the server. This may be due to maintenance or a temporary issue."}
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-2 text-sm text-muted-foreground">
            <p>Please try the following:</p>
            <ul className="space-y-1 text-left pl-6">
              <li className="list-disc">Check your internet connection</li>
              <li className="list-disc">Refresh the page</li>
              <li className="list-disc">
                Clear your browser cache and try again
              </li>
            </ul>
          </div>

          <div className="pt-2 text-center">
            <p className="text-sm text-muted-foreground">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-center gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Retry Connection
            </Button>
          )}
          {/* <Button onClick={handleContactSupport} className="gap-2">
            <Mail className="h-4 w-4" />
            Contact Support
          </Button> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
