# 🚀 Quick Setup: Gemini Moderation Bot

## Step-by-Step Setup Guide

### 1. Install Required Package

```bash
cd my-app-backend
npm install @google/generative-ai
```

### 2. Get Gemini API Key

1. **Visit Google AI Studio**: https://makersuite.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click "Create API Key"**
4. **Copy the generated key**

### 3. Add to Environment Variables

Open your `.env` file and add:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_actual_api_key_here
```

**Example:**
```env
GEMINI_API_KEY=AIzaSyABC123def456GHI789jkl012MNO345pqr
```

### 4. Start Moderation Job (Optional)

In your `server.js` or `app.js`:

```javascript
import moderationJob from './jobs/moderationJob.js';

// Start the scheduled moderation job
moderationJob.start();
```

### 5. Test the Bot

Create a test review and check the console for moderation logs:

```javascript
// The bot will automatically moderate new reviews
// Check console output for:
console.log('Moderation completed:', {
  reviewId: '...',
  actions: { ... }
});
```

---

## ✅ Verification Checklist

- [ ] `@google/generative-ai` package installed
- [ ] Gemini API key obtained from Google AI Studio
- [ ] API key added to `.env` file
- [ ] Server restarted to load new environment variables
- [ ] Moderation job started (optional)
- [ ] Test review created and moderated

---

## 🎯 How It Works

### Automatic Moderation Flow

```
User creates review
    ↓
Review saved to database
    ↓
Points calculated & awarded
    ↓
Moderation bot triggered (async)
    ↓
Gemini AI analyzes content
    ↓
Bot determines actions
    ↓
Points adjusted automatically
    ↓
Spam/offensive content removed
    ↓
Actions logged
```

### What Gets Analyzed

✅ **Spam Detection** - URLs, promotional content, gibberish
✅ **Offensive Content** - Hate speech, harassment
✅ **Quality Score** - 0-100 based on depth and insight
✅ **Spoiler Detection** - Plot reveals without tags
✅ **Effort Level** - Low effort vs thoughtful reviews
✅ **Constructive Criticism** - Balanced perspective

---

## 💰 Gemini API Pricing

**Free Tier:**
- 60 requests per minute
- 1,500 requests per day
- Perfect for small to medium sites

**Paid Tier:**
- Higher rate limits
- More requests per day
- Production-ready

**Cost:** Very affordable - typically $0.001 per request

---

## 🔧 Troubleshooting

### Issue: "API key not found"
**Solution:** Check that `GEMINI_API_KEY` is in your `.env` file and server is restarted

### Issue: "Rate limit exceeded"
**Solution:** Reduce `MODERATION_BATCH_SIZE` in config or upgrade to paid tier

### Issue: "Invalid API key"
**Solution:** Verify key is correct, regenerate if needed

### Issue: "Moderation not running"
**Solution:** Check that `moderationJob.start()` is called in server.js

### Issue: "JSON parse error"
**Solution:** Bot will automatically fall back to pattern-based detection

---

## 📊 Monitoring

### Check Moderation Logs

```javascript
// Console output shows:
'Moderation completed:', {
  reviewId: 'review_123',
  actions: {
    pointsAdjustment: +20,
    shouldRemove: false,
    warnings: [],
    bonuses: ['Quality bonus: +20 points']
  }
}
```

### Check Database

```javascript
// Reviews have moderation fields:
{
  isFlagged: false,
  isRemoved: false,
  moderatedAt: Date,
  moderatedBy: 'AI_BOT'
}
```

---

## 🎨 Customization

### Adjust Point Values

Edit `moderationBot.js`:

```javascript
// Bonuses
const QUALITY_HIGH = 30;
const CONSTRUCTIVE = 15;
const INSIGHTFUL = 20;

// Penalties
const SPAM = -50;
const OFFENSIVE = -30;
const LOW_EFFORT = -15;
```

### Adjust Thresholds

```javascript
// Spam detection sensitivity
const SPAM_THRESHOLD = 0.8; // 0-1 (higher = stricter)

// Quality bonus threshold
const QUALITY_BONUS_MIN = 60; // 0-100
```

### Add Custom Patterns

```javascript
// Add to spamPatterns array
this.spamPatterns.push(
  /your-custom-pattern/gi
);
```

---

## 🚀 Next Steps

1. **Monitor Performance** - Check logs for accuracy
2. **Adjust Thresholds** - Fine-tune based on your community
3. **Add Admin Dashboard** - View flagged content
4. **Create Appeal System** - Let users contest removals
5. **Add Notifications** - Alert users of point changes
6. **Track Metrics** - Spam detection rate, false positives

---

## 📞 Support

**Gemini API Documentation:** https://ai.google.dev/docs
**CineHub Moderation Guide:** See `MODERATION_BOT_GUIDE.md`

---

**Your AI moderation bot is ready to keep your community clean!** 🤖✨
