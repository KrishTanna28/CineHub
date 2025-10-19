# Mock Data for Testing MovieHub Backend

## Test Users

### User 1 - John Doe (Primary Test User)
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "John123",
  "fullName": "John Doe"
}
```

### User 2 - Jane Doe (Referral Test)
```json
{
  "username": "janedoe",
  "email": "jane@example.com",
  "password": "Jane123",
  "fullName": "Jane Doe",
  "referralCode": "USE_JOHN_REFERRAL_CODE"
}
```

### User 3 - Mike Brown (Avatar Test)
```json
{
  "username": "mikebrown",
  "email": "mike@example.com",
  "password": "Mike123",
  "fullName": "Mike Brown"
}
```

### User 4 - Sarah Wilson
```json
{
  "username": "sarahwilson",
  "email": "sarah@example.com",
  "password": "Sarah123",
  "fullName": "Sarah Wilson"
}
```

### User 5 - Admin User
```json
{
  "username": "admin",
  "email": "admin@moviehub.com",
  "password": "Admin123",
  "fullName": "Admin User"
}
```
**Note:** Manually set role to "admin" in database after creation

---

## Movie IDs (TMDB)

### Popular Movies
| Movie ID | Title | Genre |
|----------|-------|-------|
| 550 | Fight Club | Drama/Thriller |
| 155 | The Dark Knight | Action/Crime |
| 278 | The Shawshank Redemption | Drama |
| 13 | Forrest Gump | Drama/Romance |
| 680 | Pulp Fiction | Crime/Drama |
| 27205 | Inception | Sci-Fi/Action |
| 157336 | Interstellar | Sci-Fi/Drama |
| 299536 | Avengers: Infinity War | Action/Adventure |
| 299534 | Avengers: Endgame | Action/Adventure |
| 603 | The Matrix | Sci-Fi/Action |

### Additional Movies for Testing
| Movie ID | Title | Genre |
|----------|-------|-------|
| 238 | The Godfather | Crime/Drama |
| 424 | Schindler's List | Biography/Drama |
| 19404 | Dilwale Dulhania Le Jayenge | Romance/Drama |
| 129 | Spirited Away | Animation/Fantasy |
| 372058 | Your Name | Animation/Romance |
| 496243 | Parasite | Thriller/Drama |
| 497 | The Green Mile | Crime/Drama |
| 389 | 12 Angry Men | Drama |
| 98 | Gladiator | Action/Drama |
| 637 | Life Is Beautiful | Comedy/Drama |

---

## User Profile Updates

### Profile Update 1 - Basic Info
```json
{
  "fullName": "John Doe Updated",
  "bio": "Movie enthusiast and tech lover. Always looking for the next great film!"
}
```

### Profile Update 2 - With Preferences
```json
{
  "fullName": "John Doe Pro",
  "bio": "Cinephile | Film Critic | Tech Enthusiast 🎬",
  "preferences": {
    "favoriteGenres": ["Action", "Sci-Fi", "Thriller", "Drama"],
    "favoriteActors": ["Tom Hanks", "Leonardo DiCaprio", "Christian Bale", "Morgan Freeman"],
    "favoriteDirectors": ["Christopher Nolan", "Steven Spielberg", "Quentin Tarantino", "Martin Scorsese"],
    "language": "en",
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": true,
      "watchPartyInvites": true,
      "newReviews": false
    }
  }
}
```

### Profile Update 3 - Minimal
```json
{
  "bio": "Just a movie lover 🍿"
}
```

---

## Watchlist Test Data

### Batch 1 - Action Movies
```json
{ "movieId": "155" }   // The Dark Knight
{ "movieId": "27205" } // Inception
{ "movieId": "299536" } // Avengers: Infinity War
{ "movieId": "603" }   // The Matrix
{ "movieId": "98" }    // Gladiator
```

### Batch 2 - Drama Movies
```json
{ "movieId": "278" }  // The Shawshank Redemption
{ "movieId": "13" }   // Forrest Gump
{ "movieId": "238" }  // The Godfather
{ "movieId": "424" }  // Schindler's List
{ "movieId": "497" }  // The Green Mile
```

### Batch 3 - Sci-Fi Movies
```json
{ "movieId": "157336" } // Interstellar
{ "movieId": "603" }    // The Matrix
{ "movieId": "27205" }  // Inception
```

---

## Favorites Test Data

### Top 5 Favorites
```json
{ "movieId": "278" }  // The Shawshank Redemption
{ "movieId": "238" }  // The Godfather
{ "movieId": "155" }  // The Dark Knight
{ "movieId": "680" }  // Pulp Fiction
{ "movieId": "27205" } // Inception
```

---

## Ratings Test Data

### High Ratings (9-10)
```json
{ "movieId": "278", "rating": 10.0 }  // The Shawshank Redemption
{ "movieId": "238", "rating": 9.8 }   // The Godfather
{ "movieId": "155", "rating": 9.5 }   // The Dark Knight
{ "movieId": "27205", "rating": 9.3 } // Inception
{ "movieId": "157336", "rating": 9.2 } // Interstellar
```

### Good Ratings (7-8.9)
```json
{ "movieId": "550", "rating": 8.8 }   // Fight Club
{ "movieId": "680", "rating": 8.7 }   // Pulp Fiction
{ "movieId": "13", "rating": 8.5 }    // Forrest Gump
{ "movieId": "603", "rating": 8.9 }   // The Matrix
{ "movieId": "98", "rating": 8.4 }    // Gladiator
```

### Average Ratings (5-6.9)
```json
{ "movieId": "299536", "rating": 6.5 } // Avengers: Infinity War
{ "movieId": "299534", "rating": 6.8 } // Avengers: Endgame
```

---

## Password Change Test Data

### Valid Password Change
```json
{
  "currentPassword": "John123",
  "newPassword": "John1234"
}
```

### Invalid Password Change (Wrong Current)
```json
{
  "currentPassword": "WrongPassword",
  "newPassword": "John1234"
}
```

### Invalid Password Change (Weak New Password)
```json
{
  "currentPassword": "John123",
  "newPassword": "weak"
}
```

---

## Validation Error Test Cases

### Invalid Email
```json
{
  "username": "testuser",
  "email": "invalidemail",
  "password": "Test123"
}
```

### Weak Password (No uppercase)
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "test123"
}
```

### Weak Password (No number)
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "TestTest"
}
```

### Short Username
```json
{
  "username": "ab",
  "email": "test@example.com",
  "password": "Test123"
}
```

### Long Username
```json
{
  "username": "thisusernameiswaytoolongandexceedsthirtychars",
  "email": "test@example.com",
  "password": "Test123"
}
```

---

## Expected Points Calculation

### Actions and Points
| Action | Points | Example |
|--------|--------|---------|
| Welcome Bonus | 50 | On registration |
| Referral (Referrer) | 100 | When someone uses your code |
| Add to Watchlist | 5 | Per movie |
| Add to Favorites | 5 | Per movie |
| Rate Movie | 10 | Per rating |
| Write Review | 25 | Per review (future) |
| Daily Login Streak | Variable | Based on streak |

### Sample User Journey Points
```
Registration: 50 points
Add 10 movies to watchlist: 50 points (10 × 5)
Add 5 movies to favorites: 25 points (5 × 5)
Rate 10 movies: 100 points (10 × 10)
Refer 2 friends: 200 points (2 × 100)
---
Total: 425 points = Level 1 (need 1000 for Level 2)
```

---

## Test Scenarios

### Scenario 1: New User Registration Flow
1. Register user without avatar
2. Login
3. Update profile with bio and preferences
4. Upload avatar
5. Check profile
6. Check stats

### Scenario 2: Movie Engagement Flow
1. Login
2. Add 5 movies to watchlist
3. Add 3 movies to favorites
4. Rate 5 movies
5. Check stats (should show updated counts and points)

### Scenario 3: Social Features Flow
1. Register User A
2. Register User B
3. Login as User A
4. Follow User B
5. Login as User B
6. Check followers (should show User A)
7. Follow User A back
8. Check leaderboard

### Scenario 4: Referral Flow
1. Register User A (save referral code)
2. Register User B with User A's referral code
3. Login as User A
4. Check stats (should show 100 extra points and 1 friend referred)

### Scenario 5: Error Handling Flow
1. Try to register with invalid email
2. Try to register with weak password
3. Try to register with duplicate email
4. Try to access protected route without token
5. Try to login with wrong password (5 times to test account locking)

---

## Quick Copy-Paste Commands

### Register 5 Users Quickly
```bash
# User 1
{"username":"johndoe","email":"john@example.com","password":"John123","fullName":"John Doe"}

# User 2
{"username":"janedoe","email":"jane@example.com","password":"Jane123","fullName":"Jane Doe"}

# User 3
{"username":"mikebrown","email":"mike@example.com","password":"Mike123","fullName":"Mike Brown"}

# User 4
{"username":"sarahwilson","email":"sarah@example.com","password":"Sarah123","fullName":"Sarah Wilson"}

# User 5
{"username":"davidlee","email":"david@example.com","password":"David123","fullName":"David Lee"}
```

### Add 10 Movies to Watchlist Quickly
```bash
{"movieId":"550"}
{"movieId":"155"}
{"movieId":"278"}
{"movieId":"13"}
{"movieId":"680"}
{"movieId":"27205"}
{"movieId":"157336"}
{"movieId":"299536"}
{"movieId":"603"}
{"movieId":"238"}
```

### Rate 10 Movies Quickly
```bash
{"movieId":"278","rating":10.0}
{"movieId":"238","rating":9.8}
{"movieId":"155","rating":9.5}
{"movieId":"27205","rating":9.3}
{"movieId":"157336","rating":9.2}
{"movieId":"550","rating":8.8}
{"movieId":"680","rating":8.7}
{"movieId":"13","rating":8.5}
{"movieId":"603","rating":8.9}
{"movieId":"98","rating":8.4}
```

---

## Database Queries for Verification

### Check User Points
```javascript
db.users.find({ email: "john@example.com" }, { points: 1, level: 1, achievements: 1 })
```

### Check All Users
```javascript
db.users.find({}, { username: 1, email: 1, points: 1, level: 1 })
```

### Check User Watchlist
```javascript
db.users.findOne({ email: "john@example.com" }, { watchlist: 1 })
```

### Check User Ratings
```javascript
db.users.findOne({ email: "john@example.com" }, { ratings: 1 })
```

### Update User Role to Admin
```javascript
db.users.updateOne(
  { email: "admin@moviehub.com" },
  { $set: { role: "admin" } }
)
```

---

## Tips for Testing

1. **Save tokens**: After login, save the token in Postman environment variable
2. **Test in order**: Follow the test scenarios in sequence
3. **Check stats**: After each action, check `/users/me/stats` to verify points
4. **Use different users**: Test social features with multiple users
5. **Test errors**: Don't just test happy paths, test validation and errors
6. **Clear data**: If needed, drop the database and start fresh
7. **Check logs**: Monitor server console for errors
8. **Test avatar upload**: Use small image files (< 5MB) for testing

---

## Common Issues and Solutions

### Issue: Token expired
**Solution:** Login again to get a new token

### Issue: Duplicate key error
**Solution:** User already exists, use different email/username

### Issue: Validation error
**Solution:** Check password requirements (min 6 chars, uppercase, lowercase, number)

### Issue: Avatar upload fails
**Solution:** Check Cloudinary credentials in .env file

### Issue: Cannot follow yourself
**Solution:** Use different user IDs for follow/unfollow

### Issue: Movie already in watchlist
**Solution:** This is expected behavior, movie won't be added twice
