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
    return new Date() - this.session.start
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
            if (i === sessions.length - 1) {
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
    this.session = TimeTracker.getSessionFromLocalStorage()
    window.addEventListener('beforeunload', this.saveSessionToLocalStorage.bind(this))
    // console.log('localSession:', this.session)
    this.db = db()
    this.db.then(async db => {
      // get last session
      // const lastSession = await db.transaction('sessions')
      //         .store.openCursor(null, 'prev').then(cursor => cursor? cursor.value: cursor)
      if (!this.session || new Date() - this.session.end > this.CONFIG.secondsToStartNewSession * 1000) {
        // console.log('start new session')
        if (this.session) {
          //save old session
          db.put('sessions', this.session).then(() => {
            // console.log('session saved:', this.session)
          })
        }
        this.session = TimeTracker.createNewSession(time)
        //save session and retrieve session.nr
        db.put('sessions', this.session).then(nr => {
          this.session.nr = nr
        })
      } else {
        // console.log('continue session')
        //update current session
        db.put('sessions', this.session).then(() => {
          // console.log('session updated:', this.session)
        })
      }
    })
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
    this.session.end = new Date()
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
            resolve(dailyRedditTimeSec)
          }, dailyRedditTimeSec - time)
        })
      }
    })
  }
}