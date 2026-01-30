import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertCompanySchema,
  type Company,
  type InsertCompany,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { FileDropzone } from "@/components/FileDropzone";
import { Plus, Edit, Trash2, Building } from "lucide-react";

// Normalize company object from API (convert uppercase keys to lowercase)
function normalizeCompany(apiCompany: any): Company {
  return {
    id: apiCompany.Id || apiCompany.id,
    name: apiCompany.Name || apiCompany.name,
    address: apiCompany.Address || apiCompany.address,
    clientContact: apiCompany.ClientContact || apiCompany.clientContact,
    email: apiCompany.Email || apiCompany.email,
    contactNumber: apiCompany.ContactNumber || apiCompany.contactNumber,
    gstNumber: apiCompany.GSTNumber || apiCompany.gstNumber,
    logoUrl: apiCompany.LogoURL || apiCompany.logoUrl,
    status: apiCompany.Status ? "active" : "inactive",
    url: apiCompany.URL || apiCompany.url,
    companyUrl: apiCompany.CompanyURL || apiCompany.companyUrl,
    createdAt: apiCompany.CreatedOn || apiCompany.createdAt,
    updatedAt: apiCompany.LastUpdatedOn || apiCompany.updatedAt,
  };
}

export default function CompanyManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteCompanyId, setDeleteCompanyId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companiesRaw = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/companies"],
  });

  // Normalize companies to handle API response with uppercase keys
  const companies: Company[] = companiesRaw.map((company: any) =>
    normalizeCompany(company)
  );

  const createCompanyMutation = useMutation({
    mutationFn: async (companyData: InsertCompany) => {
      // Convert status to boolean for API
      const payload = {
        ...companyData,
        status:
          companyData.status === "active"
            ? true
            : companyData.status === "inactive"
            ? false
            : companyData.status,
      };
      await apiRequest("POST", "/api/companies", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Success",
        description: "Company created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async ({
      id,
      companyData,
    }: {
      id: string;
      companyData: Partial<InsertCompany>;
    }) => {
      // Convert status to boolean for API
      const payload = {
        ...companyData,
        status:
          companyData.status === "active"
            ? true
            : companyData.status === "inactive"
            ? false
            : companyData.status,
      };
      await apiRequest("PUT", `/api/companies/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setEditingCompany(null);
      toast({
        title: "Success",
        description: "Company updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertCompany>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      address: "",
      clientContact: "",
      email: "",
      contactNumber: "",
      gstNumber: "",
      logoUrl: "",
      url: "",
      companyUrl: "",
      status: "active",
    },
  });

  const onSubmit = (data: InsertCompany) => {
    if (editingCompany) {
      updateCompanyMutation.mutate({
        id: editingCompany.id,
        companyData: data,
      });
    } else {
      createCompanyMutation.mutate(data);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    form.reset({
      name: company.name,
      address: company.address || "",
      clientContact: company.clientContact || "",
      email: company.email || "",
      contactNumber: company.contactNumber || "",
      gstNumber: company.gstNumber || "",
      logoUrl: company.logoUrl || "",
      url: company.url || "",
      companyUrl: company.companyUrl || "",
      status: company.status || "active",
    });
  };

  const handleDelete = (id: string) => {
    setDeleteCompanyId(id);
  };

  const confirmDelete = () => {
    if (deleteCompanyId) {
      deleteCompanyMutation.mutate(deleteCompanyId);
      setDeleteCompanyId(null);
    }
  };

  const resetForm = () => {
    setEditingCompany(null);
    form.reset({
      name: "",
      address: "",
      clientContact: "",
      email: "",
      contactNumber: "",
      gstNumber: "",
      logoUrl: "",
      url: "",
      companyUrl: "",
      status: "active",
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      // Get presigned URL
      const response = await apiRequest("POST", "/api/objects/upload");
      const data = await response.json();
      const uploadURL = data.uploadURL;

      // Upload file directly to S3
      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // Update the logo URL in the backend
      const logoResponse = await apiRequest("PUT", "/api/company-logos", {
        logoURL: uploadURL,
      });
      const logoData = await logoResponse.json();
      form.setValue("logoUrl", logoData.objectPath);

      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <RoleGuard allowedRoles={["super_admin", "admin"]}>
      <div className="space-y-6" data-testid="company-management">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Company Management</h1>
            <p className="text-muted-foreground">
              Manage company profiles and information
            </p>
          </div>
          <Dialog
            open={isCreateModalOpen || !!editingCompany}
            onOpenChange={(open) => {
              if (!open) {
                setIsCreateModalOpen(false);
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                data-testid="add-company-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCompany ? "Edit Company" : "Add New Company"}
                </DialogTitle>
                <DialogDescription>
                  {editingCompany
                    ? "Update company information"
                    : "Create a new company profile"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-company-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            data-testid="input-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            {...field}
                            value={field.value ?? ""}
                            placeholder="https://company.example.com"
                            data-testid="input-website-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Login Slug</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="hfactor"
                            data-testid="input-company-url-slug"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Unique identifier for company login (e.g., 'hfactor'
                          for hfactor.com login)
                        </p>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="clientContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Contact</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              data-testid="input-client-contact"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              {...field}
                              value={field.value ?? ""}
                              data-testid="input-email"
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
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              maxLength={10}
                              data-testid="input-contact-number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              data-testid="input-gst-number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Logo</FormLabel>
                        <FormControl>
                          <div className="border rounded-lg p-4 space-y-4">
                            {/* Option 1: Upload File */}
                            <FileDropzone
                              maxFileSize={5242880}
                              acceptedFileTypes={[
                                "image/png",
                                "image/jpeg",
                                "image/gif",
                                "image/webp",
                                "image/svg+xml",
                              ]}
                              onFileSelect={() => {}}
                              onUpload={handleFileUpload}
                            />

                            {/* OR Divider */}
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                  Or paste URL
                                </span>
                              </div>
                            </div>

                            {/* Option 2: Paste URL */}
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="https://example.com/logo.png"
                              data-testid="input-logo-url"
                            />
                          </div>
                        </FormControl>
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
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                        createCompanyMutation.isPending ||
                        updateCompanyMutation.isPending
                      }
                      data-testid="submit-company"
                    >
                      {editingCompany ? "Update Company" : "Create Company"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted rounded mb-4"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : companies.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">
                No companies found
              </p>
              <p className="text-muted-foreground text-sm">
                Add your first company to get started
              </p>
            </div>
          ) : (
            companies.map((company) => (
              <Card key={company.id} data-testid={`company-card-${company.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt={`${company.name} logo`}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                          <Building className="h-6 w-6 text-primary-foreground" />
                        </div>
                      )}
                      <div>
                        <h3
                          className="font-semibold"
                          data-testid={`company-name-${company.id}`}
                        >
                          {company.name}
                        </h3>
                        <Badge
                          variant={
                            company.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {company.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(company)}
                        data-testid={`edit-company-${company.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(company.id)}
                        data-testid={`delete-company-${company.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {company.address && <p>{company.address}</p>}
                    {company.email && <p>{company.email}</p>}
                    {company.contactNumber && <p>{company.contactNumber}</p>}
                    {company.gstNumber && <p>GST: {company.gstNumber}</p>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteCompanyId}
        onOpenChange={(open) => !open && setDeleteCompanyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this company? This action cannot
              be undone.
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
