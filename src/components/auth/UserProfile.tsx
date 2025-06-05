
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Crown, Calendar } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await updateProfile({ full_name: fullName });

    if (!error) {
      setIsEditing(false);
    }

    setLoading(false);
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || '');
    setIsEditing(false);
  };

  if (!user || !profile) {
    return (
      <Card className="w-full max-w-md mx-auto bg-continental-white border-continental-gray3">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-continental-yellow" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-continental-white border-continental-gray3 shadow-lg">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-2 bg-continental-yellow rounded-lg">
            <User className="h-6 w-6 text-continental-black" />
          </div>
        </div>
        <CardTitle className="text-2xl text-continental-black font-continental">
          User Profile
        </CardTitle>
        <div className="w-12 h-1 bg-continental-yellow mx-auto"></div>
        <CardDescription className="text-continental-gray1">
          Manage your account information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-continental-gray4 rounded-lg">
            <Mail className="h-4 w-4 text-continental-gray1" />
            <div>
              <Label className="text-sm font-medium text-continental-black">Email</Label>
              <p className="text-sm text-continental-gray1">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-continental-gray4 rounded-lg">
            <Crown className="h-4 w-4 text-continental-gray1" />
            <div className="flex-1">
              <Label className="text-sm font-medium text-continental-black">Role</Label>
              <div className="mt-1">
                <Badge 
                  variant={profile.role === 'admin' ? 'default' : 'secondary'} 
                  className={profile.role === 'admin' ? 'bg-continental-yellow text-continental-black' : 'bg-continental-gray2 text-continental-white'}
                >
                  {profile.role}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-continental-gray4 rounded-lg">
            <Calendar className="h-4 w-4 text-continental-gray1" />
            <div>
              <Label className="text-sm font-medium text-continental-black">Member Since</Label>
              <p className="text-sm text-continental-gray1">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-continental-black font-medium">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={loading}
                className="border-continental-gray3 focus:border-continental-yellow focus:ring-continental-yellow"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={loading} 
                className="flex-1 bg-continental-yellow text-continental-black hover:bg-continental-yellow/90 font-medium"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 border-continental-gray2 text-continental-gray1 hover:bg-continental-gray4"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-continental-gray4 rounded-lg">
              <Label className="text-sm font-medium text-continental-black">Full Name</Label>
              <p className="text-sm text-continental-gray1 mt-1">
                {profile.full_name || 'Not set'}
              </p>
            </div>

            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="w-full border-continental-yellow text-continental-yellow hover:bg-continental-yellow hover:text-continental-black font-medium"
            >
              Edit Profile
            </Button>
          </div>
        )}

        <div className="border-t border-continental-gray3 pt-4">
          <Button
            onClick={signOut}
            className="w-full bg-continental-light-red text-white hover:bg-continental-light-red/90 font-medium"
          >
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
