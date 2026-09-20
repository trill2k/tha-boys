function BottomNav({
  screen,
  setScreen,
  isAdmin,
}) {
  return (
    <nav
      className={`bottom-nav ${
        isAdmin ? 'admin-nav' : ''
      }`}
    >
      <button
        className={`nav-item ${
          screen === 'home'
            ? 'active'
            : ''
        }`}
        type="button"
        onClick={() =>
          setScreen('home')
        }
      >
        <span className="nav-icon">
          ⌂
        </span>

        Home
      </button>

      <button
        className={`nav-item ${
          screen === 'scorecard'
            ? 'active'
            : ''
        }`}
        type="button"
        onClick={() =>
          setScreen('scorecard')
        }
      >
        <span className="nav-icon">
          ⛳
        </span>

        Start Round
      </button>

      <button
        className={`nav-item ${
          screen === 'leaderboard'
            ? 'active'
            : ''
        }`}
        type="button"
        onClick={() =>
          setScreen('leaderboard')
        }
      >
        <span className="nav-icon">
          ♛
        </span>

        Leaderboard
      </button>

      {isAdmin && (
        <button
          className={`nav-item ${
            screen === 'admin'
              ? 'active'
              : ''
          }`}
          type="button"
          onClick={() =>
            setScreen('admin')
          }
        >
          <span className="nav-icon">
            ⚙
          </span>

          Admin
        </button>
      )}
    </nav>
  )
}

export default BottomNav