import {
  useEffect,
  useRef,
} from 'react'

function ScoreWheel({
  par,
  value,
  onChange,
}) {
  const wheelRef = useRef(null)
  const scrollTimer =
    useRef(null)

  const minScore = Math.max(
    1,
    par - 2,
  )

  const maxScore = par + 2

  const options = []

  for (
    let score = minScore;
    score <= maxScore;
    score += 1
  ) {
    options.push(score)
  }

  const itemHeight = 64

  useEffect(() => {
    const selectedIndex =
      options.indexOf(value)

    if (
      wheelRef.current &&
      selectedIndex >= 0
    ) {
      wheelRef.current.scrollTop =
        selectedIndex * itemHeight
    }

    return () => {
      if (scrollTimer.current) {
        clearTimeout(
          scrollTimer.current,
        )
      }
    }
  }, [])

  function chooseScore(score) {
    const index =
      options.indexOf(score)

    onChange(score)

    wheelRef.current?.scrollTo({
      top:
        index * itemHeight,
      behavior: 'smooth',
    })
  }

  function handleScroll() {
    if (scrollTimer.current) {
      clearTimeout(
        scrollTimer.current,
      )
    }

    scrollTimer.current =
      setTimeout(() => {
        const wheel =
          wheelRef.current

        if (!wheel) {
          return
        }

        let index =
          Math.round(
            wheel.scrollTop /
              itemHeight,
          )

        index = Math.max(
          0,
          Math.min(
            index,
            options.length - 1,
          ),
        )

        const score =
          options[index]

        onChange(score)

        wheel.scrollTo({
          top:
            index * itemHeight,
          behavior: 'smooth',
        })
      }, 80)
  }

  return (
    <div className="score-wheel-shell">
      <div className="score-wheel-highlight" />

      <div
        className="score-wheel"
        ref={wheelRef}
        onScroll={handleScroll}
      >
        <div className="score-wheel-spacer" />

        {options.map(
          (score) => (
            <button
              className={`score-wheel-option ${
                score === value
                  ? 'selected'
                  : ''
              }`}
              type="button"
              key={score}
              onClick={() =>
                chooseScore(score)
              }
            >
              {score}
            </button>
          ),
        )}

        <div className="score-wheel-spacer" />
      </div>
    </div>
  )
}

export default ScoreWheel