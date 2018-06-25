const jwt = require('jsonwebtoken')
const supertest = require('supertest')
const { app, server } = require('../index')
const api = supertest(app)
const dummyBlogs = require('./blogs_test_data')
const User = require('../models/user')
const Blog = require('../models/blog')
const { format, blogsInDb, nonExistingId, blogsFromResponse, getUser, usersInDb } = require('./test_helper')


let validUser

beforeAll(async () => {
  await User.remove({})

  validUser = await getUser('ValidUsername', 'Validuser_name', 'password')
})

describe('when some users initially exist',  () => {

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  describe('login', () => {

    test('POST /api/login succeeds and returns a token with a valid username and password', async () => {
      const response = await api
        .post('/api/login')
        .send({ username: validUser.username, password: 'password' })
        .expect(200)

      expect(response.body.token).not.toBe(null)
      expect(response.body.username).toBe(validUser.username)
      expect(response.body.name).toBe(validUser.name)
    })

    test('POST /api/login fails with a wrong username or password', async () => {
      const response1 = await api
        .post('/api/login')
        .send({ username: 'wrong', password: 'password' })
        .expect(401)

      const response2 = await api
        .post('/api/login')
        .send({ username: validUser.username, password: 'wrong' })
        .expect(401)

      expect(response1.body.token).toBe(undefined)
      expect(response1.body.error).toEqual('invalid username or password')
      expect(response2.body.error).toEqual('invalid username or password')
    })
  })

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  describe('addition of a new user', async () => {
    test('POST /api/users succeeds with valid data', async () => {
      const usersBefore = await usersInDb()

      let newUser = {
        username: 'newUsernameSuccess',
        name: 'newName',
        adult: false,
        password: 'secret'
      }

      const response = await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      newUser._id = response.body.id
      newUser = User.format(newUser)

      const usersAfter = await usersInDb()


      const usersAfterMinusBlogs = usersAfter.map((user) => {
        let u = { ...user }
        delete u.blogs
        return u
      })


      expect(usersAfter.length).toBe(usersBefore.length + 1)
      expect(usersAfterMinusBlogs).toContainEqual(newUser)
    })

    test('POST /api/users defaults to adult user', async () => {
      let postUser = {
        username: 'newUsernameDefaultAdult',
        name: 'newNameDefaultAdult',
        password: 'secret'
      }

      const response = await api
        .post('/api/users')
        .send(postUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const dbUser = await User.findOne({ _id: response.body.id })
      expect(dbUser.adult).toBe(true)
    })

    test('POST /api/users fails with username < 3 characters', async () => {
      const usersBefore = await usersInDb()

      let postUser = {
        username: 'aa',
        name: 'tooshortusername',
        password: 'secret'
      }

      const response = await api
        .post('/api/users')
        .send(postUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)


      const usersAfter = await usersInDb()

      expect(usersBefore.length).toBe(usersAfter.length)
      expect(response.body.error).toEqual('username must be at least 3 char long')
    })

    test('POST /api/users fails with username already taken', async () => {
      const usersBefore = await usersInDb()

      let postUser = {
        username: validUser.username,
        name: 'name',
        password: 'secret'
      }

      const response = await api
        .post('/api/users')
        .send(postUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)


      const usersAfter = await usersInDb()

      expect(usersBefore.length).toBe(usersAfter.length)
      expect(response.body.error).toEqual('username must be unique')
    })
  })

})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('When there is initially some blogs saved:', () => {
  beforeAll(async () => {
    await Blog.remove({})

    const blogs = dummyBlogs.map(blog => new Blog(blog))
    const promises = blogs.map(blog => blog.save())
    await Promise.all(promises)
  })

  test('all blogs are returned as json by GET /api/blogs', async () => {
    const blogsInDatabase = await blogsInDb()
    const blogsFromApi = blogsFromResponse(
      await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    )

    for (let blog of blogsInDatabase) {
      expect(blogsFromApi).toContainEqual(blog)
    }

    expect(blogsFromApi.length).toBe(blogsInDatabase.length)
  })


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  describe('addition of a new blog', async () => {

    test('POST /api blogs succeeds with valid data', async () => {
      const blogsBefore = await blogsInDb()

      const newa = {
        title: 'uusi blogi',
        author: 'testman',
        url: 'abc',
        likes: 99
      }

      const response = await post('/api/blogs', newa, validUser.token, 201)

      const blogsAfter = await blogsInDb()

      expect(JSON.stringify(response.body.user)).toContain(validUser._id)
      expect(blogsAfter.length).toBe(blogsBefore.length + 1)
      expect(blogsAfter).toContainEqual(newa)
    })

    test('POST /api/blogs with field likes missing succeeds with value likes=0', async () => {
      const blogsBefore = await blogsInDb()

      let newa = {
        title: 'uusi blogi',
        author: 'testman',
        url: 'abc'
      }

      let newb = {
        title: 'uusi blogi 2',
        author: 'testman 2',
        url: 'abc 2',
        likes: ''
      }

      await post('/api/blogs', newa, validUser.token, 201)
      await post('/api/blogs', newb, validUser.token, 201)

      const blogsAfter = await blogsInDb()

      newa.likes = 0
      newb.likes = 0

      expect(blogsAfter).toContainEqual(newa)
      expect(blogsAfter).toContainEqual(newb)
      expect(blogsAfter.length).toBe(blogsBefore.length + 2)
    })

    test('POST /api/blogs fails with proper statuscode if title or url is missing', async () => {
      const blogsBefore = await blogsInDb()
      const invalidBlogs = [
        { author: 'testman', url: 'abc', likes: 99 },
        { title: 'uusi blogi', author: 'testman', likes: 99 },
        { author: 'testman', likes: 99 }
      ]

      for (let blog of invalidBlogs) {
        await post('/api/blogs', blog, validUser.token, 400)
      }

      const blogsAfter = await blogsInDb()

      expect(blogsAfter.length).toBe(blogsBefore.length)
    })

  })

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  describe('deletion of a blog', async () => {
    let addedBlog

    beforeAll(async () => {
      addedBlog = new Blog({
        author: 'deleteman',
        title: 'poisto pyynnöllä HTTP DELETE',
        url: 'del',
        likes: 333,
        user:validUser.id
      })
      await addedBlog.save()
    })

    test('DELETE /api/blogs/:id succeeds with proper statuscode', async () => {
      const blogsBefore = await blogsInDb()

      await api
        .delete(`/api/blogs/${addedBlog._id}`)
        .set('Authorization', 'bearer ' + validUser.token)
        .expect(204)

      const blogsAfterOperation = await blogsInDb()

      const contents = blogsAfterOperation.map(r => r.title)

      expect(contents).not.toContain(addedBlog.title)
      expect(blogsAfterOperation.length).toBe(blogsBefore.length - 1)
    })

    test('DELETE /api/blogs:id fails with wrong token', async () => {
      const blogsBefore = await blogsInDb()

      let invalidBlog = new Blog({
        author:'a',
        title: 't',
        url:'u',
        user:'5b17097567018a67b79348bc'
      })
      await invalidBlog.save()

      await api
        .delete(`/api/blogs/${invalidBlog._id}`)
        .set('Authorization', 'bearer ' + validUser.token)
        .expect(401)

      const blogsAfterOperation = await blogsInDb()

      expect(blogsAfterOperation.length).toBe(blogsBefore.length + 1)
    })

  })

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  describe('updating a blog', async () => {
    let newBlog

    beforeAll(async () => {
      newBlog = new Blog({
        author: 'old putman',
        title: 'old title',
        url: 'old url',
        likes: 1
      })
      await newBlog.save()
    })

    test('PUT /api/blogs/:id succeeds with valid partial data', async () => {
      const updates = [
        { author: 'new author' },
        { title: 'new title' },
        { url: 'new url' },
        { likes: 99 }
      ]

      for (let update of updates) {
        await put('/api/blogs/', newBlog._id, update, 200)
      }

      const fromDB = format(await Blog.findById(newBlog._id))
      expect(fromDB.author).toContain('new author')
    })

    test('PUT /api/blogs/:id succeeds with valid full data', async () => {
      const update = {
        title: 'new title 2',
        author: 'new author 2',
        url: 'new url 2',
        likes: 66
      }

      await put('/api/blogs/', newBlog._id, update, 200)

      const fromDB = format(await Blog.findById(newBlog._id))
      expect(fromDB.author).toContain('new author 2')
    })

    test('PUT /api/blogs/:id fails with invalid data', async () => {
      await put('/api/blogs/', newBlog._id, {}, 400)
      await put('/api/blogs/', newBlog._id, { invalid:'something' }, 400)
    })
  })


})

afterAll(() => {
  server.close()
})

async function post(path, obj, token, statusExpected) {
  const response =  await api
    .post(path)
    .set('Authorization', 'bearer ' + token)
    .send(obj)
    .expect(statusExpected)
    .expect('Content-Type', /application\/json/)


  return response
}

async function put(path, id, obj, statusExpected) {
  await api
    .put(`${path}${id}`)
    .send(obj)
    .expect(statusExpected)
    .expect('Content-Type', /application\/json/)
}



