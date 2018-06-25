const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')
const bcrypt = require('bcrypt')


const format = (blog) => {
  return {
    title: blog.title,
    author: blog.author,
    url: blog.url,
    likes: blog.likes
  }
}

const blogsInDb = async () => {
  const b = await Blog.find({})
  return b.map(format)
}

const blogsFromResponse = (response) => {
  return response.body.map(n => format(n))
}

const nonExistingId = async () => {
  const n = new Blog()
  await n.save()
  const id = n._id
  await n.remove()
  return id
}

const usersInDb = async () => {
  const c = await User.find({})
  return c.map(User.format)
}

const getUser = async (username, name, password) => {
  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    adult: true,
    passwordHash
  })

  const savedUser = await user.save()

  const token = jwt.sign({ username: savedUser.username, id: savedUser._id }, process.env.SECRET)
  savedUser.token = token

  return savedUser
}

module.exports = {
  format, blogsInDb, nonExistingId, blogsFromResponse, getUser, usersInDb
}

