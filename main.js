let mealsState = []
let user = {}
let ruta = 'login' // login, register, orders

const URL = 'https://serverless-functions-abrahamgalue.vercel.app'

const stringToHTML = (s) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(s, 'text/html')
  return doc.body.firstChild
}

const getUserFullName = (email) => {
  const [name, domain] = email.split('@')
  const [domainName] = domain.split('.')

  return [name, domainName]
}

const renderItem = (item) => {
  const element = stringToHTML(`<li data-id=${item._id}>${item.name}</li>`)

  element.addEventListener('click', () => {
    const mealsList = document.getElementById('meals-list')
    Array.from(mealsList.children).forEach(x => x.classList.remove('selected'))
    element.classList.add('selected')
    const mealsIdInput = document.getElementById('meals-id')
    mealsIdInput.value = item._id
  })

  return element
}

const createOrderElement = (order, meals, email) => {
  const [name, domainName] = getUserFullName(email)

  const meal = meals.find(meal => meal._id === order.meal_id)

  return stringToHTML(`<li data-id=${order._id}>${meal.name} - ${name} ${domainName}</li>`)
}

const renderOrderForOtherUsers = async (order, meals) => {
  const res = await fetch(`${URL}/auth/user/${order.user_id}`, {
    headers: {
      'Content-Type': 'application/json',
      authorization: localStorage.getItem('token')
    }
  })

  const data = await res.json()

  return createOrderElement(order, meals, data.email)
}

const renderOrderForCurrentUser = (order, meals) => {
  return createOrderElement(order, meals, user.email)
}

const inicializarFormulario = () => {
  const orderForm = document.getElementById('order')

  orderForm.onsubmit = (e) => {
    e.preventDefault()
    const submit = document.getElementById('submit')
    submit.setAttribute('disabled', true)
    submit.value = 'Enviando...'
    const mealId = document.getElementById('meals-id')
    const mealIdValue = mealId.value
    if (!mealIdValue) {
      alert('Debe seleccionar un plato')
      submit.removeAttribute('disabled')
      return
    }

    const order = {
      meal_id: mealIdValue,
      user_id: user._id
    }

    fetch(`${URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: localStorage.getItem('token')
      },
      body: JSON.stringify(order)
    }).then(res => res.json())
      .then(data => {
        const renderedOrder = renderOrderForCurrentUser(data, mealsState)
        const ordersList = document.getElementById('orders-list')

        ordersList.appendChild(renderedOrder)
        submit.removeAttribute('disabled')
        submit.value = 'Submit'
      })
  }
}

const inicializarDatos = () => {
  fetch(`${URL}/meals`)
    .then(res => res.json())
    .then(data => {
      mealsState = data
      const mealsList = document.getElementById('meals-list')
      const submit = document.getElementById('submit')
      const listItems = data.map(renderItem)
      mealsList.removeChild(mealsList.firstElementChild)
      listItems.forEach(e => mealsList.appendChild(e))
      submit.removeAttribute('disabled')
      fetch(`${URL}/orders`)
        .then(res => res.json())
        .then(async ordersData => {
          const ordersList = document.getElementById('orders-list')
          const listOrders = await Promise.all(ordersData.map(orderData => renderOrderForOtherUsers(orderData, data)))

          ordersList.removeChild(ordersList.firstElementChild)
          listOrders.forEach(e => ordersList.appendChild(e))
        })
    })
}

const renderApp = () => {
  const token = localStorage.getItem('token')
  if (token) {
    user = JSON.parse(localStorage.getItem('user'))
    return renderOrders()
  }
  renderLogin()
}

const renderOrders = () => {
  const ordersView = document.getElementById('orders-view')
  document.getElementById('app').innerHTML = ordersView.innerHTML

  inicializarFormulario()
  inicializarDatos()
}

const renderLogin = () => {
  const loginView = document.getElementById('login-view')
  document.getElementById('app').innerHTML = loginView.innerHTML

  const loginForm = document.getElementById('login-form')
  loginForm.onsubmit = (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    fetch(`${URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      })
    }).then(x => x.json())
      .then(res => {
        localStorage.setItem('token', res.token)
        ruta = 'orders'
        return res.token
      })
      .then(token => {
        return fetch(`${URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            authorization: token
          }
        })
      })
      .then(x => x.json())
      .then(fetchedUser => {
        localStorage.setItem('user', JSON.stringify(fetchedUser))
        user = fetchedUser
        renderOrders()
      })
  }
}

window.onload = () => {
  renderApp()
}