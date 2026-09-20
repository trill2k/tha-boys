function TeamList({
  title,
  players: teamPlayers,
}) {
  return (
    <div className="team">
      <h3>{title}</h3>

      <div className="team-list">
        {teamPlayers.map((player) => (
          <div
            className="team-player"
            key={player}
          >
            <span className="player-icon" />

            <span>{player}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TeamList