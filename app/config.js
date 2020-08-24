const localStorageKey = 'old-reddit-enhancer-config'
class Config {
  constructor() {
    this.load()
    return new Proxy(this, {
      get(target, prop, receiver) {
        const defaultValues = {
          secondsToStartNewSession: 30,
          dailyRedditTime: 60,
          showTimeAlert: true,
          showTimeAlertTime: 10
        }
        if (Object.keys(defaultValues).includes(prop.toString()) && !target.hasOwnProperty(prop)) {
          return defaultValues[prop]
        }
        return target[prop]
      }
    })
  }
  load() {
    const config = JSON.parse(localStorage.getItem(localStorageKey))
    for (let key in config) {
      this[key] = config[key]
    }
  }
  save() {
    localStorage.setItem(localStorageKey, JSON.stringify(this))
  }
}
export default new Config()