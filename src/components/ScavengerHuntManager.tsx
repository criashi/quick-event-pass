import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, QrCode, Download, Users, Trophy, MapPin, Edit, AlertTriangle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@/types/event";
import { ScavengerHunt, ScavengerLocation, ScavengerParticipant, ScavengerHuntFormData, ScavengerLocationDB, ScavengerParticipantDB, QRCodeData } from "@/types/scavenger";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import QRCodeLib from "qrcode";
import JSZip from "jszip";

interface ScavengerHuntManagerProps {
  event: Event;
  onEventUpdate: () => void;
}

const ScavengerHuntManager: React.FC<ScavengerHuntManagerProps> = ({ event, onEventUpdate }) => {
  const [scavengerHunt, setScavengerHunt] = useState<ScavengerHunt | null>(null);
  const [locations, setLocations] = useState<ScavengerLocation[]>([]);
  const [participants, setParticipants] = useState<ScavengerParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState<ScavengerHuntFormData>({
    name: '',
    congratulations_message: "You've successfully completed the scavenger hunt! Your name will be entered into a drawing for an AUMOVIO cooler bag and you will be contacted by MarComm if you're one of the ten lucky winners!",
    locations: [{ name: '', question: '', options: ['', '', ''], correct_answer: '' }]
  });

  useEffect(() => {
    if (event.scavenger_hunt_enabled) {
      fetchScavengerHunt();
    }
  }, [event.id, event.scavenger_hunt_enabled]);

  const fetchScavengerHunt = async () => {
    try {
      const { data: huntData, error: huntError } = await supabase
        .from('scavenger_hunts')
        .select('*')
        .eq('event_id', event.id)
        .eq('is_active', true)
        .maybeSingle();

      if (huntError) {
        throw huntError;
      }

      if (huntData) {
        setScavengerHunt(huntData);
        const locationsData = await fetchLocations(huntData.id);
        await fetchParticipants(huntData.id);
        await generateQRCodes(huntData, locationsData);
      }
    } catch (error) {
      console.error('Error fetching scavenger hunt:', error);
      toast({
        title: "Error",
        description: "Failed to load scavenger hunt data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (huntId: string) => {
    const { data, error } = await supabase
      .from('scavenger_locations')
      .select('*')
      .eq('scavenger_hunt_id', huntId)
      .order('location_order');

    if (error) throw error;
    
    // Convert database types to frontend types
    const convertedData = (data as ScavengerLocationDB[] || []).map(location => ({
      ...location,
      options: Array.isArray(location.options) ? location.options.filter(opt => typeof opt === 'string') : []
    }));
    setLocations(convertedData);
    return convertedData;
  };

  const fetchParticipants = async (huntId: string) => {
    const { data, error } = await supabase
      .from('scavenger_participants')
      .select('*')
      .eq('scavenger_hunt_id', huntId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Convert database types to frontend types
    const convertedData = (data as ScavengerParticipantDB[] || []).map(participant => ({
      ...participant,
      progress: Array.isArray(participant.progress) ? participant.progress.filter(p => typeof p === 'string') : []
    }));
    setParticipants(convertedData);
  };

  const generateQRCodes = async (hunt: ScavengerHunt, locationsList: ScavengerLocation[] = []) => {
    const baseUrl = window.location.origin;
    const codes: { [key: string]: string } = {};
    
    try {
      // Generate signup QR code
      const signupUrl = `${baseUrl}/hunt/${hunt.signup_qr_token}`;
      codes.signup = await QRCodeLib.toDataURL(signupUrl, { width: 200, margin: 1 });
      
      // Generate location QR codes
      for (const location of locationsList) {
        const locationUrl = `${baseUrl}/hunt/location/${location.qr_token}`;
        codes[location.id] = await QRCodeLib.toDataURL(locationUrl, { width: 200, margin: 1 });
      }
      
      setQrCodes(codes);
    } catch (error) {
      console.error('Error generating QR codes:', error);
    }
  };


  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, { name: '', question: '', options: ['', '', ''], correct_answer: '' }]
    }));
  };

  const removeLocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const updateLocation = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) => 
        i === index ? { ...loc, [field]: value } : loc
      )
    }));
  };

  const loadEditForm = () => {
    if (!scavengerHunt || !locations.length) return;
    
    setFormData({
      name: scavengerHunt.name,
      congratulations_message: scavengerHunt.congratulations_message || "You've successfully completed the scavenger hunt! Your name will be entered into a drawing for an AUMOVIO cooler bag and you will be contacted by MarComm if you're one of the ten lucky winners!",
      locations: locations.map(loc => ({
        name: loc.name,
        question: loc.question,
        options: [...loc.options],
        correct_answer: loc.correct_answer
      }))
    });
    setShowEditForm(true);
  };

  const updateScavengerHunt = async () => {
    if (!scavengerHunt) return;

    try {
      // Update the hunt name
      const { error: huntError } = await supabase
        .from('scavenger_hunts')
        .update({
          name: formData.name,
          congratulations_message: formData.congratulations_message,
          total_locations: formData.locations.length
        })
        .eq('id', scavengerHunt.id);

      if (huntError) throw huntError;

      // Delete existing locations
      const { error: deleteError } = await supabase
        .from('scavenger_locations')
        .delete()
        .eq('scavenger_hunt_id', scavengerHunt.id);

      if (deleteError) throw deleteError;

      // Create new locations
      const locationsToInsert = formData.locations.map((loc, index) => ({
        scavenger_hunt_id: scavengerHunt.id,
        name: loc.name,
        question: loc.question,
        options: loc.options,
        correct_answer: loc.correct_answer,
        location_order: index + 1
      }));

      const { error: locationsError } = await supabase
        .from('scavenger_locations')
        .insert(locationsToInsert);

      if (locationsError) throw locationsError;

      toast({
        title: "Success",
        description: "Scavenger hunt updated successfully!",
      });

      setShowEditForm(false);
      await fetchScavengerHunt();
    } catch (error) {
      console.error('Error updating scavenger hunt:', error);
      toast({
        title: "Error",
        description: "Failed to update scavenger hunt",
        variant: "destructive",
      });
    }
  };

  const createScavengerHunt = async () => {
    try {
       // Create the hunt
        const { data: huntData, error: huntError } = await supabase
          .from('scavenger_hunts')
          .insert({
            event_id: event.id,
            name: formData.name,
            congratulations_message: formData.congratulations_message,
            total_locations: formData.locations.length
          })
          .select()
          .single();

      if (huntError) throw huntError;

      // Create locations
      const locationsToInsert = formData.locations.map((loc, index) => ({
        scavenger_hunt_id: huntData.id,
        name: loc.name,
        question: loc.question,
        options: loc.options,
        correct_answer: loc.correct_answer,
        location_order: index + 1
      }));

      const { error: locationsError } = await supabase
        .from('scavenger_locations')
        .insert(locationsToInsert);

      if (locationsError) throw locationsError;

      toast({
        title: "Success",
        description: "Scavenger hunt created successfully!",
      });

      setShowCreateForm(false);
      setFormData({ 
        name: '', 
        congratulations_message: "You've successfully completed the scavenger hunt! Your name will be entered into a drawing for an AUMOVIO cooler bag and you will be contacted by MarComm if you're one of the ten lucky winners!", 
        locations: [{ name: '', question: '', options: ['', '', ''], correct_answer: '' }] 
      });
      await fetchScavengerHunt();
    } catch (error) {
      console.error('Error creating scavenger hunt:', error);
      toast({
        title: "Error",
        description: "Failed to create scavenger hunt",
        variant: "destructive",
      });
    }
  };

  const resetScavengerHunt = async () => {
    if (!scavengerHunt) return;

    try {
      // Delete all participants
      const { error: participantsError } = await supabase
        .from('scavenger_participants')
        .delete()
        .eq('scavenger_hunt_id', scavengerHunt.id);

      if (participantsError) throw participantsError;

      // Delete all locations
      const { error: locationsError } = await supabase
        .from('scavenger_locations')
        .delete()
        .eq('scavenger_hunt_id', scavengerHunt.id);

      if (locationsError) throw locationsError;

      // Delete the scavenger hunt
      const { error: huntError } = await supabase
        .from('scavenger_hunts')
        .delete()
        .eq('id', scavengerHunt.id);

      if (huntError) throw huntError;

      // Update the event to disable scavenger hunt
      const { error: eventError } = await supabase
        .from('events')
        .update({ scavenger_hunt_enabled: false })
        .eq('id', event.id);

      if (eventError) throw eventError;

      toast({
        title: "Success",
        description: "Scavenger hunt has been completely reset and disabled",
      });

      setShowEditForm(false);
      setShowResetDialog(false);
      
      // Reset local state
      setScavengerHunt(null);
      setLocations([]);
      setParticipants([]);
      setQrCodes({});
      
      // Trigger event update to refresh parent component
      onEventUpdate();
    } catch (error) {
      console.error('Error resetting scavenger hunt:', error);
      toast({
        title: "Error",
        description: "Failed to reset scavenger hunt",
        variant: "destructive",
      });
    }
  };

  const downloadQRCodes = async () => {
    if (!scavengerHunt || !locations.length) {
      toast({
        title: "Error",
        description: "No scavenger hunt or locations found",
        variant: "destructive",
      });
      return;
    }

    try {
      const zip = new JSZip();
      
      // Generate signup QR code
      const signupData: QRCodeData = {
        type: 'signup',
        token: scavengerHunt.signup_qr_token,
        huntId: scavengerHunt.id
      };
      const signupUrl = `${window.location.origin}/hunt/${scavengerHunt.signup_qr_token}`;
      const signupQRCode = await QRCodeLib.toDataURL(signupUrl, { width: 300 });
      zip.file("signup-qr-code.png", signupQRCode.split(',')[1], { base64: true });

      // Generate location QR codes
      for (const location of locations) {
        const locationData: QRCodeData = {
          type: 'location',
          token: location.qr_token,
          huntId: scavengerHunt.id,
          locationId: location.id
        };
        const locationUrl = `${window.location.origin}/hunt/location/${location.qr_token}`;
        const locationQRCode = await QRCodeLib.toDataURL(locationUrl, { width: 300 });
        zip.file(`location-${location.location_order}-${location.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`, locationQRCode.split(',')[1], { base64: true });
      }

      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scavengerHunt.name.replace(/[^a-zA-Z0-9]/g, '_')}-qr-codes.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "QR codes downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading QR codes:', error);
      toast({
        title: "Error",
        description: "Failed to download QR codes",
        variant: "destructive",
      });
    }
  };

  const exportResults = () => {
    if (!participants.length) {
      toast({
        title: "No Data",
        description: "No participants to export",
        variant: "destructive",
      });
      return;
    }

    const csvHeaders = [
      'Name',
      'Email',
      'Start Time',
      'Completion Time',
      'Status',
      'Progress',
      'Locations Completed'
    ];

    const csvData = participants.map(p => [
      p.name,
      p.email,
      new Date(p.created_at).toLocaleString(),
      p.completed_at ? new Date(p.completed_at).toLocaleString() : 'Not Completed',
      p.completed_at ? 'Completed' : 'In Progress',
      `${p.progress.length}/${locations.length}`,
      p.progress.length.toString()
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scavengerHunt?.name || 'scavenger-hunt'}-participants-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Participant data exported successfully",
    });
  };

  if (loading) {
    return <div>Loading scavenger hunt data...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scavenger Hunt Management</CardTitle>
          <CardDescription>
            Manage your QR-based trivia experience. Enable/disable scavenger hunt in Event Settings.
          </CardDescription>
        </CardHeader>
      </Card>

      {event.scavenger_hunt_enabled && (
        <>
          {!scavengerHunt ? (
            <Card>
              <CardHeader>
                <CardTitle>Create Scavenger Hunt</CardTitle>
                <CardDescription>
                  Set up locations and trivia questions for your scavenger hunt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hunt-name">Hunt Name</Label>
                    <Input
                      id="hunt-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter scavenger hunt name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="congratulations-message">Congratulations Message</Label>
                    <Textarea
                      id="congratulations-message"
                      value={formData.congratulations_message}
                      onChange={(e) => setFormData(prev => ({ ...prev, congratulations_message: e.target.value }))}
                      placeholder="Enter the message participants will see when they complete the hunt"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Locations & Questions</Label>
                      <Button onClick={addLocation} size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Location
                      </Button>
                    </div>

                    {formData.locations.map((location, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Location {index + 1}</h4>
                            {formData.locations.length > 1 && (
                              <Button
                                onClick={() => removeLocation(index)}
                                size="sm"
                                variant="outline"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div>
                            <Label>Location Name</Label>
                            <Input
                              value={location.name}
                              onChange={(e) => updateLocation(index, 'name', e.target.value)}
                              placeholder="e.g., Main Lobby"
                            />
                          </div>

                          <div>
                            <Label>Trivia Question</Label>
                            <Textarea
                              value={location.question}
                              onChange={(e) => updateLocation(index, 'question', e.target.value)}
                              placeholder="Enter your trivia question"
                            />
                          </div>

                          <div>
                            <Label>Answer Options</Label>
                            {location.options.map((option, optIndex) => (
                              <Input
                                key={optIndex}
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...location.options];
                                  newOptions[optIndex] = e.target.value;
                                  updateLocation(index, 'options', newOptions);
                                }}
                                placeholder={`Option ${optIndex + 1}`}
                                className="mt-1"
                              />
                            ))}
                            <Button
                              onClick={() => updateLocation(index, 'options', [...location.options, ''])}
                              size="sm"
                              variant="outline"
                              className="mt-2"
                            >
                              Add Option
                            </Button>
                          </div>

                          <div>
                            <Label>Correct Answer</Label>
                            <Input
                              value={location.correct_answer}
                              onChange={(e) => updateLocation(index, 'correct_answer', e.target.value)}
                              placeholder="Enter the correct answer exactly as shown in options"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button onClick={createScavengerHunt} className="w-full">
                    Create Scavenger Hunt
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="participants">Participants</TabsTrigger>
                <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{scavengerHunt.name}</h3>
                      <p className="text-sm text-muted-foreground">Scavenger Hunt Details</p>
                    </div>
                    <Button onClick={loadEditForm} variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Hunt
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <MapPin className="w-8 h-8 mx-auto mb-2 text-aum-orange" />
                        <div className="text-2xl font-bold">{locations.length}</div>
                        <div className="text-sm text-muted-foreground">Locations</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Users className="w-8 h-8 mx-auto mb-2 text-aum-orange" />
                        <div className="text-2xl font-bold">{participants.length}</div>
                        <div className="text-sm text-muted-foreground">Participants</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Trophy className="w-8 h-8 mx-auto mb-2 text-aum-orange" />
                        <div className="text-2xl font-bold">
                          {participants.filter(p => p.completed_at).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                </div>
              </TabsContent>

              <TabsContent value="participants">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Participants</CardTitle>
                      <Button onClick={exportResults}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div>
                            <div className="font-medium">{participant.name}</div>
                            <div className="text-sm text-muted-foreground">{participant.email}</div>
                          </div>
                          <div className="text-right">
                            <Badge variant={participant.completed_at ? "default" : "secondary"}>
                              {participant.progress.length}/{locations.length} completed
                            </Badge>
                            {participant.completed_at && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Finished: {new Date(participant.completed_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="qr-codes">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>QR Codes</CardTitle>
                      <Button onClick={downloadQRCodes}>
                        <Download className="w-4 h-4 mr-2" />
                        Download All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <QrCode className="w-5 h-5" />
                          <span className="font-medium">Signup QR Code</span>
                        </div>
                        {qrCodes.signup ? (
                          <img 
                            src={qrCodes.signup} 
                            alt="Signup QR Code" 
                            className="mx-auto border rounded" 
                          />
                        ) : (
                          <div className="text-sm text-muted-foreground">Loading...</div>
                        )}
                      </div>

                      {locations.map((location) => (
                        <div key={location.id} className="p-4 border rounded text-center">
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <QrCode className="w-5 h-5" />
                            <span className="font-medium">{location.name}</span>
                          </div>
                          {qrCodes[location.id] ? (
                            <img 
                              src={qrCodes[location.id]} 
                              alt={`${location.name} QR Code`} 
                              className="mx-auto border rounded" 
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </>
      )}

      {/* Edit Form Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scavenger Hunt</DialogTitle>
            <DialogDescription>
              Update your scavenger hunt details, locations, and questions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-hunt-name">Hunt Name</Label>
              <Input
                id="edit-hunt-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter scavenger hunt name"
              />
            </div>

            <div>
              <Label htmlFor="edit-congratulations-message">Congratulations Message</Label>
              <Textarea
                id="edit-congratulations-message"
                value={formData.congratulations_message}
                onChange={(e) => setFormData(prev => ({ ...prev, congratulations_message: e.target.value }))}
                placeholder="Enter the message participants will see when they complete the hunt"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Locations & Questions</Label>
                <Button onClick={addLocation} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Location
                </Button>
              </div>

              {formData.locations.map((location, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Location {index + 1}</h4>
                      {formData.locations.length > 1 && (
                        <Button
                          onClick={() => removeLocation(index)}
                          size="sm"
                          variant="outline"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label>Location Name</Label>
                      <Input
                        value={location.name}
                        onChange={(e) => updateLocation(index, 'name', e.target.value)}
                        placeholder="e.g., Main Lobby"
                      />
                    </div>

                    <div>
                      <Label>Trivia Question</Label>
                      <Textarea
                        value={location.question}
                        onChange={(e) => updateLocation(index, 'question', e.target.value)}
                        placeholder="Enter your trivia question"
                      />
                    </div>

                    <div>
                      <Label>Answer Options</Label>
                      {location.options.map((option, optIndex) => (
                        <Input
                          key={optIndex}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...location.options];
                            newOptions[optIndex] = e.target.value;
                            updateLocation(index, 'options', newOptions);
                          }}
                          placeholder={`Option ${optIndex + 1}`}
                          className="mt-1"
                        />
                      ))}
                      <Button
                        onClick={() => updateLocation(index, 'options', [...location.options, ''])}
                        size="sm"
                        variant="outline"
                        className="mt-2"
                      >
                        Add Option
                      </Button>
                    </div>

                    <div>
                      <Label>Correct Answer</Label>
                      <Input
                        value={location.correct_answer}
                        onChange={(e) => updateLocation(index, 'correct_answer', e.target.value)}
                        placeholder="Enter the correct answer exactly as shown in options"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={updateScavengerHunt} className="flex-1">
                Update Scavenger Hunt
              </Button>
              <Button 
                onClick={() => setShowEditForm(false)} 
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="font-medium text-destructive">Danger Zone</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Completely reset this scavenger hunt. This will permanently delete all participants, 
                locations, and hunt data. This action cannot be undone.
              </p>
              
              <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset Scavenger Hunt
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>All {participants.length} participants and their progress</li>
                        <li>All {locations.length} locations and questions</li>
                        <li>The entire scavenger hunt setup</li>
                        <li>Disable scavenger hunt for this event</li>
                      </ul>
                      You will need to recreate everything from scratch.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={resetScavengerHunt}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, Reset Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScavengerHuntManager;