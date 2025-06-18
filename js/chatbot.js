class Chatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.initializeElements();
        this.addEventListeners();
        // Add initial greeting after a short delay
        setTimeout(() => {
            this.addMessage("👋 Hi! I'm your Zero Waste Delhi Assistant. I can help you with:", 'bot');
            this.addMessage(`• Waste segregation tips 
• Recycling information 
• Reward program details 
• Collection schedules 
• Eco-friendly practices 
What would you like to know about?`, 'bot');
        }, 1000);
    }

    initializeElements() {
        this.container = document.querySelector('.chatbot-container');
        this.window = document.querySelector('.chatbot-window');
        this.messagesContainer = document.querySelector('.chat-messages');
        this.input = document.querySelector('.chat-input input');
        this.sendButton = document.querySelector('.chat-input button');

        // Update header with AI image
        const header = document.querySelector('.chatbot-header h3');
        header.innerHTML = `
            <img src="assets/AI.png" alt="Bin Buddy" class="header-ai-icon">
            <span>Bin Buddy</span>
        `;
    }

    addEventListeners() {
        // Toggle chat
        document.querySelector('.chatbot-button').addEventListener('click', () => this.toggleChat());
        
        // Close chat
        document.querySelector('.close-chat').addEventListener('click', () => this.toggleChat());
        
        // Send message
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.window.classList.toggle('active');
        if (this.isOpen) {
            this.input.focus();
        }
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        this.input.value = '';

        // Show typing indicator
        this.addTypingIndicator();

        try {
            // Here you would typically make an API call to your AI service
            // For now, we'll simulate a response
            const response = await this.getAIResponse(message);
            this.removeTypingIndicator();
            this.addMessage(response, 'bot');
        } catch (error) {
            this.removeTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = `${sender}-avatar`;
        
        // Only add icon for user avatar, bot avatar is handled by CSS
        if (sender === 'user') {
            const icon = document.createElement('i');
            icon.className = 'fas fa-user';
            avatar.appendChild(icon);
        }

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Format the content if it contains bullet points
        if (content.includes('•')) {
            messageContent.style.whiteSpace = 'pre-line';
            messageContent.style.lineHeight = '2';
            messageContent.style.fontSize = '15px';
            messageContent.style.fontWeight = '400';
            messageContent.style.letterSpacing = '0.3px';
        }
        
        messageContent.textContent = content;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-indicator';
        typingDiv.innerHTML = `
            <div class="bot-avatar">
                <!-- Icon removed as it's now handled by CSS background image -->
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(typingDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = this.messagesContainer.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async getAIResponse(message) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const lowercaseMessage = message.toLowerCase();
        
        // Comprehensive response mapping
        const responses = {
            // Greetings
            'hello': 'Hi there! How can I help you with waste management today?',
            'hi': 'Hello! Ready to help you with your eco-friendly journey!',
            'hey': 'Hey! How can I assist you with waste management?',

            // Waste Segregation
            'how to segregate waste': `Here's how to segregate waste properly:
1. Green Bin - Organic/Wet waste (food, leaves)
2. Blue Bin - Dry waste (paper, plastic, metal)
3. Black Bin - Hazardous waste (batteries, chemicals)
4. Red Bin - Medical waste

Would you like specific details about any category?`,

            'what goes in green bin': `The GREEN bin is for organic/wet waste including:
• Food scraps and leftovers
• Fruit and vegetable peels
• Tea bags and coffee grounds
• Garden waste (leaves, flowers)
• Eggshells
• Cooked food waste

This waste can be composted!`,

            'what goes in blue bin': `The BLUE bin is for dry waste including:
• Paper and cardboard
• Plastic bottles and containers
• Metal cans and foil
• Glass bottles and jars
• Packaging material
• Newspapers and magazines

Make sure items are clean and dry!`,

            // Points and Rewards
            'how to earn points': `You can earn points through various activities:
• Segregated waste disposal: 50 points/kg
• E-waste recycling: 100 points/item
• Regular recycling: 75 points/kg
• Referring friends: 200 points/referral
• Daily streak bonus: 20 points/day

Would you like to know about redeeming points?`,

            'rewards': `We offer exciting rewards including:
• Shopping vouchers (Amazon, Flipkart)
• Discount coupons for eco-friendly products
• Free plants and gardening supplies
• Public transport passes
• Movie tickets

Current special: Get ₹200 off on eco-friendly products at 2000 points!`,

            // Collection Schedule
            'collection schedule': `Waste collection schedule:
• Organic Waste: Daily (Morning)
• Dry Waste: Tuesday & Friday
• Hazardous Waste: Last Saturday
• E-Waste: First Sunday

You can also request special pickup through our app!`,

            // Composting
            'composting': `Here's a guide to home composting:
1. Layer green waste (kitchen scraps) with brown waste (leaves)
2. Keep the pile moist but not wet
3. Turn the pile weekly
4. Ready in 2-3 months

Would you like specific composting tips?`,

            // E-waste
            'e-waste': `E-waste handling guidelines:
• Never mix with regular waste
• Drop at designated collection centers
• Eligible for bonus points
• Schedule pickup through app
• Remove batteries before disposal

Need locations of e-waste centers?`,

            // Default responses for unknown queries
            'default': `I understand you want to know about waste management. Could you please be more specific? You can ask about:
• Waste segregation
• Points and rewards
• Collection schedule
• Composting tips
• E-waste disposal`,

            // Help command
            'help': `I can help you with:
1. Waste Segregation Guidelines
2. Points & Rewards Program
3. Collection Schedules
4. Composting Tips
5. E-waste Disposal
6. Eco-friendly Practices

What would you like to know more about?`,

            // Location based services
            'nearest center': `To find the nearest recycling center:
1. Open our app
2. Go to 'Locations' tab
3. Enable location services
4. View centers on map

Or share your area name for manual search.`,

            // Educational content
            'tips': `Eco-friendly daily tips:
1. Carry reusable bags
2. Use water wisely
3. Segregate waste
4. Avoid single-use plastic
5. Compost organic waste
6. Choose sustainable products

Want detailed info on any tip?`,

            // App related
            'app': `Our mobile app features:
• QR code scanning
• Points tracking
• Reward redemption
• Collection scheduling
• Center locations
• Educational content

Download now from App Store or Play Store!`,

            // Feedback and support
            'contact': `You can reach us through:
• Email: support@zerowastedelhi.org
• Phone: 1800-WASTE-HELP
• App: In-app support
• Office: Mon-Sat, 9AM-6PM

How else can I assist you?`,

            'bye': 'Thank you for chatting! Remember, every small step towards waste management counts. Have a great day! 🌱'
        };

        // Check for partial matches in the message
        for (const [key, value] of Object.entries(responses)) {
            if (lowercaseMessage.includes(key)) {
                return value;
            }
        }

        // If no match found, try to provide a contextual response
        if (lowercaseMessage.includes('waste')) {
            return responses['how to segregate waste'];
        } else if (lowercaseMessage.includes('point') || lowercaseMessage.includes('reward')) {
            return responses['how to earn points'];
        } else if (lowercaseMessage.includes('schedule') || lowercaseMessage.includes('timing')) {
            return responses['collection schedule'];
        } else if (lowercaseMessage.includes('compost')) {
            return responses['composting'];
        } else if (lowercaseMessage.includes('electronic') || lowercaseMessage.includes('laptop') || lowercaseMessage.includes('phone')) {
            return responses['e-waste'];
        }

        return responses.default;
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Chatbot();
}); 