/** Canonical grade levels for Christ the King Catholic School (Pre-K → Grade 10). */
export const GRADE_LEVELS = [
  "Pre-Kindergarten",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
] as const;

export type GradeLevel = (typeof GRADE_LEVELS)[number];
