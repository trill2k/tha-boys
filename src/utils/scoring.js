export function getStableford(par, score) {
  const difference = score - par

  if (difference <= -2) {
    return {
      label: 'EAGLE',
      points: 4,
    }
  }

  if (difference === -1) {
    return {
      label: 'BIRDIE',
      points: 3,
    }
  }

  if (difference === 0) {
    return {
      label: 'PAR',
      points: 2,
    }
  }

  if (difference === 1) {
    return {
      label: 'BOGEY',
      points: 1,
    }
  }

  return {
    label: 'DOUBLE BOGEY',
    points: 0,
  }
}