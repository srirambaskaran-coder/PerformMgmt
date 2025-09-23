import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, Users, FileText, Calendar, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SafeUser, AppraisalGroup } from "@shared/schema";

interface AppraisalGroupWithMembers extends AppraisalGroup {
  members: SafeUser[];
}

export default function InitiateAppraisal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<AppraisalGroupWithMembers | null>(null);
  const [isInitiateFormOpen, setIsInitiateFormOpen] = useState(false);
  const { toast } = useToast();

  // Fetch appraisal groups
  const { data: groups = [], isLoading } = useQuery<AppraisalGroupWithMembers[]>({
    queryKey: ['/api/appraisal-groups'],
  });

  const handleInitiateAppraisal = (group: AppraisalGroupWithMembers) => {
    setSelectedGroup(group);
    setIsInitiateFormOpen(true);
  };

  // Filter groups based on search query
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={['hr_manager']}>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Initiate Appraisal</h1>
            <p className="text-muted-foreground mt-2">
              Select an appraisal group to initiate performance evaluations
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search appraisal groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
              data-testid="search-groups"
            />
          </div>
        </div>

        {/* Appraisal Groups List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-muted-foreground">Loading appraisal groups...</div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No appraisal groups found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery ? "No groups match your search criteria." : "Create some appraisal groups first to initiate appraisals."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-xl font-semibold" data-testid={`group-name-${group.id}`}>
                          {group.name}
                        </h3>
                        <Badge variant="secondary">
                          {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                        </Badge>
                        <Badge 
                          variant={group.status === 'active' ? 'default' : 'secondary'}
                          data-testid={`group-status-${group.id}`}
                        >
                          {group.status}
                        </Badge>
                      </div>
                      
                      {group.description && (
                        <p className="text-muted-foreground mb-3" data-testid={`group-description-${group.id}`}>
                          {group.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {group.members.length} employees
                        </span>
                        <span>
                          Created {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleInitiateAppraisal(group)}
                        className="flex items-center gap-2"
                        data-testid={`initiate-btn-${group.id}`}
                      >
                        <Play className="h-4 w-4" />
                        Initiate Appraisal
                      </Button>
                    </div>
                  </div>
                  
                  {/* Member Preview */}
                  {group.members.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Group Members:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.members.slice(0, 5).map((member) => (
                          <Badge key={member.id} variant="outline" className="text-xs">
                            {member.firstName} {member.lastName}
                          </Badge>
                        ))}
                        {group.members.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{group.members.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Initiate Appraisal Form Dialog */}
        <Dialog open={isInitiateFormOpen} onOpenChange={setIsInitiateFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Initiate Appraisal
              </DialogTitle>
              <DialogDescription>
                Configure the appraisal settings for the selected group
              </DialogDescription>
            </DialogHeader>
            
            {selectedGroup && (
              <div className="space-y-6">
                {/* Read-only Group Info */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Selected Appraisal Group</h4>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-medium">{selectedGroup.name}</span>
                    <Badge variant="secondary">
                      {selectedGroup.members.length} members
                    </Badge>
                  </div>
                  {selectedGroup.description && (
                    <p className="text-muted-foreground mt-2">{selectedGroup.description}</p>
                  )}
                </div>

                {/* This will be replaced with the full form in the next step */}
                <div className="text-center py-12 text-muted-foreground">
                  Initiate Appraisal form will be implemented here...
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}