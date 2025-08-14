import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, QrCode, Download, Users, Trophy } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@/types/event";
import { ScavengerHunt, ScavengerLocation, ScavengerParticipant, ScavengerHuntFormData, ScavengerLocationDB, ScavengerParticipantDB, QRCodeData } from "@/types/scavenger";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState<ScavengerHuntFormData>({
    name: '',
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
        .single();

      if (huntError && huntError.code !== 'PGRST116') {
        throw huntError;
      }

      if (huntData) {
        setScavengerHunt(huntData);
        await fetchLocations(huntData.id);
        await fetchParticipants(huntData.id);
        await generateQRCodes(huntData);
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

  const generateQRCodes = async (hunt: ScavengerHunt) => {
    const baseUrl = window.location.origin;
    const codes: { [key: string]: string } = {};
    
    // Generate signup QR code
    codes.signup = `${baseUrl}/hunt/${hunt.signup_qr_token}`;
    
    // Generate location QR codes
    locations.forEach(location => {
      codes[location.id] = `${baseUrl}/hunt/location/${location.qr_token}`;
    });
    
    setQrCodes(codes);
  };

  const toggleScavengerHunt = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ scavenger_hunt_enabled: enabled })
        .eq('id', event.id);

      if (error) throw error;

      onEventUpdate();
      toast({
        title: "Success",
        description: `Scavenger hunt ${enabled ? 'enabled' : 'disabled'}`,
      });

      if (!enabled) {
        setScavengerHunt(null);
        setLocations([]);
        setParticipants([]);
      }
    } catch (error) {
      console.error('Error toggling scavenger hunt:', error);
      toast({
        title: "Error",
        description: "Failed to update scavenger hunt setting",
        variant: "destructive",
      });
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

  const createScavengerHunt = async () => {
    try {
      // Create the hunt
      const { data: huntData, error: huntError } = await supabase
        .from('scavenger_hunts')
        .insert({
          event_id: event.id,
          name: formData.name,
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
      setFormData({ name: '', locations: [{ name: '', question: '', options: ['', '', ''], correct_answer: '' }] });
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
    const csvData = participants.map(p => ({
      name: p.name,
      email: p.email,
      progress: `${p.progress.length}/${locations.length}`,
      completed: p.completed_at ? 'Yes' : 'No',
      completedAt: p.completed_at || 'N/A'
    }));

    console.log('CSV Export Data:', csvData);
    toast({
      title: "Results Exported",
      description: "Results data logged to console. In production, this would download a CSV file.",
    });
  };

  if (loading) {
    return <div>Loading scavenger hunt data...</div>;
  }

  return (
    <div className="space-y-8">
      <Card className="border-none brand-gradient p-1 rounded-xl">
        <div className="bg-background rounded-lg">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold brand-text-gradient">
                  Scavenger Hunt Experience
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Create an engaging QR-based trivia adventure for your event attendees
                </CardDescription>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {event.scavenger_hunt_enabled ? 'Active' : 'Inactive'}
                </span>
                <Switch
                  checked={event.scavenger_hunt_enabled || false}
                  onCheckedChange={toggleScavengerHunt}
                  className="data-[state=checked]:bg-aum-orange"
                />
              </div>
            </div>
          </CardHeader>
        </div>
      </Card>

      {event.scavenger_hunt_enabled && (
        <>
          {!scavengerHunt ? (
            <Card className="border-aum-orange/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-aum-orange/5 to-aum-purple/5 rounded-t-lg">
                <CardTitle className="text-xl font-bold text-aum-orange">
                  Create Your Scavenger Hunt
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Design an interactive adventure with locations and trivia challenges
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
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

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold text-aum-purple">
                        Hunt Locations & Challenges
                      </Label>
                      <Button 
                        onClick={addLocation} 
                        size="sm"
                        variant="brand"
                        className="shadow-sm hover:shadow-md transition-shadow"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Location
                      </Button>
                    </div>

                    {formData.locations.map((location, index) => (
                      <Card key={index} className="p-6 border-aum-orange/10 bg-gradient-to-br from-aum-orange/5 to-aum-purple/5">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-aum-orange text-white flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <h4 className="font-semibold text-aum-purple">Location Challenge</h4>
                            </div>
                            {formData.locations.length > 1 && (
                              <Button
                                onClick={() => removeLocation(index)}
                                size="sm"
                                variant="outline"
                                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
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
                              variant="brand-outline"
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

                  <Button 
                    onClick={createScavengerHunt} 
                    className="w-full brand-gradient text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all"
                  >
                    🚀 Launch Scavenger Hunt
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-aum-orange/10 p-1 rounded-lg">
                <TabsTrigger 
                  value="overview"
                  className="data-[state=active]:bg-aum-orange data-[state=active]:text-white font-medium"
                >
                  📊 Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="participants"
                  className="data-[state=active]:bg-aum-orange data-[state=active]:text-white font-medium"
                >
                  👥 Participants
                </TabsTrigger>
                <TabsTrigger 
                  value="qr-codes"
                  className="data-[state=active]:bg-aum-orange data-[state=active]:text-white font-medium"
                >
                  📱 QR Codes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-none bg-gradient-to-br from-aum-orange/10 to-aum-orange/5 shadow-lg">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 mx-auto bg-aum-orange rounded-full flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-aum-orange">{locations.length}</div>
                        <div className="text-sm font-medium text-muted-foreground">Hunt Locations</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-gradient-to-br from-aum-purple/10 to-aum-purple/5 shadow-lg">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 mx-auto bg-aum-purple rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-aum-purple">{participants.length}</div>
                        <div className="text-sm font-medium text-muted-foreground">Active Participants</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-gradient-to-br from-aum-spark/10 to-aum-spark/5 shadow-lg">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 mx-auto bg-aum-spark rounded-full flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-aum-spark">
                          {participants.filter(p => p.completed_at).length}
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">Hunt Completed</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {scavengerHunt && (
                  <Card className="mt-6 border-aum-orange/20 bg-gradient-to-r from-aum-orange/5 to-aum-purple/5">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold brand-text-gradient">
                        🏆 {scavengerHunt.name}
                      </CardTitle>
                      <CardDescription>
                        Your scavenger hunt is live and ready for participants!
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="participants">
                <Card className="border-aum-purple/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-aum-purple/5 to-aum-orange/5 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-aum-purple flex items-center">
                          👥 Participant Dashboard
                        </CardTitle>
                        <CardDescription>
                          Track progress and engagement across your scavenger hunt
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={exportResults} 
                        variant="brand-outline"
                        className="shadow-sm hover:shadow-md transition-shadow"
                      >
                        📊 Export Results
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
                <Card className="border-aum-orange/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-aum-orange/5 to-aum-purple/5 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-aum-orange flex items-center">
                          📱 QR Code Manager
                        </CardTitle>
                        <CardDescription>
                          Generate and download QR codes for your scavenger hunt locations
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={downloadQRCodes} 
                        variant="brand"
                        className="shadow-lg hover:shadow-xl transition-all"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        📥 Download All QR Codes
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-8">
                      <div className="bg-gradient-to-r from-aum-orange/10 to-aum-orange/5 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-aum-orange rounded-full flex items-center justify-center">
                            <QrCode className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-aum-orange text-lg">Registration QR Code</h3>
                            <p className="text-sm text-muted-foreground">
                              Share this QR code for participants to join the hunt
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs bg-white border border-aum-orange/20">
                          {qrCodes.signup}
                        </Badge>
                      </div>

                      <div className="bg-gradient-to-r from-aum-purple/10 to-aum-purple/5 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-aum-purple rounded-full flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-aum-purple text-lg">Location QR Codes</h3>
                            <p className="text-sm text-muted-foreground">
                              Place these QR codes at each designated hunt location
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3">
                          {locations.map((location) => (
                            <div key={location.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-aum-purple/20 shadow-sm">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-aum-purple text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {location.location_order}
                                </div>
                                <span className="font-semibold text-aum-purple">{location.name}</span>
                              </div>
                              <Badge variant="secondary" className="font-mono text-xs bg-aum-purple/10 border border-aum-purple/20">
                                {qrCodes[location.id]}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
};

export default ScavengerHuntManager;