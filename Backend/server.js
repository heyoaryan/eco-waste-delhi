// Suppress punycode deprecation warning
process.noDeprecation = true;

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zerowaste?directConnection=true';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    console.error('JWT secrets not configured. Please set JWT_SECRET and JWT_REFRESH_SECRET environment variables.');
    process.exit(1);
}

// MongoDB Connection with better error handling and retry logic
const connectWithRetry = async () => {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            await mongoose.connect(MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                autoIndex: true,
                maxPoolSize: 10,
                socketTimeoutMS: 45000,
                family: 4,
                retryWrites: true,
                w: 'majority'
            });
            console.log('Connected to MongoDB successfully');
            return;
        } catch (err) {
            retries++;
            console.error(`MongoDB connection attempt ${retries} failed:`, err);
            if (retries === maxRetries) {
                console.error('Max retries reached. Exiting...');
                process.exit(1);
            }
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, retries), 10000)));
        }
    }
};

connectWithRetry();

// Enhanced error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Set proper content type
    res.setHeader('Content-Type', 'application/json');
    
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        status: 'error',
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// Session configuration with better security
app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'strict'
    },
    name: 'sessionId' // Change default session cookie name
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// Enhanced User Schema
const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long']
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    points: { 
        type: Number, 
        default: 0,
        min: [0, 'Points cannot be negative']
    },
    wasteReduced: { 
        type: Number, 
        default: 0,
        min: [0, 'Waste reduced cannot be negative']
    },
    wasteStats: {
        totalWaste: { type: Number, default: 0 },
        wasteByType: {
            plastic: { type: Number, default: 0 },
            paper: { type: Number, default: 0 },
            organic: { type: Number, default: 0 },
            electronic: { type: Number, default: 0 },
            glass: { type: Number, default: 0 },
            metal: { type: Number, default: 0 }
        },
        wasteByMethod: {
            recycling: { type: Number, default: 0 },
            composting: { type: Number, default: 0 },
            reuse: { type: Number, default: 0 },
            donation: { type: Number, default: 0 }
        },
        monthlyStats: [{
            month: { type: Date, required: true },
            total: { type: Number, default: 0 },
            byType: {
                plastic: { type: Number, default: 0 },
                paper: { type: Number, default: 0 },
                organic: { type: Number, default: 0 },
                electronic: { type: Number, default: 0 },
                glass: { type: Number, default: 0 },
                metal: { type: Number, default: 0 }
            },
            byMethod: {
                recycling: { type: Number, default: 0 },
                composting: { type: Number, default: 0 },
                reuse: { type: Number, default: 0 },
                donation: { type: Number, default: 0 }
            }
        }],
        locations: [{
            name: { type: String, required: true },
            wasteAmount: { type: Number, default: 0 },
            lastUsed: { type: Date }
        }]
    },
    rank: { 
        type: Number, 
        default: 0 
    },
    impact: {
        trees: { type: Number, default: 0 },
        water: { type: Number, default: 0 },
        co2: { type: Number, default: 0 },
        energySaved: { type: Number, default: 0 }
    },
    monthlyImpact: [{
        month: { type: Date, required: true },
        wasteReduced: { type: Number, default: 0 },
        trees: { type: Number, default: 0 },
        water: { type: Number, default: 0 },
        co2: { type: Number, default: 0 },
        energySaved: { type: Number, default: 0 }
    }],
    rewards: [{
        name: { type: String, required: true },
        description: String,
        pointsCost: { type: Number, required: true },
        status: {
            type: String,
            enum: ['locked', 'unlocked', 'redeemed'],
            default: 'locked'
        },
        redeemedAt: Date
    }],
    activities: [{
        type: {
            type: String,
            enum: ['waste_segregation', 'ewaste_disposal', 'referral', 'daily_checkin'],
            required: true
        },
        points: {
            type: Number,
            required: true
        },
        description: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    lastLogin: {
        type: Date,
        default: Date.now
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        immutable: true
    }
});

// Add indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ points: -1 });
userSchema.index({ rank: 1 });

// Pre-save middleware to update rank
userSchema.pre('save', async function(next) {
    if (this.isModified('points')) {
        const higherRankedUsers = await mongoose.model('User').countDocuments({
            points: { $gt: this.points }
        });
        this.rank = higherRankedUsers + 1;
    }
    next();
});

const User = mongoose.model('User', userSchema);

// User Activity Log Schema
const userActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    activity: {
        type: String,
        required: true,
        enum: ['login', 'logout', 'register', 'points_earned', 'waste_disposal', 'profile_update']
    },
    details: {
        type: String,
        required: true
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Add index for better query performance
userActivitySchema.index({ userId: 1, timestamp: -1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: true,  // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add body-parser limit
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced Authentication Middleware
const authenticateToken = async (req, res, next) => {
    try {
        const token = req.session.token;
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required. Please log in.' 
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'User not found. Please log in again.' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Session expired. Please log in again.' 
            });
        }
        return res.status(403).json({ 
            success: false,
            message: 'Invalid authentication. Please log in again.' 
        });
    }
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Enhanced Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        console.log('Registration attempt:', req.body);
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password });
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            console.log('Password too short');
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Email already exists:', email);
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            activities: [{
                type: 'daily_checkin',
                points: 10,
                description: 'First login bonus'
            }]
        });

        await user.save();
        console.log('User registered successfully:', { name, email });

        // Log registration activity
        await new UserActivity({
            userId: user._id,
            activity: 'register',
            details: 'User registered successfully',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        }).save();

        res.status(201).json({ 
            success: true,
            message: 'Registration successful' 
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message).join(', ');
            console.log('Validation error:', messages);
            return res.status(400).json({ message: messages });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    try {
        // Clear the session
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ 
                    success: false,
                    message: 'Failed to logout' 
                });
            }
            
            res.clearCookie('sessionId');  // Clear the session cookie
            res.status(200).json({ 
                success: true,
                message: 'Logged out successfully' 
            });
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error during logout' 
        });
    }
});

// Waste Entry endpoint
app.post('/api/waste-entry', authenticateToken, async (req, res) => {
    try {
        const { wasteType, wasteAmount, disposalMethod, location, date } = req.body;
        
        // Validate input
        if (!wasteType || !wasteAmount || !disposalMethod || !location || !date) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const amount = parseFloat(wasteAmount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Waste amount must be a positive number' });
        }

        const user = req.user;
        const currentDate = new Date(date);
        
        // Calculate impact metrics
        const impactMetrics = {
            trees: amount * 0.17,
            water: amount * 1000,
            co2: amount * 2.5,
            energySaved: amount * 50
        };

        // Update total impact
        user.impact.trees += impactMetrics.trees;
        user.impact.water += impactMetrics.water;
        user.impact.co2 += impactMetrics.co2;
        user.impact.energySaved += impactMetrics.energySaved;
        user.wasteReduced += amount;

        // Update waste statistics
        user.wasteStats.totalWaste += amount;
        user.wasteStats.wasteByType[wasteType.toLowerCase()] += amount;
        user.wasteStats.wasteByMethod[disposalMethod.toLowerCase()] += amount;

        // Update monthly waste statistics
        const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        let monthStats = user.wasteStats.monthlyStats.find(stats => 
            stats.month.getMonth() === currentMonth.getMonth() && 
            stats.month.getFullYear() === currentMonth.getFullYear()
        );

        if (!monthStats) {
            monthStats = {
                month: currentMonth,
                total: 0,
                byType: {
                    plastic: 0,
                    paper: 0,
                    organic: 0,
                    electronic: 0,
                    glass: 0,
                    metal: 0
                },
                byMethod: {
                    recycling: 0,
                    composting: 0,
                    reuse: 0,
                    donation: 0
                }
            };
            user.wasteStats.monthlyStats.push(monthStats);
        }

        monthStats.total += amount;
        monthStats.byType[wasteType.toLowerCase()] += amount;
        monthStats.byMethod[disposalMethod.toLowerCase()] += amount;

        // Update location statistics
        let locationStat = user.wasteStats.locations.find(loc => loc.name === location);
        if (!locationStat) {
            locationStat = {
                name: location,
                wasteAmount: 0,
                lastUsed: currentDate
            };
            user.wasteStats.locations.push(locationStat);
        }
        locationStat.wasteAmount += amount;
        locationStat.lastUsed = currentDate;

        // Update monthly impact
        let monthlyImpact = user.monthlyImpact.find(impact => {
            const impactDate = new Date(impact.month);
            return impactDate.getMonth() === currentDate.getMonth() && 
                   impactDate.getFullYear() === currentDate.getFullYear();
        });

        if (!monthlyImpact) {
            monthlyImpact = {
                month: currentMonth,
                wasteReduced: 0,
                trees: 0,
                water: 0,
                co2: 0,
                energySaved: 0
            };
            user.monthlyImpact.push(monthlyImpact);
        }

        monthlyImpact.wasteReduced += amount;
        monthlyImpact.trees += impactMetrics.trees;
        monthlyImpact.water += impactMetrics.water;
        monthlyImpact.co2 += impactMetrics.co2;
        monthlyImpact.energySaved += impactMetrics.energySaved;

        // Add activity and points
        const points = Math.floor(amount * 10);
        user.points += points;
        user.activities.push({
            type: 'waste_segregation',
            points,
            description: `Disposed ${amount}kg of ${wasteType} waste through ${disposalMethod} at ${location}`,
            timestamp: currentDate
        });

        await user.save();

        res.json({
            success: true,
            message: 'Waste entry recorded successfully',
            data: {
                wasteReduced: user.wasteReduced,
                totalPoints: user.points,
                impact: impactMetrics,
                monthlyImpact,
                wasteStats: {
                    total: user.wasteStats.totalWaste,
                    byType: user.wasteStats.wasteByType,
                    byMethod: user.wasteStats.wasteByMethod,
                    location: locationStat
                },
                lastEntry: {
                    wasteType,
                    wasteAmount: amount,
                    disposalMethod,
                    location,
                    date: currentDate,
                    points
                }
            }
        });
    } catch (error) {
        console.error('Error recording waste entry:', error);
        res.status(500).json({ success: false, message: 'Error recording waste entry' });
    }
});

// Waste Statistics endpoint
app.get('/api/user/waste-stats', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        
        // Get the time filter from query params
        const timeFilter = req.query.timeFilter || 'all';
        let startDate = new Date(0); // Default to all time

        if (timeFilter === 'week') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
        } else if (timeFilter === 'month') {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
        }

        // Filter monthly stats based on time filter
        const filteredStats = user.wasteStats.monthlyStats.filter(stat => 
            stat.month >= startDate
        );

        // Calculate totals for the filtered period
        const totals = {
            totalWaste: filteredStats.reduce((sum, stat) => sum + stat.total, 0),
            wasteByType: {
                plastic: filteredStats.reduce((sum, stat) => sum + stat.byType.plastic, 0),
                paper: filteredStats.reduce((sum, stat) => sum + stat.byType.paper, 0),
                organic: filteredStats.reduce((sum, stat) => sum + stat.byType.organic, 0),
                electronic: filteredStats.reduce((sum, stat) => sum + stat.byType.electronic, 0),
                glass: filteredStats.reduce((sum, stat) => sum + stat.byType.glass, 0),
                metal: filteredStats.reduce((sum, stat) => sum + stat.byType.metal, 0)
            },
            wasteByMethod: {
                recycling: filteredStats.reduce((sum, stat) => sum + stat.byMethod.recycling, 0),
                composting: filteredStats.reduce((sum, stat) => sum + stat.byMethod.composting, 0),
                reuse: filteredStats.reduce((sum, stat) => sum + stat.byMethod.reuse, 0),
                donation: filteredStats.reduce((sum, stat) => sum + stat.byMethod.donation, 0)
            }
        };

        // Get current month's data
        const currentDate = new Date();
        const currentMonthStats = user.wasteStats.monthlyStats.find(stat => 
            stat.month.getMonth() === currentDate.getMonth() && 
            stat.month.getFullYear() === currentDate.getFullYear()
        ) || {
            total: 0,
            byType: {
                plastic: 0, paper: 0, organic: 0, electronic: 0, glass: 0, metal: 0
            },
            byMethod: {
                recycling: 0, composting: 0, reuse: 0, donation: 0
            }
        };

        // Get top locations
        const topLocations = user.wasteStats.locations
            .sort((a, b) => b.wasteAmount - a.wasteAmount)
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                totalWaste: timeFilter === 'all' ? user.wasteStats.totalWaste : totals.totalWaste,
                wasteByType: timeFilter === 'all' ? user.wasteStats.wasteByType : totals.wasteByType,
                wasteByMethod: timeFilter === 'all' ? user.wasteStats.wasteByMethod : totals.wasteByMethod,
                currentMonth: currentMonthStats,
                topLocations: topLocations
            }
        });
    } catch (error) {
        console.error('Error fetching waste statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch waste statistics'
        });
    }
});

// Enhanced Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Create JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
        req.session.token = token;

        // Log login activity
        await new UserActivity({
            userId: user._id,
            activity: 'login',
            details: 'User logged in successfully',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        }).save();

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                points: user.points,
                rank: user.rank
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Enhanced Profile endpoint
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password -__v')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get recent activities
        const recentActivities = user.activities.slice(-5); // Get last 5 activities

        res.json({
            user: {
                ...user,
                activities: recentActivities
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Dashboard Data endpoint
app.get('/api/dashboard-data', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get user's activities
        const userActivities = await UserActivity.find({ userId: user._id })
            .sort({ timestamp: -1 })
            .limit(5);

        // Calculate impact metrics
        const treesImpact = (user.wasteReduced * 0.17).toFixed(1);
        const waterImpact = (user.wasteReduced * 1000).toFixed(0);
        const co2Impact = (user.wasteReduced * 2.5).toFixed(1);

        // Calculate achievements
        const achievements = Math.floor(user.points / 100);

        // Calculate community impact (assuming each kg of waste influences 2 people)
        const communityImpact = Math.floor(user.wasteReduced * 2);

        // Get user's rank
        const userRank = await User.countDocuments({ points: { $gt: user.points } }) + 1;

        // Get leaderboard data
        const leaderboard = await User.find()
            .select('name points')
            .sort({ points: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                user: {
                    name: user.name,
                    email: user.email,
                    points: user.points,
                    rank: userRank,
                    level: Math.floor(user.points / 1000) + 1
                },
                stats: {
                    wasteReduced: user.wasteReduced,
                    achievements,
                    communityImpact
                },
                impact: {
                    trees: treesImpact,
                    water: waterImpact,
                    co2: co2Impact
                },
                activities: userActivities,
                leaderboard,
                recentActivities: user.activities.slice(-5)
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
    }
});

// Add activity endpoint
app.post('/api/activity', authenticateToken, async (req, res) => {
    try {
        const { type, amount } = req.body;
        
        let points = 0;
        let description = '';

        // Calculate points based on activity type
        switch (type) {
            case 'waste_segregation':
                points = amount * 50; // 50 points per kg
                description = `Segregated ${amount}kg of waste`;
                break;
            case 'ewaste_disposal':
                points = 100; // 100 points per item
                description = 'Disposed e-waste item';
                break;
            case 'referral':
                points = 200; // 200 points per referral
                description = 'Referred a new user';
                break;
            case 'daily_checkin':
                points = 10; // 10 points per day
                description = 'Daily check-in bonus';
                break;
            default:
                return res.status(400).json({ message: 'Invalid activity type' });
        }

        // Update user
        const user = await User.findById(req.user._id);
        user.points += points;
        user.activities.push({
            type,
            points,
            description
        });

        if (type === 'waste_segregation') {
            user.wasteReduced += amount;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Activity recorded successfully',
            points: points,
            totalPoints: user.points
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await User.find()
            .select('name points rank')
            .sort({ points: -1 })
            .limit(10);

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Fetch user activity logs
app.get('/api/user/activity', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const activities = await UserActivity.find({ userId: req.user._id })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const totalActivities = await UserActivity.countDocuments({ userId: req.user._id });

        res.json({
            success: true,
            activities,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalActivities / limit),
                totalActivities
            }
        });
    } catch (error) {
        console.error('Error fetching user activities:', error);
        res.status(500).json({ success: false, message: 'Error fetching activity logs' });
    }
});

// Get user impact data
app.get('/api/user/impact', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('impact monthlyImpact wasteReduced')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get current month's impact
        const now = new Date();
        const currentMonthImpact = user.monthlyImpact.find(impact => {
            const impactDate = new Date(impact.month);
            return impactDate.getMonth() === now.getMonth() && 
                   impactDate.getFullYear() === now.getFullYear();
        }) || {
            wasteReduced: 0,
            trees: 0,
            water: 0,
            co2: 0,
            energySaved: 0
        };

        // Get previous month's impact for comparison
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        const previousMonthImpact = user.monthlyImpact.find(impact => {
            const impactDate = new Date(impact.month);
            return impactDate.getMonth() === prevMonth.getMonth() && 
                   impactDate.getFullYear() === prevMonth.getFullYear();
        }) || {
            wasteReduced: 0,
            trees: 0,
            water: 0,
            co2: 0,
            energySaved: 0
        };

        // Calculate percentage changes
        const calculateChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous * 100).toFixed(1);
        };

        const trends = {
            wasteReduced: calculateChange(currentMonthImpact.wasteReduced, previousMonthImpact.wasteReduced),
            trees: calculateChange(currentMonthImpact.trees, previousMonthImpact.trees),
            water: calculateChange(currentMonthImpact.water, previousMonthImpact.water),
            co2: calculateChange(currentMonthImpact.co2, previousMonthImpact.co2),
            energySaved: calculateChange(currentMonthImpact.energySaved, previousMonthImpact.energySaved)
        };

        res.json({
            success: true,
            data: {
                totalImpact: user.impact,
                currentMonth: currentMonthImpact,
                previousMonth: previousMonthImpact,
                trends
            }
        });
    } catch (error) {
        console.error('Error fetching impact data:', error);
        res.status(500).json({ success: false, message: 'Error fetching impact data' });
    }
});

// Get user rewards
app.get('/api/user/rewards', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('rewards points')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Define available rewards if not present
        const defaultRewards = [
            {
                name: 'Eco-friendly Bag',
                description: 'A reusable shopping bag made from recycled materials',
                pointsCost: 500,
                status: user.points >= 500 ? 'unlocked' : 'locked'
            },
            {
                name: 'Plant a Tree Kit',
                description: 'Get a tree planting kit and contribute to reforestation',
                pointsCost: 1000,
                status: user.points >= 1000 ? 'unlocked' : 'locked'
            },
            {
                name: 'Solar Power Bank',
                description: 'A sustainable way to charge your devices',
                pointsCost: 2000,
                status: user.points >= 2000 ? 'unlocked' : 'locked'
            }
        ];

        // Update user's rewards if they don't exist
        if (!user.rewards || user.rewards.length === 0) {
            await User.findByIdAndUpdate(req.user._id, { rewards: defaultRewards });
        }

        res.json({
            success: true,
            data: {
                rewards: user.rewards || defaultRewards,
                points: user.points
            }
        });
    } catch (error) {
        console.error('Error fetching rewards:', error);
        res.status(500).json({ success: false, message: 'Error fetching rewards' });
    }
});

// Redeem reward
app.post('/api/user/rewards/redeem', authenticateToken, async (req, res) => {
    try {
        const { rewardName } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const reward = user.rewards.find(r => r.name === rewardName);
        if (!reward) {
            return res.status(404).json({ success: false, message: 'Reward not found' });
        }

        if (reward.status === 'redeemed') {
            return res.status(400).json({ success: false, message: 'Reward already redeemed' });
        }

        if (user.points < reward.pointsCost) {
            return res.status(400).json({ success: false, message: 'Insufficient points' });
        }

        // Update reward status and user points
        reward.status = 'redeemed';
        reward.redeemedAt = new Date();
        user.points -= reward.pointsCost;

        await user.save();

        res.json({
            success: true,
            message: 'Reward redeemed successfully',
            data: {
                reward,
                remainingPoints: user.points
            }
        });
    } catch (error) {
        console.error('Error redeeming reward:', error);
        res.status(500).json({ success: false, message: 'Error redeeming reward' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});