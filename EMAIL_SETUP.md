# Email Setup Guide

## EmailJS Configuration (FREE for 200 emails/month)

To enable real email sending for user invitations, you need to configure EmailJS:

### 1. Create EmailJS Account

1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Create Email Service

1. Go to Email Services in your dashboard
2. Add a new service (Gmail, Outlook, etc.)
3. Connect your email account
4. Copy the Service ID
service_nhqq0tw

### 3. Create Email Template

1. Go to Email Templates in your dashboard
2. Create a new template with this content:

```html
<div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #15a970; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">Task Manager Invitation</h1>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #374151; margin-bottom: 20px;">Hello {{to_name}}!</h2>
    
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
      You've been invited to join our Task Manager system as a <strong>{{role}}</strong>.
    </p>
    
    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 30px;">
      Click the button below to set up your password and activate your account:
    </p>
    
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="{{invitation_link}}" 
         style="background: #15a970; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Set Up Password
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; margin-bottom: 20px;">
      This invitation link will expire in {{expiry_days}} days.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      If you didn't expect this invitation, please ignore this email.
    </p>
  </div>
</div>
```

3. Copy the Template ID
template_20mrm8m
### 4. Get Public Key

1. Go to Account > API Keys
2. Copy your Public Key
B7oRa4hzxw6In2ccj

### 5. Environment Variables

Create a `.env` file in your project root with:

```env
VITE_EMAILJS_SERVICE_ID=service_nhqq0tw
VITE_EMAILJS_TEMPLATE_ID=template_20mrm8m
VITE_EMAILJS_PUBLIC_KEY=B7oRa4hzxw6In2ccj
```

**Note**: Vite uses `VITE_` prefix for environment variables, not `REACT_APP_`.

### 6. Testing

1. Create a new user in User Management
2. Check the console for email sending logs
3. Check the recipient's email inbox
4. Click the invitation link to test the setup

### 7. Troubleshooting

- **Authentication Error**: Check your EmailJS credentials
- **Template Error**: Verify template variables match
- **Email Not Received**: Check spam folder
- **Service Error**: Verify email service connection

### 8. Benefits of EmailJS

- **Free Tier**: 200 emails/month
- **Browser Compatible**: Works in React frontend
- **Easy Setup**: No server required
- **Professional**: Reliable delivery
- **Templates**: Customizable email templates

## Features Added

### Email Invitation System
- ✅ Real email sending with EmailJS
- ✅ Professional email templates
- ✅ Secure invitation tokens
- ✅ 7-day expiration

### User Status Management
- ✅ Active/Inactive status
- ✅ Invited status tracking
- ✅ Status badges in UI
- ✅ Status change actions

### User Actions
- ✅ Resend invitation
- ✅ Activate/Deactivate users
- ✅ Edit user details
- ✅ Delete users

### Security Features
- ✅ Time-limited tokens
- ✅ Token verification
- ✅ Secure password setup
- ✅ Status validation 