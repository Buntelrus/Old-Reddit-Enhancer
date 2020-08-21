import './scss/index.scss'
import selectors from './selectors'
import config from './config'
import TimeTracker from './TimeTracker'
import update from './functions/update'
import Container from './html/container.html'


document.body.insertAdjacentHTML('afterbegin', Container)
const container = document.body.children[0]
const modules = Array.from(document.querySelector('.ore-container').children)
const isShown = module => module.classList.contains('show')
modules.forEach(module => {
  module.show = function (show = true) {
    if (show) {
      module.classList.add('show')
      if (!container.classList.contains('show')) {
        container.classList.add('show')
      }
    } else {
      module.classList.remove('show')
      if (!modules.some(isShown)) {
        container.classList.remove('show')
      }
    }
  }
  const closeButton = module.querySelector('.close')
  closeButton.addEventListener('click', event => {
    module.show(false)
  })
})

update(config, modules[0])

const timeTracker = window.TimeTracker = new TimeTracker(config)
timeTracker.accumulatedDayTime.then(time => {
  const minutesSpentOnReddit = time / 1000 / 60
  if (minutesSpentOnReddit > config.dailyRedditTime) {
    alert(`genug reddit für heute! dailyRedditTime: ${config.dailyRedditTime}min, time spent: ${Math.round(minutesSpentOnReddit)}min`)
  }
})

document.addEventListener('keydown', event => {
  if (event.key === 't' && event.ctrlKey && event.altKey) {
    const config = modules[1]
    if (config.classList.contains('show')) {
      config.show(false)
    } else {
      config.show()
    }
  }
})

//config
const form = document.querySelector('.ore-container form')
const inputs = Array.from(form.querySelectorAll('input'))
const camalize = string => {
  const parts = string.split('-')
  return parts.map((part, i) => {
    if (i !== 0) {
      return part.charAt(0).toUpperCase() + part.slice(1)
    } else {
      return part
    }
  })
  .join('')
}
inputs.forEach(input => {
  input.value = config[camalize(input.id)]
})

form.addEventListener('submit', event => {
  event.preventDefault()
  inputs.forEach(input => {
    config[camalize(input.id)] = input.value
  })
  config.save()
  modules[1].show(false) //close config
})

const comments = Array.from(document.querySelectorAll(selectors.comment))
comments.forEach(comment => {
  const threadLine = document.createElement('div')
  threadLine.append(document.createElement('div'))
  threadLine.classList.add('threadline')
  threadLine.addEventListener('click', function () {
    const comment = this.parentElement
    const collapsed = comment.classList.toggle('collapsed')
    if (collapsed) {
      comment.classList.remove('noncollapsed')
      comment.querySelector(selectors.expand).innerText = '[+]'
    } else {
      comment.classList.add('noncollapsed')
      comment.querySelector(selectors.expand).innerText = '[-]'
    }
  })
  comment.append(threadLine)
})