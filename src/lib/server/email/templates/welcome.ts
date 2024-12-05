export const getWelcomeEmailTemplate = (email: string, firstName: string = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to Arddata</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f5f7;
      font-family: 'Inter', sans-serif;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #1b0ab1;
      padding: 20px;
      text-align: center;
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
    .button {
      background-color: #00ffbf;
      color: #1b0ab1;
      padding: 15px 30px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      display: inline-block;
    }
    .footer {
      background-color: #1b0ab1;
      padding: 15px;
      text-align: center;
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://basf.arddata.com/logo1.png" alt="Arddata Logo" width="80">
    </div>
    <div class="content">
      <h1>Welcome to Arddata™!</h1>
      <p>
        Hello${firstName ? ` ${firstName}` : ''},
      </p>
      <p>
        Thank you for joining Arddata™! We're excited to have you on board. Our platform is designed to help you make data-driven decisions in agriculture with powerful tools and insights.
      </p>
      <p>
        To get started, you can:
        <ul>
          <li>Complete your profile setup</li>
          <li>Create your first project</li>
          <li>Add zones to your project</li>
          <li>Invite team members to collaborate</li>
        </ul>
      </p>
      <p>
        <a href="${process.env.APP_URL}/dashboard" class="button">Go to Dashboard</a>
      </p>
      <p>
        If you need any help, our support team is always here for you at <a href="mailto:support@arddata.com">support@arddata.com</a>.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Arddata™. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`; 