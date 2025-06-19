
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Menu, User, LogOut, Calendar } from 'lucide-react';
import { Event } from '@/types/event';

interface AppHeaderProps {
  currentEvent?: Event | null;
  onMenuToggle?: () => void;
}

const AppHeader = ({ currentEvent, onMenuToggle }: AppHeaderProps) => {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="bg-white border-b shadow-sm">
      {/* Continental Banner */}
      <div className="bg-gradient-to-r from-continental-light-green to-continental-dark-green text-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onMenuToggle && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onMenuToggle}
                  className="text-white hover:bg-white/20 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-continental-yellow rounded-lg">
                  <img 
                    src="/lovable-uploads/7db59a9c-fbb6-4e19-951e-7a41b8ae2800.png" 
                    alt="Continental Logo" 
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Continental Events</h1>
                  <p className="text-continental-white/90 text-sm">Management System</p>
                </div>
              </div>
            </div>

            {/* User Controls */}
            <div className="flex items-center gap-3">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-white/20 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {profile?.full_name || user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem disabled className="text-sm text-gray-600">
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Header */}
      {currentEvent && (
        <div className="container mx-auto p-6 pb-0">
          <Card className="bg-gradient-to-r from-continental-light-green to-continental-dark-green text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{currentEvent.name}</CardTitle>
                  <CardDescription className="text-continental-white/90">
                    {new Date(currentEvent.event_date).toLocaleDateString()} • {currentEvent.location}
                  </CardDescription>
                </div>
                <Calendar className="h-8 w-8" />
              </div>
            </CardHeader>
          </Card>
        </div>
      )}

      {!currentEvent && (
        <div className="container mx-auto p-6 pb-0">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">No Active Event</CardTitle>
              <CardDescription className="text-orange-600">
                Please set up an event in the Event Setup tab to get started.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AppHeader;
