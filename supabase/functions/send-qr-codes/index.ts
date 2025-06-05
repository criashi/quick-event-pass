
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendQRRequest {
  attendeeIds?: string[];
  sendToAll?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { attendeeIds, sendToAll }: SendQRRequest = await req.json();

    console.log('QR code email request:', { attendeeIds, sendToAll });

    // Get attendees to send QR codes to
    let attendeesQuery = supabaseClient
      .from('attendees')
      .select('id, full_name, continental_email, qr_code_data');

    if (!sendToAll && attendeeIds && attendeeIds.length > 0) {
      attendeesQuery = attendeesQuery.in('id', attendeeIds);
    }

    const { data: attendees, error: fetchError } = await attendeesQuery;

    if (fetchError) {
      console.error('Error fetching attendees:', fetchError);
      throw new Error(`Failed to fetch attendees: ${fetchError.message}`);
    }

    if (!attendees || attendees.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No attendees found' }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log(`Found ${attendees.length} attendees to send QR codes to`);

    // Generate QR codes for attendees who don't have them
    const attendeesToUpdate = [];
    for (const attendee of attendees) {
      if (!attendee.qr_code_data) {
        // Generate QR code data (simple format for now)
        const qrData = `CONTINENTAL_EVENT_${attendee.id}`;
        attendeesToUpdate.push({
          id: attendee.id,
          qr_code_data: qrData
        });
      }
    }

    // Update attendees with QR codes
    if (attendeesToUpdate.length > 0) {
      console.log(`Updating ${attendeesToUpdate.length} attendees with QR codes`);
      
      for (const update of attendeesToUpdate) {
        const { error: updateError } = await supabaseClient
          .from('attendees')
          .update({ qr_code_data: update.qr_code_data })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Error updating attendee ${update.id}:`, updateError);
        }
      }
    }

    // Send emails with QR codes using Resend
    const emailResults = [];
    
    for (const attendee of attendees) {
      const qrCodeData = attendee.qr_code_data || `CONTINENTAL_EVENT_${attendee.id}`;
      
      try {
        // Generate QR code URL using a QR code service
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}`;
        
        // Create email HTML with Continental branding
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Your Continental Event QR Code</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { background: linear-gradient(135deg, #FFD700, #FFA500); padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                .qr-section { text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 10px; }
                .qr-code { border: 3px solid #333; border-radius: 10px; max-width: 100%; height: auto; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                .instructions { background-color: #e8f4fd; padding: 20px; border-radius: 10px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">
                    <h1 style="margin: 0; color: #333;">Continental Event</h1>
                  </div>
                  <h2>Your Event QR Code</h2>
                </div>
                
                <p>Dear <strong>${attendee.full_name}</strong>,</p>
                
                <p>Thank you for registering for the Continental event! Please find your personal QR code below.</p>
                
                <div class="qr-section">
                  <h3>Your Check-in QR Code</h3>
                  <img src="${qrCodeUrl}" alt="QR Code for ${attendee.full_name}" class="qr-code" />
                  <p><strong>QR Code ID:</strong> ${qrCodeData}</p>
                  <p style="font-size: 14px; color: #666;">Present this QR code at the event for quick check-in</p>
                </div>
                
                <div class="instructions">
                  <h4 style="margin-top: 0; color: #0066cc;">Event Details:</h4>
                  <p>📅 <strong>Date:</strong> Please check your event invitation for date and time</p>
                  <p>📍 <strong>Location:</strong> Continental Corporation</p>
                  <p>✅ <strong>Check-in:</strong> Show this QR code at the entrance</p>
                </div>
                
                <p><strong>Important Instructions:</strong></p>
                <ul>
                  <li>Save this email or take a screenshot of the QR code</li>
                  <li>Arrive 15 minutes before the event start time</li>
                  <li>Have your QR code ready for scanning at check-in</li>
                  <li>If you have any issues, contact the event organizers</li>
                </ul>
                
                <div class="footer">
                  <p>This is an automated email from Continental Events Management System.</p>
                  <p>If you did not register for this event, please contact us immediately.</p>
                </div>
              </div>
            </body>
          </html>
        `;

        // Send email using Resend
        const emailResponse = await resend.emails.send({
          from: 'Continental Events <onboarding@resend.dev>',
          to: [attendee.continental_email],
          subject: 'Your Continental Event QR Code - Ready for Check-in!',
          html: emailHtml,
        });

        if (emailResponse.error) {
          console.error(`Email error for ${attendee.continental_email}:`, emailResponse.error);
          emailResults.push({
            attendee_id: attendee.id,
            email: attendee.continental_email,
            success: false,
            error: emailResponse.error.message
          });
        } else {
          console.log(`QR code email sent successfully to ${attendee.continental_email}`);
          emailResults.push({
            attendee_id: attendee.id,
            email: attendee.continental_email,
            success: true
          });
        }
      } catch (emailError: any) {
        console.error(`Failed to send email to ${attendee.continental_email}:`, emailError);
        emailResults.push({
          attendee_id: attendee.id,
          email: attendee.continental_email,
          success: false,
          error: emailError.message
        });
      }
    }

    const successCount = emailResults.filter(r => r.success).length;
    const failureCount = emailResults.filter(r => !r.success).length;

    console.log(`Email sending complete: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        message: `QR codes processed for ${attendees.length} attendees`,
        results: {
          total_attendees: attendees.length,
          emails_sent: successCount,
          emails_failed: failureCount,
          details: emailResults
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('Error in send-qr-codes function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);
