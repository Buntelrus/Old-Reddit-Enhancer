import './scss/threadline.scss'
import selectors from './selectors'
import TimeTracker from './TimeTracker'

window.TimeTracker = new TimeTracker()

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