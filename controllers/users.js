const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
  const users = await User
    .find({})
    .populate('blogs', { author:1, title:1, likes:1, url:1 })

  response.json(users.map(User.format))
})

usersRouter.get('/:id', async (request, response) => {
  try {
    const user = await User
      .findById(request.params.id)
      .populate('blogs', { author:1, title:1, likes:1, url:1 })

    response.json(User.format(user))
  } catch (exception) {
    console.log(exception)
    response.status(400).json({ error: 'malformmated id' })
  }
})

usersRouter.post('/', async (request, response) => {
  try {
    const body = request.body

    if (body.username.length < 3) {
      return response.status(400).json({ error: 'username must be at least 3 char long' })
    }

    const existingUser = await User.find({ username: body.username })
    if (existingUser.length > 0) {
      return response.status(400).json({ error: 'username must be unique' })
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    const user = new User({
      username: body.username,
      name: body.name,
      adult: body.adult === false ? false : true,
      passwordHash
    })

    const savedUser = await user.save()

    response.status(201).json(User.format(savedUser))
  } catch (exception) {
    console.log(exception)
    response.status(500).json({ error: 'something went wrong...' })
  }
})

module.exports = usersRouter