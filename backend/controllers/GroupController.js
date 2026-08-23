const db = require('../utilities/db')

exports.create = async (req, res, next) => {
  try {
    const {
      name, containers
    } = req.body

    const response = await db.newGroup({name, containers})
    res.json(response)
  } catch (error) {
    next(error)
  }
}

exports.fetch = async (req, res, next) => {
  try {
    const response = await db.getGroups()
    res.json(response)
  } catch (error) {
    next(error)
  }
}

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.body
    await db.deleteGroup(id)
    res.json([])
  } catch (error) {
    next(error)
  }
}