const listHelper = require('../utils/list_helper')
const dummyBlogs = require('./blogs_test_data')

test('dummy is called', () => {
  const blogs = []

  const result = listHelper.dummy(blogs)
  expect(result).toBe(1)
})

describe('total likes', () => {
  const listWithOneBlog = [dummyBlogs[0]]
  const listWithManyBlogs = dummyBlogs

  test('of empty list is zero', () => {
    const result = listHelper.totalLikes([])
    expect(result).toBe(0)
  })

  test('when list has only one blog equals the likes of that', () => {
    const result = listHelper.totalLikes(listWithOneBlog)
    expect(result).toBe(7)
  })

  test('of list with many blogs is calculated correctly', () => {
    const result = listHelper.totalLikes(listWithManyBlogs)
    expect(result).toBe(36)
  })
})

describe('favorite blog is', () => {
  const listWithOneBlog = [dummyBlogs[0]]
  const listWithManyBlogs = dummyBlogs

  test('an empty object when list has no blogs', () => {
    const result = listHelper.favoriteBlog([])
    expect(result).toEqual({})
  })

  test('the only blog in a list of one blogs', () => {
    const result = listHelper.favoriteBlog(listWithOneBlog)
    expect(result).toEqual(dummyBlogs[0])
  })

  test('the blog with most likes in a list of many blogs', () => {
    const result = listHelper.favoriteBlog(listWithManyBlogs)
    expect(result).toEqual(dummyBlogs[2])
  })
})

describe('author with most titles', () => {
  const listWithOneBlog = [dummyBlogs[0]]
  const listWithManyBlogs = dummyBlogs

  test('in an empty list is an empty object', () => {
    const result = listHelper.mostBlogs([])
    expect(result).toEqual({ })
  })

  test('in a list of one blog is author of that', () => {
    const result = listHelper.mostBlogs(listWithOneBlog)
    expect(result).toEqual({ author: 'Michael Chan', blogs: 1 })
  })

  test('in a list with many authors is one with most titles', () => {
    const result = listHelper.mostBlogs(listWithManyBlogs)
    expect(result).toEqual({ author: 'Robert C. Martin', blogs: 3 })
  })

})

describe('author with most likes', () => {
  const listWithOneBlog = [dummyBlogs[0]]
  const listWithManyBlogs = dummyBlogs

  test('in an empty list is an empty object', () => {
    const result = listHelper.mostLikes([])
    expect(result).toEqual({ })
  })

  test('in a list of one blog is author of that', () => {
    const result = listHelper.mostLikes(listWithOneBlog)
    expect(result).toEqual({ author: 'Michael Chan', likes: 7 })
  })

  test('in a list with many authors is one with most likes', () => {
    const result = listHelper.mostLikes(listWithManyBlogs)
    expect(result).toEqual({ author: 'Edsger W. Dijkstra', likes: 17 })
  })

})