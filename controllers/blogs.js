const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1 })

  response.json(blogs.map(Blog.format))
})

blogsRouter.post('/', async (request, response) => {
  try {
    const body = request.body

    const decodedToken = jwt.verify(request.token, process.env.SECRET)

    const user = await User.findById(decodedToken.id)

    if (!decodedToken.id || !user) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }

    if (!body.title || !body.url) {
      return response.status(400).json({ error: 'content missing' })
    }

    if (body.likes === undefined || body.likes === '') {
      body.likes = 0
    }

    body.user = user._id

    const blog = new Blog(body)
    let savedBlog = await blog
      .save()

    Blog.populate(savedBlog, { path: 'user', select: 'username name' })

    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.status(201).json(Blog.format(savedBlog))
  } catch (exception) {
    if (exception.name === 'JsonWebTokenError') {
      response.status(401).json({ error: exception.message })
    } else {
      console.log(exception)
      response.status(500).json({ error: 'something went wrong...' })
    }
  }
})

blogsRouter.delete('/:id', async (request, response) => {
  try {

    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    const blog = await Blog.findById(request.params.id)

    if (!decodedToken.id || !blog) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }

    if (blog.user && blog.user.toString() !== decodedToken.id) {
      return response.status(401).json({ error: 'unauthorized' })
    }

    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()

  } catch (exception) {
    if (exception.name === 'JsonWebTokenError') {
      return response.status(401).json({ error: exception.message })
    }

    console.log(exception)
    response.status(400).send({ error: 'malformatted id' })
  }
})

blogsRouter.put('/:id', async (request, response) => {
  try {

    const body = request.body

    if (body.author === undefined
      && body.title === undefined
      && body.url === undefined
      && body.likes === undefined) {
      return response.status(400).json({ error: 'content missing' })
    }

    const updated = await Blog
      .findByIdAndUpdate(request.params.id, body, { new: true })
      .populate('user', { username: 1, name: 1 })

    //    Blog.populate(updated, { path: 'user', select: 'username name' })
    response.status(200).json(Blog.format(updated))
  } catch (exception) {

    console.log(exception)
    return response.status(400).json({ error: 'content missing' })
  }
})

module.exports = blogsRouter