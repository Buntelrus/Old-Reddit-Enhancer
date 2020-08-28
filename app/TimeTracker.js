import { openDB } from 'idb'
const LOCAL_STORAGE_SESSION_KEY = 'lastRedditSession'
function db() {
  return openDB('reddit-usage', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sessions')) {
        const store = db.createObjectStore('sessions', {
          keyPath: 'nr',
          autoIncrement: true
        })
        store.createIndex('start', 'start', {
          unique: false
        })
        store.createIndex('end', 'end', {
          unique: false
        })
      }
    }
  })
}

export default class TimeTracker {
  get currentSessionTime() {
    return this.idle? 0: new Date() - this.session.start
  }
  get accumulatedDayTime() {
    return new Promise(resolve => {
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      this.db.then(db => {
        db.getAllFromIndex('sessions', 'end',
          IDBKeyRange.lowerBound(oneDayAgo)).then(sessions => {
          const accumulatedTime = sessions.reduce((time, session, i) => {
            let timeSpent
            if (!this.idle && i === sessions.length - 1) {
              timeSpent = this.currentSessionTime
            } else {
              let startTime
              if (session.start < oneDayAgo) {
                startTime = oneDayAgo
              } else {
                startTime = session.start
              }
              timeSpent = session.end.getTime() - startTime.getTime()
            }
            return time + timeSpent
          }, 0)
          resolve(accumulatedTime)
        })
      })
    })
  }
  constructor(config) {
    const time = new Date()
    this.CONFIG = config
    this.db = db()
    this.session = TimeTracker.getSessionFromLocalStorage()
    this.idle = false
    this.saveSession()
    window.addEventListener('beforeunload', () => this.saveSessionToLocalStorage())
    window.addEventListener('focus', () => {
      this.idle = false
      this.track(new Date())
    })
    window.addEventListener('blur', () => {
      this.session.end = new Date()
      this.saveSession()
      this.idle = true
    })
    this.track(time)
  }
  static getSessionFromLocalStorage() {
    const session = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SESSION_KEY))
    if (session) {
      session.start = session.start? new Date(session.start): new Date()
      session.end = session.end? new Date(session.end): new Date()
    }
    return session
  }
  static createNewSession(time) {
    return {
      start: time,
      end: new Date()
    }
  }
  /**
   * This will save the current session in local storage. We do this because
   * this is a synchronous operation an can be securely done if browser window closes.
   */
  saveSessionToLocalStorage() {
    if (!this.idle) {
      this.session.end = new Date()
    }
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(this.session))
  }
  dailyRedditTimeExhausted() {
    return this.accumulatedDayTime.then(time => {
      if (time / 1000 / 60 > this.CONFIG.dailyRedditTime) {
        return time
      } else {
        return new Promise(resolve => {
          const dailyRedditTimeSec = this.CONFIG.dailyRedditTime * 1000 * 60
          setTimeout(() => {
            this.dailyRedditTimeExhausted().then(time => {
              resolve(time)
            })
          }, dailyRedditTimeSec - time)
        })
      }
    })
  }
  track(time) {
    if (!this.session || new Date() - this.session.end > this.CONFIG.secondsToStartNewSession * 1000) {
      // console.log('start new session')
      this.session = TimeTracker.createNewSession(time)
      this.saveSession()
    // } else {
    //   console.log('continue session')
    }
  }
  saveSession(session = this.session) {
    return this.db.then(db => {
      return db.put('sessions', session).then(nr => {
        this.session.nr = nr
        // console.log('session saved:', this.session)
      })
    })
  }
  showHistory(historyList) {
    const locale = 'DE-de'
    const timestampToHr = timestamp => {
      const minutes = Math.round(timestamp / 1000 / 60)
      const hours = Math.floor(minutes / 60)
      let timestring = ''
      if (hours) {
        timestring += hours.toString() + 'h '
      }
      return `${timestring}${minutes % 60}min`
    }
    if (historyList.childNodes.length) {
      historyList.childNodes.forEach(child => child.remove())
    }
    this.db.then(db => {
      db.getAllFromIndex('sessions', 'end').then(sessions => {
        const sortedByDate = sessions.reduce((object, session) => {
          const date = new Intl.DateTimeFormat(locale).format(session.start)
          if (!object[date]) {
            object[date] = []
          }
          object[date].push(session)
          return object
        }, {})
        for (let date in sortedByDate) {
          const li = document.createElement('li')
          const h2 = document.createElement('h2')
          const ul = document.createElement('ul')
          let accumulatedDayTime = 0
          sortedByDate[date].forEach(session => {
            const li = document.createElement('li')
            const dateTimeFormat = new Intl.DateTimeFormat(locale, {hour: 'numeric', minute: 'numeric'})
            const spentTime = session.end - session.start
            accumulatedDayTime += spentTime
            const text = [
              '<span>',
              dateTimeFormat.format(session.start),
              'Uhr',
              '-',
              dateTimeFormat.format(session.end),
              'Uhr',
              '</span>',
              '<span>',
              'Duration:',
              timestampToHr(spentTime),
              '</span>'
            ]
            li.innerHTML = text.join(' ')
            ul.append(li)
          })
          h2.innerText = `${date} (${timestampToHr(accumulatedDayTime)})`
          li.append(h2)
          li.append(ul)
          historyList.append(li)
        }
      })
    })
  }
}