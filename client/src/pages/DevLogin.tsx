import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building, Shield, UserCheck, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TestUser {
  id: string;
  role: string;
  email: string;
  name: string;
}

const roleIcons = {
  super_admin: Shield,
  admin: Building,
  hr_manager: Users,
  manager: UserCheck,
  employee: User,
};

const roleColors = {
  super_admin: "bg-red-500",
  admin: "bg-purple-500", 
  hr_manager: "bg-blue-500",
  manager: "bg-green-500",
  employee: "bg-gray-500",
};

export default function DevLogin() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Get test users
  const { data: testUsersData, isLoading } = useQuery({
    queryKey: ["/api/dev/test-users"],
  });

  // Seed users mutation
  const seedUsersMutation = useMutation({
    mutationFn: () => fetch("/api/dev/seed-users", {
      method: "POST",
    }).then(res => res.json()),
  });

  // Login as user mutation
  const loginMutation = useMutation({
    mutationFn: (userId: string) => fetch("/api/dev/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }).then(res => res.json()),
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const handleSeedUsers = async () => {
    try {
      await seedUsersMutation.mutateAsync();
      window.location.reload();
    } catch (error) {
      console.error("Failed to seed users:", error);
    }
  };

  const handleLogin = (userId: string) => {
    setSelectedUser(userId);
    loginMutation.mutate(userId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading development login...</p>
        </div>
      </div>
    );
  }

  const testUsers: TestUser[] = (testUsersData as any)?.testUsers || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Building className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Development Login</h1>
          <p className="text-muted-foreground">
            Choose a test user role to login and explore the system
          </p>
        </div>

        {testUsers.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Setup Required</CardTitle>
              <CardDescription>
                Test users haven't been created yet. Click below to seed the database with test accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={handleSeedUsers}
                disabled={seedUsersMutation.isPending}
                size="lg"
                data-testid="seed-users-button"
              >
                {seedUsersMutation.isPending ? "Creating Users..." : "Create Test Users"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testUsers.map((user) => {
              const Icon = roleIcons[user.role as keyof typeof roleIcons] || User;
              const isLoading = loginMutation.isPending && selectedUser === user.id;
              
              return (
                <Card 
                  key={user.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleLogin(user.id)}
                  data-testid={`login-card-${user.role}`}
                >
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${roleColors[user.role as keyof typeof roleColors]}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Badge variant="secondary" className="mb-4">
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Button 
                      className="w-full"
                      disabled={isLoading}
                      data-testid={`login-button-${user.role}`}
                    >
                      {isLoading ? "Logging in..." : "Login as this user"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg">OAuth Authentication Issue</CardTitle>
              <CardDescription>
                The Replit OAuth authentication is currently experiencing issues. 
                This development login system allows you to test all user roles without OAuth.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Once OAuth is working, users will login through the normal Replit authentication flow.
                This dev login will be removed in production.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}