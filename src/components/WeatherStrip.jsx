import {
  useEffect,
  useState,
} from 'react'

import {
  getLeagueWeather,
} from '../lib/weather'

function formatHour(hour) {
  if (hour === 12) {
    return '12 PM'
  }

  if (hour > 12) {
    return `${hour - 12} PM`
  }

  return `${hour} AM`
}

function WeatherStrip() {
  const [
    weather,
    setWeather,
  ] = useState(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState(false)

  useEffect(() => {
    let active = true

    async function loadWeather() {
      try {
        const result =
          await getLeagueWeather()

        if (active) {
          setWeather(result)
          setError(false)
        }
      } catch (err) {
        console.error(
          'Weather error:',
          err,
        )

        if (active) {
          setError(true)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadWeather()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="weather-strip weather-loading">
        Loading league weather...
      </div>
    )
  }

  if (
    error ||
    !weather
  ) {
    return null
  }

  return (
    <section className="weather-strip">
      <div className="weather-strip-heading">
        <span>
          LEAGUE WEATHER
        </span>

        <small>
          Providence Golf Club
        </small>
      </div>

      <div className="weather-days">

        {/* TUESDAY */}

        <div className="weather-day">
          <div className="weather-day-title">
            <span>
              TUE
            </span>

            <span className="weather-icon">
              {
                weather
                  .tuesday
                  .icon
              }
            </span>
          </div>

          <strong className="weather-main">
            {
              weather
                .tuesday
                .rainTotal
            }
            "
          </strong>

          <span className="weather-detail">
            rain expected
          </span>

          <span className="weather-subdetail">
            {
              weather
                .tuesday
                .rainChance
            }
            % chance
          </span>
        </div>

{/* WEDNESDAY */}

<div className="weather-day league-day">
  <div className="weather-day-title">
    <span>
      WED
    </span>

    <span className="weather-icon">
      {
        weather
          .wednesday
          .icon
      }
    </span>
  </div>

  <div className="weather-hourly">
    {
      weather
        .wednesday
        .hourly
        .map(
          (hour) => (
            <div
              className="weather-hour"
              key={hour.hour}
            >
              <span className="weather-hour-time">
                {
                    formatHour(
                    hour.hour,
                    )
                }
                </span>

                <span className="weather-hour-icon">
                {hour.icon}
                </span>

                <strong className="weather-hour-temp">
                {
                    hour.temperature
                }
                °
                </strong>

                <span className="weather-hour-rain">
                {
                    hour.rainChance
                }
                %
                </span>
            </div>
          ),
        )
    }
  </div>

  <div className="weather-rain-before">
    <span>
      Rain before play
    </span>

    <strong>
      {
        weather
          .wednesday
          .rainBeforeGolf
      }
      "
    </strong>
  </div>
</div>

      </div>
    </section>
  )
}

export default WeatherStrip