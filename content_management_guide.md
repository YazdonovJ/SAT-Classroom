# Content Management Portal - Complete Guide

## 🎯 Overview

The Content Management Portal allows teachers to create tests, quizzes, and manage all course materials without writing any SQL. Students can take tests with automatic grading and view their results.

---

## 📊 Setup Instructions

### 1. Run Database Migration

Execute in Supabase SQL Editor:

```sql
-- Run this file
\i create_content_management_schema.sql
```

This creates:
- `tests` table - Store test metadata
- `questions` table - Store questions with answers
- `test_attempts` table - Track student submissions
- `materials` table - For future file uploads
- RLS policies for secure access

### 2. Verify Setup

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tests', 'questions', 'test_attempts', 'materials');
```

---

## 👨‍🏫 For Teachers

### Accessing Content Portal

Navigate to: `/teacher/content`

### Creating a Test

1. **Click "Create Test"** on content dashboard
2. **Fill in test details:**
   - Title (e.g., "Algebra Unit 1 Quiz")
   - Description
   - Select unit
   - Set time limit (optional)
   - Set passing score (default 70%)
   - Set max attempts
   - Toggle "Show correct answers"

3. **Add Questions:**
   - Click "Add Question"
   - Enter question text
   - Fill in 4 answer options (A, B, C, D)
   - Select correct answer
   - Set points (default 1)
   - Add explanation (optional)

4. **Publish:**
   - Click "Save as Draft" to save without publishing
   - Click "Publish Test" to make available to students

### Managing Tests

**View All Tests:** `/teacher/content/tests`
- See all created tests
- Published/Draft status
- Edit or delete tests
- View analytics

**View Analytics:** `/teacher/content/test/[id]/analytics`
- Average score
- Pass rate
- Question difficulty analysis
- Student performance breakdown
- Time spent statistics

---

## 👨‍🎓 For Students

### Finding Tests

Tests appear in unit pages when:
1. Teacher has published them
2. Unit is unlocked by teacher

Navigate to: `/student/unit/[id]/tests`

### Taking a Test

1. **Click "Start Test"** on any available test
2. **Answer questions:**
   - Select one answer per question
   - Navigate with Previous/Next buttons
   - Track progress at top
   - See timer countdown (if time limit set)
   - View answer summary (which questions answered)

3. **Submit:**
   - Click "Submit Test" on last question
   - Get instant results
   - View score and pass/fail status

### Viewing Results

After submission:
- See overall score
- View correct/incorrect answers (if enabled by teacher)
- Read explanations
- Check attempt history
- Retake if attempts remaining

---

## 🎨 Features

### Teacher Features
✅ Create unlimited tests
✅ Multiple choice questions
✅ Time limits & attempt restrictions
✅ Draft/publish workflow
✅ Detailed analytics dashboard
✅ Question difficulty analysis
✅ Student performance tracking

### Student Features
✅ View available tests
✅ Take timed tests
✅ Progress tracking
✅ Instant auto-grading
✅ View results & explanations
✅ Attempt history
✅ Retake tests (if allowed)

---

## 📈 Analytics Metrics

### Test-Level Metrics
- **Average Score** - Mean score across all attempts
- **Pass Rate** - Percentage of attempts that passed
- **Unique Students** - Number of students who attempted
- **Total Attempts** - All submissions
- **Average Time** - Mean time spent on test

### Question-Level Analysis
- **Correct Rate** - % of students who answered correctly
- **Difficulty Rating** - Color-coded difficulty indicator
  - Green (≥70%) - Easy
  - Orange (40-69%) - Medium
  - Red (<40%) - Hard

### Student Performance
- Best score per student
- Total attempts
- Latest attempt date
- Pass/fail status

---

## 🔒 Security & Permissions

### RLS Policies

**Teachers can:**
- Create tests for units in courses they teach
- View/edit only their own tests
- See attempts from students in their classes

**Students can:**
- View only published tests
- Take tests in units they have access to
- View only their own attempts
- Cannot see other students' answers

---

## 💡 Best Practices

### For Teachers

1. **Start Small** - Create 1-2 question test to familiarize yourself
2. **Use Drafts** - Save as draft while building, publish when ready
3. **Test Yourself** - Create a dummy student account to test experience
4. **Review Analytics** - Check which questions are too hard/easy
5. **Set Reasonable Time Limits** - ~1-2 minutes per question
6. **Allow Retakes** - Set max attempts to 2-3 for learning

### For Creating Good Questions

1. **Clear Question Text** - Be specific and unambiguous
2. **Plausible Distractors** - Wrong answers should be reasonable
3. **Add Explanations** - Help students learn from mistakes
4. **Vary Difficulty** - Mix easy, medium, and hard questions
5. **Avoid Tricks** - Test knowledge, not reading comprehension

---

## 🚀 Future Enhancements

Coming soon:
- [ ] Essay/short answer questions
- [ ] File uploads (PDFs, images)
- [ ] Question bank/reusable questions
- [ ] Randomize question order
- [ ] Export results to CSV
- [ ] Email notifications
- [ ] Practice mode (no grading)

---

## 🐛 Troubleshooting

**Problem:** Students can't see published tests
- **Solution:** Check unit is unlocked by teacher in class settings

**Problem:** Can't create test
- **Solution:** Ensure you're a teacher and have classes assigned

**Problem:** Analytics showing zero
- **Solution:** Students need to complete tests first

**Problem:** Timer not working
- **Solution:** Ensure time limit is set in test settings

---

## 📞 Support

For issues:
1. Check this guide
2. Verify database migration ran successfully
3. Check browser console for errors
4. Ensure RLS policies are enabled

---

**The Content Management Portal is production-ready! 🎉**

Teachers can now create and manage tests independently, while students get instant feedback on their performance.
