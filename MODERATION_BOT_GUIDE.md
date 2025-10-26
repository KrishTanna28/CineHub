# 🤖 AI-Powered Moderation Bot System

## Overview
CineHub features an intelligent AI-powered moderation bot that automatically reviews content, adjusts points, and removes spam/inappropriate content to maintain community quality.

---

## 🎯 Key Features

### 1. **Automatic Content Analysis**
- ✅ AI-powered review analysis using Google Gemini
- ✅ Pattern-based spam detection (fallback)
- ✅ Offensive content filtering
- ✅ Duplicate content detection
- ✅ Quality scoring (0-100)
- ✅ Sentiment analysis

### 2. **Smart Point Adjustment**
- ✅ Quality bonuses for excellent reviews
- ✅ Penalties for spam/low-effort content
- ✅ Constructive criticism rewards
- ✅ Insightful analysis bonuses
- ✅ Automatic point recalculation

### 3. **Automated Actions**
- ✅ Remove spam automatically
- ✅ Flag suspicious content for manual review
- ✅ Adjust user points in real-time
- ✅ Log all moderation actions
- ✅ Update user statistics

---

## 🔍 Analysis Criteria

### AI Analysis Factors

#### 1. **Spam Detection**
- Promotional content
- Irrelevant content
- Gibberish/nonsense
- Excessive repetition
- URL/contact info spam

#### 2. **Offensive Content**
- Hate speech
- Harassment
- Inappropriate language
- Personal attacks
- Discriminatory content

#### 3. **Spoiler Detection**
- Plot reveals without tags
- Ending details
- Major twists
- Character deaths
- Surprise elements

#### 4. **Quality Assessment**
- Constructive criticism
- Insightful analysis
- Well-articulated thoughts
- Balanced perspective
- Depth of analysis

#### 5. **Effort Level**
- Content length
- Substance vs fluff
- Unique perspective
- Thoughtful reasoning
- Proper grammar

---

## 📊 Point Adjustments

### Bonuses (Positive Points)

| Criteria | Points | Description |
|----------|--------|-------------|
| **Quality Score 90+** | +30 | Exceptional review quality |
| **Quality Score 75-89** | +20 | High-quality review |
| **Quality Score 60-74** | +10 | Good quality review |
| **Constructive Review** | +15 | Balanced, helpful criticism |
| **Insightful Analysis** | +20 | Deep, unique perspective |
| **Thoughtful Reply** | +5 | Well-written reply (100+ chars) |

### Penalties (Negative Points)

| Criteria | Points | Action |
|----------|--------|--------|
| **Spam Detected** | -50 | Auto-remove |
| **Offensive Content** | -30 | Auto-remove |
| **Duplicate Content** | -20 | Flag for review |
| **Low Effort** | -15 | Warning |
| **Untagged Spoilers** | -15 | Flag for review |
| **Spam Reply** | -20 | Auto-remove |
| **Offensive Reply** | -15 | Auto-remove |

**Note:** Properly tagging spoilers is NOT rewarded (it's expected behavior). You only get penalized if you DON'T tag spoilers when your review contains them.

---

## 🚨 Automatic Actions

### 1. **Auto-Remove** (Immediate)
```
Triggers:
- Spam score > 80%
- Offensive content detected
- Multiple spam patterns matched
- Excessive URL/contact info

Result:
- Review marked as removed
- User loses points
- Content hidden from public
- Logged for audit
```

### 2. **Flag for Manual Review**
```
Triggers:
- Duplicate content (80%+ similarity)
- Untagged spoilers
- Borderline offensive content
- Quality score < 30

Result:
- Review flagged
- Admin notified
- User warned
- Points adjusted
```

### 3. **Quality Bonus** (Automatic)
```
Triggers:
- Quality score > 60
- Constructive criticism
- Insightful analysis
- Well-written content

Result:
- Bonus points awarded
- User encouraged
- Review promoted
```

---

## 🔄 Moderation Workflow

### Real-Time Moderation
```
1. User submits review
   ↓
2. Review saved to database
   ↓
3. Points calculated & awarded
   ↓
4. AI moderation triggered (async)
   ↓
5. Content analyzed by AI
   ↓
6. Actions determined
   ↓
7. Points adjusted
   ↓
8. Content removed/flagged if needed
   ↓
9. User notified (if applicable)
   ↓
10. Action logged
```

### Batch Moderation (Every 5 minutes)
```
1. Cron job triggers
   ↓
2. Fetch unmoderated reviews (limit 50)
   ↓
3. Process each review
   ↓
4. Apply actions
   ↓
5. Log results
   ↓
6. Wait for next cycle
```

---

## 🛡️ Spam Detection Methods

### Pattern-Based Detection

#### 1. **Repeated Characters**
```javascript
Pattern: /(.)\1{10,}/i
Example: "aaaaaaaaaaa" or "!!!!!!!!!!!!"
Action: Auto-remove
```

#### 2. **URL Detection**
```javascript
Pattern: /https?:\/\//gi
Example: "Check out http://spam.com"
Action: Auto-remove
```

#### 3. **Spam Keywords**
```javascript
Keywords: buy, click, visit, download, free, win, prize
Example: "Click here to win free prizes!"
Action: Auto-remove
```

#### 4. **Contact Info**
```javascript
Patterns: Phone numbers, email addresses
Example: "Call me at 555-1234"
Action: Auto-remove
```

#### 5. **Low Word Diversity**
```javascript
Check: Unique words / Total words < 30%
Example: "great great great great movie great"
Action: Flag as spam
```

### AI-Based Detection

Uses Google Gemini to analyze:
- Context and relevance
- Intent (promotional vs genuine)
- Coherence and logic
- Natural language patterns
- Sentiment authenticity

---

## 📈 Quality Scoring

### Factors (0-100 scale)

**Content Length** (30 points max)
- < 50 chars: 0-10 points
- 50-150 chars: 10-20 points
- 150-300 chars: 20-30 points
- 300+ chars: 30 points

**Vocabulary Diversity** (20 points max)
- Unique word ratio
- Vocabulary richness
- Sentence variety

**Grammar & Structure** (20 points max)
- Proper punctuation
- Sentence structure
- Paragraph organization

**Insight & Analysis** (30 points max)
- Depth of thought
- Unique perspective
- Supporting arguments
- Balanced view

---

## 🎯 Real-World Examples

### Example 1: High-Quality Review (Bonus)
```
Review: "This film masterfully explores themes of identity and 
belonging through stunning cinematography and nuanced performances. 
The director's use of color symbolism particularly stands out, 
creating a visual metaphor that enhances the narrative. While the 
pacing slows in the second act, it serves to build tension 
effectively. Overall, a thought-provoking piece that rewards 
multiple viewings."

AI Analysis:
- Quality Score: 92/100
- Constructive: Yes
- Insightful: Yes
- Spam: No
- Offensive: No

Actions:
✅ Quality Bonus: +30 points
✅ Constructive Bonus: +15 points
✅ Insightful Bonus: +20 points
Total Adjustment: +65 points
```

### Example 2: Spam Review (Removed)
```
Review: "OMG BEST MOVIE EVER!!! Click here to watch free movies 
at moviesite.com!!! Download now and win prizes!!!"

AI Analysis:
- Quality Score: 5/100
- Spam: Yes (URLs, spam keywords)
- Pattern Match: URLs detected

Actions:
🚫 Auto-removed
⚠️ Penalty: -50 points
📝 Logged: Spam removal
```

### Example 3: Low Effort (Penalty)
```
Review: "good movie"

AI Analysis:
- Quality Score: 15/100
- Low Effort: Yes (too short, no substance)
- Spam: No
- Offensive: No

Actions:
⚠️ Low Effort Penalty: -15 points
💡 Suggestion: "Add more details to earn bonus points"
```

### Example 4: Untagged Spoilers (Flagged & Penalized)
```
Review: "Great movie! I loved when the main character died at 
the end and the twist that he was actually the villain all along."

AI Analysis:
- Quality Score: 60/100
- Contains Spoilers: Yes
- Spoiler Tagged: No
- Spam: No

Actions:
🚩 Flagged for review
⚠️ Penalty: -15 points
📧 User notified: "Please use spoiler tags for content revealing plot details"
```

### Example 4b: Properly Tagged Spoilers (No Penalty)
```
Review: "Great movie! [Contains spoilers about ending and major twist]"
Spoiler Tag: ✅ YES

AI Analysis:
- Quality Score: 60/100
- Contains Spoilers: Yes
- Spoiler Tagged: Yes ✅
- Spam: No

Actions:
✅ No penalty (proper tagging)
💡 Note: "Spoiler tag is expected behavior, not rewarded"
```

### Example 5: Offensive Content (Removed)
```
Review: "[Contains offensive/hateful content]"

AI Analysis:
- Offensive: Yes
- Hate Speech: Detected

Actions:
🚫 Auto-removed
⚠️ Penalty: -30 points
🚨 Admin notified
📝 User warned
```

---

## 🔧 Technical Implementation

### Backend Architecture

```
services/
├── moderationBot.js          # Main moderation logic
├── openai.service.js         # AI integration
└── spam-detector.js          # Pattern matching

jobs/
└── moderationJob.js          # Scheduled batch processing

models/
└── Review.js                 # Added moderation fields
    ├── isFlagged
    ├── flagReason
    ├── isRemoved
    ├── removalReason
    ├── moderatedAt
    └── moderatedBy
```

### API Integration

```javascript
// Google Gemini Pro
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const result = await model.generateContent(prompt);
const response = await result.response;
const text = response.text();
```

### Database Schema

```javascript
// Review Model
{
  // ... existing fields
  
  // Moderation fields
  isFlagged: Boolean,
  flagReason: String,
  isRemoved: Boolean,
  removalReason: String,
  moderatedAt: Date,
  moderatedBy: String, // 'AI_BOT' or admin ID
  flagCount: Number
}
```

---

## ⚙️ Configuration

### Environment Variables

```env
# Google Gemini API Key (required for AI moderation)
GEMINI_API_KEY=your_gemini_api_key_here

# Moderation Settings
MODERATION_ENABLED=true
MODERATION_BATCH_SIZE=50
MODERATION_INTERVAL_MINUTES=5

# Thresholds
SPAM_THRESHOLD=0.8
QUALITY_BONUS_THRESHOLD=60
LOW_EFFORT_THRESHOLD=50
```

### Customization

```javascript
// Adjust spam patterns
spamPatterns = [
  /your-custom-pattern/gi,
  // Add more patterns
];

// Adjust point values
const PENALTIES = {
  SPAM: -50,
  OFFENSIVE: -30,
  DUPLICATE: -20,
  LOW_EFFORT: -15
};

const BONUSES = {
  QUALITY_HIGH: +30,
  CONSTRUCTIVE: +15,
  INSIGHTFUL: +20
};
```

---

## 📊 Monitoring & Logs

### Moderation Logs

```javascript
{
  timestamp: "2024-01-25T10:30:00Z",
  reviewId: "review_123",
  userId: "user_456",
  action: "REMOVE",
  reason: "Spam detected",
  pointsAdjusted: -50,
  analysis: {
    isSpam: true,
    qualityScore: 5,
    // ... more details
  }
}
```

### Point Adjustment Logs

```javascript
{
  timestamp: "2024-01-25T10:30:00Z",
  userId: "user_456",
  reviewId: "review_123",
  adjustment: +20,
  reason: "Insightful analysis bonus",
  previousTotal: 1500,
  newTotal: 1520
}
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install @google/generative-ai node-cron
```

### 2. Configure Environment

```bash
# Add to .env file
GEMINI_API_KEY=your_api_key_here
```

**Get your Gemini API key:**
1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy and paste into .env file

### 3. Start Moderation Job

```javascript
// In server.js or app.js
import moderationJob from './jobs/moderationJob.js';

// Start the scheduled job
moderationJob.start();
```

### 4. Test Moderation

```javascript
// Manual test
import moderationBot from './services/moderationBot.js';

const result = await moderationBot.moderateReview(review, user);
console.log(result);
```

---

## 🎯 Best Practices

### For Developers

1. **Always log moderation actions** for audit trails
2. **Run moderation async** to not block user requests
3. **Set rate limits** on AI API calls
4. **Cache AI responses** for similar content
5. **Monitor false positives** and adjust thresholds
6. **Provide appeal mechanism** for users

### For Admins

1. **Review flagged content** regularly
2. **Adjust thresholds** based on community
3. **Monitor bot performance** metrics
4. **Handle appeals** promptly
5. **Update spam patterns** as needed
6. **Communicate** moderation policies clearly

---

## 🔮 Future Enhancements

### Planned Features

- **Machine Learning Model**: Train custom model on your data
- **User Reputation System**: Trust score affects moderation
- **Appeal System**: Users can contest removals
- **Moderation Dashboard**: Admin panel for oversight
- **Real-time Alerts**: Notify admins of serious violations
- **Pattern Learning**: Bot learns from admin decisions
- **Multi-language Support**: Moderate in multiple languages
- **Image Moderation**: Analyze uploaded images
- **Toxicity Scoring**: Granular toxicity levels
- **Auto-ban System**: Repeat offenders auto-banned

---

## 📞 Support

### Common Issues

**Q: Bot removing legitimate reviews?**
A: Adjust `SPAM_THRESHOLD` and review patterns

**Q: Not detecting spam?**
A: Add more patterns or lower threshold

**Q: AI API errors?**
A: Check API key and rate limits, fallback to patterns

**Q: Points not adjusting?**
A: Check logs for errors, verify user permissions

---

## 📈 Performance Metrics

### Target Metrics

- **Spam Detection Rate**: > 95%
- **False Positive Rate**: < 5%
- **Processing Time**: < 2 seconds per review
- **API Cost**: < $0.01 per review
- **User Satisfaction**: > 90%

---

**The moderation bot keeps your community safe and high-quality automatically!** 🤖✨
