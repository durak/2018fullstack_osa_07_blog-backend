const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({ comment: 'string' })

const blogSchema = new mongoose.Schema({
  title: String,
  author: String,
  url: String,
  likes: Number,
  comments: [commentSchema],
  user: { type: mongoose.Schema.Types.ObjectId, ref:'User' }
})

blogSchema.statics.format = (blog) => {
  return {
    id: blog._id.toString(),
    title: blog.title,
    author: blog.author,
    url: blog.url,
    likes: blog.likes,
    comments: blog.comments,
    user: blog.user
  }
}
const Blog = mongoose.model('Blog', blogSchema)

module.exports = Blog