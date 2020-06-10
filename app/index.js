import './scss/message.scss'
import Toast from './html/toast.html'
function showToast() {
  document.body.insertAdjacentHTML('beforeend', Toast)
  const toast = document.body.children.item(document.body.children.length - 1)
  toast.classList.add('show')
  toast.addEventListener('click', function () {
    this.classList.remove('show')
  })
}

console.log('Hello World!')
showToast()