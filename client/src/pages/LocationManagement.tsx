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
import {
  insertLocationSchema,
  type Location,
  type InsertLocation,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getClientIdFromSession } from "@/lib/ssoAuth";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Check,
  ChevronDown,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewModeToggle } from "@/components/ViewModeToggle";
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

export default function LocationManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const currentUserRole =
    (currentUser as any)?.role || (currentUser as any)?.Role || "";
  const isSuperAdmin = currentUserRole === "super_admin";

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
    select: (data: any[]) => {
      return data.map((company: any) => ({
        id: String(company.Id || company.id),
        name: company.Name || company.name,
      }));
    },
  });

  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
    select: (data: any[]) => {
      return data.map((location: any) => {
        // Parse AddressDetails JSON string
        let addressDetails: any = {};
        try {
          if (location.AddressDetails) {
            addressDetails = JSON.parse(location.AddressDetails);
          }
        } catch (e) {
          console.error("Failed to parse AddressDetails:", e);
        }

        return {
          id: location.Id,
          code: location.LocationCode,
          name: location.LocationName,
          state: addressDetails.StateName || location.State || "",
          country: addressDetails.CountryName || location.Country || "",
          city: addressDetails.City || "",
          address: addressDetails.Address1 || "",
          pincode: addressDetails.PinCode || "",
          gstNumber: location.GSTNumber || "",
          companyId: location.ClientID, // API uses ClientID
          status: location.Status === 1 ? "active" : "inactive", // API uses 1/0
          createdOn: location.CreatedOn,
          createdBy: location.CreatedBy,
          lastUpdatedOn: location.LastUpdatedOn,
          lastUpdatedBy: location.LastUpdatedBy,
        };
      });
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async (locationData: InsertLocation) => {
      // Transform to PascalCase and convert status to boolean
      const payload = {
        LocationCode: locationData.code,
        LocationName: locationData.name,
        GSTNumber: (locationData as any).gstNumber || null,
        Address: (locationData as any).address || null,
        ClientId: getClientIdFromSession(),
        Country: locationData.country,
        State: locationData.state,
        City: (locationData as any).city,
        PinCode: (locationData as any).pincode,
      };
      await apiRequest("POST", "/api/locations", payload);
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
    mutationFn: async ({
      id,
      locationData,
    }: {
      id: string;
      locationData: Partial<InsertLocation>;
    }) => {
      // Transform to PascalCase and convert status to boolean
      const payload: any = {};
      if (locationData.code !== undefined)
        payload.LocationCode = locationData.code;
      if (locationData.name !== undefined)
        payload.LocationName = locationData.name;
      if ((locationData as any).gstNumber !== undefined)
        payload.GSTNumber = (locationData as any).gstNumber || null;
      if (
        (locationData as any).address !== undefined ||
        locationData.country !== undefined ||
        locationData.state !== undefined ||
        (locationData as any).city !== undefined ||
        (locationData as any).pincode !== undefined
      ) {
        payload.AddressDetails = (locationData as any).address
          ? JSON.stringify({
              Address1: (locationData as any).address,
              CountryName: locationData.country,
              StateName: locationData.state,
              City: (locationData as any).city,
              PinCode: (locationData as any).pincode,
            })
          : null;
      }
      if (locationData.companyId !== undefined)
        payload.ClientId = getClientIdFromSession();
      if (locationData.status !== undefined) {
        payload.Status =
          locationData.status === "active"
            ? true
            : locationData.status === "inactive"
              ? false
              : locationData.status;
      }
      await apiRequest("PUT", `/api/locations/${id}`, payload);
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
        description: "Location marked as inactive",
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
      locationType: null,
      gstNumber: "",
      address: "",
      country: "",
      state: "",
      city: "",
      pincode: "",
      isBillingAddress: false,
      isShippingAddress: false,
      isPrimaryLocation: false,
      companyId: currentUser?.companyId ? String(currentUser.companyId) : null,
      status: "active",
    },
  });

  const onSubmit = (data: InsertLocation) => {
    if (editingLocation) {
      updateLocationMutation.mutate({
        id: editingLocation.id,
        locationData: data,
      });
    } else {
      createLocationMutation.mutate(data);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    form.reset({
      code: location.code,
      name: location.name,
      locationType: (location as any).locationType || null,
      gstNumber: (location as any).gstNumber || "",
      address: (location as any).address || "",
      country: location.country || "",
      state: location.state || "",
      city: (location as any).city || "",
      pincode: (location as any).pincode || "",
      isBillingAddress: false,
      isShippingAddress: false,
      isPrimaryLocation: false,
      companyId: location.companyId
        ? String(location.companyId)
        : currentUser?.companyId
          ? String(currentUser.companyId)
          : null,
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
      locationType: null,
      gstNumber: "",
      address: "",
      country: "",
      state: "",
      city: "",
      pincode: "",
      isBillingAddress: false,
      isShippingAddress: false,
      isPrimaryLocation: false,
      companyId: currentUser?.companyId ? String(currentUser.companyId) : null,
      status: "active",
    });
  };

  const filteredLocations = locations.filter((location) => {
    const matchesSearch =
      searchQuery === "" ||
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.country?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilters.length === 0 ||
      (location.status && statusFilters.includes(location.status));

    return matchesSearch && matchesStatus;
  });

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div
        className="space-y-6 location-list"
        data-testid="location-management"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Location Management</h1>
            <p className="text-muted-foreground">
              Manage office locations and branches
            </p>
          </div>
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        <Dialog
          open={isCreateModalOpen || !!editingLocation}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateModalOpen(false);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? "Edit Location" : "Add New Location"}
              </DialogTitle>
              <DialogDescription>
                {editingLocation
                  ? "Update location information"
                  : "Create a new office location"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Code *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Location Code"
                            data-testid="input-location-code"
                          />
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
                        <FormLabel>Location Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Location Name"
                            data-testid="input-location-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="GST Number"
                          data-testid="input-gst-number"
                        />
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
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Enter address"
                          rows={2}
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder="---Select---" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="India">India</SelectItem>
                            <SelectItem value="United States">
                              United States
                            </SelectItem>
                            <SelectItem value="United Kingdom">
                              United Kingdom
                            </SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                            <SelectItem value="Australia">Australia</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-state">
                              <SelectValue placeholder="---Select---" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Gujarat">Gujarat</SelectItem>
                            <SelectItem value="Maharashtra">
                              Maharashtra
                            </SelectItem>
                            <SelectItem value="Karnataka">Karnataka</SelectItem>
                            <SelectItem value="Tamil Nadu">
                              Tamil Nadu
                            </SelectItem>
                            <SelectItem value="Delhi">Delhi</SelectItem>
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
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-city">
                              <SelectValue placeholder="---Select---" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Ahmedabad">Ahmedabad</SelectItem>
                            <SelectItem value="Mumbai">Mumbai</SelectItem>
                            <SelectItem value="Bangalore">Bangalore</SelectItem>
                            <SelectItem value="Chennai">Chennai</SelectItem>
                            <SelectItem value="Delhi">Delhi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Pin Code"
                            data-testid="input-pincode"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                      createLocationMutation.isPending ||
                      updateLocationMutation.isPending
                    }
                    data-testid="submit-location"
                  >
                    {editingLocation ? "Update Location" : "Create Location"}
                  </Button>
                </div>
              </form>
            </Form>
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
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8"
                  data-testid="search-locations"
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
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                selected={statusFilters}
                onChange={setStatusFilters}
                placeholder="All Status"
                label="status"
              />
            </div>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
            <CardDescription>
              {filteredLocations.length} location
              {filteredLocations.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
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
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No locations found</p>
              </div>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLocations.map((location) => (
                  <Card
                    key={location.id}
                    className="hover:shadow-md transition-shadow"
                    data-testid={`location-card-${location.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3
                              className="font-semibold truncate"
                              data-testid={`location-name-${location.id}`}
                            >
                              {location.name}
                            </h3>
                            <Badge
                              variant={
                                location.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="flex-shrink-0"
                            >
                              {location.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {location.code}
                          </p>
                        </div>
                      </div>
                      {/* <div className="space-y-1 text-sm text-muted-foreground">
                        {location.state && (
                          <p className="truncate">{location.state}</p>
                        )}
                        {location.country && (
                          <p className="truncate">{location.country}</p>
                        )}
                      </div> */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location) => (
                    <TableRow
                      key={location.id}
                      data-testid={`location-table-row-${location.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-primary-foreground" />
                          </div>
                          <div>
                            <p
                              className="font-medium"
                              data-testid={`location-name-${location.id}`}
                            >
                              {location.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{location.code}</TableCell>
                      <TableCell>{location.state || "-"}</TableCell>
                      <TableCell>{location.country || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            location.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {location.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
