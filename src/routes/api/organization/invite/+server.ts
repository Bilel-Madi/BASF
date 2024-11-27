// src/routes/api/send-invite/+server.ts

import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { nanoid } from 'nanoid';
import * as brevo from '@getbrevo/brevo';

// Environment Variables
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const APP_URL = process.env.APP_URL || 'http://basf.arddata.com';

// POST Handler to Send Invitation Email
export async function POST({ request, locals }) {
    try {
        const user = locals.user;

        // Authentication Check
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        // Authorization Check: Only ADMIN or SUPER_ADMIN can send invites
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            return new Response('Forbidden', { status: 403 });
        }

        // Parse Request Body
        const { email } = await request.json();

        // Validate Email
        if (!email || typeof email !== 'string') {
            return new Response('Invalid email address', { status: 400 });
        }

        // Generate Unique Invite Token
        const inviteToken = nanoid(32);

        // Retrieve Organization Name
        const organization = await prisma.organization.findUnique({
            where: { id: user.organizationId },
            select: { name: true }
        });

        if (!organization) {
            return new Response('Organization not found', { status: 404 });
        }

        // Create Invite Record in Database
        const invite = await prisma.inviteCode.create({
            data: {
                code: inviteToken,
                organizationId: user.organizationId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            }
        });

        // Configure Brevo API Instance
        const apiInstance = new brevo.TransactionalEmailsApi();
        const apiKey = apiInstance.authentications['apiKey'];
        apiKey.apiKey = BREVO_API_KEY;

        // Construct Invitation Link
        const inviteLink = `${APP_URL}/auth/signup?invite=${inviteToken}`;

        // Create Responsive HTML Email Content
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to Arddata</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    /* Responsive Styles */
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 10px !important; }
      .header img { width: 60px !important; }
      .content { padding: 16px !important; }
      .button a { padding: 12px 24px !important; font-size: 16px !important; }
      h1 { font-size: 20px !important; }
      p { font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8; font-family: 'Inter', sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header Section -->
          <tr>
            <td align="center" style="background-color:#1b0ab1; padding:32px;">
              <img src="https://basf.arddata.com/logo1.png" alt="Arddata Logo" style="width:100px; height:auto; display:block;">
            </td>
          </tr>
          
          <!-- Content Section -->
          <tr>
            <td align="left" style="padding:40px 48px; background-color:#ffffff;">
              <h1 style="color:#1e293b; font-size:28px; margin:0 0 24px 0; font-weight:700; letter-spacing:-0.5px;">
                Welcome to ${organization.name}
              </h1>
              <p style="color:#475569; font-size:16px; line-height:1.7; margin-bottom:20px;">
                You've been invited to join <strong style="color:#1b0ab1;">${organization.name}</strong> on Arddata, your comprehensive platform for data management and collaboration.
              </p>
              <p style="color:#475569; font-size:16px; line-height:1.7; margin-bottom:32px;">
                Get started by creating your account and joining your team:
              </p>
              
              <!-- Button Section -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" 
                       style="background-color:#00ffbf; 
                              color:#1b0ab1; 
                              padding:16px 40px; 
                              text-decoration:none; 
                              border-radius:12px; 
                              display:inline-block; 
                              font-weight:600; 
                              font-size:16px; 
                              transition: all 0.3s ease; 
                              box-shadow:0 4px 6px rgba(0,255,191,0.2);">
                      Accept Invitation →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:32px 0;">
                <tr>
                  <td style="border-top:1px solid #e5e7eb;"></td>
                </tr>
              </table>
              
              <!-- Additional Information -->
              <p style="color:#64748b; font-size:14px; text-align:center; line-height:1.6;">
                This invitation will expire in 7 days.<br>
                Need help? Contact us at <a href="mailto:support@arddata.com" style="color:#1b0ab1; text-decoration:none; font-weight:500;">support@arddata.com</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer Section -->
          <tr>
            <td style="background-color:#1b0ab1; padding:24px; text-align:center;">
              <p style="margin:0; color:#ffffff; font-size:13px; opacity:0.9;">
                © ${new Date().getFullYear()} Arddata. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

        // Create SendSmtpEmail Object with Email Data
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = `Join ${organization.name} on Arddata`;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { 
            name: "Arddata™", 
            email: "support@arddata.com" 
        };
        sendSmtpEmail.to = [
            { email, name: email.split('@')[0] }
        ];
        sendSmtpEmail.params = {
            organizationName: organization.name,
            inviteLink: inviteLink
        };

        // Send the Email via Brevo
        await apiInstance.sendTransacEmail(sendSmtpEmail);

        // Respond with Success
        return json({ success: true });
    } catch (error) {
        console.error('Error sending invitation:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
