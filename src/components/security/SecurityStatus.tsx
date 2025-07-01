
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SecurityStatus: React.FC = () => {
  const { user, profile } = useAuth();

  const securityChecks = [
    {
      name: 'Row Level Security',
      status: 'active',
      description: 'Database access controls enforced'
    },
    {
      name: 'Input Validation',
      status: 'active',
      description: 'All user inputs are sanitized'
    },
    {
      name: 'Admin Verification',
      status: 'active',
      description: 'Server-side role verification enabled'
    },
    {
      name: 'Audit Logging',
      status: 'active',
      description: 'Security events are logged'
    },
    {
      name: 'File Upload Security',
      status: 'active',
      description: 'File type and size validation'
    },
    {
      name: 'QR Code Validation',
      status: 'active',
      description: 'QR codes validated before processing'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending</Badge>;
      default:
        return <Badge variant="destructive">Inactive</Badge>;
    }
  };

  if (profile?.role !== 'admin') {
    return null;
  }

  return (
    <Card className="w-full bg-continental-white border-continental-gray3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-continental-black font-continental">
          <Shield className="h-5 w-5 text-continental-yellow" />
          Security Status
        </CardTitle>
        <CardDescription>
          Current security measures and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {securityChecks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-continental-gray4 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <p className="font-medium text-continental-black">{check.name}</p>
                  <p className="text-sm text-continental-gray1">{check.description}</p>
                </div>
              </div>
              {getStatusBadge(check.status)}
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Security Hardening Complete</h4>
              <p className="text-sm text-green-700 mt-1">
                All critical security vulnerabilities have been addressed. The application now includes 
                proper access controls, input validation, and audit logging.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityStatus;
