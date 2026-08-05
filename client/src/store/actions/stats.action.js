import { store } from '../'
import { request } from '../../utilities/request'

export const genericStats = payload => ({
  type: 'GENERIC_STATS',
  payload
})

// Store the interval id globally so it can be cleared on unmount.
export const statsIntervalId = { current: null }

export const isTabVisible = () =>
  typeof document === 'undefined' || !document.hidden

export const stopContainerStats = () => {
  if (statsIntervalId.current) {
    clearInterval(statsIntervalId.current)
    statsIntervalId.current = null
  }
  return dispatch => {
    dispatch(genericStats({ isLive: false }))
  }
}

export const getContainersStat = () => {
  return dispatch => {
    request('get', `container/stats`, {})
      .then(response => {
        dispatch(genericStats({ containerStats: response.data }))
      }).catch(error => {
        console.log(error)
      })
  }
}

export const containerStatsProcess = () => {
  if(!store.getState().stats.isLive) {
    return dispatch => {
      dispatch(genericStats({ isLive: true }))
      dispatch(getContainersStat())
      // Only poll while the tab is visible and slow down from 4s to 10s.
      statsIntervalId.current = setInterval(() => {
        if (isTabVisible()) {
          dispatch(getContainersStat())
        }
      }, 10000)
    }
  } else {
    return dispatch => {
      dispatch(genericStats({ isLive: true }))
    }
  }
}