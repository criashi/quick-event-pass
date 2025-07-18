-- Add email_sent field to track actual email delivery status
ALTER TABLE public.attendees 
ADD COLUMN email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE;