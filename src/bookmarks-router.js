const express = require('express')
const bookmarksRouter = express.Router()
const bodyParser = express.json()
const uuid = require('uuid')
const logger = require('./logger')

const bookmarks = [
    {
        id: 1,
        title: "Permanent Record",
        url: "www.google2.com",
        description: "Edward Snowden, the man who risked everything to expose the US government’s system of mass surveillance, reveals for the first time the story of his life, including how he helped to build that system and what motivated him to try to bring it down.",
        rating: 5
    },
    {
        id: 2,
        title: "Room on the Broom",
        url: "www.google1.com",
        description: "The witch and her cat are happily flying through the sky on a broomstick when the wind picks up and blows away the witch's hat, then her bow, and then her wand!  Luckily, three helpful animals find the missing items, and all they want in return is a ride on the broom.  But is there room on the broom for so many friends?  And when disaster strikes, will they be able to save the witch from a hungry dragon?",
        rating: 5
    },
    {
        id: 3,
        title: "Wrecking Ball",
        url: "www.google3.com",
        description: "In Wrecking Ball, Book 14 of the Diary of a Wimpy Kid series—from #1 international bestselling author Jeff Kinney—an unexpected inheritance gives Greg Heffley’s family a chance to make big changes to their house. But they soon find that home improvement isn’t all it’s cracked up to be.",
        rating: 4
    }
]

bookmarksRouter
    .route('/bookmarks')
    .get((req, res) => {
        if (bookmarks.length === 0) {
            logger.info('Bookmarks list is empty')
        }
        return res.json(bookmarks)
    })
    .post(bodyParser, (req, res) => {
        const {title, url, description="", rating} = req.body
        if (!title) {
            logger.error('Title is required')
            return res.status(400).send('Invalid data')
        }
        if (!url) {
            logger.error('URL is required')
            return res.status(400).send('Invalid data')
        }
        if (!rating) {
            logger.error('Rating is required')
            return res.status(400).send('Invalid data')
        }
        if(url) {
            let valid = true
            bookmarks.forEach(bm => {
                if (bm.url == url) {
                    valid = false
                }})
            if (!valid) {
                logger.error(`url ${url} is duplicate`)
                return res.status(400).send('Duplicate URL')
            }
        }
        const id = uuid()
        const ratingNumber = Number(rating)
        const newBookmark = {
            id,
            title,
            url,
            description,
            ratingNumber
        }

        bookmarks.push(newBookmark)
        logger.info(`Bookmark id ${id} created`)
        res.status(201).location(`http://localhost:8000/${id}`).json(newBookmark)
        
    })

bookmarksRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
        const {id} = req.params
        const bookmark = bookmarks.find(bm => bm.id == id)
        if (!bookmark) {
            logger.error(`Bookmark with ID ${id} not found`)
            res.status(404).send('Bookmark not found')
        }
        return res.json(bookmark)
    })
    .delete((req, res) => {
        const {id} = req.params
        const bookmark = bookmarks.find(bm => bm.id == id)
        if (!bookmark) {
            logger.error(`Bookmark with ID ${id} not found`)
            return res.status(404).send('Bookmark not found')
        }
        const bmIndex = bookmarks.findIndex(bm => bm.id == id)
        if (bmIndex === -1) {
            logger.error(`Bookmark with ID ${id} not found`)
            return res.status(404).send('Not Found')
        }
        bookmarks.splice(bmIndex, 1)
        console.log(bookmarks)
        logger.info(`Bookmark with ID ${id} deleted`)
        res.status(204).end()
    })

module.exports = bookmarksRouter