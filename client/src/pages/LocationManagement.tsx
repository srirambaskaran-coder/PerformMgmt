import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLocationSchema, type Location, type InsertLocation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Search, Edit, Trash2, MapPin } from "lucide-react";

export default function LocationManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const createLocationMutation = useMutation({
    mutationFn: async (locationData: InsertLocation) => {
      await apiRequest("POST", "/api/locations", locationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Success",
        description: "Location created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create location",
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, locationData }: { id: string; locationData: Partial<InsertLocation> }) => {
      await apiRequest("PUT", `/api/locations/${id}`, locationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setEditingLocation(null);
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Success",
        description: "Location deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertLocation>({
    resolver: zodResolver(insertLocationSchema),
    defaultValues: {
      code: "",
      name: "",
      state: "",
      country: "",
      status: "active",
    },
  });

  const onSubmit = (data: InsertLocation) => {
    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation.id, locationData: data });
    } else {
      createLocationMutation.mutate(data);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    form.reset({
      code: location.code,
      name: location.name,
      state: location.state || "",
      country: location.country || "",
      status: location.status || "active",
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this location?")) {
      deleteLocationMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingLocation(null);
    form.reset({
      code: "",
      name: "",
      state: "",
      country: "",
      status: "active",
    });
  };

  const filteredLocations = locations.filter((location) => {
    const matchesSearch = searchQuery === "" || 
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.country?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || location.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-6" data-testid="location-management">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Location Management</h1>
            <p className="text-muted-foreground">Manage office locations and branches</p>
          </div>
          <Dialog open={isCreateModalOpen || !!editingLocation} onOpenChange={(open) => {
            if (!open) {
              setIsCreateModalOpen(false);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateModalOpen(true)} data-testid="add-location-button">
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingLocation ? "Edit Location" : "Add New Location"}</DialogTitle>
                <DialogDescription>
                  {editingLocation ? "Update location information" : "Create a new office location"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="NYC01" data-testid="input-location-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="New York Office" data-testid="input-location-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="New York" data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="United States" data-testid="input-country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                      disabled={createLocationMutation.isPending || updateLocationMutation.isPending}
                      data-testid="submit-location"
                    >
                      {editingLocation ? "Update Location" : "Create Location"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

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
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-locations"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="filter-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded mb-4"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredLocations.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No locations found</p>
              <p className="text-muted-foreground text-sm">Add your first location to get started</p>
            </div>
          ) : (
            filteredLocations.map((location) => (
              <Card key={location.id} data-testid={`location-card-${location.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold" data-testid={`location-name-${location.id}`}>
                          {location.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{location.code}</p>
                        <Badge variant={location.status === 'active' ? 'default' : 'secondary'}>
                          {location.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(location)}
                        data-testid={`edit-location-${location.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(location.id)}
                        data-testid={`delete-location-${location.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {location.state && <p>{location.state}</p>}
                    {location.country && <p>{location.country}</p>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
