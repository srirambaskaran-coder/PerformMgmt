import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema, type User, type InsertUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getClientIdFromSession } from "@/lib/ssoAuth";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api.config";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth, normalizeUser, getAccessToken } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Key,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X as XIcon,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Multi-select filter component
interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  label?: string;
}

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  label,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between hover:bg-transparent"
        >
          {selected.length > 0 ? (
            <span className="truncate">
              {selected.length} {label || "items"} selected
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer data-[selected=true]:bg-blue-400 dark:data-[selected=true]:bg-blue-900 hover:!bg-blue-400 dark:hover:!bg-blue-900"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Checkbox
                      checked={selected.includes(option.value)}
                      onCheckedChange={() => handleSelect(option.value)}
                    />
                    <span>{option.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {selected.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleClear}
              >
                Clear filters
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function EmployeeManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilters, setDepartmentFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [companyFilters, setCompanyFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const currentUserRole =
    (currentUser as any)?.role || (currentUser as any)?.Role || "";
  const isSuperAdmin = currentUserRole === "super_admin";
  const isAdmin = currentUserRole === "admin";

  // Fetch all users without filters - filtering is done on frontend
  const { data: usersRaw = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Normalize users to handle API response with uppercase keys
  const users: User[] = useMemo(() => {
    return usersRaw.map((user: any) => {
      const normalized = normalizeUser(user) as User;
      // Add manager info from API response
      (normalized as any).managerFirstName =
        user.ManagerFirstName || user.managerFirstName || "";
      (normalized as any).managerLastName =
        user.ManagerLastName || user.managerLastName || "";
      (normalized as any).departmentName =
        user.DepartmentName || user.departmentName || "";
      (normalized as any).locationName =
        user.LocationName || user.locationName || "";
      return normalized;
    });
  }, [usersRaw]);

  const { data: locations = [] } = useQuery<any[]>({
    queryKey: ["/api/locations"],
    select: (data) =>
      data.map((loc: any) => ({
        id: loc.Id || loc.id,
        name: loc.LocationName || loc.Name || loc.name,
        code: loc.LocationCode || loc.Code || loc.code,
        companyId: loc.ClientID || loc.CompanyId || loc.companyId,
        status: loc.Status || loc.status,
      })),
  });

  const { data: companiesRaw = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
  });

  // Normalize companies to handle API response with uppercase keys
  const companies = companiesRaw.map((company: any) => ({
    id: company.Id || company.id,
    name: company.Name || company.name,
    address: company.Address || company.address,
    status: company.Status,
    companyUrl: company.CompanyURL || company.companyUrl,
  }));

  const { data: levels = [] } = useQuery<any[]>({
    queryKey: ["/api/levels"],
    select: (data) =>
      data.map((level: any) => ({
        id: level.Id || level.id,
        code: level.Code || level.code,
        description: level.Description || level.description,
        companyId: level.ClientId || level.CompanyId || level.companyId,
        status: level.Status || level.status,
      })),
  });

  const { data: grades = [] } = useQuery<any[]>({
    queryKey: ["/api/grades"],
    select: (data) =>
      data.map((grade: any) => ({
        id: grade.Id || grade.id,
        code: grade.Code || grade.code,
        description: grade.Description || grade.description,
        companyId: grade.ClientId || grade.CompanyId || grade.companyId,
        status: grade.Status || grade.status,
      })),
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/departments"],
    select: (data) => {
      // Handle response wrapped in departments key
      const deptArray = (data as any)?.departments || data;
      return Array.isArray(deptArray)
        ? deptArray.map((dept: any) => ({
            id: dept.Id || dept.id,
            code: dept.Code || dept.code,
            name: dept.Name || dept.name,
            description: dept.Name || dept.Description || dept.description,
            companyId: dept.ClientId || dept.CompanyId || dept.companyId,
            status: dept.Status || dept.status,
          }))
        : [];
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      // Helper to normalize role (remove underscores)
      const normalizeRole = (role: string) =>
        role?.toLowerCase().replace(/_/g, "");

      // Transform to PascalCase and convert status to boolean
      const payload = {
        Code: userData.code,
        CompanyId: userData.companyId,
        ConfirmPassword: userData.confirmPassword,
        Department: userData.department,
        Designation: userData.designation,
        Email: userData.email,
        FirstName: userData.firstName,
        GradeId: userData.gradeId,
        LastName: userData.lastName,
        LevelId: userData.levelId,
        LocationId: userData.locationId,
        MobileNumber: userData.mobileNumber,
        Password: userData.password,
        ReportingManagerId: userData.reportingManagerId,
        Role: normalizeRole(userData.role),
        // Send roles as array (backend expects array, not string)
        Roles: Array.isArray(userData.roles)
          ? userData.roles.map(normalizeRole)
          : ["employee"],
        Status:
          userData.status === "active"
            ? true
            : userData.status === "inactive"
              ? false
              : userData.status,
      };
      await apiRequest("POST", "/api/users", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      userData,
    }: {
      id: string;
      userData: Partial<InsertUser>;
    }) => {
      // Transform to PascalCase and convert status to boolean
      const payload: any = {};
      if (userData.code !== undefined) payload.Code = userData.code;
      if (userData.companyId !== undefined)
        payload.ClientId = getClientIdFromSession();
      if (userData.confirmPassword !== undefined)
        payload.ConfirmPassword = userData.confirmPassword;
      if (userData.department !== undefined)
        payload.Department = userData.department;
      if (userData.designation !== undefined)
        payload.Designation = userData.designation;
      if (userData.email !== undefined) payload.Email = userData.email;
      if (userData.firstName !== undefined)
        payload.FirstName = userData.firstName;
      if (userData.gradeId !== undefined) payload.GradeId = userData.gradeId;
      if (userData.lastName !== undefined) payload.LastName = userData.lastName;
      if (userData.levelId !== undefined) payload.LevelId = userData.levelId;
      if (userData.locationId !== undefined)
        payload.LocationId = userData.locationId;
      if (userData.mobileNumber !== undefined)
        payload.MobileNumber = userData.mobileNumber;
      if (userData.password !== undefined) payload.Password = userData.password;
      if (userData.reportingManagerId !== undefined)
        payload.ReportingManagerId = userData.reportingManagerId;
      if (userData.role !== undefined)
        payload.Role = userData.role.toLowerCase().replace(/_/g, "");
      // Send roles as array (backend expects array, not string)
      if (userData.roles !== undefined) {
        payload.Roles = Array.isArray(userData.roles)
          ? userData.roles.map((r: string) => r.toLowerCase().replace(/_/g, ""))
          : ["employee"];
      }
      if (userData.status !== undefined) {
        payload.Status =
          userData.status === "active"
            ? true
            : userData.status === "inactive"
              ? false
              : userData.status;
      }
      await apiRequest("PUT", `/api/users/${id}`, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      const statusChanged = variables.userData.status !== undefined;
      toast({
        title: "Success",
        description: statusChanged
          ? `User status updated to ${variables.userData.status}`
          : "User updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeleteUserId(null); // Close dialog after successful deletion
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error) => {
      setDeleteUserId(null); // Close dialog even on error
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleDownloadTemplate = async () => {
    try {
      const token = getAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/api/users/bulk-upload/template`,
        {
          method: "GET",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      if (!response.ok) throw new Error("Failed to download template");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "user_bulk_upload_template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Template downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const bulkUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const base64 = e.target?.result as string;
            const fileData = base64.split(",")[1]; // Remove data:...;base64, prefix

            const result = await apiRequest("POST", "/api/users/bulk-upload", {
              fileData,
            });
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === "/api/users",
      });
      setUploadResults(data);
      setSelectedFile(null);

      if (data?.summary) {
        toast({
          title: "Bulk Upload Completed",
          description: `${
            data.summary.successful || 0
          } users created successfully, ${data.summary.failed || 0} failed`,
        });
      } else {
        toast({
          title: "Upload Completed",
          description: "Bulk upload process completed",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process bulk upload",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast({
          title: "Invalid File",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setUploadResults(null);
    }
  };

  const handleBulkUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    bulkUploadMutation.mutate(selectedFile);
  };

  const handleCloseBulkUploadModal = () => {
    setIsBulkUploadModalOpen(false);
    setSelectedFile(null);
    setUploadResults(null);
  };

  // Create a schema that handles empty passwords properly for updates
  const flexibleUserSchema = z
    .object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: z.string().email("Invalid email address"),
      code: z.string().min(1, "Employee code is required"),
      designation: z.string().optional(),
      mobileNumber: z.string().optional(),
      locationId: z.string().nullable().optional(),
      companyId: z.string().nullable().optional(),
      levelId: z.string().nullable().optional(),
      gradeId: z.string().nullable().optional(),
      reportingManagerId: z.string().nullable().optional(),
      department: z.string().nullable().optional(),
      role: z.enum([
        "super_admin",
        "admin",
        "hr_manager",
        "employee",
        "manager",
      ]),
      roles: z
        .array(
          z.enum(["super_admin", "admin", "hr_manager", "employee", "manager"]),
        )
        .optional()
        .default(["employee"]),
      status: z.enum(["active", "inactive"]).default("active"),
      password: z
        .union([
          z.string().min(8, "Password must be at least 8 characters"),
          z.literal("").transform(() => undefined),
        ])
        .optional(),
      confirmPassword: z
        .union([z.string(), z.literal("").transform(() => undefined)])
        .optional(),
    })
    .refine(
      (data) => {
        // If either password field is provided, both must be provided and match
        if (data.password || data.confirmPassword) {
          return (
            data.password &&
            data.confirmPassword &&
            data.password === data.confirmPassword
          );
        }
        return true;
      },
      {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      },
    );

  const form = useForm<InsertUser>({
    resolver: zodResolver(flexibleUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      code: "",
      designation: "",
      mobileNumber: "",
      locationId: "none",
      companyId:
        isAdmin && currentUser?.companyId ? currentUser.companyId : "none",
      levelId: "none",
      gradeId: "none",
      reportingManagerId: "none",
      role: "employee",
      roles: ["employee"],
      status: "active",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch the selected company ID for filtering dependent dropdowns
  const selectedCompanyId = form.watch("companyId");

  // Watch password fields for match validation
  const watchedPassword = form.watch("password");
  const watchedConfirmPassword = form.watch("confirmPassword");

  // Password strength criteria
  const hasMinLength = Boolean(watchedPassword && watchedPassword.length >= 8);
  const hasUppercase = Boolean(
    watchedPassword && /[A-Z]/.test(watchedPassword),
  );
  const hasLowercase = Boolean(
    watchedPassword && /[a-z]/.test(watchedPassword),
  );
  const hasNumber = Boolean(watchedPassword && /[0-9]/.test(watchedPassword));
  const hasSpecialChar = Boolean(
    watchedPassword &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(watchedPassword),
  );

  // Count how many criteria are met
  const criteriaCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  ].filter(Boolean).length;
  const isPasswordStrong = criteriaCount === 5;

  const passwordsMatch = Boolean(
    watchedPassword &&
    watchedConfirmPassword &&
    isPasswordStrong &&
    watchedPassword === watchedConfirmPassword,
  );
  const passwordsMismatch = Boolean(
    watchedPassword &&
    watchedConfirmPassword &&
    watchedConfirmPassword.length > 0 &&
    watchedPassword !== watchedConfirmPassword,
  );
  const passwordTooShort = Boolean(
    watchedPassword && watchedPassword.length > 0 && watchedPassword.length < 8,
  );

  // Filter locations, departments, levels, grades, and users based on selected company
  const filteredLocations =
    isSuperAdmin && selectedCompanyId && selectedCompanyId !== "none"
      ? locations.filter((loc: any) => loc.companyId === selectedCompanyId)
      : locations;

  const filteredDepartments =
    isSuperAdmin && selectedCompanyId && selectedCompanyId !== "none"
      ? departments.filter((dept: any) => dept.companyId === selectedCompanyId)
      : departments;

  const filteredLevels =
    isSuperAdmin && selectedCompanyId && selectedCompanyId !== "none"
      ? levels.filter((level: any) => level.companyId === selectedCompanyId)
      : levels;

  const filteredGrades =
    isSuperAdmin && selectedCompanyId && selectedCompanyId !== "none"
      ? grades.filter((grade: any) => grade.companyId === selectedCompanyId)
      : grades;

  // Filter managers by role (manager or hr_manager/hrmanager) and by company
  const filteredManagers = users.filter((user: any) => {
    // Exclude the user being edited
    if (user.id === editingUser?.id) return false;

    // Only include users with manager or hr_manager role (handle both formats)
    const normalizedRole = user.role?.toLowerCase().replace(/_/g, "") || "";
    const hasManagerRole =
      normalizedRole === "manager" || normalizedRole === "hrmanager";
    if (!hasManagerRole) return false;

    // For super_admin: filter by selected company
    if (isSuperAdmin && selectedCompanyId && selectedCompanyId !== "none") {
      return user.companyId === selectedCompanyId;
    }

    // For admin: filter by their own company
    if (isAdmin && currentUser?.companyId) {
      return user.companyId === currentUser.companyId;
    }

    return true;
  });

  // Reset dependent fields when company changes (only for super admin)
  useEffect(() => {
    if (isSuperAdmin && !editingUser) {
      form.setValue("locationId", "none");
      form.setValue("department", "none");
      form.setValue("levelId", "none");
      form.setValue("gradeId", "none");
      form.setValue("reportingManagerId", "none");
    }
  }, [selectedCompanyId, isSuperAdmin, editingUser, form]);

  // Update form companyId when currentUser loads (for admins)
  useEffect(() => {
    if (isAdmin && currentUser?.companyId && !editingUser) {
      form.setValue("companyId", currentUser.companyId);
    }
  }, [isAdmin, currentUser?.companyId, editingUser, form]);

  // Clear form data when component unmounts (navigation/refresh)
  useEffect(() => {
    return () => {
      form.reset();
    };
  }, []);

  const onSubmit = (data: InsertUser) => {
    // Convert "none" placeholder values to null
    const processedData = {
      ...data,
      locationId: data.locationId === "none" ? null : data.locationId,
      companyId: data.companyId === "none" ? null : data.companyId,
      levelId: data.levelId === "none" ? null : data.levelId,
      gradeId: data.gradeId === "none" ? null : data.gradeId,
      reportingManagerId:
        data.reportingManagerId === "none" ? null : data.reportingManagerId,
      department: data.department === "none" ? null : data.department,
    };

    // Set role field based on roles array (highest privilege role)
    const rolePriority = [
      "super_admin",
      "admin",
      "hr_manager",
      "manager",
      "employee",
    ];
    if (data.roles && data.roles.length > 0) {
      const highestRole = rolePriority.find((r) =>
        data.roles?.includes(r as any),
      );
      if (highestRole) {
        processedData.role = highestRole as any;
      }
    }

    // CRITICAL: Force admin users to only create/edit users in their own company
    if (isAdmin && currentUser?.companyId) {
      processedData.companyId = currentUser.companyId;
    } else if (isAdmin && !currentUser?.companyId) {
      toast({
        title: "Error",
        description: "Administrator must be assigned to a company first",
        variant: "destructive",
      });
      return;
    }

    if (editingUser) {
      // For updates, only include password fields if they're actually filled in
      const updateData = { ...processedData };

      // Remove password fields if they're empty (to avoid triggering password update logic)
      if (!data.password && !data.confirmPassword) {
        delete updateData.password;
        delete updateData.confirmPassword;
      }

      updateUserMutation.mutate({ id: editingUser.id, userData: updateData });
    } else {
      createUserMutation.mutate(processedData);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    // Ensure roles is always an array
    let userRoles = (user as any).roles;
    if (!userRoles) {
      userRoles = user.role ? [user.role] : ["employee"];
    } else if (typeof userRoles === "string") {
      try {
        userRoles = JSON.parse(userRoles);
      } catch {
        userRoles = userRoles
          .split(",")
          .map((r: string) => r.trim())
          .filter(Boolean);
      }
    }
    if (!Array.isArray(userRoles)) {
      userRoles = ["employee"];
    }
    // Filter out any invalid roles
    const validRoles = [
      "super_admin",
      "admin",
      "hr_manager",
      "employee",
      "manager",
    ];
    userRoles = userRoles.filter((r: string) => validRoles.includes(r));
    if (userRoles.length === 0) {
      userRoles = ["employee"];
    }

    // Validate and sanitize the role field (some users have corrupted data like "[")
    let userRole = user.role;
    if (!userRole || !validRoles.includes(userRole)) {
      // Try to get role from the roles array
      userRole = userRoles[0] || "employee";
    }

    form.reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      code: user.code || "",
      designation: user.designation || "",
      mobileNumber: user.mobileNumber || "",
      locationId: user.locationId || "none",
      // CRITICAL: Force admin to use their company when editing
      companyId:
        isAdmin && currentUser?.companyId
          ? currentUser.companyId
          : user.companyId || "none",
      levelId: user.levelId || "none",
      gradeId: user.gradeId || "none",
      reportingManagerId: user.reportingManagerId || "none",
      role: userRole as any,
      roles: userRoles,
      status: user.status || "active",
      password: "",
      confirmPassword: "",
    });
  };

  const handleDelete = (id: string) => {
    setDeleteUserId(id);
  };

  const confirmDelete = () => {
    if (deleteUserId) {
      deleteUserMutation.mutate(deleteUserId);
      // Don't close dialog here - let onSuccess/onError handle it
    }
  };

  // Enrich users with company information
  const enrichedUsers = useMemo(() => {
    return users.map((user) => {
      const company = companies.find((c: any) => c.id === user.companyId);
      return {
        ...user,
        companyName: company?.name || null,
      };
    });
  }, [users, companies]);

  const filteredUsers = useMemo(() => {
    if (!enrichedUsers || enrichedUsers.length === 0) return [];

    const searchTerm = searchQuery.trim().toLowerCase();

    return enrichedUsers.filter((user: any) => {
      // For non-super admins, only show users from their company
      if (!isSuperAdmin && currentUser?.companyId) {
        if (user.companyId !== currentUser.companyId) return false;
      }

      // Search filter - match against firstName, lastName, email, or code
      const matchesSearch =
        searchTerm === "" ||
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        (user.code && user.code.toLowerCase().includes(searchTerm));

      const matchesDepartment =
        departmentFilters.length === 0 ||
        (user.departmentName && departmentFilters.includes(user.departmentName));

      const matchesStatus =
        statusFilters.length === 0 ||
        (user.status && statusFilters.includes(user.status));

      const matchesCompany =
        companyFilters.length === 0 ||
        (user.companyId && companyFilters.includes(user.companyId));

      return (
        matchesSearch && matchesDepartment && matchesStatus && matchesCompany
      );
    });
  }, [
    enrichedUsers,
    searchQuery,
    departmentFilters,
    statusFilters,
    companyFilters,
    isSuperAdmin,
    currentUser?.companyId,
  ]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilters, statusFilters, companyFilters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, startIndex, endIndex]);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const resetForm = () => {
    setEditingUser(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      code: "",
      designation: "",
      mobileNumber: "",
      locationId: "none",
      companyId:
        isAdmin && currentUser?.companyId ? currentUser.companyId : "none",
      levelId: "none",
      gradeId: "none",
      reportingManagerId: "none",
      role: "employee",
      roles: ["employee"],
      status: "active",
      password: "",
      confirmPassword: "",
    });
  };

  return (
    <RoleGuard allowedRoles={["super_admin", "admin"]}>
      <div className="space-y-6 user-list" data-testid="employee-management">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">User Management</h1>
            <p className="text-muted-foreground">
              Manage user profiles and roles
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
              data-testid="view-mode-card"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Card
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              data-testid="view-mode-table"
            >
              <LayoutList className="h-4 w-4 mr-1" />
              Table
            </Button>
          </div>
        </div>
        {isSuperAdmin && (
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsBulkUploadModalOpen(true)}
              data-testid="bulk-upload-button"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Dialog
              open={isCreateModalOpen || !!editingUser}
              onOpenChange={(open) => {
                if (!open) {
                  setIsCreateModalOpen(false);
                  resetForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm(); // Reset form to clear any previous data
                    setIsCreateModalOpen(true);
                  }}
                  data-testid="add-user-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? "Edit User" : "Add New User"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser
                      ? "Update user information"
                      : "Create a new user profile"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit, (errors) => {
                      console.error("Form validation errors:", errors);
                      // Show first error as toast
                      const firstError = Object.values(errors)[0];
                      if (firstError?.message) {
                        toast({
                          title: "Validation Error",
                          description: String(firstError.message),
                          variant: "destructive",
                        });
                      }
                    })}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                data-testid="input-first-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                data-testid="input-last-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                autoComplete="off"
                                {...field}
                                value={field.value ?? ""}
                                data-testid="input-email"
                                onBlur={() => {
                                  form.trigger("email");
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee Code *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                data-testid="input-code"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="designation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Designation</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                data-testid="input-designation"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                data-testid="input-mobile"
                                type="tel"
                                maxLength={10}
                                placeholder="10 digit mobile number"
                                onInput={(e) => {
                                  const input = e.target as HTMLInputElement;
                                  input.value = input.value.replace(
                                    /[^0-9]/g,
                                    "",
                                  );
                                  field.onChange(input.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="companyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? "none"}
                              disabled={isAdmin}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-company">
                                  <SelectValue placeholder="Select company" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No Company</SelectItem>
                                {companies.map((company: any) => (
                                  <SelectItem
                                    key={company.id}
                                    value={company.id}
                                  >
                                    {company.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                            {isAdmin && (
                              <p className="text-xs text-muted-foreground">
                                As an Administrator, you can only create users
                                for your company
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="locationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? "none"}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-location">
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">
                                  No Location
                                </SelectItem>
                                {filteredLocations.map((location: any) => (
                                  <SelectItem
                                    key={location.id}
                                    value={location.id}
                                  >
                                    {location.name} ({location.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? "none"}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-department">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">
                                  No Department
                                </SelectItem>
                                {filteredDepartments.map((department: any) => (
                                  <SelectItem
                                    key={department.id}
                                    value={department.code}
                                  >
                                    {department.description} ({department.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="levelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Level</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? "none"}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-level">
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No Level</SelectItem>
                                {filteredLevels.map((level: any) => (
                                  <SelectItem key={level.id} value={level.id}>
                                    {level.description} ({level.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gradeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grade</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? "none"}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-grade">
                                  <SelectValue placeholder="Select grade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No Grade</SelectItem>
                                {filteredGrades.map((grade: any) => (
                                  <SelectItem key={grade.id} value={grade.id}>
                                    {grade.description} ({grade.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="reportingManagerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reporting Manager</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? "none"}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-manager">
                                  <SelectValue placeholder="Select reporting manager" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No Manager</SelectItem>
                                {filteredManagers.map((user: any) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} (
                                    {user.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? "active"}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-status">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">
                                  Inactive
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="roles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Roles</FormLabel>
                            <div
                              className="space-y-2"
                              data-testid="select-roles"
                            >
                              {[
                                { value: "employee", label: "Employee" },
                                { value: "manager", label: "Manager" },
                                { value: "hr_manager", label: "HR Manager" },
                                { value: "admin", label: "Administrator" },
                                {
                                  value: "super_admin",
                                  label: "Super Administrator",
                                },
                              ]
                                .filter(
                                  (role) =>
                                    role.value !== "super_admin" ||
                                    isSuperAdmin,
                                )
                                .map((role) => (
                                  <div
                                    key={role.value}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={role.value}
                                      checked={field.value?.includes(
                                        role.value as
                                          | "super_admin"
                                          | "admin"
                                          | "hr_manager"
                                          | "employee"
                                          | "manager",
                                      )}
                                      onCheckedChange={(checked) => {
                                        const currentRoles = field.value || [];
                                        if (checked) {
                                          field.onChange([
                                            ...currentRoles,
                                            role.value,
                                          ]);
                                        } else {
                                          field.onChange(
                                            currentRoles.filter(
                                              (r: string) => r !== role.value,
                                            ),
                                          );
                                        }
                                      }}
                                      data-testid={`checkbox-role-${role.value}`}
                                    />
                                    <label
                                      htmlFor={role.value}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {role.label}
                                    </label>
                                  </div>
                                ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Password fields - Super Admin or Creator */}
                    {(isSuperAdmin || isAdmin) && (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Key className="h-4 w-4" />
                          <h3 className="text-lg font-medium">
                            {editingUser ? "Change Password" : "Set Password"}
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type={showPassword ? "text" : "password"}
                                      autoComplete="new-password"
                                      placeholder="Enter new password"
                                      {...field}
                                      value={field.value || ""}
                                      data-testid="input-password"
                                      className="pr-10"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() =>
                                        setShowPassword(!showPassword)
                                      }
                                      tabIndex={-1}
                                    >
                                      {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type={
                                        showConfirmPassword
                                          ? "text"
                                          : "password"
                                      }
                                      autoComplete="new-password"
                                      placeholder="Confirm new password"
                                      {...field}
                                      value={field.value || ""}
                                      data-testid="input-confirm-password"
                                      className={cn(
                                        "pr-14 transition-all duration-300",
                                        passwordsMatch &&
                                          "border-green-500 ring-1 ring-green-500",
                                        passwordsMismatch &&
                                          "border-red-500 ring-1 ring-red-500",
                                      )}
                                    />
                                    <div className="absolute right-0 top-0 h-full flex items-center pr-3">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() =>
                                          setShowConfirmPassword(
                                            !showConfirmPassword,
                                          )
                                        }
                                        tabIndex={-1}
                                      >
                                        {showConfirmPassword ? (
                                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Advanced Password Strength & Match Animation */}
                        {(watchedPassword || watchedConfirmPassword) && (
                          <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border">
                            {/* Password Strength Indicator */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  Password Strength
                                </span>
                                <span
                                  className={cn(
                                    "text-xs font-bold transition-all duration-300",
                                    criteriaCount === 0 &&
                                      "text-muted-foreground",
                                    criteriaCount >= 1 &&
                                      criteriaCount <= 2 &&
                                      "text-red-500",
                                    criteriaCount >= 3 &&
                                      criteriaCount <= 4 &&
                                      "text-amber-500",
                                    criteriaCount === 5 && "text-green-500",
                                  )}
                                >
                                  {criteriaCount === 0 && "Enter password"}
                                  {criteriaCount >= 1 &&
                                    criteriaCount <= 2 &&
                                    "Weak"}
                                  {criteriaCount >= 3 &&
                                    criteriaCount <= 4 &&
                                    "Good"}
                                  {criteriaCount === 5 && "Strong"}
                                </span>
                              </div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500 ease-out",
                                    criteriaCount === 0 && "w-0 bg-slate-300",
                                    criteriaCount >= 1 &&
                                      criteriaCount <= 2 &&
                                      "bg-gradient-to-r from-red-400 to-red-500",
                                    criteriaCount >= 3 &&
                                      criteriaCount <= 4 &&
                                      "bg-gradient-to-r from-amber-400 to-amber-500",
                                    criteriaCount === 5 &&
                                      "bg-gradient-to-r from-green-400 to-green-500",
                                  )}
                                  style={{
                                    width: `${(criteriaCount / 5) * 100}%`,
                                  }}
                                />
                              </div>

                              {/* Password Criteria Checklist */}
                              <div className="grid grid-cols-2 gap-2 mt-3">
                                {[
                                  {
                                    met: hasMinLength,
                                    label: "Min 8 characters",
                                  },
                                  {
                                    met: hasUppercase,
                                    label: "One uppercase (A-Z)",
                                  },
                                  {
                                    met: hasLowercase,
                                    label: "One lowercase (a-z)",
                                  },
                                  {
                                    met: hasNumber,
                                    label: "One number (0-9)",
                                  },
                                  {
                                    met: hasSpecialChar,
                                    label: "One special (!@#$...)",
                                  },
                                ].map((criteria, index) => (
                                  <div
                                    key={index}
                                    className={cn(
                                      "flex items-center gap-2 text-xs transition-all duration-300",
                                      criteria.met
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 transform",
                                        criteria.met
                                          ? "bg-green-500 scale-100"
                                          : "bg-slate-200 dark:bg-slate-700 scale-90",
                                      )}
                                    >
                                      {criteria.met ? (
                                        <Check className="h-3 w-3 text-white" />
                                      ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                      )}
                                    </div>
                                    <span
                                      className={cn(
                                        "transition-all duration-300",
                                        criteria.met && "font-medium",
                                      )}
                                    >
                                      {criteria.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Password Match Indicator */}
                            <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                              <div
                                className={cn(
                                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ease-out transform",
                                  !watchedConfirmPassword &&
                                    "bg-slate-200 dark:bg-slate-700 scale-90",
                                  passwordsMismatch &&
                                    "bg-gradient-to-br from-red-400 to-red-600 scale-100 shadow-lg shadow-red-500/30",
                                  passwordsMatch &&
                                    "bg-gradient-to-br from-green-400 to-green-600 scale-110 shadow-lg shadow-green-500/40",
                                )}
                              >
                                {!watchedConfirmPassword && (
                                  <Key className="h-5 w-5 text-slate-400" />
                                )}
                                {passwordsMismatch && (
                                  <XCircle className="h-5 w-5 text-white animate-pulse" />
                                )}
                                {passwordsMatch && (
                                  <CheckCircle
                                    className="h-5 w-5 text-white"
                                    style={{
                                      animation: "bounce 0.5s ease-out",
                                    }}
                                  />
                                )}
                              </div>

                              <div className="flex-1">
                                <div
                                  className={cn(
                                    "text-sm font-semibold transition-all duration-300",
                                    !watchedConfirmPassword &&
                                      "text-muted-foreground",
                                    passwordsMismatch &&
                                      "text-red-600 dark:text-red-400",
                                    passwordsMatch &&
                                      "text-green-600 dark:text-green-400",
                                  )}
                                >
                                  {!watchedConfirmPassword &&
                                    "Enter confirm password"}
                                  {passwordsMismatch &&
                                    "Passwords do not match"}
                                  {passwordsMatch && "Perfect! Passwords match"}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {!watchedConfirmPassword &&
                                    "Type same password again to confirm"}
                                  {passwordsMismatch &&
                                    "Please make sure both passwords are identical"}
                                  {passwordsMatch &&
                                    "Your password is set and ready to go!"}
                                </div>
                              </div>
                            </div>

                            {/* Animated success bar */}
                            <div className="mt-3 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-700 ease-out",
                                  !watchedConfirmPassword && "w-0",
                                  passwordsMismatch &&
                                    "bg-gradient-to-r from-red-400 via-red-500 to-red-400 w-1/2",
                                  passwordsMatch &&
                                    "bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 w-full",
                                )}
                                style={
                                  passwordsMatch
                                    ? {
                                        backgroundSize: "200% 100%",
                                        animation:
                                          "shimmer 1.5s linear infinite",
                                      }
                                    : {}
                                }
                              />
                            </div>
                          </div>
                        )}

                        <p className="text-sm text-muted-foreground mt-2">
                          {editingUser
                            ? "Leave password fields empty if you don't want to change the password."
                            : "Set a password for the new user account."}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          resetForm();
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={
                          createUserMutation.isPending ||
                          updateUserMutation.isPending
                        }
                        data-testid="submit-user"
                      >
                        {editingUser ? "Update User" : "Create User"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Bulk Upload Modal */}
        <Dialog
          open={isBulkUploadModalOpen}
          onOpenChange={handleCloseBulkUploadModal}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk Upload Users</DialogTitle>
              <DialogDescription>
                Upload an Excel file to create multiple users at once
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Download Template Section */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Download Sample Template
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start by downloading the sample template with the required
                      format
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    data-testid="download-template-button"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="border-2 border-dashed rounded-lg p-6">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">Upload Excel File</p>
                    <p className="text-sm text-muted-foreground">
                      Select the filled template to upload
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="mt-2"
                    data-testid="file-input"
                  />
                  {selectedFile && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Upload Results */}
              {uploadResults && uploadResults.summary && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Upload Results</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {uploadResults.summary.total}
                      </p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {uploadResults.summary.successful}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Successful
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {uploadResults.summary.failed}
                      </p>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                  </div>

                  {/* Success List */}
                  {uploadResults.results?.success?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Successfully Created (
                        {uploadResults.results.success.length})
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {uploadResults.results.success.map(
                          (item: any, index: number) => (
                            <div
                              key={index}
                              className="text-sm bg-green-50 p-2 rounded"
                            >
                              Row {item.row}: {item.name} ({item.email})
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error List */}
                  {uploadResults.results?.errors?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Errors ({uploadResults.results.errors.length})
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {uploadResults.results.errors.map(
                          (item: any, index: number) => (
                            <div
                              key={index}
                              className="text-sm bg-red-50 p-2 rounded"
                            >
                              Row {item.row}: {item.error}{" "}
                              {item.email && `(${item.email})`}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseBulkUploadModal}
                  className="flex-1"
                  data-testid="cancel-bulk-upload"
                >
                  {uploadResults ? "Close" : "Cancel"}
                </Button>
                {!uploadResults && (
                  <Button
                    onClick={handleBulkUpload}
                    disabled={!selectedFile || bulkUploadMutation.isPending}
                    className="flex-1"
                    data-testid="submit-bulk-upload"
                  >
                    {bulkUploadMutation.isPending
                      ? "Uploading..."
                      : "Upload Users"}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8"
                  data-testid="search-employees"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              <MultiSelect
                options={Array.from(
                  new Set(
                    users
                      .map((user: any) => user.departmentName)
                      .filter(Boolean)
                  )
                ).map((deptName: string) => ({
                  value: deptName,
                  label: deptName,
                }))}
                selected={departmentFilters}
                onChange={setDepartmentFilters}
                placeholder="All Departments"
                label="departments"
              />

              <MultiSelect
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                selected={statusFilters}
                onChange={setStatusFilters}
                placeholder="All Status"
                label="status"
              />

              {isSuperAdmin && (
                <MultiSelect
                  options={companies.map((company: any) => ({
                    value: company.id,
                    label: company.name,
                  }))}
                  selected={companyFilters}
                  onChange={setCompanyFilters}
                  placeholder="All Companies"
                  label="companies"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <CardDescription>
              {filteredUsers.length} employee
              {filteredUsers.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent
            key={`content-${searchQuery}-${departmentFilters.join(",")}-${statusFilters.join(",")}-${companyFilters.join(",")}`}
          >
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 animate-pulse"
                  >
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No employees found</p>
              </div>
            ) : viewMode === "card" ? (
              <div
                className="space-y-2"
                key={`card-list-${filteredUsers.length}`}
              >
                {paginatedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/20 transition-colors"
                    data-testid={`user-row-${user.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium text-xs">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p
                            className="font-medium text-sm"
                            data-testid={`user-name-${user.id}`}
                          >
                            {user.firstName} {user.lastName}
                          </p>
                          {isSuperAdmin && (user as any).companyName && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
                            >
                              {(user as any).companyName}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {user.email} • {user.designation}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          user.status === "active" ? "default" : "secondary"
                        }
                      >
                        {user.status}
                      </Badge>
                      {/* <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          data-testid={`edit-user-${user.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          data-testid={`delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div> */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table key={`table-list-${filteredUsers.length}`}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Manager</TableHead>
                    {isSuperAdmin && <TableHead>Company</TableHead>}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      data-testid={`user-table-row-${user.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground font-medium text-sm">
                              {user.firstName?.[0]}
                              {user.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p
                              className="font-medium"
                              data-testid={`user-name-${user.id}`}
                            >
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.code}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.designation}</TableCell>
                      <TableCell>
                        {(user as any).managerFirstName ||
                        (user as any).managerLastName
                          ? `${(user as any).managerFirstName || ""} ${(user as any).managerLastName || ""}`.trim()
                          : "-"}
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell>
                          {(user as any).companyName && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
                            >
                              {(user as any).companyName}
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge
                          variant={
                            user.status === "active" ? "default" : "secondary"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination Controls */}
            {filteredUsers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t mt-4">
                {/* Rows per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Rows per page:
                  </span>
                  <Select
                    value={String(rowsPerPage)}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Page info */}
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredUsers.length)} of{" "}
                  {filteredUsers.length} entries
                </div>

                {/* Page navigation */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {getPageNumbers().map((page, index) =>
                    typeof page === "number" ? (
                      <Button
                        key={index}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Button>
                    ) : (
                      <span key={index} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    ),
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleGuard>
  );
}
