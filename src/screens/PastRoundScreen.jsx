import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'

function PastRoundScreen({
  playerName,
  round,
  setScreen,
  isAdmin,
}) {
  if (!round) {
    setScreen('home')
    return null
  }

  return (
    <main className="app-page scorecard-page">
      <AppHeader
        playerName={playerName}
      />

      <section className="scorecard-top">
        <p className="eyebrow">
          {round.label.toUpperCase()} •{' '}
          {round.course.toUpperCase()}
        </p>

        <h1>
          {round.complete
            ? 'Round Complete'
            : 'Round in Progress'}
        </h1>

        <div className="hole-par">
          {round.total}
        </div>
      </section>

      <section className="round-progress">
        <div className="round-progress-heading">
          <span>
            {round.complete
              ? 'FINAL SCORE'
              : `SCORE THRU ${round.thru}`}
          </span>

          <strong>
            {round.total}
          </strong>
        </div>

        <div className="hole-tracker">
          {round.holes.map((hole) => (
            <div
              className="hole-tracker-item completed"
              key={hole.hole_number}
            >
              <span className="tracker-hole-number">
                {hole.hole_number}
              </span>

              <span className="tracker-score">
                {hole.strokes}
              </span>
            </div>
          ))}
        </div>
      </section>

      <button
        className="submit-hole-button"
        type="button"
        onClick={() =>
          setScreen('home')
        }
      >
        Back to Home
      </button>

      <BottomNav
        screen="home"
        setScreen={setScreen}
        isAdmin={isAdmin}
      />
    </main>
  )
}

export default PastRoundScreen