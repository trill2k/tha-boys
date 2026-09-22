const PROVIDENCE_GOLF_CLUB = {
  latitude: 37.48064,
  longitude: -77.55755,
}

const TIME_ZONE = 'America/New_York'

function getEasternNow() {
  const parts = new Intl.DateTimeFormat(
    'en-US',
    {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    },
  ).formatToParts(new Date())

  const values = {}

  parts.forEach((part) => {
    values[part.type] = part.value
  })

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
  }
}

function toDateString(date) {
  const year = date.getUTCFullYear()

  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getUTCDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getLeagueDates() {
  const now = getEasternNow()

  const today = new Date(
    Date.UTC(
      now.year,
      now.month - 1,
      now.day,
      12,
    ),
  )

  const dayOfWeek =
    today.getUTCDay()

  // Wednesday = 3
  let daysUntilWednesday =
    (3 - dayOfWeek + 7) % 7

  // Once Wednesday league night is over,
  // move the weather card to next week.
  if (
    dayOfWeek === 3 &&
    now.hour >= 20
  ) {
    daysUntilWednesday = 7
  }

  const wednesday =
    new Date(today)

  wednesday.setUTCDate(
    today.getUTCDate() +
      daysUntilWednesday,
  )

  const tuesday =
    new Date(wednesday)

  tuesday.setUTCDate(
    wednesday.getUTCDate() - 1,
  )

  return {
    tuesday:
      toDateString(tuesday),

    wednesday:
      toDateString(wednesday),
  }
}

function getHour(time) {
  return Number(
    time.slice(11, 13),
  )
}

function round(
  value,
  digits = 0,
) {
  const multiplier =
    10 ** digits

  return (
    Math.round(
      value * multiplier,
    ) / multiplier
  )
}

function sum(values) {
  return values.reduce(
    (total, value) =>
      total + (value ?? 0),
    0,
  )
}

function max(values) {
  const valid =
    values.filter(
      (value) =>
        typeof value ===
        'number',
    )

  if (!valid.length) {
    return 0
  }

  return Math.max(...valid)
}

function getConditionIcon(code) {
  if (code === 0) {
    return '☀️'
  }

  if ([1, 2].includes(code)) {
    return '⛅'
  }

  if (code === 3) {
    return '☁️'
  }

  if (
    [45, 48].includes(code)
  ) {
    return '🌫️'
  }

  if (
    [
      51,
      53,
      55,
      56,
      57,
      61,
      63,
      65,
      66,
      67,
      80,
      81,
      82,
    ].includes(code)
  ) {
    return '🌧️'
  }

  if (
    [95, 96, 99].includes(
      code,
    )
  ) {
    return '⛈️'
  }

  if (
    [
      71,
      73,
      75,
      77,
      85,
      86,
    ].includes(code)
  ) {
    return '🌨️'
  }

  return '🌤️'
}

function getHourlyIcon(code) {
  const rainCodes = [
    51, 53, 55, 56, 57,
    61, 63, 65, 66, 67,
    80, 81, 82,
    95, 96, 99,
  ]

  if (rainCodes.includes(code)) {
    return '🌧️'
  }

  return '☀️'
}

export async function getLeagueWeather() {
  const leagueDates =
    getLeagueDates()

  const params =
    new URLSearchParams({
      latitude:
        PROVIDENCE_GOLF_CLUB.latitude,

      longitude:
        PROVIDENCE_GOLF_CLUB.longitude,

      hourly: [
        'temperature_2m',
        'precipitation_probability',
        'precipitation',
        'weather_code',
        'wind_speed_10m',
      ].join(','),

      temperature_unit:
        'fahrenheit',

      wind_speed_unit: 'mph',

      precipitation_unit:
        'inch',

      timezone: TIME_ZONE,

      // Allows Tuesday data to
      // remain available on Wednesday.
      past_days: '1',

      // Enough range to always
      // reach the next Wednesday.
      forecast_days: '8',
    })

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
  )

  if (!response.ok) {
    throw new Error(
      'Could not load weather.',
    )
  }

  const data =
    await response.json()

  const hourly = data.hourly

  const rows =
    hourly.time.map(
      (time, index) => ({
        time,

        date:
          time.slice(0, 10),

        hour:
          getHour(time),

        temperature:
          hourly
            .temperature_2m[
            index
          ],

        rainChance:
          hourly
            .precipitation_probability[
            index
          ],

        precipitation:
          hourly
            .precipitation[
            index
          ],

        weatherCode:
          hourly.weather_code[
            index
          ],

        wind:
          hourly
            .wind_speed_10m[
            index
          ],
      }),
    )

  // Tuesday noon through 11 PM.
  const tuesdayHours =
    rows.filter(
      (row) =>
        row.date ===
          leagueDates.tuesday &&
        row.hour >= 12 &&
        row.hour <= 23,
    )

  // Wednesday before first tee time.
  const wednesdayBeforeGolf =
    rows.filter(
      (row) =>
        row.date ===
          leagueDates.wednesday &&
        row.hour < 17,
    )

    // Wednesday afternoon through league night:
    // 2 PM through 8 PM.
    const playHours =
    rows.filter(
        (row) =>
        row.date ===
            leagueDates.wednesday &&
        row.hour >= 14 &&
        row.hour <= 20,
    )

  if (!playHours.length) {
    throw new Error(
      'League forecast is not available yet.',
    )
  }

  const firstPlayHour =
    playHours[0]

  return {
    tuesday: {
      date:
        leagueDates.tuesday,

      rainTotal: round(
        sum(
          tuesdayHours.map(
            (row) =>
              row.precipitation,
          ),
        ),
        2,
      ),

      rainChance: max(
        tuesdayHours.map(
          (row) =>
            row.rainChance,
        ),
      ),

      icon:
        getConditionIcon(
          tuesdayHours[0]
            ?.weatherCode ?? 0,
        ),
    },

    wednesday: {
      date:
        leagueDates.wednesday,

      icon:
        getConditionIcon(
          firstPlayHour.weatherCode,
        ),

      rainBeforeGolf: round(
        sum(
          wednesdayBeforeGolf.map(
            (row) =>
              row.precipitation,
          ),
        ),
        2,
      ),

      hourly:
        playHours.map(
            (row) => ({
            hour:
                row.hour,

            temperature:
                Math.round(
                row.temperature,
                ),

            rainChance:
                row.rainChance ??
                0,

            wind:
                Math.round(
                row.wind,
                ),

            icon:
                getHourlyIcon(
                row.weatherCode,
                ),
            }),
        ),
    },
  }
}