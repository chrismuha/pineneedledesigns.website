import countiesUrl from './counties.json?url'

let taxLocationDataPromise

const countyKey = (state, county) => `${state}::${county}`

export const loadTaxLocationData = async () => {
  if (!taxLocationDataPromise) {
    taxLocationDataPromise = fetch(countiesUrl)
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load tax location data.')
        return response.json()
      })
      .then((countiesData) => {
      const states = []
      const stateSet = new Set()
      const countiesByState = new Map()
      const taxByKey = new Map()

      countiesData.forEach((item) => {
        const state = String(item.state || '').trim()
        const county = String(item.county || '').trim()
        if (!state || !county) return

        if (!stateSet.has(state)) {
          stateSet.add(state)
          states.push(state)
        }

        if (!countiesByState.has(state)) {
          countiesByState.set(state, [])
        }
        countiesByState.get(state).push(county)
        taxByKey.set(countyKey(state, county), item)
      })

      states.sort()
      countiesByState.forEach((counties, state) => {
        countiesByState.set(state, [...new Set(counties)].sort())
      })

      return { states, countiesByState, taxByKey }
      })
  }

  return taxLocationDataPromise
}

export const getTaxLocationKey = countyKey
