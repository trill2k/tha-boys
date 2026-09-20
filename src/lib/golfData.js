import { supabase } from './supabase'
import { courseHoles } from '../data/course'

const COURSE_PARS = Object.fromEntries(
  courseHoles.map((hole) => [
    hole.hole,
    hole.par,
  ]),
)

/*
|--------------------------------------------------------------------------
| PLAYERS
|--------------------------------------------------------------------------
*/

export async function getPlayers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .order('name')

  if (error) {
    throw error
  }

  return data || []
}

/*
|--------------------------------------------------------------------------
| WEEK - GET SPECIFIC WEEK
|--------------------------------------------------------------------------
*/

export async function getWeek(weekNumber) {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .eq('week_number', weekNumber)
    .single()

  if (error) {
    throw error
  }

  return data
}

/*
|--------------------------------------------------------------------------
| WEEK - GET CURRENT WEEK
|--------------------------------------------------------------------------
*/

export async function getCurrentWeek() {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .eq('is_current', true)
    .single()

  if (error) {
    throw error
  }

  return data
}

/*
|--------------------------------------------------------------------------
| ADMIN - LOAD SCORES FOR A WEEK
|--------------------------------------------------------------------------
*/

export async function getAdminWeekScores(
  weekNumber,
) {
  const week = await getWeek(weekNumber)
  const players = await getPlayers()

  const {
    data: rounds,
    error: roundsError,
  } = await supabase
    .from('rounds')
    .select('id, player_id')
    .eq('week_id', week.id)

  if (roundsError) {
    throw roundsError
  }

  const scorecards = {}

  players.forEach((player) => {
    scorecards[player.id] = {
      player,
      roundId: null,
      scores: {},
    }
  })

  if (!rounds || rounds.length === 0) {
    return {
      week,
      players,
      scorecards,
    }
  }

  rounds.forEach((round) => {
    if (scorecards[round.player_id]) {
      scorecards[
        round.player_id
      ].roundId = round.id
    }
  })

  const roundIds = rounds.map(
    (round) => round.id,
  )

  const {
    data: holeScores,
    error: scoreError,
  } = await supabase
    .from('hole_scores')
    .select(
      'id, round_id, hole_number, par, strokes, stableford_points',
    )
    .in('round_id', roundIds)
    .order('hole_number')

  if (scoreError) {
    throw scoreError
  }

  const roundToPlayer = {}

  rounds.forEach((round) => {
    roundToPlayer[round.id] =
      round.player_id
  })

  ;(holeScores || []).forEach(
    (score) => {
      const playerId =
        roundToPlayer[score.round_id]

      if (!scorecards[playerId]) {
        return
      }

      scorecards[playerId].scores[
        score.hole_number
      ] = {
        id: score.id,
        strokes: score.strokes,
        par: score.par,
        stablefordPoints:
          score.stableford_points,
      }
    },
  )

  return {
    week,
    players,
    scorecards,
  }
}

/*
|--------------------------------------------------------------------------
| ROUND - FIND OR CREATE
|--------------------------------------------------------------------------
*/

async function getOrCreateRound(
  weekId,
  playerId,
) {
  const {
    data: existingRound,
    error,
  } = await supabase
    .from('rounds')
    .select('id')
    .eq('week_id', weekId)
    .eq('player_id', playerId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (existingRound) {
    return existingRound
  }

  const {
    data: newRound,
    error: insertError,
  } = await supabase
    .from('rounds')
    .insert({
      week_id: weekId,
      player_id: playerId,
    })
    .select('id')
    .single()

  if (insertError) {
    throw insertError
  }

  return newRound
}

/*
|--------------------------------------------------------------------------
| ADMIN - ADD OR UPDATE HOLE SCORE
|--------------------------------------------------------------------------
*/

export async function saveAdminHoleScore({
  weekNumber,
  playerId,
  holeNumber,
  strokes,
}) {
  const week =
    await getWeek(weekNumber)

  const round =
    await getOrCreateRound(
      week.id,
      playerId,
    )

  const par =
    COURSE_PARS[holeNumber]

  const { data, error } = await supabase
    .from('hole_scores')
    .upsert(
      {
        round_id: round.id,
        hole_number: holeNumber,
        par,
        strokes,
      },
      {
        onConflict:
          'round_id,hole_number',
      },
    )
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/*
|--------------------------------------------------------------------------
| ADMIN - REMOVE HOLE SCORE
|--------------------------------------------------------------------------
*/

export async function removeAdminHoleScore({
  weekNumber,
  playerId,
  holeNumber,
}) {
  const week =
    await getWeek(weekNumber)

  const {
    data: round,
    error: roundError,
  } = await supabase
    .from('rounds')
    .select('id')
    .eq('week_id', week.id)
    .eq('player_id', playerId)
    .maybeSingle()

  if (roundError) {
    throw roundError
  }

  if (!round) {
    return
  }

  const { error } = await supabase
    .from('hole_scores')
    .delete()
    .eq('round_id', round.id)
    .eq('hole_number', holeNumber)

  if (error) {
    throw error
  }
}

/*
|--------------------------------------------------------------------------
| PLAYER - LOAD MY ROUND
|--------------------------------------------------------------------------
*/

export async function getMyWeekRound(
  weekNumber,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error(
      'You must be logged in.',
    )
  }

  const week =
    await getWeek(weekNumber)

  const {
    data: round,
    error: roundError,
  } = await supabase
    .from('rounds')
    .select('id')
    .eq('week_id', week.id)
    .eq('player_id', user.id)
    .maybeSingle()

  if (roundError) {
    throw roundError
  }

  if (!round) {
    return {
      week,
      roundId: null,
      scores: {},
    }
  }

  const {
    data: holeScores,
    error: scoreError,
  } = await supabase
    .from('hole_scores')
    .select(
      'id, hole_number, par, strokes, stableford_points',
    )
    .eq('round_id', round.id)
    .order('hole_number')

  if (scoreError) {
    throw scoreError
  }

  const scores = {}

  ;(holeScores || []).forEach(
    (score) => {
      scores[score.hole_number] = {
        id: score.id,
        strokes: score.strokes,
        par: score.par,
        stablefordPoints:
          score.stableford_points,
      }
    },
  )

  return {
    week,
    roundId: round.id,
    scores,
  }
}

/*
|--------------------------------------------------------------------------
| PLAYER - SUBMIT MY HOLE SCORE
|--------------------------------------------------------------------------
*/

export async function submitMyHoleScore({
  weekNumber,
  holeNumber,
  strokes,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error(
      'You must be logged in.',
    )
  }

  const week =
    await getWeek(weekNumber)

  const round =
    await getOrCreateRound(
      week.id,
      user.id,
    )

  const par =
    COURSE_PARS[holeNumber]

  const { data, error } = await supabase
    .from('hole_scores')
    .insert({
      round_id: round.id,
      hole_number: holeNumber,
      par,
      strokes,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/*
|--------------------------------------------------------------------------
| ADMIN - LOAD TEAM ASSIGNMENTS
|--------------------------------------------------------------------------
*/

export async function getTeamAssignments(
  weekNumber,
) {
  const week =
    await getWeek(weekNumber)

  const players =
    await getPlayers()

  const {
    data: assignments,
    error,
  } = await supabase
    .from('team_assignments')
    .select('player_id, team')
    .eq('week_id', week.id)

  if (error) {
    throw error
  }

  const assignmentsByPlayer = {}

  players.forEach((player) => {
    assignmentsByPlayer[player.id] = {
      player,
      team: null,
    }
  })

  ;(assignments || []).forEach(
    (assignment) => {
      if (
        assignmentsByPlayer[
          assignment.player_id
        ]
      ) {
        assignmentsByPlayer[
          assignment.player_id
        ].team = assignment.team
      }
    },
  )

  return {
    week,
    players,
    assignments:
      assignmentsByPlayer,
  }
}

/*
|--------------------------------------------------------------------------
| ADMIN - SAVE TEAM ASSIGNMENTS
|--------------------------------------------------------------------------
|
| Saving teams also makes that week the CURRENT WEEK.
|
|--------------------------------------------------------------------------
*/

export async function saveTeamAssignments({
  weekNumber,
  assignments,
}) {
  const week =
    await getWeek(weekNumber)

  const rows = Object.entries(
    assignments,
  ).map(
    ([playerId, team]) => ({
      week_id: week.id,
      player_id: playerId,
      team,
    }),
  )

  const { data, error } = await supabase
    .from('team_assignments')
    .upsert(rows, {
      onConflict:
        'week_id,player_id',
    })
    .select()

  if (error) {
    throw error
  }

  /*
    Turn off any OTHER active week.
  */
  const {
    error: clearCurrentError,
  } = await supabase
    .from('weeks')
    .update({
      is_current: false,
    })
    .eq('is_current', true)
    .neq('id', week.id)

  if (clearCurrentError) {
    throw clearCurrentError
  }

  /*
    Make the week Ryan selected
    the new active week.
  */
  const {
    error: setCurrentError,
  } = await supabase
    .from('weeks')
    .update({
      is_current: true,
    })
    .eq('id', week.id)

  if (setCurrentError) {
    throw setCurrentError
  }

  return data
}

/*
|--------------------------------------------------------------------------
| HOME - CURRENT WEEK + TEAMS
|--------------------------------------------------------------------------
*/

export async function getCurrentWeekHomeData() {
  const week =
    await getCurrentWeek()

  const {
    data: assignments,
    error: assignmentError,
  } = await supabase
    .from('team_assignments')
    .select('player_id, team')
    .eq('week_id', week.id)

  if (assignmentError) {
    throw assignmentError
  }

  const players =
    await getPlayers()

  const assignmentMap = {}

  ;(assignments || []).forEach(
    (assignment) => {
      assignmentMap[
        assignment.player_id
      ] = assignment.team
    },
  )

  const team1 = []
  const team2 = []
  const out = []

  players.forEach((player) => {
    const team =
      assignmentMap[player.id]

    if (team === '1') {
      team1.push(player.name)
    }

    if (team === '2') {
      team2.push(player.name)
    }

    if (team === 'out') {
      out.push(player.name)
    }
  })

  return {
    week,
    team1,
    team2,
    out,
  }
}

/*
|--------------------------------------------------------------------------
| PLAYER - ROUND HISTORY
|--------------------------------------------------------------------------
*/

export async function getMyRoundHistory() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error(
      'You must be logged in.',
    )
  }

  const {
    data: rounds,
    error: roundsError,
  } = await supabase
    .from('rounds')
    .select(
      'id, week_id, created_at',
    )
    .eq('player_id', user.id)

  if (roundsError) {
    throw roundsError
  }

  if (!rounds || rounds.length === 0) {
    return []
  }

  const weekIds = [
    ...new Set(
      rounds.map(
        (round) => round.week_id,
      ),
    ),
  ]

  const roundIds =
    rounds.map(
      (round) => round.id,
    )

  const {
    data: weeks,
    error: weeksError,
  } = await supabase
    .from('weeks')
    .select(
      'id, week_number, label, course',
    )
    .in('id', weekIds)

  if (weeksError) {
    throw weeksError
  }

  const {
    data: holeScores,
    error: scoresError,
  } = await supabase
    .from('hole_scores')
    .select(
      'round_id, hole_number, par, strokes, stableford_points',
    )
    .in('round_id', roundIds)
    .order('hole_number')

  if (scoresError) {
    throw scoresError
  }

  const weekMap = {}

  ;(weeks || []).forEach(
    (week) => {
      weekMap[week.id] = week
    },
  )

  const scoreMap = {}

  ;(holeScores || []).forEach(
    (score) => {
      if (
        !scoreMap[
          score.round_id
        ]
      ) {
        scoreMap[
          score.round_id
        ] = []
      }

      scoreMap[
        score.round_id
      ].push(score)
    },
  )

  return rounds
    .map((round) => {
      const week =
        weekMap[round.week_id]

      const scores =
        scoreMap[round.id] || []

      if (
        !week ||
        scores.length === 0
      ) {
        return null
      }

      const holes = [
        ...scores,
      ].sort(
        (a, b) =>
          a.hole_number -
          b.hole_number,
      )

      const total =
        holes.reduce(
          (sum, score) =>
            sum +
            Number(
              score.strokes || 0,
            ),
          0,
        )

      return {
        roundId: round.id,
        weekNumber:
          week.week_number,
        label: week.label,
        course: week.course,
        total,
        thru: holes.length,
        complete:
          holes.length === 9,
        holes,
      }
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.weekNumber -
        a.weekNumber,
    )
}

/*
|--------------------------------------------------------------------------
| LEADERBOARD - REAL LEAGUE STANDINGS
|--------------------------------------------------------------------------
|
| Par 3 / Par 4:
| Best 3 player Stableford scores count.
|
| Par 5:
| Best 2 player Stableford scores count.
|
|--------------------------------------------------------------------------
*/

export async function getLeaderboardData() {
  const players =
    await getPlayers()

  const {
    data: weeks,
    error: weeksError,
  } = await supabase
    .from('weeks')
    .select('*')
    .order('week_number')

  if (weeksError) {
    throw weeksError
  }

  const {
    data: assignments,
    error: assignmentError,
  } = await supabase
    .from('team_assignments')
    .select(
      'week_id, player_id, team',
    )

  if (assignmentError) {
    throw assignmentError
  }

  const {
    data: rounds,
    error: roundsError,
  } = await supabase
    .from('rounds')
    .select(
      'id, week_id, player_id',
    )

  if (roundsError) {
    throw roundsError
  }

  let holeScores = []

  if (
    rounds &&
    rounds.length > 0
  ) {
    const roundIds =
      rounds.map(
        (round) => round.id,
      )

    const {
      data,
      error,
    } = await supabase
      .from('hole_scores')
      .select(
        'round_id, hole_number, par, strokes, stableford_points',
      )
      .in('round_id', roundIds)

    if (error) {
      throw error
    }

    holeScores = data || []
  }

  const currentWeek =
    (weeks || []).find(
      (week) =>
        week.is_current,
    )

  if (!currentWeek) {
    throw new Error(
      'No current week is set.',
    )
  }

  /*
    weekId
      → playerId
        → team
  */

  const assignmentMap = {}

  ;(assignments || []).forEach(
    (assignment) => {
      if (
        !assignmentMap[
          assignment.week_id
        ]
      ) {
        assignmentMap[
          assignment.week_id
        ] = {}
      }

      assignmentMap[
        assignment.week_id
      ][assignment.player_id] =
        assignment.team
    },
  )

  /*
    weekId
      → playerId
        → roundId
  */

  const roundMap = {}

  ;(rounds || []).forEach(
    (round) => {
      if (
        !roundMap[
          round.week_id
        ]
      ) {
        roundMap[
          round.week_id
        ] = {}
      }

      roundMap[
        round.week_id
      ][round.player_id] =
        round.id
    },
  )

  /*
    roundId
      → holeNumber
        → score row
  */

  const scoreMap = {}

  holeScores.forEach(
    (score) => {
      if (
        !scoreMap[
          score.round_id
        ]
      ) {
        scoreMap[
          score.round_id
        ] = {}
      }

      scoreMap[
        score.round_id
      ][score.hole_number] =
        score
    },
  )

  /*
    Calculate each team's
    Stableford total for every week.
  */

  const weeklyTeamScores = {}

  ;(weeks || []).forEach(
    (week) => {
      weeklyTeamScores[
        week.id
      ] = {
        1: 0,
        2: 0,
      }

      ;['1', '2'].forEach(
        (team) => {
          courseHoles.forEach(
            (hole) => {
              const points = []

              players.forEach(
                (player) => {
                  const assignment =
                    assignmentMap[
                      week.id
                    ]?.[
                      player.id
                    ]

                  if (
                    assignment !==
                    team
                  ) {
                    return
                  }

                  const roundId =
                    roundMap[
                      week.id
                    ]?.[
                      player.id
                    ]

                  if (!roundId) {
                    return
                  }

                  const score =
                    scoreMap[
                      roundId
                    ]?.[
                      hole.hole
                    ]

                  if (!score) {
                    return
                  }

                  points.push(
                    Number(
                      score.stableford_points ||
                        0,
                    ),
                  )
                },
              )

              points.sort(
                (a, b) =>
                  b - a,
              )

              const scoresToCount =
                hole.par === 5
                  ? 2
                  : 3

              const holeTotal =
                points
                  .slice(
                    0,
                    scoresToCount,
                  )
                  .reduce(
                    (
                      total,
                      value,
                    ) =>
                      total +
                      value,
                    0,
                  )

              weeklyTeamScores[
                week.id
              ][team] +=
                holeTotal
            },
          )
        },
      )
    },
  )

  /*
    Build player standings.
  */

  const standings =
    players.map((player) => {
      let seasonPoints = 0
      let seasonGross = 0

      ;(weeks || []).forEach(
        (week) => {
          const team =
            assignmentMap[
              week.id
            ]?.[
              player.id
            ]

          if (
            team === '1' ||
            team === '2'
          ) {
            seasonPoints +=
              weeklyTeamScores[
                week.id
              ][team]
          }

          const roundId =
            roundMap[
              week.id
            ]?.[
              player.id
            ]

          if (roundId) {
            Object.values(
              scoreMap[
                roundId
              ] || {},
            ).forEach(
              (score) => {
                seasonGross +=
                  Number(
                    score.strokes ||
                      0,
                  )
              },
            )
          }
        },
      )

      /*
        Current week individual
        gross score.
      */

      const currentRoundId =
        roundMap[
          currentWeek.id
        ]?.[
          player.id
        ]

      const currentScores =
        currentRoundId
          ? scoreMap[
              currentRoundId
            ] || {}
          : {}

      const currentHoleScores =
        Object.values(
          currentScores,
        )

      const weekScore =
        currentHoleScores.length > 0
          ? currentHoleScores.reduce(
              (
                total,
                score,
              ) =>
                total +
                Number(
                  score.strokes ||
                    0,
                ),
              0,
            )
          : null

      const thru =
        currentHoleScores.length

      return {
        id: player.id,
        name: player.name,
        seasonPoints,
        seasonGross,
        weekScore,
        thru,
        complete:
          thru === 9,
        team:
          assignmentMap[
            currentWeek.id
          ]?.[
            player.id
          ] || null,
      }
    })

  /*
    Leaderboard sorting:

    1. Highest season/team points
    2. Completed round ahead of incomplete
    3. Lower current-week gross score
    4. Alphabetical fallback
  */

  standings.sort(
    (a, b) => {
      if (
        b.seasonPoints !==
        a.seasonPoints
      ) {
        return (
          b.seasonPoints -
          a.seasonPoints
        )
      }

      if (
        a.complete !==
        b.complete
      ) {
        return a.complete ? -1 : 1
      }

      if (
        a.weekScore !== null &&
        b.weekScore !== null &&
        a.weekScore !==
          b.weekScore
      ) {
        return (
          a.weekScore -
          b.weekScore
        )
      }

      return a.name.localeCompare(
        b.name,
      )
    },
  )

  return {
    currentWeek,

    team1Points:
      weeklyTeamScores[
        currentWeek.id
      ]?.['1'] || 0,

    team2Points:
      weeklyTeamScores[
        currentWeek.id
      ]?.['2'] || 0,

    standings,
    weeklyTeamScores,
  }
}