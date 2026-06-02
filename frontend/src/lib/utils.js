// Utility functions for the madrasah app

/**
 * Convert a subject ID to a friendly display name
 * @param {string} subjectId - e.g. "g5-aqaaid" 
 * @returns {string} - e.g. "Aqaaid"
 */
export function getSubjectDisplayName(subjectId) {
  if (!subjectId) return '';
  
  // Remove grade prefix like "g5-", "shafii-g2-", etc.
  const withoutPrefix = subjectId.replace(/^(shafii-)?g\d+-/, '');
  
  // Capitalize first letter
  return withoutPrefix.charAt(0).toUpperCase() + withoutPrefix.slice(1);
}

/**
 * Convert a grade ID to a friendly display name
 * @param {string} gradeId - e.g. "g5", "shafii-g2"
 * @returns {string} - e.g. "Grade 5", "Shafi'i Grade 2"
 */
export function getGradeDisplayName(gradeId) {
  if (!gradeId) return '';
  
  if (gradeId.startsWith('shafii-')) {
    const gradeNumber = gradeId.replace('shafii-g', '');
    return `Shafi'i Grade ${gradeNumber}`;
  }
  
  const gradeNumber = gradeId.replace('g', '');
  return `Grade ${gradeNumber}`;
}

/**
 * Convert a lesson ID to a friendly display name
 * @param {string} lessonId - e.g. "aqaaid-001"
 * @returns {string} - e.g. "Lesson 1"
 */
export function getLessonDisplayName(lessonId) {
  if (!lessonId) return '';
  
  // Extract lesson number from ID like "aqaaid-001"
  const lessonNumber = lessonId.split('-').pop();
  if (lessonNumber && lessonNumber.match(/^\d+$/)) {
    return `Lesson ${parseInt(lessonNumber, 10)}`;
  }
  
  // Fallback: just capitalize and clean up
  return lessonId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get a friendly name for any entity type
 * @param {string} type - 'grade', 'subject', or 'lesson'
 * @param {string} id - the ID to convert
 * @returns {string} - friendly display name
 */
export function getFriendlyName(type, id) {
  switch (type) {
    case 'grade':
      return getGradeDisplayName(id);
    case 'subject':
      return getSubjectDisplayName(id);
    case 'lesson':
      return getLessonDisplayName(id);
    default:
      return id || '';
  }
}

/**
 * Find a friendly name by looking up the ID in arrays
 * @param {string} id - the ID to find
 * @param {Array} grades - array of grade objects with {id, name}
 * @param {Array} subjects - array of subject objects with {id, name}
 * @param {Array} lessons - array of lesson objects with {id, name}
 * @returns {string} - friendly name if found, otherwise falls back to utility functions
 */
export function lookupFriendlyName(id, grades = [], subjects = [], lessons = []) {
  // Try to find in grades
  const grade = grades.find(g => g.id === id);
  if (grade) return grade.name;
  
  // Try to find in subjects
  const subject = subjects.find(s => s.id === id);
  if (subject) return subject.name;
  
  // Try to find in lessons
  const lesson = lessons.find(l => l.id === id);
  if (lesson) return lesson.name;
  
  // Fallback to utility functions based on ID pattern
  if (id.match(/^(shafii-)?g\d+$/)) return getGradeDisplayName(id);
  if (id.match(/^(shafii-)?g\d+-\w+$/)) return getSubjectDisplayName(id);
  if (id.match(/^\w+-\d+$/)) return getLessonDisplayName(id);
  
  return id || '';
}