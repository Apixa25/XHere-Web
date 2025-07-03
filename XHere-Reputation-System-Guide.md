# 🏆 **XHere Reputation System - Complete User Guide**

## 📋 **What is the Reputation System?**

The reputation system is XHere's way of rewarding quality contributors and maintaining high standards in the community. Your reputation score determines your trust level, which unlocks new privileges and reduces posting costs.

---

## 🎯 **How Your Reputation Score is Calculated**

Your reputation score is made up of **4 main components**:

### **1. Location Score (Base Points)**
- **Upvotes**: +10 points each
- **Downvotes**: -5 points each  
- **Verified locations**: +50 bonus points
- **High-quality locations** (5+ upvotes): +25 bonus points
- **Flagged locations**: -100 penalty points

### **2. Consistency Bonus**
- Based on your last 10 locations
- Calculates ratio of quality locations (2+ upvotes, more upvotes than downvotes)
- **Formula**: `(qualityCount / 10) × 100`
- **Example**: If 7 out of 10 recent locations are quality → 70 points

### **3. Quality Bonus**
- Based on overall quality ratio of all your locations
- **Formula**: `(qualityLocations / totalLocations) × 200`
- **Example**: If 4 out of 17 locations are quality → (4/17) × 200 = 47 points

### **4. Activity Bonus**
- **Votes given**: +2 points per vote you've made
- **Credits owned**: +1 point per 10 credits (max 50 points)
- **Example**: 0 votes + 994 credits → 50 points (capped)

---

## 🏅 **Trust Levels & Requirements**

| **Trust Level** | **Score Range** | **Daily Limit** | **Approval Required** | **Credit Cost** | **Benefits** |
|----------------|----------------|-----------------|---------------------|-----------------|--------------|
| **New** | 0-99 | 3 locations | ✅ Yes | 100 credits | Basic access |
| **Trusted** | 100-499 | 10 locations | ❌ No | 50 credits | Faster posting |
| **Verified** | 500-1,999 | 25 locations | ❌ No | 25 credits | Premium access |
| **Moderator** | 2,000+ | 50 locations | ❌ No | 10 credits | VIP privileges |

---

## 📈 **How to Increase Your Reputation Score**

### **Quick Wins (Easy Points)**
1. **Vote on other locations** (+2 points per vote)
2. **Maintain credits** (+1 point per 10 credits, max 50)
3. **Create quality content** (3+ upvotes = quality location)

### **Medium-Term Goals**
1. **Get locations verified** (+50 bonus points each)
2. **Build consistency** (quality ratio of recent locations)
3. **Create high-quality locations** (5+ upvotes = +25 bonus)

### **Long-Term Strategy**
1. **Focus on quality over quantity**
2. **Engage with the community** (voting, commenting)
3. **Maintain consistent high standards**
4. **Build a portfolio of verified locations**

---

## 🎮 **Gamification Elements**

### **What the System Rewards**
- **Consistent quality** over quantity
- **Community engagement** (voting, participation)
- **Verified contributions** (trusted by community)
- **Long-term participation** (activity bonuses)

### **What to Avoid**
- **Spam posting** (hurts consistency bonus)
- **Low-quality content** (downvotes hurt score)
- **Inactive periods** (reduces activity bonus)

---

## 📊 **Understanding Your Dashboard**

### **Key Metrics to Watch**
- **Reputation Score**: Your total points
- **Trust Level**: Current status and privileges
- **Quality Locations**: Locations with 3+ upvotes
- **Average Rating**: Overall quality of your content
- **Progress to Next Level**: How close you are to advancing

### **Recent Activity Section**
- Shows your last 10 locations
- Displays upvotes/downvotes for each
- Tracks location status (pending, verified, flagged)

---

## 🚀 **Pro Tips for Success**

### **For New Users (0-99 points)**
1. **Start with "general" locations** (free, 7-day auto-delete)
2. **Focus on quality descriptions and photos**
3. **Vote on other locations** to build activity bonus
4. **Save credits** for paid location types

### **For Trusted Users (100-499 points)**
1. **Experiment with paid location types** (50 credit cost)
2. **Build consistency** with regular quality posts
3. **Aim for verified status** on your best locations
4. **Engage with community** through voting

### **For Verified Users (500+ points)**
1. **Enjoy premium privileges** (25 credit cost, 25 daily limit)
2. **Mentor new users** and help build community
3. **Focus on high-quality, verified locations**
4. **Consider moderation opportunities**

---

## ❓ **Common Questions**

### **Q: Why did my score go down?**
A: Possible reasons:
- Received downvotes on locations
- Locations were flagged for removal
- Inactive period reduced activity bonus
- Recent locations lowered consistency ratio

### **Q: How do I get my locations verified?**
A: Locations become verified when they receive 5+ positive ratings (more upvotes than downvotes).

### **Q: What's the fastest way to advance?**
A: Focus on creating high-quality locations that get 3+ upvotes, vote on other content, and maintain consistent quality.

### **Q: Do I lose points for deleting locations?**
A: No, but deleted locations won't contribute to your score. Focus on creating content worth keeping.

---

## 🎯 **Your Progress Tracker**

**Current Status**: Trusted Level (447 points)
**Next Goal**: Verified Level (500 points needed)
**Progress**: 86.75% complete (53 more points needed)

**To reach Verified level, you could**:
- Get 5 more upvotes on your locations (+50 points)
- Create 2-3 more quality locations (+25-75 points)
- Get more locations verified (+50 points each)

---

## 📚 **Additional Resources**

- **Location Types Guide**: Understanding different posting categories
- **Credit System Guide**: How to earn and spend credits wisely
- **Community Guidelines**: Best practices for quality contributions
- **Badge System**: Additional achievements and recognition

---

## 🔧 **Technical Details**

### **Score Calculation Example**
```
Location Score: 350 points
├── 29 total upvotes × 10 = 290 points
├── Some verified locations (+50 bonus)
└── Some high-quality locations (+25 bonus)

Quality Bonus: 47 points  
├── 4 quality locations ÷ 17 total = 23.5%
└── 23.5% × 200 = 47 points

Activity Bonus: 50 points
├── 994 credits ÷ 10 = 99.4
└── Capped at 50 points

Consistency Bonus: 0 points
└── Recent locations don't meet quality threshold

TOTAL: 350 + 47 + 50 + 0 = 447 points
```

### **Database Fields**
- `reputationScore`: Integer (0-999,999)
- `trustLevel`: Enum ('new', 'trusted', 'verified', 'moderator')
- `qualityLocationsCount`: Integer
- `totalLocationsCount`: Integer
- `averageLocationRating`: Decimal(10,2)
- `lastReputationUpdate`: DateTime
- `reputationHistory`: JSONB array

---

## 🎉 **Success Stories**

### **Example User Journey**
1. **Week 1**: New user creates 3 quality locations, earns 150 points
2. **Week 2**: Gets first location verified (+50), reaches Trusted level
3. **Month 1**: Builds consistency, creates 10 quality locations
4. **Month 2**: Reaches Verified level, enjoys premium privileges
5. **Month 3**: Becomes community mentor, helps new users

---

**Remember**: The reputation system is designed to reward quality, consistency, and community engagement. Focus on creating valuable content that helps other users, and your reputation will grow naturally! 🚀

---

*Last updated: July 3, 2025*  
*Version: 1.0*  
*XHere App - Building Better Communities Together* 