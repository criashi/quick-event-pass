
// Security utility functions for input validation and sanitization
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
};

export const sanitizeText = (text: string): string => {
  if (!text) return '';
  // Remove potentially dangerous characters and limit length
  return text
    .replace(/[<>"'&]/g, '')
    .substring(0, 255)
    .trim();
};

export const validateCSVHeaders = (headers: string[]): boolean => {
  const allowedHeaders = [
    'full_name', 'continental_email', 'employee_number', 
    'business_area', 'vegetarian_vegan_option', 'email', 'name'
  ];
  
  return headers.every(header => {
    const sanitized = sanitizeText(header.toLowerCase().replace(/\s+/g, '_'));
    return allowedHeaders.includes(sanitized);
  });
};

export const validateFileType = (file: File): boolean => {
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];
  const allowedExtensions = ['.csv'];
  
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
};

export const validateFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const validateQRData = (data: string): boolean => {
  // Basic validation for QR code data
  if (!data || data.length > 500) return false;
  
  // Check if it looks like a valid attendee ID (UUID format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(data);
};

export const logSecurityEvent = async (
  action: string,
  tableName?: string,
  recordId?: string,
  oldValues?: any,
  newValues?: any
) => {
  // This would typically send to an audit logging service
  console.log('Security Event:', {
    action,
    tableName,
    recordId,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    oldValues,
    newValues
  });
};
