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
    console.log('02: request body blog post', body)
    const decodedToken = jwt.verify(request.token, process.env.SECRET)

    const user = await User.findById(decodedToken.id)
    /// SAMA TULOS KUN TOIMII JA KUN EI
    //console.log('01: user ', user)
    ///
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

    await Blog.populate(savedBlog, { path: 'user', select: 'username name' })

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

blogsRouter.post('/:id/comments', async (request, response) => {
  console.log('request', request.body)
  try {
    const body = request.body
    if (body.comment === undefined || body.comment === '') {
      return response.status(400).json({ error: 'content missing' })
    }

    const blog = await Blog
      .findById(request.params.id)
      .populate('user', { username: 1, name: 1 })

    //blog.comments = blog.comments.concat(body.comment)
    blog.comments.push({ comment:body.comment })

    await blog.save()

    /*     const updated = await Blog
      .findByIdAndUpdate(request.params.id, update, { new: true })
      .populate('user', { username: 1, name: 1 }) */

    response.status(200).json(Blog.format(blog))

  } catch (exception) {
    console.log(exception)
    return response.status(400).json({ error: 'malformatted id' })
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