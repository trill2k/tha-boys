import {
  useEffect,
  useState,
} from 'react'

import { supabase } from './lib/supabase'
import { useAuth } from './hooks/useAuth'

import Brand from './components/Brand'
import TeamList from './components/TeamList'
import AppHeader from './components/AppHeader'
import BottomNav from './components/BottomNav'

import ScorecardScreen from './screens/ScorecardScreen'
import LeaderboardScreen from './screens/LeaderboardScreen'
import AdminScreen from './screens/admin/AdminScreen'
import PastRoundScreen from './screens/PastRoundScreen'

import {
  getCurrentWeekHomeData,
  getMyRoundHistory,
} from './lib/golfData'

import { COURSE_NAME } from './data/course'

import './App.css'

/* =========================================================
   TEMPORARY CURRENT WEEK DATA

   We will connect this to Supabase next.
   ========================================================= */


/* =========================================================
   AUTH SCREEN
   ========================================================= */

function AuthScreen() {
  const [mode, setMode] =
    useState('login')

  const [name, setName] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [loading, setLoading] =
    useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setErrorMessage('')
    setLoading(true)

    try {
      if (mode === 'create') {
        const { error } =
          await supabase.auth.signUp({
            email,
            password,

            options: {
              data: {
                name,
              },
            },
          })

        if (error) {
          throw error
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          })

        if (error) {
          throw error
        }
      }
    } catch (error) {
      setErrorMessage(
        error?.message ||
          'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setMode((current) =>
      current === 'login'
        ? 'create'
        : 'login',
    )

    setErrorMessage('')
    setPassword('')
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <Brand />

        <div className="yellow-mark" />

        <section className="auth-card">
          <h1>
            {mode === 'login'
              ? 'Welcome Back'
              : 'Join The League'}
          </h1>

          <p className="auth-intro">
            {mode === 'login'
              ? 'Sign in to view your team and enter your round.'
              : 'Create your Tha Boiz Golf League account.'}
          </p>

          <form onSubmit={handleSubmit}>
            {mode === 'create' && (
              <div className="field">
                <label htmlFor="name">
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Niall"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                  required
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                required
                minLength={6}
                autoComplete={
                  mode === 'login'
                    ? 'current-password'
                    : 'new-password'
                }
              />
            </div>

            {errorMessage && (
              <div className="auth-error">
                {errorMessage}
              </div>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Log In'
                  : 'Create Account'}
            </button>
          </form>

          <button
            className="auth-switch"
            type="button"
            onClick={switchMode}
          >
            {mode === 'login'
              ? 'Need an account? Create one'
              : 'Already have an account? Log in'}
          </button>
        </section>
      </div>
    </main>
  )
}

/* =========================================================
   HOME SCREEN
   ========================================================= */

function HomeScreen({
  playerName,
  setScreen,
  isAdmin,
  onViewPastRound,
}) {
  const [
    currentWeek,
    setCurrentWeek,
  ] = useState(null)

  const [
    pastRounds,
    setPastRounds,
  ] = useState([])

  const [
    expandedRound,
    setExpandedRound,
  ] = useState(null)

  const [loading, setLoading] =
    useState(true)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadHome(
      showLoading = true,
    ) {
      if (showLoading) {
        setLoading(true)
      }

      setErrorMessage('')

      try {
        const [
          weekData,
          historyData,
        ] = await Promise.all([
          getCurrentWeekHomeData(),
          getMyRoundHistory(),
        ])

        if (!mounted) {
          return
        }

        setCurrentWeek(
          weekData,
        )

        setPastRounds(
          historyData,
        )
      } catch (error) {
        console.error(
          'Could not load home:',
          error,
        )

        if (mounted) {
          setErrorMessage(
            error?.message ||
              'Could not load league data.',
          )
        }
      } finally {
        if (
          mounted &&
          showLoading
        ) {
          setLoading(false)
        }
      }
    }

    loadHome()

    /*
      Refresh Home periodically so if Ryan
      changes the current week or teams,
      players see the new information.
    */
    const interval =
      setInterval(() => {
        loadHome(false)
      }, 5000)

    return () => {
      mounted = false

      clearInterval(
        interval,
      )
    }
  }, [])

  if (loading) {
    return (
      <main className="app-page">
        <AppHeader
          playerName={playerName}
        />

        <div className="empty-rounds">
          Loading current week...
        </div>

        <BottomNav
          screen="home"
          setScreen={setScreen}
          isAdmin={isAdmin}
        />
      </main>
    )
  }

  if (
    errorMessage ||
    !currentWeek
  ) {
    return (
      <main className="app-page">
        <AppHeader
          playerName={playerName}
        />

        <div className="auth-error">
          {errorMessage ||
            'Could not load the current week.'}
        </div>

        <BottomNav
          screen="home"
          setScreen={setScreen}
          isAdmin={isAdmin}
        />
      </main>
    )
  }

  return (
    <main className="app-page">
      <AppHeader
        playerName={playerName}
      />

      <section className="welcome">
        <p className="eyebrow">
          {currentWeek.week.label.toUpperCase()}
        </p>

        <h1>
          Welcome back, {playerName}
        </h1>
      </section>

      <section className="current-week-card">
        <div className="section-heading">
          <div>
            <span className="small-label">
              CURRENT WEEK
            </span>

            <h2>
              {currentWeek.week.label}
            </h2>
          </div>

          <span className="course-name">
            {currentWeek.week.course}
          </span>
        </div>

        <div className="teams-grid">
          <TeamList
            title="Team 1"
            players={
              currentWeek.team1
            }
          />

          <div className="vs">
            VS
          </div>

          <TeamList
            title="Team 2"
            players={
              currentWeek.team2
            }
          />
        </div>

        <button
          className="start-round-button"
          type="button"
          onClick={() =>
            setScreen('scorecard')
          }
        >
          <span>▶</span>
          Start Round
        </button>
      </section>

      <section className="past-section">
  <div className="past-title">
    <span>↶</span>

    <h2>Past Rounds</h2>
  </div>

  {pastRounds.length === 0 ? (
    <div className="empty-rounds">
      No previous rounds yet.
    </div>
  ) : (
    <div className="past-round-list">
      {pastRounds.map((round) => (
        <button
          type="button"
          className="past-round-card"
          key={round.roundId}
          onClick={() =>
            onViewPastRound(round)
          }
        >
          <div className="past-round-card-info">
            <strong>
              {round.label}
            </strong>

            <span>
              {round.course}
            </span>
          </div>

          <div className="past-round-card-result">
            <strong>
              {round.total}
            </strong>

            <span>
              {round.complete
                ? 'FINAL'
                : `THRU ${round.thru}`}
            </span>
          </div>

          <span className="past-round-arrow">
            ›
          </span>
        </button>
      ))}
    </div>
  )}
</section>

      <BottomNav
        screen="home"
        setScreen={setScreen}
        isAdmin={isAdmin}
      />
    </main>
  )
}

/* =========================================================
   MAIN APP
   ========================================================= */

function App() {
  const {
    session,
    profile,
    isAdmin,
    loading,
  } = useAuth()

  const [screen, setScreen] =
    useState('home')
  const [
  selectedPastRound,
  setSelectedPastRound,
] = useState(null)


  /* -------------------------------------------------------
     LOADING
     ------------------------------------------------------- */

  if (loading) {
    return (
      <main className="auth-page">
        <div className="auth-container">
          <Brand />

          <div className="yellow-mark" />

          <p className="loading-message">
            Loading league...
          </p>
        </div>
      </main>
    )
  }

  /* -------------------------------------------------------
     NOT LOGGED IN
     ------------------------------------------------------- */

  if (!session) {
    return <AuthScreen />
  }

  const playerName =
    profile?.name || 'Player'

  /* -------------------------------------------------------
     SCORECARD
     ------------------------------------------------------- */

  if (screen === 'scorecard') {
    return (
      <ScorecardScreen
        playerName={playerName}
        setScreen={setScreen}
        isAdmin={isAdmin}
      />
    )
  }

  /* -------------------------------------------------------
     LEADERBOARD
     ------------------------------------------------------- */

  if (screen === 'leaderboard') {
    return (
      <LeaderboardScreen
        playerName={playerName}
        setScreen={setScreen}
        isAdmin={isAdmin}
      />
    )
  }

  /* -------------------------------------------------------
     ADMIN
     ------------------------------------------------------- */

if (
  screen === 'admin' &&
  isAdmin
) {
  return (
    <AdminScreen
      playerName={playerName}
      setScreen={setScreen}
      isAdmin={isAdmin}
    />
  )
}

if (
  screen === 'past-round' &&
  selectedPastRound
) {
  return (
    <PastRoundScreen
      playerName={playerName}
      round={selectedPastRound}
      setScreen={setScreen}
      isAdmin={isAdmin}
    />
  )
}


  /* -------------------------------------------------------
     HOME
     ------------------------------------------------------- */

return (
  <HomeScreen
    playerName={playerName}
    setScreen={setScreen}
    isAdmin={isAdmin}
    onViewPastRound={(round) => {
      setSelectedPastRound(round)
      setScreen('past-round')
    }}
  />
)
}

export default App