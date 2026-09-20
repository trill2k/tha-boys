import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import ScoreWheel from '../components/ScoreWheel'

import { courseHoles } from '../data/course'
import { getStableford } from '../utils/scoring'

import {
  getCurrentWeek,
  getMyWeekRound,
  submitMyHoleScore,
} from '../lib/golfData'

function ScorecardScreen({
  playerName,
  setScreen,
  isAdmin,
}) {
  const [week, setWeek] =
    useState(null)

  const [scores, setScores] =
    useState({})

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    selectedScore,
    setSelectedScore,
  ] = useState(4)

  const loadRound =
    useCallback(async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const activeWeek =
          await getCurrentWeek()

        setWeek(activeWeek)

        const roundData =
          await getMyWeekRound(
            activeWeek.week_number,
          )

        setScores(
          roundData.scores || {},
        )
      } catch (error) {
        console.error(
          'Could not load round:',
          error,
        )

        setErrorMessage(
          error?.message ||
            'Could not load your round.',
        )
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    loadRound()
  }, [loadRound])

  const currentHole =
    courseHoles.find(
      (hole) =>
        !scores[hole.hole],
    )

  const completedHoles =
    Object.keys(scores).length

  const roundComplete =
    completedHoles === 9

  const currentTotal =
    Object.values(scores).reduce(
      (total, score) =>
        total +
        Number(
          score.strokes || 0,
        ),
      0,
    )

  useEffect(() => {
    if (currentHole) {
      setSelectedScore(
        currentHole.par,
      )
    }
  }, [currentHole?.hole])

  async function handleSubmit() {
    if (
      !currentHole ||
      !week
    ) {
      return
    }

    setSaving(true)
    setErrorMessage('')

    try {
      await submitMyHoleScore({
        weekNumber:
          week.week_number,

        holeNumber:
          currentHole.hole,

        strokes:
          selectedScore,
      })

      const wasFinalHole =
        currentHole.hole === 9

      await loadRound()

      if (wasFinalHole) {
        setScreen(
          'leaderboard',
        )
      }
    } catch (error) {
      console.error(
        'Could not submit score:',
        error,
      )

      setErrorMessage(
        error?.message ||
          'Could not submit your score.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="app-page scorecard-page">
        <AppHeader
          playerName={playerName}
        />

        <section className="scorecard-top">
          <h1>
            Loading Round...
          </h1>
        </section>

        <BottomNav
          screen="scorecard"
          setScreen={setScreen}
          isAdmin={isAdmin}
        />
      </main>
    )
  }

  if (
    errorMessage &&
    !week
  ) {
    return (
      <main className="app-page scorecard-page">
        <AppHeader
          playerName={playerName}
        />

        <div className="auth-error">
          {errorMessage}
        </div>

        <BottomNav
          screen="scorecard"
          setScreen={setScreen}
          isAdmin={isAdmin}
        />
      </main>
    )
  }

  if (roundComplete) {
    return (
      <main className="app-page scorecard-page">
        <AppHeader
          playerName={playerName}
        />

        <section className="scorecard-top">
          <p className="eyebrow">
            {week.label.toUpperCase()} •{' '}
            {week.course.toUpperCase()}
          </p>

          <h1>
            Round Complete
          </h1>

          <div className="hole-par">
            {currentTotal}
          </div>
        </section>

        <section className="round-progress">
          <div className="round-progress-heading">
            <span>
              FINAL SCORE
            </span>

            <strong>
              {currentTotal}
            </strong>
          </div>

          <div className="hole-tracker">
            {courseHoles.map(
              (hole) => (
                <div
                  className="hole-tracker-item completed"
                  key={hole.hole}
                >
                  <span className="tracker-hole-number">
                    {hole.hole}
                  </span>

                  <span className="tracker-score">
                    {
                      scores[
                        hole.hole
                      ]?.strokes
                    }
                  </span>
                </div>
              ),
            )}
          </div>
        </section>

        <button
          className="submit-hole-button"
          type="button"
          onClick={() =>
            setScreen(
              'leaderboard',
            )
          }
        >
          View Leaderboard
        </button>

        <BottomNav
          screen="scorecard"
          setScreen={setScreen}
          isAdmin={isAdmin}
        />
      </main>
    )
  }

  const stableford =
    getStableford(
      currentHole.par,
      selectedScore,
    )

  return (
    <main className="app-page scorecard-page">
      <AppHeader
        playerName={playerName}
      />

      <section className="scorecard-top">
        <p className="eyebrow">
          {week.label.toUpperCase()} •{' '}
          {week.course.toUpperCase()}
        </p>

        <div className="hole-count">
          Hole {currentHole.hole} of 9
        </div>

        <h1>
          Hole {currentHole.hole}
        </h1>

        <div className="hole-par">
          PAR {currentHole.par}
        </div>
      </section>

      <section className="score-entry-card">
        <span className="score-label">
          YOUR SCORE
        </span>

        <ScoreWheel
          key={currentHole.hole}
          par={currentHole.par}
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

        <button
          className="submit-hole-button"
          type="button"
          disabled={saving}
          onClick={handleSubmit}
        >
          {saving
            ? 'Saving...'
            : currentHole.hole === 9
              ? 'Complete Round'
              : 'Submit Score'}
        </button>
      </section>

      <section className="round-progress">
        <div className="round-progress-heading">
          <span>ROUND</span>

          <strong>
            {completedHoles === 0
              ? 'Not started'
              : `${currentTotal} thru ${completedHoles}`}
          </strong>
        </div>

        <div className="hole-tracker">
          {courseHoles.map(
            (hole) => {
              const savedScore =
                scores[
                  hole.hole
                ]

              const isCurrent =
                hole.hole ===
                currentHole.hole

              return (
                <div
                  className={`hole-tracker-item ${
                    savedScore
                      ? 'completed'
                      : ''
                  } ${
                    isCurrent
                      ? 'current'
                      : ''
                  }`}
                  key={hole.hole}
                >
                  <span className="tracker-hole-number">
                    {hole.hole}
                  </span>

                  <span className="tracker-score">
                    {savedScore?.strokes ??
                      '—'}
                  </span>
                </div>
              )
            },
          )}
        </div>
      </section>

      <BottomNav
        screen="scorecard"
        setScreen={setScreen}
        isAdmin={isAdmin}
      />
    </main>
  )
}

export default ScorecardScreen