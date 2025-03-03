let mealsState = []
let ruta = 'login' // login, register, orders

const stringToHTML = (s) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(s, 'text/html')
  return doc.body.firstChild
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

const renderOrder = (order, meals) => {
  const meal = meals.find(meal => meal._id === order.meal_id)
  const element = stringToHTML(`<li data-id=${order._id}>${meal.name} - ${order.user_id}</li>`)

  return element
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
      return
    }

    const order = {
      meal_id: mealIdValue,
      user_id: 'chanchito triste'
    }

    fetch('https://serverless-functions-abrahamgalue.vercel.app/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order)
    }).then(res => res.json())
      .then(data => {
        const renderedOrder = renderOrder(data, mealsState)
        const ordersList = document.getElementById('orders-list')

        ordersList.appendChild(renderedOrder)
        submit.removeAttribute('disabled')
        submit.value = 'Submit'
      })
  }
}

const inicializarDatos = () => {
  fetch('https://serverless-functions-abrahamgalue.vercel.app/meals')
    .then(res => res.json())
    .then(data => {
      mealsState = data
      const mealsList = document.getElementById('meals-list')
      const submit = document.getElementById('submit')
      const listItems = data.map(renderItem)
      mealsList.removeChild(mealsList.firstElementChild)
      listItems.forEach(e => mealsList.appendChild(e))
      submit.removeAttribute('disabled')
      fetch('https://serverless-functions-abrahamgalue.vercel.app/orders')
        .then(res => res.json())
        .then(ordersData => {
          const ordersList = document.getElementById('orders-list')
          const listOrders = ordersData.map(orderData => renderOrder(orderData, data))

          ordersList.removeChild(ordersList.firstElementChild)
          listOrders.forEach(e => ordersList.appendChild(e))
        })
    })
}

const renderApp = () => {
  const token = localStorage.getItem('token')
  if (token) {
    const ordersView = document.getElementById('orders-view')
    document.getElementsByTagName('body')[0].innerHTML = ordersView.innerHTML
  }
}

const renderLogin = () => {
  const loginView = document.getElementById('login-view')
  document.getElementsByTagName('body')[0].innerHTML = loginView.innerHTML

  const loginForm = document.getElementById('login-form')
  loginForm.onsubmit = (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    fetch('https://serverless-functions-abrahamgalue.vercel.app/auth/login', {
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
      })
  }
}

window.onload = () => {
  renderApp()
  // inicializarFormulario()
  // inicializarDatos()
}