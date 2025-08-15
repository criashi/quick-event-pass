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
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/lovable-uploads/5db0e992-8715-40d6-a2f9-c016c0db9347.png)' }}
      >
        <div className="text-center">
          <img 
            src="/lovable-uploads/2dc7d964-a3e8-4457-8571-35ebc9806fa9.png" 
            alt="Aumovio Logo" 
            className="w-32 h-auto mx-auto mb-6 animate-fade-in"
          />
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white/90">Loading scavenger hunt...</p>
        </div>
      </div>
    );
  }

  if (!hunt) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4"
        style={{ backgroundImage: 'url(/lovable-uploads/5db0e992-8715-40d6-a2f9-c016c0db9347.png)' }}
      >
        <div className="w-full max-w-md">
          <img 
            src="/lovable-uploads/2dc7d964-a3e8-4457-8571-35ebc9806fa9.png" 
            alt="Aumovio Logo" 
            className="w-32 h-auto mx-auto mb-8 animate-fade-in"
          />
          <Card className="backdrop-blur-sm bg-black/20 border-white/20">
            <CardHeader>
              <CardTitle className="text-center text-red-400">Hunt Not Found</CardTitle>
              <CardDescription className="text-center text-white/90">
                The scavenger hunt you're looking for doesn't exist or has expired.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Registration/Signup flow
  if (token && !participant) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4"
        style={{ backgroundImage: 'url(/lovable-uploads/5db0e992-8715-40d6-a2f9-c016c0db9347.png)' }}
      >
        <div className="w-full max-w-md">
          <img 
            src="/lovable-uploads/2dc7d964-a3e8-4457-8571-35ebc9806fa9.png" 
            alt="Aumovio Logo" 
            className="w-32 h-auto mx-auto mb-8 animate-fade-in"
          />
          <Card className="backdrop-blur-sm bg-black/20 border-white/20 animate-scale-in">
            <CardHeader className="text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-white" />
              <CardTitle className="text-white">{hunt.name}</CardTitle>
              <CardDescription className="text-white/90">
                Welcome to the scavenger hunt! Register to start your adventure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  required
                />
              </div>
              <Button
                onClick={handleRegistration}
                disabled={!name.trim() || !email.trim() || registering}
                variant="gradient-primary"
                className="w-full"
              >
                {registering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Start Hunt'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Completion screen
  if (participant && participant.completed_at) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4"
        style={{ backgroundImage: 'url(/lovable-uploads/5db0e992-8715-40d6-a2f9-c016c0db9347.png)' }}
      >
        <div className="w-full max-w-md text-center">
          <img 
            src="/lovable-uploads/2dc7d964-a3e8-4457-8571-35ebc9806fa9.png" 
            alt="Aumovio Logo" 
            className="w-32 h-auto mx-auto mb-8 animate-fade-in"
          />
          <Card className="backdrop-blur-sm bg-black/20 border-white/20 animate-scale-in">
            <CardHeader>
              <Trophy className="w-16 h-16 mx-auto mb-4 text-white animate-pulse" />
              <CardTitle className="text-2xl text-white">Congratulations!</CardTitle>
              <CardDescription className="text-white/90">
                You've successfully completed the scavenger hunt!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-medium text-white">{participant.name}</p>
                <Badge className="text-lg px-4 py-2 bg-white/20 text-white border-white/20">
                  {locations.length}/{locations.length} locations completed
                </Badge>
                <p className="text-sm text-white/70 mt-4">
                  Completed on {new Date(participant.completed_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Trivia question flow
  if (currentLocation && participant) {
    const isCompleted = participant.progress.includes(currentLocation.id);
    
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat p-4"
        style={{ backgroundImage: 'url(/lovable-uploads/5db0e992-8715-40d6-a2f9-c016c0db9347.png)' }}
      >
        <div className="max-w-2xl mx-auto">
          <img 
            src="/lovable-uploads/2dc7d964-a3e8-4457-8571-35ebc9806fa9.png" 
            alt="Aumovio Logo" 
            className="w-24 h-auto mx-auto mb-6 animate-fade-in"
          />
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-white" />
              <h1 className="text-xl font-bold text-white">{currentLocation.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">Progress:</span>
              <Badge variant="outline" className="border-white/20 text-white bg-white/10">
                {participant.progress.length}/{locations.length} completed
              </Badge>
            </div>
          </div>

          <Card className="backdrop-blur-sm bg-black/20 border-white/20 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Trophy className="w-5 h-5 text-white" />
                )}
                Trivia Question
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-white">{currentLocation.question}</p>
              
              {isCompleted ? (
                <div className="text-center p-4 bg-green-500/20 border border-green-400/30 rounded-lg">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p className="font-medium text-green-300">
                    You've already completed this location!
                  </p>
                </div>
              ) : (
                <>
                  <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                    {currentLocation.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} className="border-white/30 text-white" />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-white">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  <Button
                    onClick={handleAnswerSubmission}
                    disabled={!selectedAnswer || answering}
                    variant="gradient-primary"
                    className="w-full"
                  >
                    {answering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Answer'
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
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: 'url(/lovable-uploads/5db0e992-8715-40d6-a2f9-c016c0db9347.png)' }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/2dc7d964-a3e8-4457-8571-35ebc9806fa9.png" 
            alt="Aumovio Logo" 
            className="w-32 h-auto mx-auto mb-6 animate-fade-in"
          />
          <Trophy className="w-12 h-12 mx-auto mb-4 text-white" />
          <h1 className="text-2xl font-bold text-white">{hunt.name}</h1>
          <p className="text-white/90">Welcome back, {participant?.name}!</p>
        </div>

        <Card className="backdrop-blur-sm bg-black/20 border-white/20 animate-scale-in">
          <CardHeader>
            <CardTitle className="text-white">Your Progress</CardTitle>
            <CardDescription className="text-white/90">
              Complete all locations to finish the scavenger hunt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {locations.map((location) => {
                const completed = participant?.progress.includes(location.id);
                return (
                  <div
                    key={location.id}
                    className={`flex items-center justify-between p-3 border rounded ${
                      completed ? 'bg-green-500/20 border-green-400/30' : 'border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {completed ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <MapPin className="w-5 h-5 text-white/70" />
                      )}
                      <span className={completed ? 'text-green-300' : 'text-white'}>
                        {location.name}
                      </span>
                    </div>
                    <Badge variant={completed ? "default" : "secondary"} className={completed ? "bg-green-500/30 text-green-300 border-green-400/30" : "bg-white/10 text-white/70 border-white/20"}>
                      {completed ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 text-center">
              <Badge className="text-lg px-4 py-2 bg-white/20 text-white border-white/20">
                {participant?.progress.length || 0}/{locations.length} locations completed
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScavengerHuntPage;