const path = require('path')
const express = require('express')
const { isWebUri } = require('valid-url')
const xss = require('xss')
const bookmarksRouter = express.Router()
const bodyParser = express.json()
const logger = require('./logger')
const BookmarksService = require('./bookmarks-service')

bookmarksRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
        .then(list => {
            if (!list) {
                logger.info('Bookmarks list is empty')
            }
            res.json(list.map(bm => ({
                ...bm,
                title: xss(bm.title),
                description: xss(bm.description)
            })))
        })
        .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const {title, url, description="", rating} = req.body

        // const requiredFields = ['title', 'url', 'rating']
        // requiredFields.forEach(field => {
        //     if (!req.body[field]) {
        //         logger.error((`Missing ${field} in the request body`))
        //         return res.status(400).send(
        //             {error: {message: `${field} is required`}}
        //         )}
        // })

        for (const field of ['title', 'url', 'rating']) {
            if (!req.body[field]) {
                logger.error(`${field} is required`)
                return res.status(400).send({
                    error: {message: `${field} is required`}
                })
            }
        }
  
            let unique = true
            BookmarksService
            .getAllBookmarks(knexInstance)
            .then(bookmarks => 
                bookmarks.forEach(bm => {
                   if (bm.url == url) {
                        valid = false 
                    }
                    if (!unique) {
                        logger.error(`url ${url} is duplicate`)
                        res.status(400).send('Duplicate URL') 
                    }
                })
            )

        if(!isWebUri(url)) {
            logger.error(`Invalid url ${url}`)
            return res.status(400).send({
                error: {message: `url must be a valid url`}
            })
        }

        const newBookmark = {title, url, description, rating}

        BookmarksService.insertBookmark(knexInstance, newBookmark)
        .then(bm => {
            res
                .status(201)
                .location(path.posix.join(req.originalUrl) + `/${bm.id}`)
                .json({
                    ...bm,
                    title: xss(bm.title),
                    description: xss(bm.description)
                })
        })
        .catch(next)
    })
    .patch((req, res) => {
        res
            .status(400)
            .json({error: {message: 'Bookmark ID required'}})
            .end()
    })

bookmarksRouter
    .route('/bookmarks/:id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        const id = req.params.id
        if (!id) {
            return res.status(400).json({error: {message: 'Bookmark ID required'}})
        }
        BookmarksService.getBookmarkById(knexInstance, id)
            .then(bookmark => {
                if (!bookmark) {
                    return res.status(404).json({
                        error: {message: `Bookmark with id ${id} does not exist`}
                    })
                }
                res.bookmark = bookmark
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json({
            ...res.bookmark,
            title: xss(res.bookmark.title),
            description: xss(res.bookmark.description)
        })
    })
    .delete((req, res, next) => {
        const {id} = req.params
        const knexInstance = req.app.get('db')
        BookmarksService.deleteBookmark(knexInstance, id)
            .then(() => {
                logger.info(`Bookmark with id ${id} deleted`)
                res.status(204).end()
        })
            .catch(next)
    })
    .patch(bodyParser, (req, res, next) => {
        const {title, url, description, rating} = req.body
        const bmToUpdate = {title, url, description, rating}
        const {id} = req.params
        if (!id) {
            res.status(400).json({error: {message: 'Bookmark id required'}})
        }
        const numberOfValues = Object.values(bmToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({error: {message: `Request body must contain either 'Title', 'Url', 'Description', or 'Rating'`}})
        }
        const knexInstance = req.app.get('db')
        BookmarksService.updateBookmark(knexInstance, id, bmToUpdate)
            .then(rowsAffected => {
                res.status(204).end()
            })
            .catch(next)
            
    })

module.exports = bookmarksRouter