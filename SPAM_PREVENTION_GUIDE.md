# 🛡️ Spam Prevention System

## Overview
CineHub features a multi-layered spam prevention system that allows users to post multiple legitimate reviews and replies while preventing spam, abuse, and low-quality content.

---

## 🎯 Key Principles

### ✅ **What's Allowed**
- Multiple reviews on different movies/shows
- Multiple replies to different reviews
- Thoughtful, unique content for each post
- Reasonable posting frequency

### ❌ **What's Prevented**
- Duplicate reviews on same content
- Copy-paste reviews across different media
- Rapid-fire posting (too fast)
- Identical replies
- Excessive posting (rate limits)
- Spam patterns (URLs, promotional content)

---

## 🔒 Protection Layers

### Layer 1: **Rate Limiting**

#### Review Rate Limits
- **Maximum**: 10 reviews per hour
- **Cooldown**: 30 seconds between reviews
- **Purpose**: Prevent rapid-fire spam

#### Reply Rate Limits
- **Maximum**: 30 replies per hour
- **Cooldown**: 10 seconds between replies
- **Duplicate Prevention**: 1 minute between replies to same review

**Example:**
```
User posts review #1 → ✅ Allowed
User posts review #2 (10 seconds later) → ❌ Blocked
  "Please wait 20 seconds before posting again"

User posts review #2 (35 seconds later) → ✅ Allowed
```

---

### Layer 2: **Duplicate Prevention**

#### Same Media Check
- **Rule**: One review per media item per user
- **Action**: Suggest editing existing review instead

**Example:**
```
User reviews "Inception" → ✅ Allowed
User tries to review "Inception" again → ❌ Blocked
  "You have already reviewed this content. Edit your existing review instead."
```

#### Copy-Paste Detection
- **Algorithm**: Jaccard similarity index
- **Threshold**: 70% similarity
- **Scope**: Checks last 5 reviews

**How it works:**
```javascript
Review 1: "This movie has great acting and cinematography"
Review 2: "This film has great acting and cinematography"
Similarity: 85% → ❌ Blocked

Review 1: "Amazing thriller with plot twists"
Review 2: "Heartwarming drama about family"
Similarity: 15% → ✅ Allowed
```

---

### Layer 3: **Rapid-Fire Detection**

#### Minimum Intervals
- **Reviews**: 30 seconds apart
- **Replies**: 10 seconds apart

#### Why?
- Legitimate users need time to think and write
- Bots/spammers post instantly
- Prevents accidental double-posting

**Example:**
```
User posts review at 10:00:00
User posts review at 10:00:15 → ❌ Blocked (only 15s)
  "Please slow down. Wait 15 seconds between reviews."

User posts review at 10:00:35 → ✅ Allowed (35s passed)
```

---

### Layer 4: **Spam Score System**

#### Score Calculation (0-100)

**Factors:**
1. **Removed Reviews Ratio** (up to 40 points)
   - Formula: `(removed / total) × 40`
   
2. **Flagged Reviews Ratio** (up to 30 points)
   - Formula: `(flagged / total) × 30`
   
3. **Negative Engagement** (up to 20 points)
   - Formula: `(dislikes / totalVotes) × 20`
   - Minimum: 10 votes required
   
4. **Duplicate Content Flag** (10 points)
   - Detected copy-paste behavior

**Score Thresholds:**
- **0-30**: Good user ✅
- **31-60**: Watch list ⚠️
- **61-80**: Suspicious 🚨
- **81-100**: Blocked 🚫

**Example:**
```
User Stats:
- Total reviews: 20
- Removed: 4 (20%)
- Flagged: 2 (10%)
- Likes: 50, Dislikes: 30 (37.5% dislikes)
- Duplicate content: Yes

Spam Score Calculation:
- Removal ratio: 0.20 × 40 = 8 points
- Flag ratio: 0.10 × 30 = 3 points
- Dislike ratio: 0.375 × 20 = 7.5 points
- Duplicate flag: 10 points
Total: 28.5 points → Good user ✅
```

---

### Layer 5: **Content Similarity Check**

#### Algorithm
Uses **Jaccard Index** for similarity:
```
Similarity = (Common Words) / (Total Unique Words)
```

#### Process
1. Extract words > 3 characters
2. Remove punctuation
3. Convert to lowercase
4. Calculate intersection and union
5. Compare ratio

**Example:**
```
Review A: "This movie has excellent acting and great cinematography"
Review B: "This film has excellent acting and great cinematography"

Words A: {this, movie, excellent, acting, great, cinematography}
Words B: {this, film, excellent, acting, great, cinematography}

Common: {this, excellent, acting, great, cinematography} = 5
Total Unique: 7
Similarity: 5/7 = 71% → ❌ Too similar
```

---

## 📊 Rate Limit Details

### Review Limits

| Time Period | Max Reviews | Cooldown |
|-------------|-------------|----------|
| Per Hour | 10 | - |
| Between Posts | - | 30 seconds |
| Same Media | 1 (lifetime) | - |

### Reply Limits

| Time Period | Max Replies | Cooldown |
|-------------|-------------|----------|
| Per Hour | 30 | - |
| Between Posts | - | 10 seconds |
| Same Review | - | 1 minute |
| Duplicate Content | 0 | - |

---

## 🚨 Error Messages

### Rate Limit Exceeded
```json
{
  "success": false,
  "message": "Too many reviews. Please wait 1 hour before posting again.",
  "retryAfter": "1 hour"
}
```

### Too Fast
```json
{
  "success": false,
  "message": "Please slow down. Wait 15 seconds between reviews.",
  "retryAfter": "15 seconds"
}
```

### Duplicate Content
```json
{
  "success": false,
  "message": "You have already reviewed this content. You can edit your existing review instead."
}
```

### Similar Content
```json
{
  "success": false,
  "message": "This review appears to be very similar to your recent reviews. Please write unique content for each review."
}
```

### High Spam Score
```json
{
  "success": false,
  "message": "Your account has been flagged for spam. Please contact support."
}
```

---

## 🎯 Real-World Scenarios

### Scenario 1: Legitimate Power User ✅
```
Timeline:
10:00 - Reviews "Inception" (detailed, 500 chars) → ✅
10:01 - Reviews "Interstellar" (different content) → ✅
10:02 - Reviews "The Dark Knight" (unique analysis) → ✅
10:03 - Reviews "Dunkirk" (original thoughts) → ✅

Result: All allowed (different content, reasonable pace)
```

### Scenario 2: Rapid-Fire Spammer ❌
```
Timeline:
10:00:00 - Reviews "Movie A" → ✅
10:00:05 - Reviews "Movie B" → ❌ (too fast)
10:00:10 - Reviews "Movie C" → ❌ (too fast)

Result: Only first review allowed
Error: "Please slow down. Wait 25 seconds between reviews."
```

### Scenario 3: Copy-Paste Spammer ❌
```
Review 1: "Great movie with amazing visuals and sound"
Review 2: "Great film with amazing visuals and sound"
Review 3: "Great show with amazing visuals and sound"

Result: Review 1 ✅, Review 2 ❌ (71% similar)
Error: "This review appears to be very similar to your recent reviews."
```

### Scenario 4: Duplicate Attempt ❌
```
User reviews "Inception" → ✅
User tries to review "Inception" again → ❌

Error: "You have already reviewed this content. Edit your existing review instead."
```

### Scenario 5: Reply Spam ❌
```
10:00:00 - Reply to Review A → ✅
10:00:05 - Reply to Review B → ✅
10:00:08 - Reply to Review C → ❌ (too fast)

Error: "Please slow down. Wait 2 seconds between replies."
```

---

## 🔧 Technical Implementation

### Middleware Flow
```
User Request
    ↓
Authentication Check
    ↓
Spam Prevention Middleware
    ↓
├─ Rate Limit Check
├─ Duplicate Check
├─ Similarity Check
├─ Rapid-Fire Check
└─ Spam Score Check
    ↓
Controller (if all checks pass)
    ↓
Database Save
    ↓
Response
```

### Cache System
```javascript
// In-memory cache for rate limiting
const rateLimitCache = new Map();

// Structure:
{
  "userId_last_review": timestamp,
  "userId_last_reply": timestamp
}

// Auto-cleanup: Entries older than 1 hour removed
```

---

## ⚙️ Configuration

### Adjustable Parameters

```javascript
// In spamPrevention.js

// Rate Limits
const MAX_REVIEWS_PER_HOUR = 10;
const MAX_REPLIES_PER_HOUR = 30;

// Cooldowns (milliseconds)
const REVIEW_COOLDOWN = 30000; // 30 seconds
const REPLY_COOLDOWN = 10000;  // 10 seconds
const SAME_REVIEW_REPLY_COOLDOWN = 60000; // 1 minute

// Similarity Threshold
const SIMILARITY_THRESHOLD = 0.7; // 70%

// Spam Score Threshold
const SPAM_BLOCK_THRESHOLD = 80; // Block at 80+
```

---

## 📈 Monitoring

### Track Spam Attempts
```javascript
// Log spam prevention blocks
console.log('Spam prevented:', {
  userId: '...',
  type: 'rate_limit',
  message: 'Too many reviews',
  timestamp: Date.now()
});
```

### User Spam Score
```javascript
// Check user's spam score
const score = await calculateSpamScore(userId);
console.log(`User ${userId} spam score: ${score}/100`);
```

---

## 🎨 Frontend Integration

### Handle Rate Limit Errors
```javascript
try {
  await reviewAPI.createReview(data);
} catch (error) {
  if (error.status === 429) {
    // Rate limit exceeded
    showError(`Too many requests. ${error.retryAfter}`);
    
    // Optionally disable submit button
    setSubmitDisabled(true);
    setTimeout(() => setSubmitDisabled(false), 30000);
  }
}
```

### Show Cooldown Timer
```javascript
const [cooldown, setCooldown] = useState(0);

const handleSubmit = async () => {
  try {
    await reviewAPI.createReview(data);
    
    // Start cooldown
    setCooldown(30);
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  } catch (error) {
    // Handle error
  }
};

// UI
{cooldown > 0 && (
  <p>Please wait {cooldown}s before posting again</p>
)}
```

---

## 🚀 Best Practices

### For Users
1. **Write unique content** for each review
2. **Take your time** - quality over quantity
3. **Edit existing reviews** instead of creating duplicates
4. **Wait between posts** - respect cooldowns
5. **Avoid copy-paste** - write original thoughts

### For Developers
1. **Monitor spam scores** regularly
2. **Adjust thresholds** based on community
3. **Log all blocks** for analysis
4. **Provide clear error messages**
5. **Use Redis** for production (instead of in-memory cache)

---

## 🔮 Future Enhancements

### Planned Features
- **IP-based rate limiting** - Prevent multi-account spam
- **CAPTCHA integration** - For suspicious users
- **Machine learning** - Better spam detection
- **Reputation system** - Trusted users get higher limits
- **Appeal system** - Contest false positives
- **Admin dashboard** - Monitor spam attempts
- **Whitelist/Blacklist** - Manual overrides

---

## 📞 Support

### Common Issues

**Q: Legitimate user blocked?**
A: Check spam score, adjust thresholds, or whitelist user

**Q: Spammers getting through?**
A: Lower similarity threshold or reduce rate limits

**Q: Too restrictive?**
A: Increase limits or reduce cooldowns

**Q: False positives on similarity?**
A: Adjust similarity threshold (currently 70%)

---

**The spam prevention system keeps your community clean while allowing genuine engagement!** 🛡️✨
