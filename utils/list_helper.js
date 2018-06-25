const dummy = (blogs) => {
  let use = blogs
  use = 1
  return use
}

const totalLikes = (blogs) => {
  const reducer = (likesSum, blog) => likesSum + blog.likes

  return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  const reducer = (prev, current) => {
    return prev.likes > current.likes ? prev : current
  }

  return blogs.reduce(reducer, {})
}

const mostBlogs = (blogs) => {
  const reducer = (titleCount, blog) => {
    titleCount[blog.author] = (titleCount[blog.author] || 0) + 1
    return titleCount
  }
  const blogsPerAuthor = blogs.reduce(reducer, [])

  const topAuthor = Object.keys(blogsPerAuthor).reduce((prev, next) => {
    return blogsPerAuthor[prev] > blogsPerAuthor[next] ? prev : next
  }, {})

  if (!blogsPerAuthor[topAuthor]) {
    return {}
  }

  return {
    author: topAuthor,
    blogs: blogsPerAuthor[topAuthor]
  }
}

const mostLikes = (blogs) => {
  const reducer = (likeCount, blog) => {
    likeCount[blog.author] = (likeCount[blog.author] || 0) + blog.likes
    return likeCount
  }

  const likesPerAuthor = blogs.reduce(reducer, [])

  const topAuthor = Object.keys(likesPerAuthor).reduce((prev, next) => {
    return likesPerAuthor[prev] > likesPerAuthor[next] ? prev : next
  }, {})

  if (!likesPerAuthor[topAuthor]) {
    return {}
  }

  return {
    author: topAuthor,
    likes: likesPerAuthor[topAuthor]
  }

}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}