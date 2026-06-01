# Project: Madrasah Revision App

Build a small, responsive, child-friendly revision web application for Madrasah students. The first target user is a 10-year-old student revising for exams over the next two weeks, but the app should be designed so it can later support many syllabuses and many students.

The first syllabus to support is the South African Tas-heel series, especially Grade 5. The subjects are:

- Akhlaaq
- Aqaaid
- Fiqh
- Hadeeth
- Tareekh / Islamic History

The user will upload PDFs and screenshots from the Tas-heel syllabus. Use those files as the source material for revision questions, flashcards, topics, lessons, and tests.

## Product goal

Create a revision app that helps a Madrasah student:

1. Select a syllabus.
2. Select a grade.
3. Select a subject.
4. Revise lessons from the book.
5. Attempt tests and quizzes.
6. Practise weak areas using flashcards.
7. Track progress over time.
8. Prepare for an exam in a focused, fun, and engaging way.

The application should feel modern, clean, and child-friendly, inspired by the UX of apps such as Quizlet, Quranly, Everyday Ilm, and other polished Muslim learning apps. It should not feel like a boring document viewer.

## Important design direction

The UI should be:

- Mobile-first and fully responsive.
- Simple enough for a 10-year-old to use.
- Clean, rounded, soft, and modern.
- Encouraging, not childish.
- Islamic in tone without being overly decorative.
- Suitable for boys and girls.
- Fast to use during short revision sessions.
- Optimised for repeated daily use over two weeks.

Use a calm visual system:
- Soft greens, blues, creams, and neutral tones.
- Rounded cards.
- Large touch targets.
- Clear progress bars.
- Simple icons.
- Gentle animations.
- No noisy UI.
- No emojis unless used very sparingly inside the product UI.

## Core user journey

### 1. Student setup

When the user first opens the app:

- Ask for the student’s name.
- Save the name locally.
- Show a friendly dashboard greeting: “Assalamu alaykum, Muhammad” or whatever name they entered.
- Allow the user to update or reset their profile.

For the first version, use local storage or IndexedDB. Do not require authentication yet.

### 2. Syllabus selection

The app should support a dynamic syllabus structure.

Initial syllabus:

```ts
Tasheel {
  Grade 5 {
    Akhlaaq
    Aqaaid
    Fiqh
    Hadeeth
    Tareekh / Islamic History
  }
}

An-Nasihah {

  Book 1

  Book 2

  Book 3

}


But architect it so later we can add:
Other Madrasah Syllabuses {

  Grade / Level / Book

}

The student should be able to choose:

* Syllabus
* Grade
* Subject
* Lesson / topic

3. Subject dashboard

Each subject should have a dashboard showing:

* Lessons / chapters
* Completion percentage
* Number of questions attempted
* Accuracy
* Weak topics
* Flashcards due
* Recommended revision path

Example subject cards:

* Aqaaid: “Allah’s qualities”, “Angels”, “Books of Allah”
* Fiqh: “Najasa”, “Wudhu”, “Salaah”
* Akhlaaq: “Walking”, “Talking”, “Neighbours”, “Table manners”
* Hadeeth: “Lesson 1”, “Lesson 2”
* Tareekh: “Compilation of the Qur’an”, “Sayyidina Abu Bakr”, etc.

4. Lesson screen

Each lesson screen should include:

* Lesson title
* Short summary
* Key terms / new words
* Important points
* Related story if available
* Quick revision cards
* “Start Quiz” button
* “Practise Flashcards” button

The app should not simply show full PDF pages. It should turn the PDF material into structured revision content.

5. Quiz modes

Build multiple quiz modes.

Multiple choice

Example:
“What are the two types of Najasa?”

Options:

* Najasa Haqiqi and Najasa Hukmi
* Wudhu and Ghusl
* Halaal and Haraam
* Sunnah and Nafl

Short answer

Example:
“Name the two types of Najasa.”

The student types the answer. The app should allow minor spelling differences if possible.

Fill in the blank

Example:
“Allah was not ______ by anyone.”

Match columns

Example:
Match Allah’s qualities:

* Qadeem → Eternal
* Qaadir → All powerful
* Hayy → Everliving
* Mutakallim → One who speaks
* Khaaliq → Creator

True / false

Example:
“Muslim manners change with time and go out of fashion.”

Word search / interactive vocabulary

Some Tas-heel pages include word searches. Build a simple word-search activity where possible:

* Show a grid.
* Student highlights words.
* Track found words.
* Words may include angel names or Islamic terms.

For MVP, word search can be a simple interactive grid with preloaded words.

6. Flashcard mode

If the student gets an answer wrong, automatically add that question/concept to “Needs revision”.

Flashcard mode should include:

* Front: question, term, or concept.
* Back: answer and short explanation.
* Buttons:
    * “I knew this”
    * “Still learning”
    * “I forgot”
* Use spaced repetition logic:
    * Forgotten cards come back sooner.
    * Known cards come back later.
    * Track review history locally.

Example flashcards:

Front:
“What does Qadeem mean?”

Back:
“Eternal. Allah has no beginning.”

Front:
“What is Akhlaaq?”

Back:
“Good character and manners.”

Front:
“What did Sayyidina Zaid رضي الله عنه do in the compilation of the Qur’an?”

Back:
“He collected the written pieces and compiled the first copy of the Qur’an in book form.”

7. Exam practice mode

Create a special “Exam Practice” mode.

The student chooses:

* Subject
* Number of questions: 10, 20, 30, or all
* Difficulty: Easy, Medium, Hard, Mixed
* Question type: Multiple choice, written, mixed

At the end, show:

* Score
* Correct answers
* Incorrect answers
* Topics to revise
* Flashcards automatically created from mistakes
* Encouraging message

8. Two-week revision planner

The student has around two weeks to revise.

Create a simple revision planner:

* Shows days remaining until exam.
* Suggests daily revision.
* Breaks subjects into manageable chunks.
* Tracks streaks and completed sessions.
* Example:
    * Day 1: Aqaaid lessons 1–2
    * Day 2: Akhlaaq lessons 1–3
    * Day 3: Fiqh Najasa + Wudhu
    * Day 4: Hadeeth lesson 1
    * Day 5: Tareekh story revision
    * Then repeat weak areas.

Allow the parent/student to set the exam date.

9. Progress dashboard

Create a dashboard with:

* Overall progress
* Subject progress
* Accuracy by subject
* Weak topics
* Flashcards due
* Recent activity
* Best score
* Revision streak

This should be stored locally for now.

Technical requirements

Use a modern local-first stack.

Recommended stack:

* Next.js latest stable version
* TypeScript
* Tailwind CSS
* shadcn/ui components
* Framer Motion for subtle animations
* Lucide icons
* Zustand or React Context for state
* LocalStorage or IndexedDB for persistence
* Optional: Dexie.js if using IndexedDB
* No backend required for MVP

The app should work locally with:

npm install

npm run dev

/src
  /app
    /page.tsx
    /dashboard/page.tsx
    /syllabus/page.tsx
    /subject/[subjectId]/page.tsx
    /lesson/[lessonId]/page.tsx
    /quiz/page.tsx
    /flashcards/page.tsx
    /exam/page.tsx
    /planner/page.tsx
  /components
    /layout
    /cards
    /quiz
    /flashcards
    /planner
    /progress
  /data
    syllabus.ts
    tasheel-grade-5.ts
    sample-questions.ts
  /lib
    storage.ts
    scoring.ts
    spaced-repetition.ts
    quiz-engine.ts
    normalise-answer.ts
  /types
    syllabus.ts
    quiz.ts
    progress.ts



Data model

Design the app around structured content.

Example types:

export type Syllabus = {

  id: string;

  name: string;

  grades: Grade[];

};

export type Grade = {

  id: string;

  name: string;

  subjects: Subject[];

};

export type Subject = {

  id: string;

  name: string;

  description?: string;

  lessons: Lesson[];

};

export type Lesson = {

  id: string;

  title: string;

  subjectId: string;

  summary: string;

  keyTerms: KeyTerm[];

  points: string[];

  questions: Question[];

  flashcards: Flashcard[];

};

export type KeyTerm = {

  term: string;

  meaning: string;

};

export type Question =

  | MultipleChoiceQuestion

  | ShortAnswerQuestion

  | FillBlankQuestion

  | TrueFalseQuestion

  | MatchQuestion

  | WordSearchQuestion;

export type BaseQuestion = {

  id: string;

  lessonId: string;

  subjectId: string;

  difficulty: "easy" | "medium" | "hard";

  prompt: string;

  explanation?: string;

};

export type MultipleChoiceQuestion = BaseQuestion & {

  type: "multiple-choice";

  options: string[];

  correctAnswer: string;

};

export type ShortAnswerQuestion = BaseQuestion & {

  type: "short-answer";

  acceptedAnswers: string[];

};

export type FillBlankQuestion = BaseQuestion & {

  type: "fill-blank";

  correctAnswer: string;

};

export type TrueFalseQuestion = BaseQuestion & {

  type: "true-false";

  correctAnswer: boolean;

};

export type MatchQuestion = BaseQuestion & {

  type: "match";

  pairs: {

    left: string;

    right: string;

  }[];

};

export type WordSearchQuestion = BaseQuestion & {

  type: "word-search";

  grid: string[][];

  words: string[];

};

export type Flashcard = {

  id: string;

  subjectId: string;

  lessonId: string;

  front: string;

  back: string;

  dueAt?: string;

  strength?: number;

};


Initial sample content

Create enough sample content to prove the app works. Use the uploaded screenshots and PDFs as reference.

Include sample questions like:

Aqaaid

Lesson: Allah’s qualities

Key words:

* Qadeem
* Qaadir
* Hayy
* Mutakallim
* Khaaliq

Matching:

* Qadeem → Eternal
* Qaadir → All powerful
* Hayy → Everliving
* Mutakallim → One who speaks
* Khaaliq → Creator

Questions:

* What is the meaning of Eternal?
* Allah was not ______ by anyone.
* He is the ______.
* Do the qualities of Allah Ta‘ala change?
* Why do we say that Allah is ONE?

Aqaaid

Lesson: Angels

Key words:

* Munkar
* Nakeer
* Kiraaman Kaatibeen
* Mulhim

Questions:

* Who is Mulhim?
* Give the functions of other angels.
* What causes inconvenience to the angels?

Akhlaaq

Lesson: Walking

Summary:
Islam teaches manners in all parts of life, including how we walk. We should walk with moderation, humility, and awareness.

Questions:

* What does it mean to walk moderately?
* Should a Muslim walk proudly?
* How did Rasoolullah ﷺ walk?
* What should we avoid looking into when walking?

Akhlaaq

Lesson: Introduction to Akhlaaq

Questions:

* What is Akhlaaq?
* Why is good character important?
* Who had the best character?
* Do Muslim manners change with time?
* Who should our good conduct first touch?

Tareekh / Islamic History

Lesson: Compilation of the Qur’an

Questions:

* During whose time was the Qur’an compiled into book form?
* Why was there concern after the battle against Musailamah?
* Who was given the task of collecting the written pieces?
* What materials had the Qur’an been written on?
* What was compiled from the collected pieces?

Hadeeth / Akhlaaq

Lessons from contents:

* Walking
* Talking
* Joking
* Neighbours
* Self Respect
* Hosts
* Sharing
* Table Manners
* Friday Salaah
* Duty of one Muslim to another

Create placeholder lessons for these, ready for real content to be added later.

PDF ingestion strategy

For now, do not build a full automatic PDF parser unless it is simple.

MVP approach:

* Store structured content manually in TypeScript files.
* Allow future import from JSON.
* Add a content-source field so we know which PDF/page the content came from.

Later version:

* Add admin/import mode.
* Parent uploads PDF.
* App extracts text.
* Parent reviews generated questions.
* Parent approves before it appears in the student app.

Do not depend on AI at runtime for the MVP.

Question generation strategy

For MVP:

* Use manually curated questions in /data/tasheel-grade-5.ts.
* Make the quiz engine dynamic enough to render any question type.

Later:

* Add a script that takes extracted PDF text and outputs JSON question banks.
* Always allow human review because Islamic educational content must be accurate.

Islamic content requirements

Be respectful with Islamic terms.

Use:

* Allah
* Qur’an
* Rasoolullah ﷺ
* Nabee ﷺ
* Sayyidina Abu Bakr رضي الله عنه
* Sayyidina Zaid رضي الله عنه

Do not invent Islamic rulings. Where content is uncertain, mark as “Needs review”.

Add a small note in the code comments:
“Islamic content must be reviewed by a parent/teacher before use.”

Features for engagement

Add lightweight gamification:

* Daily streak
* Subject mastery badge
* Lesson completion rings
* “Weak topic” cards
* “Ready for exam” score
* Progress celebration after completing a quiz
* Gentle animations when answers are correct

Avoid over-gamifying. The goal is revision and mastery.

Answer checking

For short answers:

* Trim whitespace.
* Lowercase.
* Remove punctuation.
* Allow accepted answer variants.
* For now, exact match against accepted answers is enough.
* Later, add fuzzy matching.

Example:


acceptedAnswers: [

  "najasa haqiqi and najasa hukmi",

  "najasa haqeeqi and najasa hukmi",

  "haqiqi and hukmi"

]
Accessibility

* Use readable font sizes.
* High contrast.
* Keyboard accessible.
* Buttons should be easy to tap.
* Do not rely on colour alone for correct/incorrect states.
* Use clear labels.

Pages to build

Home page

* Welcome screen
* Student name input if no profile exists
* Continue button

Dashboard

* Greeting
* Today’s revision
* Continue where you left off
* Subject progress cards
* Flashcards due
* Exam practice button

Syllabus page

* Select syllabus
* Select grade
* Select subject

Subject page

* Subject overview
* Lessons list
* Progress per lesson
* Start quick quiz
* Practise flashcards

Lesson page

* Summary
* Key terms
* Important points
* Start quiz
* Flashcards

Quiz page

* Render different question types
* Immediate feedback
* Explanation
* Next question
* Score tracker

Flashcards page

* Card flip interaction
* Spaced repetition buttons
* Due cards first

Exam practice page

* Configure test
* Mixed questions
* Results screen
* Weak topics added to flashcards

Planner page

* Set exam date
* Daily revision plan
* Mark day complete

MVP acceptance criteria

The first working version is complete when:

1. A student can enter their name and it is saved.
2. The dashboard greets the student.
3. The student can select Tasheel Grade 5.
4. The student can choose Aqaaid, Akhlaaq, Fiqh, Hadeeth, or Tareekh.
5. Each subject has lessons.
6. Lessons show summaries, key terms, and questions.
7. The student can complete a quiz.
8. The app shows correct/incorrect feedback.
9. Wrong answers are added to flashcards.
10. Flashcards can be practised.
11. Progress is saved locally.
12. The UI works well on mobile and desktop.

Build order

Work in this order:

1. Create project skeleton with Next.js, TypeScript, Tailwind, and shadcn/ui.
2. Build the data model and sample Tasheel Grade 5 content.
3. Build local storage helpers.
4. Build student profile flow.
5. Build dashboard.
6. Build syllabus/subject/lesson navigation.
7. Build quiz engine.
8. Build flashcard system.
9. Build progress tracking.
10. Build exam practice.
11. Build revision planner.
12. Polish UI and animations.
13. Add more content from PDFs.

Coding standards

* Use TypeScript strictly.
* Keep components small and reusable.
* Keep content separate from UI.
* Make the quiz engine data-driven.
* Avoid hardcoding only for Grade 5.
* Design for future syllabuses.
* Use clean naming.
* Add comments where logic is important.
* Make it easy for a parent to add more questions.

Final aim

This should become a reusable Madrasah revision platform where any syllabus can be added, any grade can be added, and students can revise through tests, flashcards, word searches, matching exercises, and exam practice.

The first priority is helping a 10-year-old revise the Tasheel Grade 5 syllabus confidently over the next two weeks.

## Additional requirement: follow the real Tas-heel book structure

The application must follow the structure of the actual Tas-heel books, not invent a generic structure.

Each subject should mirror the book layout as closely as possible.

For example:

- Some books have Lesson 1, Lesson 2, Lesson 3, then a test.
- Some books have a contents page with numbered lessons.
- Some books have stories after lessons.
- Some books have exercises, match-the-column, fill-in-the-blank, short-answer questions, or word searches.
- Some subjects, such as Akhlaaq, may not have formal tests after every lesson, so the app should generate practice/revision activities based on the lesson content instead.

The app should support all of these content structures.

## Content hierarchy

Use this structure:

```ts
Syllabus
  Grade
    Subject
      Book
        Unit / Section
          Lesson
            Content Blocks
            Activities
            Tests

Each lesson should be able to include:

* Title
* Page range
* Lesson number
* Short explanation
* Story section if available
* New words / key terms
* Main lesson text
* Important points
* Questions
* Exercises
* Flashcards
* Related test questions
* Source PDF filename
* Source page number

Example:

export type Lesson = {
  id: string;
  subjectId: string;
  bookId: string;
  lessonNumber?: number;
  title: string;
  pageStart?: number;
  pageEnd?: number;
  summary?: string;
  source?: {
    pdfName?: string;
    pageNumbers?: number[];
  };
  contentBlocks: ContentBlock[];
  activities: Activity[];
  tests?: Test[];
  flashcards: Flashcard[];
};

Content blocks

Lessons should be rendered from flexible content blocks.

Content blocks

Lessons should be rendered from flexible content blocks.

Activity model

Activities should match the book where possible.

export type Activity =
  | QuestionActivity
  | MatchActivity
  | WordSearchActivity
  | FlashcardActivity
  | WritingActivity
  | RevisionGameActivity;

export type QuestionActivity = {
  id: string;
  type: "questions";
  title?: string;
  questions: Question[];
};

export type MatchActivity = {
  id: string;
  type: "match";
  title?: string;
  pairs: {
    left: string;
    right: string;
  }[];
};

export type WordSearchActivity = {
  id: string;
  type: "word-search";
  title?: string;
  grid: string[][];
  words: string[];
};

export type WritingActivity = {
  id: string;
  type: "writing";
  title?: string;
  prompt: string;
  suggestedAnswer?: string;
};

Tests should be first-class

Some books have tests after a group of lessons. The app must support this.

Example:



export type Test = {
  id: string;
  title: string;
  subjectId: string;
  bookId: string;
  coversLessonIds: string[];
  source?: {
    pdfName?: string;
    pageNumbers?: number[];
  };
  questions: Question[];
  difficulty?: "easy" | "medium" | "hard" | "mixed";
};


The student journey should show:

* Lesson 1
* Lesson 2
* Lesson 3
* Test 1
* Lesson 4
* Lesson 5
* Test 2

The app should visually show tests as checkpoints.

Akhlaaq-specific behaviour

Akhlaaq may not have formal test pages.

For Akhlaaq:

* Follow the lesson titles from the contents page.
* Show each lesson as its own topic.
* Use lesson content to create revision questions.
* Use story sections as comprehension questions.
* Create flashcards from manners, key points, and important terms.
* Add “scenario questions” where suitable.

Example:

Lesson: Walking

Possible activity:
“Which of these is the best example of walking with humility?”

Possible options:

* Walking proudly with your chest out.
* Walking so slowly that people are delayed.
* Walking moderately and being aware of your surroundings.
* Looking into people’s homes while walking.

This keeps Akhlaaq engaging even if the book has fewer formal tests.


Then add this admin-panel section.

```md
## Admin panel requirement

The app must be designed with an admin panel in mind from the beginning.

For MVP, the admin panel can be local-only and protected by a simple parent/admin PIN.

Later, it can become a real authenticated dashboard.

## Admin users

There are two main roles:

### Student

Can:
- Revise lessons
- Take quizzes
- Practise flashcards
- Complete tests
- View own progress
- Follow revision plan

### Admin / Parent / Teacher

Can:
- View student progress
- See scores by subject
- See weak lessons and weak topics
- See quiz history
- Create questions
- Edit questions
- Create tests
- Edit tests
- Build a question bank
- Assign revision tasks
- Set exam date
- Choose which subjects are active
- Import or review PDF-based content later

## Admin panel pages

Create the admin architecture even if some pages are simple placeholders in the MVP.

Routes:

```txt
/admin
/admin/dashboard
/admin/students
/admin/students/[studentId]
/admin/content
/admin/content/syllabuses
/admin/content/subjects
/admin/content/lessons
/admin/questions
/admin/questions/new
/admin/tests
/admin/tests/new
/admin/results
/admin/settings

Admin dashboard

The admin dashboard should show:

* Student name
* Days until exam
* Overall progress
* Subject accuracy
* Lessons completed
* Tests completed
* Weak topics
* Flashcards due
* Recent quiz attempts
* Recommended next revision

Example admin insight:

“Muhammad is strong in Akhlaaq but needs more revision in Aqaaid Lesson 2: Angels. He missed 4 out of 7 questions related to angel names and functions.”

Student progress model

Track detailed progress.

Admin dashboard

The admin dashboard should show:

* Student name
* Days until exam
* Overall progress
* Subject accuracy
* Lessons completed
* Tests completed
* Weak topics
* Flashcards due
* Recent quiz attempts
* Recommended next revision

Example admin insight:

“Muhammad is strong in Akhlaaq but needs more revision in Aqaaid Lesson 2: Angels. He missed 4 out of 7 questions related to angel names and functions.”

Student progress model

Track detailed progress.

export type StudentProgress = {
  studentId: string;
  completedLessonIds: string[];
  quizAttempts: QuizAttempt[];
  testAttempts: TestAttempt[];
  flashcardReviews: FlashcardReview[];
  weakTopicIds: string[];
  subjectStats: SubjectStats[];
  streak: {
    current: number;
    best: number;
    lastStudiedAt?: string;
  };
};

export type QuizAttempt = {
  id: string;
  studentId: string;
  subjectId: string;
  lessonId?: string;
  testId?: string;
  mode: "lesson-practice" | "quick-quiz" | "exam-practice" | "flashcard-review";
  startedAt: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  answers: StudentAnswer[];
};

export type StudentAnswer = {
  questionId: string;
  prompt: string;
  studentAnswer: string | string[] | boolean;
  correctAnswer: string | string[] | boolean;
  isCorrect: boolean;
  timeTakenSeconds?: number;
};

export type SubjectStats = {
  subjectId: string;
  lessonsCompleted: number;
  totalLessons: number;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
};

Question bank

Build a reusable question bank.

Questions should not only live inside a quiz. A question can belong to:

* A syllabus
* A grade
* A subject
* A book
* A lesson
* A topic
* A test
* One or more tags

Example:
export type QuestionBankItem = Question & {
  syllabusId: string;
  gradeId: string;
  subjectId: string;
  bookId?: string;
  lessonId?: string;
  topicIds?: string[];
  tags?: string[];
  source?: {
    pdfName?: string;
    pageNumber?: number;
    screenshotName?: string;
  };
  status: "draft" | "reviewed" | "active" | "archived";
  createdBy?: string;
  reviewedBy?: string;
};

Admin should be able to filter the question bank by:

* Subject
* Lesson
* Question type
* Difficulty
* Status
* Tags
* Weak topics
* Used in tests / not used in tests

Test builder

Admin should be able to create tests from the question bank.

Test builder should allow:

* Test title
* Subject
* Lessons covered
* Number of questions
* Question types
* Difficulty mix
* Manual question selection
* Random selection from question bank
* Save as draft
* Activate test for student

Example:

“Create Aqaaid Test 1 covering Lessons 1–3 with 15 questions: 5 multiple choice, 5 fill-in-the-blank, 3 short-answer, 2 matching.”

Admin content editor

Admin should be able to add and edit:

* Syllabuses
* Grades
* Subjects
* Lessons
* Key terms
* Lesson summaries
* Questions
* Flashcards
* Tests

For MVP, this can write to local storage.

Later, this should be moved to a backend database.

Storage strategy

MVP:

* LocalStorage or IndexedDB.
* Seed data from TypeScript files.
* Admin-created content saved locally.

Later:

* Supabase, Firebase, or custom backend.
* Authentication.
* Parent/teacher accounts.
* Multiple students.
* Cloud sync.

Build the code so storage is abstracted behind a service.

Example:

interface StorageAdapter {

  getStudentProfile(): Promise<StudentProfile | null>;

  saveStudentProfile(profile: StudentProfile): Promise<void>;

  getProgress(studentId: string): Promise<StudentProgress>;

  saveProgress(progress: StudentProgress): Promise<void>;

  getQuestionBank(): Promise<QuestionBankItem[]>;

  saveQuestion(question: QuestionBankItem): Promise<void>;

  getTests(): Promise<Test[]>;

  saveTest(test: Test): Promise<void>;

}

Do not tightly couple the app to localStorage. Use a storage adapter so a backend can be added later.

Admin PIN

For the MVP:

* Add /admin.
* Ask for a simple PIN.
* Default development PIN can be 1234.
* Store admin unlocked state in session storage.
* Add a note that this is not real security and must be replaced before production.

Reporting

Admin results page should include:

* Accuracy by subject
* Accuracy by lesson
* Most missed questions
* Weak topics
* Time spent revising
* Test history
* Flashcard retention
* Recommended revision

Use simple charts if possible.

Use Recharts if charts are needed.

Fun but serious learning

The student app should make revision enjoyable:

* Unlock lesson checkpoints.
* Show “Mastered”, “Practising”, “Needs revision”.
* Celebrate improvement, not just high scores.
* After wrong answers, avoid harsh wording.
* Say: “Good try. Let’s revise this one.”
* Give the correct answer and explanation.
* Add it to flashcards.

Updated MVP acceptance criteria

The MVP should now include:

1. Student profile saved locally.
2. Tasheel Grade 5 syllabus structure.
3. Subjects follow lesson order from books.
4. Tests can appear after groups of lessons.
5. Akhlaaq works even without formal test pages.
6. Student can revise lessons and attempt quizzes.
7. Wrong answers become flashcards.
8. Progress is tracked.
9. Admin route exists.
10. Admin can enter a PIN.
11. Admin can view student progress.
12. Admin can see weak areas.
13. Admin can view question bank.
14. Admin can create or edit a question locally.
15. Admin can create a simple test from existing questions.