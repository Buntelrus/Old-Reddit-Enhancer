import './scss/index.scss'
import selectors from './selectors'
import config from './config'
import TimeTracker from './TimeTracker'
import update from './functions/update'
import Container from './html/container.html'

function addClickListenerToModuleLink(element) {
  const moduleLinks = Array.from(element.querySelectorAll('a[data-module]'))
  moduleLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault()
      const moduleIndex = parseInt(event.currentTarget.dataset.module)
      modules[moduleIndex].show()
    })
  })
}

//insert container html
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

//open proper modules
addClickListenerToModuleLink(container)

const toast = document.querySelector('.ore-notification-container > .toast')
toast.addEventListener('click', () => toast.classList.remove('show'))
function showToast(heading, message) {
  toast.querySelector('.toast-header').innerText = heading
  const body =  toast.querySelector('.toast-body')
  body.innerHTML = message
  addClickListenerToModuleLink(body)
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 10000)
}

update(config, modules[0])

const timeTracker = window.TimeTracker = new TimeTracker(config)
if (config.showTimeAlert) {
  timeTracker.dailyRedditTimeExhausted().then(time => {
    const minutesSpentOnReddit = time / 1000 / 60
    showToast(
      'Enough Reddit for today!',
      `dailyRedditTime: ${config.dailyRedditTime}min, spent: ${Math.round(minutesSpentOnReddit)}min` +
              '<br><a href="" data-module="1">configure</a>'
    )
  })
}

document.addEventListener('keydown', event => {
  let module
  if (event.code === 'KeyT' && event.ctrlKey && event.altKey) {
    module = modules[1] //open config
  } else if (event.code === 'KeyT' && event.altKey) {
    module = modules[2] //open history
  } else if (event.code === 'Escape') {
    modules.forEach(module => module.show(false)) //close all
  }
  if (module) {
    if (module.classList.contains('show')) {
      module.show(false)
    } else {
      module.show()
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
  if (input.type === 'checkbox') {
    input.checked = config[camalize(input.id)]
  } else {
    input.value = config[camalize(input.id)]
  }
})

form.addEventListener('submit', event => {
  event.preventDefault()
  inputs.forEach(input => {
    if (input.type === 'checkbox') {
      config[camalize(input.id)] = input.checked
    } else {
      config[camalize(input.id)] = input.value
    }
  })
  config.save()
  modules[1].show(false) //close config
})
document.getElementById('ore-version').innerText = VERSION

//history
const history = modules[2]
const originalShow = history.show
history.show = show => {
  if (show !== false) {
    timeTracker.showHistory(history.querySelector('.history-list'))
  }
  originalShow(show)
}

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