import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import AppHeader from '../../components/AppHeader'
import BottomNav from '../../components/BottomNav'
import ScoreWheel from '../../components/ScoreWheel'

import { courseHoles } from '../../data/course'
import { getStableford } from '../../utils/scoring'

import {
  getAdminWeekScores,
  saveAdminHoleScore,
  removeAdminHoleScore,
  getTeamAssignments,
  saveTeamAssignments,
} from '../../lib/golfData'

function getWeekLabel(week) {
  if (week === 5) {
    return 'Playoff Week 1'
  }

  if (week === 6) {
    return 'Playoff Week 2'
  }

  return `Week ${week}`
}

function TeamAssignmentControl({
  player,
  assignment,
  onChange,
}) {
  return (
    <div className="admin-player-row">
      <strong>{player.name}</strong>

      <div className="team-toggle">
        <button
          type="button"
          className={
            assignment === '1'
              ? 'selected'
              : ''
          }
          onClick={() =>
            onChange(
              player.id,
              '1',
            )
          }
        >
          1
        </button>

        <button
          type="button"
          className={
            assignment === '2'
              ? 'selected'
              : ''
          }
          onClick={() =>
            onChange(
              player.id,
              '2',
            )
          }
        >
          2
        </button>

        <button
          type="button"
          className={
            assignment === 'out'
              ? 'selected'
              : ''
          }
          onClick={() =>
            onChange(
              player.id,
              'out',
            )
          }
        >
          OUT
        </button>
      </div>
    </div>
  )
}

function AdminTeams() {
  const [
    selectedWeek,
    setSelectedWeek,
  ] = useState(1)

  const [
    weekData,
    setWeekData,
  ] = useState(null)

  const [
    assignments,
    setAssignments,
  ] = useState({})

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [
    savedMessage,
    setSavedMessage,
  ] = useState('')

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const loadAssignments =
    useCallback(async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const data =
          await getTeamAssignments(
            selectedWeek,
          )

        setWeekData(data)

        const loadedAssignments = {}

        data.players.forEach(
          (player) => {
            loadedAssignments[
              player.id
            ] =
              data.assignments[
                player.id
              ]?.team || null
          },
        )

        setAssignments(
          loadedAssignments,
        )
      } catch (error) {
        console.error(
          'Could not load team assignments:',
          error,
        )

        setErrorMessage(
          error?.message ||
            'Could not load teams.',
        )
      } finally {
        setLoading(false)
      }
    }, [selectedWeek])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  function setAssignment(
    playerId,
    team,
  ) {
    setAssignments(
      (current) => ({
        ...current,
        [playerId]: team,
      }),
    )

    setSavedMessage('')
    setErrorMessage('')
  }

  async function handleSetTeams() {
    const realPlayers =
      weekData?.players || []

    const missingPlayer =
      realPlayers.find(
        (player) =>
          !assignments[
            player.id
          ],
      )

    if (missingPlayer) {
      setErrorMessage(
        `Choose Team 1, Team 2, or OUT for ${missingPlayer.name}.`,
      )

      return
    }

    setSaving(true)
    setSavedMessage('')
    setErrorMessage('')

    try {
      await saveTeamAssignments({
        weekNumber:
          selectedWeek,
        assignments,
      })

      await loadAssignments()

      setSavedMessage(
        `${getWeekLabel(
          selectedWeek,
        )} teams saved.`,
      )
    } catch (error) {
      console.error(
        'Could not save team assignments:',
        error,
      )

      setErrorMessage(
        error?.message ||
          'Could not save teams.',
      )
    } finally {
      setSaving(false)
    }
  }

  const realPlayers =
    weekData?.players || []

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <div>
          <span className="small-label">
            TEAM MANAGEMENT
          </span>

          <h2>Assign Teams</h2>
        </div>
      </div>

      <div className="admin-select-field">
        <label htmlFor="team-week">
          Select Week
        </label>

        <select
          id="team-week"
          value={selectedWeek}
          onChange={(event) => {
            setSelectedWeek(
              Number(
                event.target.value,
              ),
            )

            setSavedMessage('')
            setErrorMessage('')
          }}
        >
          {[1, 2, 3, 4, 5, 6].map(
            (week) => (
              <option
                value={week}
                key={week}
              >
                {getWeekLabel(
                  week,
                )}
              </option>
            ),
          )}
        </select>
      </div>

      {loading && (
        <div className="empty-rounds">
          Loading teams...
        </div>
      )}

      {errorMessage && (
        <div className="auth-error">
          {errorMessage}
        </div>
      )}

      {!loading && (
        <div className="admin-player-list">
          {realPlayers.map(
            (player) => (
              <TeamAssignmentControl
                key={player.id}
                player={player}
                assignment={
                  assignments[
                    player.id
                  ]
                }
                onChange={
                  setAssignment
                }
              />
            ),
          )}
        </div>
      )}

      {!loading && (
        <button
          className="primary-button admin-save-button"
          type="button"
          disabled={saving}
          onClick={handleSetTeams}
        >
          {saving
            ? 'Saving Teams...'
            : 'Set Teams'}
        </button>
      )}

      {savedMessage && (
        <div className="admin-success">
          ✓ {savedMessage}
        </div>
      )}
    </section>
  )
}

function AdminScoreEditor({
  selectedWeek,
  player,
  scorecard,
  onRefresh,
  onBack,
}) {
  const [
    selectedHole,
    setSelectedHole,
  ] = useState(1)

  const [
    selectedScore,
    setSelectedScore,
  ] = useState(
    courseHoles[0].par,
  )

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const holeData =
    courseHoles[
      selectedHole - 1
    ]

  const existingScore =
    scorecard[
      selectedHole
    ]

  useEffect(() => {
    setSelectedScore(
      existingScore?.strokes ??
        holeData.par,
    )

    setMessage('')
    setErrorMessage('')
  }, [
    selectedHole,
    existingScore?.strokes,
    holeData.par,
  ])

  const stableford =
    getStableford(
      holeData.par,
      selectedScore,
    )

  const completedHoles =
    Object.keys(
      scorecard,
    ).length

  const total =
    Object.values(
      scorecard,
    ).reduce(
      (sum, score) =>
        sum +
        Number(
          score.strokes || 0,
        ),
      0,
    )

  async function handleSave() {
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    try {
      await saveAdminHoleScore({
        weekNumber:
          selectedWeek,
        playerId: player.id,
        holeNumber:
          selectedHole,
        strokes:
          selectedScore,
      })

      await onRefresh()

      setMessage(
        `Hole ${selectedHole} saved.`,
      )
    } catch (error) {
      console.error(
        'Could not save score:',
        error,
      )

      setErrorMessage(
        error?.message ||
          'Could not save this score.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    setSaving(true)
    setMessage('')
    setErrorMessage('')

    try {
      await removeAdminHoleScore({
        weekNumber:
          selectedWeek,
        playerId: player.id,
        holeNumber:
          selectedHole,
      })

      await onRefresh()

      setMessage(
        `Hole ${selectedHole} removed.`,
      )
    } catch (error) {
      console.error(
        'Could not remove score:',
        error,
      )

      setErrorMessage(
        error?.message ||
          'Could not remove this score.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-section">
      <button
        className="admin-back-button"
        type="button"
        onClick={onBack}
      >
        ← Back to players
      </button>

      <div className="admin-score-header">
        <span className="small-label">
          {getWeekLabel(
            selectedWeek,
          )}
        </span>

        <h2>{player.name}</h2>

        <div className="admin-round-total">
          <span>
            ROUND SCORE
          </span>

          <strong>
            {completedHoles
              ? total
              : '—'}
          </strong>
        </div>
      </div>

      <div className="admin-hole-tabs">
        {courseHoles.map(
          (hole) => {
            const saved =
              scorecard[
                hole.hole
              ]

            return (
              <button
                type="button"
                key={hole.hole}
                className={`admin-hole-tab ${
                  selectedHole ===
                  hole.hole
                    ? 'active'
                    : ''
                } ${
                  saved
                    ? 'has-score'
                    : ''
                }`}
                onClick={() =>
                  setSelectedHole(
                    hole.hole,
                  )
                }
              >
                <span>
                  {hole.hole}
                </span>

                <strong>
                  {saved?.strokes ??
                    '—'}
                </strong>
              </button>
            )
          },
        )}
      </div>

      <div className="admin-edit-score-card">
        <span className="small-label">
          HOLE {selectedHole}
        </span>

        <h3>
          Par {holeData.par}
        </h3>

        <ScoreWheel
          key={`${player.id}-${selectedHole}-${existingScore?.strokes ?? 'new'}`}
          par={holeData.par}
          value={selectedScore}
          onChange={
            setSelectedScore
          }
        />

        <div className="score-result">
          <strong>
            {stableford.label}
          </strong>

          <span>
            {stableford.points}{' '}
            {stableford.points === 1
              ? 'POINT'
              : 'POINTS'}
          </span>
        </div>

        {errorMessage && (
          <div className="auth-error">
            {errorMessage}
          </div>
        )}

        {message && (
          <div className="admin-success">
            ✓ {message}
          </div>
        )}

        <button
          type="button"
          className="primary-button"
          disabled={saving}
          onClick={handleSave}
        >
          {saving
            ? 'Saving...'
            : existingScore
              ? 'Update Hole'
              : 'Add Score'}
        </button>

        {existingScore && (
          <button
            type="button"
            className="remove-score-button"
            disabled={saving}
            onClick={handleRemove}
          >
            Remove Hole Score
          </button>
        )}
      </div>
    </section>
  )
}

function AdminScores() {
  const [
    selectedWeek,
    setSelectedWeek,
  ] = useState(1)

  const [
    selectedPlayerId,
    setSelectedPlayerId,
  ] = useState(null)

  const [
    weekData,
    setWeekData,
  ] = useState(null)

  const [loading, setLoading] =
    useState(true)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const loadWeekScores =
    useCallback(
      async () => {
        setLoading(true)
        setErrorMessage('')

        try {
          const data =
            await getAdminWeekScores(
              selectedWeek,
            )

          setWeekData(data)
        } catch (error) {
          console.error(
            'Could not load admin scores:',
            error,
          )

          setErrorMessage(
            error?.message ||
              'Could not load scores.',
          )
        } finally {
          setLoading(false)
        }
      },
      [selectedWeek],
    )

  useEffect(() => {
    loadWeekScores()
  }, [loadWeekScores])

  const realPlayers =
    weekData?.players || []

  const scorecards =
    weekData?.scorecards || {}

  const selectedPlayer =
    realPlayers.find(
      (player) =>
        player.id ===
        selectedPlayerId,
    )

  if (selectedPlayer) {
    const playerScorecard =
      scorecards[
        selectedPlayer.id
      ]?.scores || {}

    return (
      <AdminScoreEditor
        selectedWeek={
          selectedWeek
        }
        player={
          selectedPlayer
        }
        scorecard={
          playerScorecard
        }
        onRefresh={
          loadWeekScores
        }
        onBack={() =>
          setSelectedPlayerId(
            null,
          )
        }
      />
    )
  }

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <div>
          <span className="small-label">
            SCORE MANAGEMENT
          </span>

          <h2>Scores</h2>
        </div>
      </div>

      <div className="admin-select-field">
        <label htmlFor="score-week">
          Select Week
        </label>

        <select
          id="score-week"
          value={selectedWeek}
          onChange={(event) => {
            setSelectedWeek(
              Number(
                event.target.value,
              ),
            )

            setSelectedPlayerId(
              null,
            )
          }}
        >
          {[1, 2, 3, 4, 5, 6].map(
            (week) => (
              <option
                value={week}
                key={week}
              >
                {getWeekLabel(
                  week,
                )}
              </option>
            ),
          )}
        </select>
      </div>

      {loading && (
        <div className="empty-rounds">
          Loading scores...
        </div>
      )}

      {errorMessage && (
        <div className="auth-error">
          {errorMessage}
        </div>
      )}

      {!loading &&
        !errorMessage && (
          <div className="admin-score-player-list">
            {realPlayers.map(
              (player) => {
                const playerScores =
                  scorecards[
                    player.id
                  ]?.scores || {}

                const holesEntered =
                  Object.keys(
                    playerScores,
                  ).length

                const total =
                  Object.values(
                    playerScores,
                  ).reduce(
                    (
                      sum,
                      score,
                    ) =>
                      sum +
                      Number(
                        score.strokes ||
                          0,
                      ),
                    0,
                  )

                return (
                  <button
                    className="admin-score-player"
                    type="button"
                    key={player.id}
                    onClick={() =>
                      setSelectedPlayerId(
                        player.id,
                      )
                    }
                  >
                    <div>
                      <strong>
                        {player.name}
                      </strong>

                      <span>
                        {holesEntered ===
                        0
                          ? 'No score entered'
                          : holesEntered ===
                              9
                            ? 'Round complete'
                            : `${holesEntered} of 9 holes`}
                      </span>
                    </div>

                    <div className="admin-player-score">
                      {holesEntered >
                      0
                        ? total
                        : '—'}

                      <span>›</span>
                    </div>
                  </button>
                )
              },
            )}
          </div>
        )}
    </section>
  )
}

function AdminScreen({
  playerName,
  setScreen,
  isAdmin,
}) {
  const [
    adminView,
    setAdminView,
  ] = useState('home')

  return (
    <main className="app-page admin-page">
      <AppHeader
        playerName={playerName}
      />

      <section className="admin-header">
        <p className="eyebrow">
          COMMISSIONER
        </p>

        <h1>Admin</h1>

        <p>
          Manage teams and player
          scores.
        </p>
      </section>

      {adminView ===
        'home' && (
        <div className="admin-menu">
          <button
            type="button"
            className="admin-menu-card"
            onClick={() =>
              setAdminView(
                'teams',
              )
            }
          >
            <div className="admin-menu-icon">
              1 | 2
            </div>

            <div>
              <h2>
                Assign Teams
              </h2>

              <p>
                Set or edit team
                assignments for any
                week.
              </p>
            </div>

            <span>›</span>
          </button>

          <button
            type="button"
            className="admin-menu-card"
            onClick={() =>
              setAdminView(
                'scores',
              )
            }
          >
            <div className="admin-menu-icon">
              36
            </div>

            <div>
              <h2>Scores</h2>

              <p>
                View and edit every
                player's scorecard.
              </p>
            </div>

            <span>›</span>
          </button>
        </div>
      )}

      {adminView !==
        'home' && (
        <button
          type="button"
          className="admin-main-back"
          onClick={() =>
            setAdminView(
              'home',
            )
          }
        >
          ← Admin Home
        </button>
      )}

      {adminView ===
        'teams' && (
        <AdminTeams />
      )}

      {adminView ===
        'scores' && (
        <AdminScores />
      )}

      <BottomNav
        screen="admin"
        setScreen={setScreen}
        isAdmin={isAdmin}
      />
    </main>
  )
}

export default AdminScreen