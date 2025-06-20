# ♻️ Zero Waste Delhi

**Zero Waste Delhi** is a smart waste management initiative designed to promote eco-friendly waste disposal, community participation, and gamified rewards in the capital city. It combines IoT-enabled Smart Bins with a web and mobile platform that tracks individual contributions, promotes awareness, and rewards responsible waste behavior.

## 🚀 Project Objective

To create a tech-driven, eco-conscious solution for urban waste management by:

- Encouraging responsible waste disposal behavior
- Enabling real-time tracking through IoT Smart Bins
- Using gamification to motivate and reward citizens
- Reducing overall landfill waste and improving recycling rates

---

## 🧠 Problem Statement

Delhi generates over 10,000 tons of waste daily. Most of it ends up in landfills due to poor segregation, lack of awareness, and inefficient tracking. There's a need for a **smart, trackable, and rewarding** waste management system that involves citizens actively.

---

## 🌟 Key Features

- 🗑️ **Smart Bin**: Equipped with a weight sensor to measure and record waste deposited.
- 📲 **User Dashboard**: Track your contributions, view stats, and check your impact.
- 🏆 **Leaderboard System**: Weekly rewards for top contributors.
- 🔔 **Notifications**: Alerts for bin status and reward updates.
- 🌐 **Gamified Web Portal**: User registration, profile, and performance stats.

---

## 🛠️ Tech Stack

### Frontend:
- React.js
- Tailwind CSS
- Framer Motion (Animations)

### Backend:
- Node.js
- Express.js
- MongoDB (Database)
- Firebase Auth / JWT for Login/Signup

### IoT Hardware:
- Arduino / NodeMCU
- Load Cell + HX711 (Weight Sensor)
- WiFi Module for sending data to server

---

## 🖥️ Website Features

- Home Page with project info and stats
- Login / Signup using Firebase or MongoDB
- User Dashboard with real-time waste data
- Weekly Leaderboard and Rewards
- Admin Panel to monitor bin status and user contributions

---

## 📦 How to Run Locally

1. **Clone the Repository**
   ```bash
   git clone https://github.com/<your-username>/zero-waste-delhi.git
   cd zero-waste-delhi



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
