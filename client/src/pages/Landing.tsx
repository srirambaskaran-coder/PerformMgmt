import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Building,
  Users,
  ClipboardList,
  BarChart3,
  Shield,
  Globe,
  Clock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { API_BASE_URL } from "@/config/api.config";
import { setStoredUser, setTokens } from "@/hooks/useAuth";

const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  designation: z.string().min(2, "Designation must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
});

const loginSchema = z.object({
  companyUrl: z.string().min(1, "Company URL is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;
type LoginForm = z.infer<typeof loginSchema>;

export default function Landing() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { toast } = useToast();
  const params = useParams() as { companyUrl?: string };

  const registerForm = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      companyName: "",
      designation: "",
      email: "",
      mobile: "",
    },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      companyUrl: "",
      email: "",
      password: "",
    },
  });

  // Pre-fill company URL if accessed via /company/:companyUrl
  useEffect(() => {
    if (params.companyUrl) {
      loginForm.setValue("companyUrl", params.companyUrl);
      // Auto-open login modal if accessed via company URL
      setIsLoginOpen(true);
    }
  }, [params.companyUrl, loginForm]);

  const onRegisterSubmit = async (data: RegistrationForm) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Registration Successful",
          description: "Thank you for your interest! We'll contact you soon.",
        });
        setIsRegisterOpen(false);
        registerForm.reset();
      } else {
        throw new Error("Registration failed");
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const onLoginSubmit = async (data: LoginForm) => {
    try {
      // Use JWT auth endpoint
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("[Landing] Login response:", result);

        // Store JWT tokens (if backend returns them)
        if (result.accessToken) {
          setTokens(result.accessToken, result.refreshToken, result.expiresIn);
          console.log("[Landing] JWT tokens stored");
        } else {
          console.log("[Landing] No JWT tokens in response (using session cookies)");
        }

        // Store user data
        if (result.user) {
          setStoredUser(result.user);
          console.log("[Landing] User stored:", result.user.role || result.user.Role);
        }

        toast({
          title: "Login Successful",
          description: `Welcome back! Redirecting to your dashboard...`,
        });
        setIsLoginOpen(false);
        loginForm.reset();

        // Log what's stored for debugging
        console.log("[Landing] Stored accessToken:", localStorage.getItem("pms_access_token"));
        console.log("[Landing] Stored user:", localStorage.getItem("pms_auth_user"));

        // Redirect to dashboard with page reload to refresh auth state
        setTimeout(() => {
          console.log("[Landing] Redirecting to dashboard...");
          window.location.href = `${import.meta.env.BASE_URL || "/"}#/`;
          window.location.reload();
        }, 1000);
      } else {
        const errorData = await response.json();
        toast({
          title: "Login Failed",
          description:
            errorData.message ||
            "Please check your company URL, email, and password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Navigation Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Performance Hub</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" data-testid="login-btn">
                  Login
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Company Login</DialogTitle>
                  <DialogDescription>
                    Enter your company URL and credentials to access your
                    Performance Hub.
                  </DialogDescription>
                </DialogHeader>
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="companyUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="your-company"
                              {...field}
                              data-testid="input-company-url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your.email@company.com"
                              {...field}
                              data-testid="input-login-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              data-testid="input-login-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      data-testid="button-login-submit"
                    >
                      Login to Performance Hub
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
              <DialogTrigger asChild>
                <Button data-testid="register-btn">Get Started</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Register Your Interest</DialogTitle>
                  <DialogDescription>
                    Fill out this form and we'll contact you to set up your
                    Performance Hub.
                  </DialogDescription>
                </DialogHeader>
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John Doe"
                              {...field}
                              data-testid="input-register-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Acme Corporation"
                              {...field}
                              data-testid="input-register-company"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="designation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Designation</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="HR Manager"
                              {...field}
                              data-testid="input-register-designation"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@acme.com"
                              {...field}
                              data-testid="input-register-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              {...field}
                              data-testid="input-register-mobile"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      data-testid="button-register-submit"
                    >
                      Submit Registration
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Building className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1
            className="text-4xl md:text-6xl font-bold mb-6"
            data-testid="hero-title"
          >
            Performance Hub
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Transform your organization with our comprehensive SaaS Performance
            Management platform. Streamline evaluations, track progress, and
            drive employee growth with powerful analytics and automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => setIsRegisterOpen(true)}
              data-testid="hero-register-btn"
              className="min-w-[180px]"
            >
              Start Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsLoginOpen(true)}
              data-testid="hero-login-btn"
              className="min-w-[180px]"
            >
              Company Login
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Join 500+ companies already using Performance Hub
          </p>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">
                Multi-Tenant Architecture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Secure, isolated environments for each company with custom
                branding and configurations.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-lg">Dynamic Evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Customizable questionnaires with real-time calculations,
                self-assessments, and automated workflows.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Real-time progress tracking, completion rates, and comprehensive
                reporting across all levels.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Enterprise Security</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Role-based access control, data encryption, and compliance with
                industry standards.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Global Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Cloud-based infrastructure that scales with your organization,
                from startups to enterprises.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Automated Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Smart notifications, reminder systems, and meeting scheduling to
                streamline HR processes.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-8">
            Trusted by Organizations Worldwide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Deploy in Minutes</h3>
              <p className="text-muted-foreground">
                Get your Performance Hub set up instantly with our guided
                onboarding. No technical expertise required - we handle
                everything for you.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">ROI in 30 Days</h3>
              <p className="text-muted-foreground">
                See immediate improvements in review completion rates, employee
                engagement, and performance visibility across your organization.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">
                Scale Without Limits
              </h3>
              <p className="text-muted-foreground">
                From 10 employees to 10,000+, our platform grows with you.
                Enterprise-grade infrastructure with 99.9% uptime guarantee.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing CTA Section */}
        <div className="bg-muted/50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Transform Your Performance Management?
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Join hundreds of forward-thinking companies using Performance Hub to
            drive employee growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => setIsRegisterOpen(true)}
              data-testid="cta-register-btn"
              className="min-w-[200px]"
            >
              Start Your Free Trial
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => setIsLoginOpen(true)}
              data-testid="cta-login-btn"
              className="min-w-[200px]"
            >
              Access Your Company Portal
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Setup in under 5 minutes • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
