export const COURSE_NAME = 'Providence Golf Club'

export const courseHoles = [
  { hole: 1, par: 4 },
  { hole: 2, par: 3 },
  { hole: 3, par: 4 },
  { hole: 4, par: 4 },
  { hole: 5, par: 5 },
  { hole: 6, par: 3 },
  { hole: 7, par: 4 },
  { hole: 8, par: 5 },
  { hole: 9, par: 3 },
]

export const COURSE_PAR = courseHoles.reduce(
  (total, hole) => total + hole.par,
  0,
)