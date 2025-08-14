import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Trophy, MapPin, Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScavengerHunt, ScavengerLocation, ScavengerParticipant, ScavengerLocationDB, ScavengerParticipantDB } from "@/types/scavenger";

const ScavengerHuntPage: React.FC = () => {
  const { token, locationToken } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [hunt, setHunt] = useState<ScavengerHunt | null>(null);
  const [locations, setLocations] = useState<ScavengerLocation[]>([]);
  const [currentLocation, setCurrentLocation] = useState<ScavengerLocation | null>(null);
  const [participant, setParticipant] = useState<ScavengerParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [answering, setAnswering] = useState(false);

  // Registration form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Trivia state
  const [selectedAnswer, setSelectedAnswer] = useState('');

  useEffect(() => {
    if (token) {
      // Signup flow
      fetchHuntBySignupToken(token);
    } else if (locationToken) {
      // Location trivia flow
      fetchLocationByToken(locationToken);
    }
  }, [token, locationToken]);

  const fetchHuntBySignupToken = async (signupToken: string) => {
    try {
      const { data: huntData, error: huntError } = await supabase
        .from('scavenger_hunts')
        .select('*')
        .eq('signup_qr_token', signupToken)
        .eq('is_active', true)
        .single();

      if (huntError) throw huntError;

      setHunt(huntData);
      await fetchLocations(huntData.id);
    } catch (error) {
      console.error('Error fetching hunt:', error);
      toast({
        title: "Error",
        description: "Invalid or expired signup link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationByToken = async (locToken: string) => {
    try {
      const { data: locationData, error: locationError } = await supabase
        .from('scavenger_locations')
        .select(`
          *,
          scavenger_hunts (*)
        `)
        .eq('qr_token', locToken)
        .single();

      if (locationError) throw locationError;

      // Convert database types to frontend types
      const convertedLocation = {
        ...locationData,
        options: Array.isArray(locationData.options) ? locationData.options.filter(opt => typeof opt === 'string') : []
      };
      setCurrentLocation(convertedLocation);
      setHunt(locationData.scavenger_hunts);
      await fetchLocations(locationData.scavenger_hunts.id);
      
      // Check for existing participant
      const storedEmail = localStorage.getItem('scavenger_email');
      if (storedEmail) {
        await fetchParticipant(locationData.scavenger_hunts.id, storedEmail);
      } else {
        // Redirect to signup if no stored email
        navigate(`/hunt/${locationData.scavenger_hunts.signup_qr_token}`);
        return;
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      toast({
        title: "Error",
        description: "Invalid or expired location link",
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

  const fetchParticipant = async (huntId: string, email: string) => {
    const { data, error } = await supabase
      .from('scavenger_participants')
      .select('*')
      .eq('scavenger_hunt_id', huntId)
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (data) {
      // Convert database types to frontend types
      const convertedData = {
        ...data,
        progress: Array.isArray(data.progress) ? data.progress.filter(p => typeof p === 'string') : []
      };
      setParticipant(convertedData);
    }
  };

  const handleRegistration = async () => {
    if (!name.trim() || !email.trim() || !hunt) return;

    setRegistering(true);
    try {
      // Check if participant already exists
      const { data: existingParticipant, error: fetchError } = await supabase
        .from('scavenger_participants')
        .select('*')
        .eq('scavenger_hunt_id', hunt.id)
        .eq('email', email)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existingParticipant) {
        // Restore existing progress
        const convertedParticipant = {
          ...existingParticipant,
          progress: Array.isArray(existingParticipant.progress) ? existingParticipant.progress.filter(p => typeof p === 'string') : []
        };
        setParticipant(convertedParticipant);
        localStorage.setItem('scavenger_email', email);
        toast({
          title: "Welcome back!",
          description: "Your progress has been restored.",
        });
      } else {
        // Create new participant
        const { data: newParticipant, error: insertError } = await supabase
          .from('scavenger_participants')
          .insert({
            scavenger_hunt_id: hunt.id,
            name: name.trim(),
            email: email.trim(),
            progress: []
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const convertedParticipant = {
          ...newParticipant,
          progress: Array.isArray(newParticipant.progress) ? newParticipant.progress.filter(p => typeof p === 'string') : []
        };
        setParticipant(convertedParticipant);
        localStorage.setItem('scavenger_email', email);
        toast({
          title: "Registration successful!",
          description: "You can now start the scavenger hunt.",
        });
      }
    } catch (error) {
      console.error('Error registering participant:', error);
      toast({
        title: "Error",
        description: "Failed to register. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleAnswerSubmission = async () => {
    if (!selectedAnswer || !currentLocation || !participant) return;

    setAnswering(true);
    try {
      const isCorrect = selectedAnswer === currentLocation.correct_answer;
      let newProgress = [...participant.progress];

      if (isCorrect && !newProgress.includes(currentLocation.id)) {
        newProgress.push(currentLocation.id);
      }

      const isCompleted = newProgress.length === locations.length;
      const updateData: any = {
        progress: newProgress,
        updated_at: new Date().toISOString()
      };

      if (isCompleted) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('scavenger_participants')
        .update(updateData)
        .eq('id', participant.id);

      if (error) throw error;

      setParticipant({ ...participant, ...updateData });

      if (isCorrect) {
        toast({
          title: "Correct!",
          description: isCompleted ? "Congratulations! You've completed all locations!" : "Great job! Move to the next location.",
        });
      } else {
        toast({
          title: "Incorrect",
          description: "That's not the right answer. Try again!",
          variant: "destructive",
        });
      }

      setSelectedAnswer('');
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnswering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-aum-orange/5 to-aum-purple/5">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-brand-gradient flex items-center justify-center">
            <img 
              src="/lovable-uploads/Aumovio_Logo_print_orange_black_CMYK.png" 
              alt="Aumovio Logo" 
              className="w-10 h-10 object-contain"
            />
          </div>
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-aum-orange" />
          <p className="text-lg font-medium brand-text-gradient">Loading scavenger hunt...</p>
        </div>
      </div>
    );
  }

  if (!hunt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-aum-orange/5 to-aum-purple/5 p-4">
        <Card className="w-full max-w-md border-aum-orange/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-brand-gradient flex items-center justify-center">
              <img 
                src="/lovable-uploads/Aumovio_Logo_print_orange_black_CMYK.png" 
                alt="Aumovio Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <CardTitle className="text-center text-destructive text-xl">🔍 Hunt Not Found</CardTitle>
            <CardDescription className="text-center">
              The scavenger hunt you're looking for doesn't exist or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Registration/Signup flow
  if (token && !participant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-aum-orange/5 to-aum-purple/5 p-4">
        <Card className="w-full max-w-md border-aum-orange/20 shadow-xl bg-card/80 backdrop-blur">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg">
              <img 
                src="/lovable-uploads/Aumovio_Logo_print_orange_black_CMYK.png" 
                alt="Aumovio Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <Trophy className="w-12 h-12 mx-auto mb-4 text-aum-orange animate-pulse" />
            <CardTitle className="text-2xl brand-text-gradient">{hunt.name}</CardTitle>
            <CardDescription className="text-base">
              🎯 Welcome to the scavenger hunt! Register to start your adventure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">👤 Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="border-aum-orange/20 focus:border-aum-orange/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">📧 Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="border-aum-orange/20 focus:border-aum-orange/40"
              />
            </div>
            <Button
              onClick={handleRegistration}
              disabled={!name.trim() || !email.trim() || registering}
              className="w-full bg-brand-gradient hover:opacity-90 text-white font-semibold py-6 text-lg shadow-lg"
              variant="brand"
            >
              {registering ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  🚀 Start Hunt
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completion screen
  if (participant && participant.completed_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-aum-orange/5 to-aum-purple/5 p-4">
        <Card className="w-full max-w-md text-center border-aum-orange/20 shadow-xl bg-card/80 backdrop-blur">
          <CardHeader className="pb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg animate-pulse">
              <img 
                src="/lovable-uploads/Aumovio_Logo_print_orange_black_CMYK.png" 
                alt="Aumovio Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <Trophy className="w-20 h-20 mx-auto mb-4 text-aum-orange animate-bounce" />
            <CardTitle className="text-3xl brand-text-gradient mb-2">🎉 Congratulations!</CardTitle>
            <CardDescription className="text-lg">
              You've successfully completed the scavenger hunt!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-brand-gradient/10 rounded-lg border border-aum-orange/20">
                <p className="text-xl font-bold text-aum-orange">{participant.name}</p>
              </div>
              <Badge className="text-xl px-6 py-3 bg-brand-gradient text-white">
                🏆 {locations.length}/{locations.length} locations completed
              </Badge>
              <p className="text-sm text-muted-foreground mt-6 bg-muted/50 p-3 rounded-lg">
                📅 Completed on {new Date(participant.completed_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Trivia question flow
  if (currentLocation && participant) {
    const isCompleted = participant.progress.includes(currentLocation.id);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-aum-orange/5 to-aum-purple/5 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header with Aumovio branding */}
          <div className="mb-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg">
              <img 
                src="/lovable-uploads/Aumovio_Logo_print_orange_black_CMYK.png" 
                alt="Aumovio Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3 justify-center">
              <MapPin className="w-6 h-6 text-aum-orange" />
              <h1 className="text-2xl font-bold brand-text-gradient">{currentLocation.name}</h1>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Progress:</span>
              <Badge variant="outline" className="border-aum-orange/30 text-aum-orange">
                📍 {participant.progress.length}/{locations.length} completed
              </Badge>
            </div>
          </div>

          <Card className="border-aum-orange/20 shadow-xl bg-card/80 backdrop-blur">
            <CardHeader className="bg-brand-gradient/5 border-b border-aum-orange/10">
              <CardTitle className="flex items-center gap-3 text-xl">
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <Trophy className="w-6 h-6 text-aum-orange animate-pulse" />
                )}
                <span className="brand-text-gradient">🧠 Trivia Question</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="p-4 bg-muted/30 rounded-lg border border-aum-orange/10">
                <p className="text-lg font-medium">{currentLocation.question}</p>
              </div>
              
              {isCompleted ? (
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="font-semibold text-green-700 dark:text-green-300 text-lg">
                    ✅ You've already completed this location!
                  </p>
                </div>
              ) : (
                <>
                  <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-3">
                    {currentLocation.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-aum-orange/10 hover:bg-brand-gradient/5 transition-colors">
                        <RadioGroupItem value={option} id={`option-${index}`} className="border-aum-orange/40" />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer font-medium">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  <Button
                    onClick={handleAnswerSubmission}
                    disabled={!selectedAnswer || answering}
                    className="w-full bg-brand-gradient hover:opacity-90 text-white font-semibold py-6 text-lg shadow-lg"
                    variant="brand"
                  >
                    {answering ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        🎯 Submit Answer
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Progress overview for registered participants
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-aum-orange/5 to-aum-purple/5 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg">
            <img 
              src="/lovable-uploads/Aumovio_Logo_print_orange_black_CMYK.png" 
              alt="Aumovio Logo" 
              className="w-10 h-10 object-contain"
            />
          </div>
          <Trophy className="w-12 h-12 mx-auto mb-4 text-aum-orange animate-pulse" />
          <h1 className="text-3xl font-bold brand-text-gradient">{hunt.name}</h1>
          <p className="text-lg text-muted-foreground">👋 Welcome back, {participant?.name}!</p>
        </div>

        <Card className="border-aum-orange/20 shadow-xl bg-card/80 backdrop-blur">
          <CardHeader className="bg-brand-gradient/5 border-b border-aum-orange/10">
            <CardTitle className="text-xl brand-text-gradient flex items-center gap-2">
              📊 Your Progress
            </CardTitle>
            <CardDescription className="text-base">
              Complete all locations to finish the scavenger hunt
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {locations.map((location) => {
                const completed = participant?.progress.includes(location.id);
                return (
                  <div
                    key={location.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                      completed 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 shadow-sm' 
                        : 'border-aum-orange/10 hover:bg-brand-gradient/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {completed ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <MapPin className="w-6 h-6 text-aum-orange" />
                      )}
                      <span className={`font-medium ${completed ? 'text-green-700 dark:text-green-300' : 'text-foreground'}`}>
                        {location.name}
                      </span>
                    </div>
                    <Badge 
                      variant={completed ? "default" : "secondary"}
                      className={completed ? "bg-green-500 hover:bg-green-600" : "border-aum-orange/20"}
                    >
                      {completed ? "✅ Completed" : "⏳ Pending"}
                    </Badge>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 text-center">
              <div className="p-4 bg-brand-gradient/10 rounded-lg border border-aum-orange/20">
                <Badge className="text-xl px-6 py-3 bg-brand-gradient text-white">
                  🎯 {participant?.progress.length || 0}/{locations.length} locations completed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScavengerHuntPage;