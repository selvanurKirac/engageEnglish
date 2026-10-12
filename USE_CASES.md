# Use Cases for English Learning Application

## 1. User Authentication & Account Management

### UC-01: User Registration
**Actor:** New User  
**Description:** User creates a new account to access the learning platform  
**Preconditions:** User has internet access  
**Main Flow:**
1. User navigates to registration page
2. User enters email and password
3. System validates email format and password strength
4. User clicks "Sign Up" button
5. System creates account and sends to home page
6. User receives welcome message

**Alternative Flow:**
- User can sign up with Google OAuth for faster registration
- System handles existing email error gracefully

### UC-02: User Login
**Actor:** Registered User  
**Description:** User logs into their account to access personalized content  
**Main Flow:**
1. User enters email and password
2. System validates credentials
3. User gains access to dashboard with personalized data
4. System loads user's progress and settings

### UC-03: Account Settings Management
**Actor:** Logged User  
**Description:** User manages their account settings and learning goals  
**Main Flow:**
1. User accesses account page
2. User can update daily learning time goal (default 60 minutes)
3. User can change password with current password verification
4. User can view personal statistics and progress charts
5. User can logout from the system

## 2. Learning Assessment & Testing

### UC-04: English Level Test
**Actor:** Logged User  
**Description:** User takes comprehensive level test to determine English proficiency  
**Preconditions:** User is logged in  
**Main Flow:**
1. User starts level test from navigation
2. System presents 60 questions covering A1-C2 levels
3. Questions adapt difficulty based on user responses
4. User completes test within allocated time
5. System calculates level based on Common European Framework
6. User receives detailed results and recommendations
7. Results are saved to user profile

### UC-05: Word Vision Challenge Game
**Actor:** Logged User  
**Description:** User plays vocabulary game to improve word recognition  
**Main Flow:**
1. User starts Word Vision Challenge
2. System presents image with multiple word choices
3. User has 30 seconds to select correct word
4. System provides immediate feedback
5. For wrong answers, system plays audio pronunciation
6. Game continues for 5 minutes total
7. System calculates score and streak
8. Progress is saved to Firebase
9. User can view game statistics

## 3. Pronunciation & Speech Recognition

### UC-06: Pronunciation Checker
**Actor:** Logged User  
**Description:** User practices pronunciation with real-time feedback  
**Preconditions:** User has microphone access  
**Main Flow:**
1. User accesses pronunciation checker
2. User can input word manually or select from list
3. System validates word exists in dictionary
4. User clicks microphone to start recording
5. System uses Web Speech API to capture speech
6. System compares pronunciation using similarity algorithms
7. User receives feedback on accuracy
8. System tracks correct/incorrect pronunciations
9. User can practice multiple times
10. Personal word lists are maintained

## 4. Progress Tracking & Analytics

### UC-07: Time Chart Visualization
**Actor:** Logged User  
**Description:** User views learning time patterns and progress  
**Main Flow:**
1. User accesses time chart section
2. System displays daily/weekly/monthly learning time
3. User can set and modify daily time goals
4. System shows progress toward goals
5. Visual charts display learning patterns over time
6. User can analyze their consistency and improvement

### UC-08: Streak Tracking
**Actor:** Logged User  
**Description:** User monitors daily learning streaks  
**Main Flow:**
1. System automatically tracks daily activities
2. User can view current streak count
3. System displays streak history with visual charts
4. User receives motivation to maintain streaks
5. System celebrates milestone achievements

## 5. Daily Learning Management

### UC-09: Daily Task Management
**Actor:** Logged User  
**Description:** User manages daily learning tasks and goals  
**Main Flow:**
1. User views daily task list
2. Tasks include: reading exercises, listening practice, vocabulary learning, mini tests
3. User can mark tasks as completed
4. System tracks progress percentage
5. User sees daily time goal progress (15 minutes default)
6. System provides motivation and achievement feedback

### UC-10: Vocabulary Control
**Actor:** Logged User  
**Description:** User manages and reviews learned vocabulary  
**Main Flow:**
1. User accesses vocabulary section
2. System displays learned words with definitions
3. User can review pronunciation of words
4. System tracks word learning progress
5. User can practice with spaced repetition
6. System suggests words needing review

## 6. Business English Learning

### UC-11: Business English Training
**Actor:** Logged User  
**Description:** User accesses specialized business English content  
**Main Flow:**
1. User navigates to business English section
2. System provides industry-specific vocabulary
3. User can access business video content
4. System tracks business English progress separately
5. User practices professional communication scenarios

## 7. Daily Progress Monitoring

### UC-12: Daily Progress Dashboard
**Actor:** Logged User  
**Description:** User views comprehensive daily learning overview  
**Main Flow:**
1. User accesses daily progress page
2. System displays today's completed activities
3. User sees time spent on different learning areas
4. System shows progress toward daily goals
5. User receives personalized recommendations
6. System highlights areas needing attention

## 8. Navigation & User Experience

### UC-13: Responsive Navigation
**Actor:** Any User  
**Description:** User navigates through application features  
**Main Flow:**
1. User can toggle sidebar navigation
2. Navigation adapts to screen size (mobile/desktop)
3. User can access all features from main menu
4. System provides consistent navigation experience
5. User can return to home page from any section

### UC-14: Home Dashboard
**Actor:** Logged User  
**Description:** User views personalized home dashboard  
**Main Flow:**
1. User lands on home page after login
2. System displays carousel of available features
3. User can access quick links to main functions
4. System shows recent activity and progress summary
5. User receives personalized learning recommendations

## Error Handling & Edge Cases

### UC-15: Network Error Handling
**Actor:** Any User  
**Description:** System handles network connectivity issues  
**Main Flow:**
1. System detects network connectivity problems
2. User receives clear error messages
3. System provides retry options
4. User can continue working offline where possible
5. System syncs data when connection resumes

### UC-16: Authentication Error Handling
**Actor:** Any User  
**Description:** System handles authentication failures gracefully  
**Main Flow:**
1. System detects authentication errors
2. User receives specific error messages
3. System provides password reset options
4. User can try alternative login methods
5. System maintains security while being user-friendly
