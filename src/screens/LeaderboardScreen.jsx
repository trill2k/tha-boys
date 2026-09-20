import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'

import { getLeaderboardData } from '../lib/golfData'

function LeaderboardScreen({
  playerName,
  setScreen,
  isAdmin,
}) {
  const [
    leaderboard,
    setLeaderboard,
  ] = useState(null)

  const [loading, setLoading] =
    useState(true)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const loadLeaderboard =
    useCallback(
      async ({
        showLoading = true,
      } = {}) => {
        if (showLoading) {
          setLoading(true)
        }

        setErrorMessage('')

        try {
          const data =
            await getLeaderboardData()

          setLeaderboard(data)
        } catch (error) {
          console.error(
            'Could not load leaderboard:',
            error,
          )

          setErrorMessage(
            error?.message ||
              'Could not load the leaderboard.',
          )
        } finally {
          if (showLoading) {
            setLoading(false)
          }
        }
      },
      [],
    )

  useEffect(() => {
    loadLeaderboard()

    /*
      Refresh every few seconds so scores entered
      by other players or Ryan appear automatically.

      With only 8 players this is very lightweight.
      We can switch this to Supabase Realtime later.
    */
    const refreshInterval =
      setInterval(() => {
        loadLeaderboard({
          showLoading: false,
        })
      }, 3000)

    return () => {
      clearInterval(
        refreshInterval,
      )
    }
  }, [loadLeaderboard])

  if (loading) {
    return (
      <main className="app-page">
        <AppHeader
          playerName={playerName}
        />

        <section className="leaderboard-header">
          <h1>Leaderboard</h1>

          <p className="leaderboard-description">
            Loading live standings...
          </p>
        </section>

        <BottomNav
          screen="leaderboard"
          setScreen={setScreen}
          isAdmin={isAdmin}
        />
      </main>
    )
  }

  if (
    errorMessage ||
    !leaderboard
  ) {
    return (
      <main className="app-page">
        <AppHeader
          playerName={playerName}
        />

        <section className="leaderboard-header">
          <h1>Leaderboard</h1>
        </section>

        <div className="auth-error">
          {errorMessage ||
            'Could not load leaderboard.'}
        </div>

        <BottomNav
          screen="leaderboard"
          setScreen={setScreen}
          isAdmin={isAdmin}
        />
      </main>
    )
  }

  const {
    currentWeek,
    team1Points,
    team2Points,
    standings,
  } = leaderboard

  return (
    <main className="app-page">
      <AppHeader
        playerName={playerName}
      />

      <section className="leaderboard-header">
        <p className="eyebrow">
          {currentWeek.label.toUpperCase()}
        </p>

        <h1>Leaderboard</h1>

        <p className="leaderboard-description">
          Live season standings
        </p>
      </section>

      <section className="team-score-summary">
        <div className="team-score-side">
          <span>TEAM 1</span>

          <strong>
            {team1Points}
          </strong>

          <small>POINTS</small>
        </div>

        <div className="team-score-middle">
          <span>LIVE</span>
        </div>

        <div className="team-score-side">
          <span>TEAM 2</span>

          <strong>
            {team2Points}
          </strong>

          <small>POINTS</small>
        </div>
      </section>

      <section className="leaderboard-card">
        <div className="leaderboard-columns">
          <span>PLAYER</span>

          <span>
            SEASON PTS
          </span>

          <span>
            WK {currentWeek.week_number}
          </span>
        </div>

        <div className="leaderboard-list">
          {standings.map(
            (player, index) => (
              <div
                className={`leaderboard-row ${
                index === 0 ? 'first-place' : ''
                } ${
                player.name.toLowerCase() ===
                playerName.toLowerCase()
                    ? 'current-player'
                    : ''
                }`}
                key={player.id}
              >
                <div className="leaderboard-player">
                  <span
                    className={`rank ${
                      index < 3
                        ? 'top-rank'
                        : ''
                    }`}
                  >
                    {index + 1}
                  </span>

                  <span className="leaderboard-name">
                    {player.name}
                  </span>
                </div>

                <strong className="season-points">
                  {player.seasonPoints}
                </strong>

                <div className="week-score-cell">
                  {player.weekScore ===
                  null ? (
                    <span className="no-score">
                      —
                    </span>
                  ) : (
                    <>
                      <strong>
                        {player.weekScore}
                      </strong>

                      {!player.complete && (
                        <small>
                          thru {player.thru}
                        </small>
                      )}
                    </>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      <div className="leaderboard-note">
        <span className="live-dot" />

        Scores update as holes are
        submitted
      </div>

      <BottomNav
        screen="leaderboard"
        setScreen={setScreen}
        isAdmin={isAdmin}
      />
    </main>
  )
}

export default LeaderboardScreen