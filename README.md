# Zero Waste Delhi - Social Authentication Setup

This guide will help you set up social authentication (Google and Apple Sign-In) for the Zero Waste Delhi application.

## Prerequisites

1. Node.js and npm installed
2. MongoDB installed and running
3. Google Developer Console account
4. Apple Developer account

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Google Sign-In Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials > Create Credentials > OAuth Client ID
5. Configure the OAuth consent screen
6. Create a Web Application type credential
7. Add your domain to the authorized JavaScript origins
8. Add your callback URL to the authorized redirect URIs
9. Copy the Client ID and update it in your `.env` file

### 3. Apple Sign-In Setup

1. Go to the [Apple Developer Console](https://developer.apple.com/)
2. Register your app and enable Sign In with Apple
3. Create a Service ID and configure domains and redirect URLs
4. Generate a Client Secret
5. Update the `.env` file with your Apple credentials

### 4. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here
APPLE_CLIENT_ID=your_apple_client_id_here
APPLE_CLIENT_SECRET=your_apple_client_secret_here
APPLE_REDIRECT_URI=https://your-domain.com/auth/apple/callback
MONGODB_URI=your_mongodb_uri_here
```

### 5. Start the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Testing Social Authentication

1. Open the application in your browser
2. Click on "Sign In with Google" or "Sign In with Apple"
3. Complete the authentication flow
4. You should be redirected to the dashboard upon successful authentication

## Security Considerations

1. Always use HTTPS in production
2. Keep your `.env` file secure and never commit it to version control
3. Regularly rotate your JWT secret
4. Implement rate limiting for auth endpoints
5. Use secure session management
6. Validate all incoming tokens on the server side

## Troubleshooting

If you encounter any issues:

1. Check the browser console for client-side errors
2. Check the server logs for backend errors
3. Verify your API credentials are correct
4. Ensure your callback URLs are properly configured
5. Check if your domain is properly authorized in both Google and Apple developer consoles

## Support

For any questions or issues, please open a GitHub issue or contact the development team. 