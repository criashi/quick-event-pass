# Frontend Integration Guide

This guide covers integrating the React frontend with the Azure backend APIs.

## API Configuration

### Environment Variables

```typescript
// src/config/api.ts
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7071/api',
  webhookKey: import.meta.env.VITE_WEBHOOK_KEY || '',
  environment: import.meta.env.MODE || 'development'
};

export default config;
```

### API Client Setup

```typescript
// src/services/apiClient.ts
import axios from 'axios';
import config from '@/config/api';

const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for auth
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## API Service Layer

```typescript
// src/services/attendeeService.ts
import apiClient from './apiClient';
import { Attendee, EventStats } from '@/types/attendee';

export class AttendeeService {
  static async getAttendees(filters?: {
    department?: string;
    checkedIn?: boolean;
  }): Promise<Attendee[]> {
    const params = new URLSearchParams();
    if (filters?.department) params.append('department', filters.department);
    if (filters?.checkedIn !== undefined) params.append('checkedIn', filters.checkedIn.toString());
    
    const response = await apiClient.get(`/attendees?${params}`);
    return response.data;
  }

  static async checkInAttendee(qrData: string): Promise<{
    success: boolean;
    attendee: Attendee;
    message: string;
  }> {
    const response = await apiClient.post('/checkin', { qrData });
    return response.data;
  }

  static async getStats(): Promise<EventStats> {
    const response = await apiClient.get('/stats');
    return response.data;
  }

  static async exportAttendees(): Promise<Blob> {
    const response = await apiClient.get('/export', {
      responseType: 'blob'
    });
    return response.data;
  }

  static async bulkCheckIn(attendeeIds: string[]): Promise<{
    successful: string[];
    failed: { id: string; error: string }[];
  }> {
    const response = await apiClient.post('/bulk-checkin', { attendeeIds });
    return response.data;
  }
}
```

## React Query Integration

```typescript
// src/hooks/useAttendees.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AttendeeService } from '@/services/attendeeService';
import { toast } from '@/hooks/use-toast';

export const useAttendees = (filters?: { department?: string; checkedIn?: boolean }) => {
  return useQuery({
    queryKey: ['attendees', filters],
    queryFn: () => AttendeeService.getAttendees(filters),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
};

export const useCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (qrData: string) => AttendeeService.checkInAttendee(qrData),
    onSuccess: (data) => {
      toast({
        title: "Check-in Successful",
        description: data.message,
      });
      
      // Invalidate and refetch attendees
      queryClient.invalidateQueries({ queryKey: ['attendees'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Check-in Failed",
        description: error.response?.data?.error || "An error occurred",
        variant: "destructive",
      });
    },
  });
};

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: AttendeeService.getStats,
    refetchInterval: 30000, // 30 seconds
  });
};
```

## Updated Components

### Updated useEventData Hook

```typescript
// src/hooks/useEventData.ts
import { useState, useEffect } from "react";
import { Attendee, EventStats } from "@/types/attendee";
import { useAttendees, useCheckIn, useStats } from "./useAttendees";

export const useEventData = () => {
  const { data: attendees = [], isLoading, error } = useAttendees();
  const { data: stats } = useStats();
  const checkInMutation = useCheckIn();

  const checkInAttendee = async (attendeeId: string): Promise<boolean> => {
    try {
      await checkInMutation.mutateAsync(attendeeId);
      return true;
    } catch (error) {
      return false;
    }
  };

  const getStats = (): EventStats => {
    if (stats) return stats;
    
    // Fallback calculation from local data
    const total = attendees.length;
    const checkedIn = attendees.filter(a => a.checkedIn).length;
    const pending = total - checkedIn;
    
    return { total, checkedIn, pending };
  };

  return {
    attendees,
    checkInAttendee,
    getStats,
    isLoading,
    error
  };
};
```

### Updated Dashboard Component

```typescript
// src/components/Dashboard.tsx - Add real-time updates
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const Dashboard = ({ attendees, stats }: DashboardProps) => {
  const queryClient = useQueryClient();

  // Set up real-time updates (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['attendees'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [queryClient]);

  // ... rest of component remains the same
};
```

## Error Handling

```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Something went wrong. Please refresh the page or contact support.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Loading States

```typescript
// src/components/LoadingSpinner.tsx
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner = ({ size = 'md', text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
};
```

## Offline Support

```typescript
// src/hooks/useOfflineSupport.ts
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Process pending actions when back online
      processPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addPendingAction = (action: any) => {
    if (!isOnline) {
      setPendingActions(prev => [...prev, action]);
    }
  };

  const processPendingActions = async () => {
    // Process queued actions when back online
    for (const action of pendingActions) {
      try {
        await action();
      } catch (error) {
        console.error('Failed to process pending action:', error);
      }
    }
    setPendingActions([]);
  };

  return {
    isOnline,
    addPendingAction
  };
};
```

## WebSocket Integration (Optional)

```typescript
// src/hooks/useRealtimeUpdates.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useRealtimeUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // SignalR or WebSocket connection
    const connection = new WebSocket(
      `wss://func-event-checkin.azurewebsites.net/api/realtime`
    );

    connection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'ATTENDEE_CHECKED_IN':
          queryClient.invalidateQueries({ queryKey: ['attendees'] });
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          break;
        case 'NEW_REGISTRATION':
          queryClient.invalidateQueries({ queryKey: ['attendees'] });
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          break;
      }
    };

    return () => {
      connection.close();
    };
  }, [queryClient]);
};
```

## CSV Export Feature

```typescript
// src/utils/csvExport.ts
import { Attendee } from '@/types/attendee';

export const exportToCSV = (attendees: Attendee[], filename = 'attendees.csv') => {
  const headers = [
    'ID',
    'First Name',
    'Last Name',
    'Email',
    'Department',
    'Food Allergies',
    'Registration Time',
    'Checked In',
    'Check-in Time'
  ];

  const csvContent = [
    headers.join(','),
    ...attendees.map(attendee => [
      attendee.id,
      attendee.firstName,
      attendee.lastName,
      attendee.email,
      attendee.department,
      attendee.foodAllergies || '',
      attendee.registrationTime,
      attendee.checkedIn ? 'Yes' : 'No',
      attendee.checkInTime || ''
    ].map(field => `"${field}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
```

## Authentication Integration

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('authToken');
    if (token) {
      // Validate token and get user info
      validateToken(token).then(setUser).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) throw new Error('Login failed');

    const { token, user } = await response.json();
    localStorage.setItem('authToken', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

## Performance Optimizations

```typescript
// src/hooks/useVirtualization.ts
import { useMemo } from 'react';

export const useVirtualizedList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const bufferSize = Math.floor(visibleCount / 2);
    
    return {
      visibleCount,
      bufferSize,
      totalHeight: items.length * itemHeight
    };
  }, [items.length, itemHeight, containerHeight]);
};
```

## Environment-Specific Configuration

```typescript
// src/config/environment.ts
const environments = {
  development: {
    apiBaseUrl: 'http://localhost:7071/api',
    enableDevTools: true,
    logLevel: 'debug'
  },
  staging: {
    apiBaseUrl: 'https://func-event-checkin-staging.azurewebsites.net/api',
    enableDevTools: true,
    logLevel: 'info'
  },
  production: {
    apiBaseUrl: 'https://func-event-checkin.azurewebsites.net/api',
    enableDevTools: false,
    logLevel: 'error'
  }
};

const env = import.meta.env.MODE as keyof typeof environments;
export const config = environments[env] || environments.development;
```

This frontend integration guide provides a robust foundation for connecting your React application to the Azure backend, with proper error handling, real-time updates, and performance optimizations.
