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
        const { email, firstName, lastName } = await request.json();

        // Validate inputs
        if (!email || typeof email !== 'string') {
            return new Response('Invalid email address', { status: 400 });
        }
        if (!firstName || typeof firstName !== 'string') {
            return new Response('Invalid first name', { status: 400 });
        }
        if (!lastName || typeof lastName !== 'string') {
            return new Response('Invalid last name', { status: 400 });
        }

        // Generate Unique Invite Token
        const inviteToken = nanoid(32);

        // Retrieve Organization Name and Sender's Name
        const organization = await prisma.organization.findUnique({
            where: { id: user.organizationId },
            select: { 
                name: true,
                users: {
                    where: { id: user.id },
                    select: { firstName: true, lastName: true }
                }
            }
        });

        if (!organization) {
            return new Response('Organization not found', { status: 404 });
        }

        // Create Invite Record in Database
        const invite = await prisma.inviteCode.create({
            data: {
                code: inviteToken,
                organizationId: user.organizationId,
                firstName,
                lastName,
                email,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            }
        });

        // Configure Brevo API Instance
        const apiInstance = new brevo.TransactionalEmailsApi();
        const apiKey = apiInstance.authentications['apiKey'];
        apiKey.apiKey = BREVO_API_KEY;

        // Construct Invitation Link
        const inviteLink = `${APP_URL}/auth/signup?invite=${inviteToken}`;

        // Create Enhanced Responsive HTML Email Content
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to Arddata</title>
  <style>
    /* General Styles */
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f5f7; /* Light Blue Background */
      font-family: 'Inter', sans-serif;
    }
    table {
      border-collapse: collapse;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 24px; /* Increased Border Radius for More Rounded Corners */
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Subtle Shadow for Depth */
    }
    .header {
      background-color: #1b0ab1;
      padding: 20px;
      text-align: center;
    }
    .header img {
      width: 80px;
      height: auto;
    }
    .content {
      padding: 40px 30px;
    }
    h1 {
      font-size: 24px;
      color: #1e293b;
      margin-bottom: 20px;
    }
    p {
      font-size: 16px;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      background-color: #00ffbf;
      color: #1b0ab1;
      padding: 15px 30px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      display: inline-block;
      transition: background-color 0.3s ease, transform 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 255, 191, 0.2);
    }
    .button:hover {
      background-color: #00e6a0;
      transform: translateY(-2px);
    }
    .footer {
      background-color: #1b0ab1;
      padding: 15px;
      text-align: center;
    }
    .footer p {
      color: #ffffff;
      font-size: 13px;
      margin: 0;
    }
    /* Responsive Styles */
    @media only screen and (max-width: 600px) {
      .content {
        padding: 20px 15px;
      }
      h1 {
        font-size: 20px;
      }
      p {
        font-size: 14px;
      }
      .button {
        padding: 12px 20px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table class="container" cellpadding="0" cellspacing="0" role="presentation">
          <!-- Header -->
          <tr>
            <td class="header">
              <img src="https://basf.arddata.com/logo1.png" alt="Arddata Logo">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="content">
              <h1>Welcome to Arddata™</h1>
              <p>
                Hi ${firstName},
              </p>
              <p>
                You've been invited by <strong>${organization.users[0].firstName} ${organization.users[0].lastName}</strong> to join <strong>${organization.name}</strong> on Arddata™.
              </p>
              <p>
                Arddata™ is a precision agriculture platform empowering organizations with data-driven insights. By joining, you'll gain access to advanced tools and analytics designed to transform agriculture.
              </p>
              <p>
                Get started by creating your account and joining your team:
              </p>
              <div class="button-container">
                <a href="${inviteLink}" class="button">Accept Invitation</a>
              </div>
              <p style="text-align: center; font-size: 14px; color: #64748b;">
                This invitation will expire in 7 days.<br>
                Need help? Contact us at <a href="mailto:support@arddata.com" style="color: #1b0ab1; text-decoration: none;">support@arddata.com</a>
              </p>
              <p style="text-align: center; font-size: 14px; color: #475569; margin-top: 15px;">
                Learn more about Arddata™ at 
                <a href="https://www.arddata.com" style="color: #1b0ab1; text-decoration: none;">www.arddata.com</a>.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="footer">
              <p>© ${new Date().getFullYear()} Arddata™. All rights reserved.</p>
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
            { email, name: `${firstName} ${lastName}` }
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
