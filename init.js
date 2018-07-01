const supertest = require('supertest')
const { app, server } = require('./index')
const api = supertest(app)
const User = require('./models/user')
const Blog = require('./models/blog')
const { getUser } = require('./tests/test_helper')
const blogData = require('./tests/blogs_test_data')

const init = async () => {

  const comments = [
    'I agree!!!',
    'Don\'t think so...',
    'Where did u find this?',
    'I\'ve always known this',
    'Thanks very interesting'
  ]

  const randomComment = () => {
    const i = Math.floor(Math.random() * comments.length)
    return comments[i]
  }

  const randomBlog = () => {
    const i = Math.floor(Math.random() * (blogData.length))
    const content = blogData[i]
    const likes = Math.floor(Math.random() * (30))

    const j = Math.floor(Math.random() * 10)
    let randomComments = []

    for (let n = 0; n < j; n++) {
      randomComments.push({ comment: randomComment() })
    }

    return {
      title: content.title,
      author: content.author,
      url: content.url,
      likes: likes,
      comments: randomComments
    }
  }

  async function post(obj, token) {
    const response =  await api
      .post('/api/blogs')
      .set('Authorization', 'bearer ' + token)
      .send(obj)


    return response
  }

  await User.remove({})
  await Blog.remove({})

  const user1 = await getUser('user', 'Dev Man', 'password')
  const user2 = await getUser('user2', 'Kumi Jii', 'password')

  for (let n= 0; n < 50; n++) {
    await post(randomBlog(), user1.token)
    await post(randomBlog(), user2.token)
  }

  server.close()
}

init()
