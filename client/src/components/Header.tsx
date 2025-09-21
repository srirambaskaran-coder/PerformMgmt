import { Bell, Plus, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user } = useAuth();

  const handleStartReview = () => {
    // TODO: Implement start review cycle modal
    console.log("Start review cycle");
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" data-testid="page-title">Performance Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage employee performance reviews
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              data-testid="notifications-button"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
            </Button>
          </div>

          {/* Quick Actions - Only show for HR Manager */}
          {user?.role === 'hr_manager' && (
            <Button onClick={handleStartReview} data-testid="start-review-button">
              <Plus className="h-4 w-4 mr-2" />
              Start Review Cycle
            </Button>
          )}

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="user-profile-button">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-accent-foreground text-sm font-medium">
                    {(user as any)?.firstName && (user as any)?.lastName 
                      ? `${(user as any).firstName[0]?.toUpperCase()}${(user as any).lastName[0]?.toUpperCase()}`
                      : <User className="h-4 w-4" />
                    }
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none" data-testid="user-name-display">
                    {(user as any)?.firstName && (user as any)?.lastName 
                      ? `${(user as any).firstName} ${(user as any).lastName}`
                      : 'Loading...'
                    }
                  </p>
                  <p className="text-xs leading-none text-muted-foreground" data-testid="user-email-display">
                    {(user as any)?.email || 'Loading...'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize" data-testid="user-role-display">
                    {(user as any)?.role?.replace('_', ' ') || 'Loading...'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="logout-button">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
