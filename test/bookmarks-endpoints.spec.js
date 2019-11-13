const knex = require('knex')
const app = require('../src/app')
const BookmarksService = require('../src/bookmarks-service.js')
const { makeBookmarksArray, makeNewBookmark, makeMaliciousBookmark } = require('./bookmarks.fixtures')
const { API_TOKEN } = require('../src/config')

describe('BookmarksService methods', () => {
    let db 
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

    before('clean up the table', () => db('bookmarks').truncate())
    afterEach('cleanup', () => db('bookmarks').truncate())
    after('disconnect from db', () => db.destroy())

    context(`Given there are bookmarks in the table`, () => {
        const testBookmarks = makeBookmarksArray()

        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
        })

        it('getAllBookmarks() responds with a list of all bookmarks', () => {

            return BookmarksService.getAllBookmarks(db)
            .then(actual => {
                expect(actual).to.eql(testBookmarks)
            })
        })

        it('getBookmarkById() responds with the bookmark obj', () => {
            const id = 1
            return BookmarksService.getBookmarkById(db, id)
            .then(actual => 
                expect(actual).to.eql(testBookmarks[id-1]))
        })

        it('insertBookmark() inserts a new bookmark and resolves the new bm with an id', () => {
            const newBm = makeNewBookmark()
            return BookmarksService.insertBookmark(db, newBm)
            .then(actual => {
                expect(actual).to.eql(newBm)
            })
        })

        it('deleteBookmark() deletes a bookmark', () => {
            const id = 1
            return BookmarksService.deleteBookmark(db, id)
            .then(res => {
                     return BookmarksService.getBookmarkById(db, id)
                        .then(postRes => 
                            expect(postRes).to.eql(undefined))
                })
        })
    })

    context(`Given there is no data in the table`, () => {
        it('getAllBookmarks() responds with an empty array', () => {
            return BookmarksService.getAllBookmarks(db)
                .then(actual =>
                    expect(actual).to.eql([])
                )
        })

        it('getBookmarkById() responds with undefined', () => {
            const id = 1
            return BookmarksService.getBookmarkById(db, id)
                .then(actual =>
                    expect(actual).to.be.undefined
                )
        })

        // it.skip('updateBookmarkById() responds with undefined', () => {
        //     const idToUpdate = 12345

        //     return BookmarksService.updateBookmark(db, idToUpdate)
        //         .then(actual => 
        //             expect(actual).to.be.undefined
        //         )
        // })
    })             
})


describe('Bookmarks Endpoints', function() {
    const token = API_TOKEN

    let db 
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

    before('clean up the table', () => db('bookmarks').truncate())
    afterEach('cleanup', () => db('bookmarks').truncate())
    after('disconnect from db', () => db.destroy())

    describe('GET/api/bookmarks endpoint', () => {
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('GET/api/bookmarks responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', 'Bearer ' + token)
                    .expect(200, testBookmarks)
            })
        })

        context('Given there are no bookmarks in the database', () => {
            it('GET/api/bookmarks responds with an empty array', () => {
            return supertest(app)
                .get('/api/bookmarks')
                .set('Authorization', 'Bearer ' + token)
                .expect(200, [])
            })
        })

        context('Given XSS attack content', () => {
            const { maliciousBm, expectedBm } = makeMaliciousBookmark()
            beforeEach('insert malicious bookmark', () => {
                return db
                    .insert(maliciousBm)
                    .into('bookmarks')
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/bookmarks/${maliciousBm.id}`)
                    .set('Authorization', 'Bearer ' + token)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBm.title)
                        expect(res.body.description).to.eql(expectedBm.description)
                    })
            })
        })
    })

    describe('GET/api/bookmarks/:id endpoint', () => {
        context('Given the id exists', () => {
            const testBookmarks = makeBookmarksArray()
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('GET/api/bookmarks/:id responds with the correct bookmark obj', () => {
                const bmId = 2
                expectedBm = testBookmarks[bmId-1]
                return supertest(app)
                    .get(`/api/bookmarks/${bmId}`)
                    .set('Authorization', 'Bearer ' + token)
                    .expect(200, expectedBm)
            })
        })

        context('Given XSS attack content', () => {
            const { maliciousBm, expectedBm } = makeMaliciousBookmark()
            beforeEach('insert malicious bookmark', () => {
                return db
                    .insert(maliciousBm)
                    .into('bookmarks')
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/bookmarks/${maliciousBm.id}`)
                    .set('Authorization', 'Bearer ' + token)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBm.title)
                        expect(res.body.description).to.eql(expectedBm.description)
                    })
            })
        })
    })

    describe('POST/api/bookmarks', () => {
        context('Given valid user post request', () => {
            it('POST/api/bookmarks responds with the 201 and the new bookmark object', () => {
                const newBm = makeNewBookmark()
                delete newBm['id']
                return supertest(app)
                    .post('/api/bookmarks')
                    .set('Authorization', 'Bearer '+ token)
                    .send(newBm)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(newBm.title)
                        expect(res.body.url).to.eql(newBm.url)
                        expect(res.body.description).to.eql(newBm.description)
                        expect(res.body.rating).to.eql(newBm.rating)
                        expect(res.body).to.have.property('id')
                        expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
                    })
                    .then(postRes =>
                        supertest(app)
                            .get(`/api/bookmarks/${postRes.body.id}`)
                            .set('Authorization', 'Bearer ' + token)
                            .expect(200, postRes.body)
                    )
            })
        })

        context('Given user post request is missing required fields', () => {
            const requiredFields = ['title', 'url', 'rating']
            requiredFields.forEach(field => {
                const newBookmark = makeNewBookmark()

                it(`responds with 400 and an error message when ${field} is missing`, () => {
                    delete newBookmark[field]
                    delete newBookmark['id']

                    return supertest(app)
                        .post('/api/bookmarks')
                        .send(newBookmark)
                        .set('Authorization', 'Bearer ' + token)
                        .expect(400, {error: {message: `${field} is required`}
                        })
                })
            })
        })

        context('Given XSS attack content', () => {
            const { maliciousBm, expectedBm } = makeMaliciousBookmark()

            it('removes XSS attack content', () => {
                return supertest(app)
                    .post('/api/bookmarks')
                    .set('Authorization', 'Bearer ' + token)
                    .send(maliciousBm)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBm.title)
                        expect(res.body.description).to.eql(expectedBm.description)
                    })
            })
        })
        
    })

    describe('DELETE/api/bookmarks/:id', () => {
        context('Given the id exists', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 204 and removes the bookmark', () => {
                const idToRemove = 2
                return supertest(app)
                    .delete(`/api/bookmarks/${idToRemove}`)
                    .set('Authorization', 'Bearer ' + token)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                        .get('/api/bookmarks')
                        .set('Authorization', 'Bearer ' + token)
                        .expect(testBookmarks.filter(bm => bm.id !== idToRemove))
                    )

            })
        })

        context('Given no bookmarks', () => {
            it('returns 404 message', () => {
                const idToRemove = 1
                return supertest(app)
                    .delete(`/api/bookmarks/${idToRemove}`)
                    .set('Authorization', 'Bearer ' + token)
                    .expect(404, {
                        error: {message: `Bookmark with id ${idToRemove} does not exist`}
                    })
            })
        })
    })

    describe('PATCH/api/bookmarks/:id', () => {
        context('Given the id exists', () => {
            const testBookmarks = makeBookmarksArray()
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it('responds with 204 and updates the bookmark', () => {
                const idToUpdate = 1
                const updateBookmark = {
                    title: 'Updated title',
                    description: 'Updated description'
                }
                const expectedBookmark = {
                    ...testBookmarks[idToUpdate - 1],
                    ...updateBookmark
                }
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', 'Bearer ' + token)
                    .send(updateBookmark)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .set('Authorization', 'Bearer ' + token)
                            .expect(expectedBookmark))
            })

            it('responds with 204 and updates the bookmark when only updating a subset of fields', () => {
                const idToUpdate = 2
                const updateBookmark = {
                    title: "Updated title"
                }
                const expectedBm = {
                    ...testBookmarks[idToUpdate -1],
                    ...updateBookmark
                }
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', 'Bearer ' + token)
                    .send(updateBookmark)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .set('Authorization', 'Bearer ' + token)
                            .expect(expectedBm)
                    )
            })

            it('responds with 400 when no fields are supplied', () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', 'Bearer ' + token)
                    .send({ irrelevantField: 'Foo'})
                    .expect(400, {error: {message: `Request body must contain either 'Title', 'Url', 'Description', or 'Rating'`}})
            })
        })

        context('Given no id provided as URL param', () => {
            it('responds with 404 and error message', () => {
                const updatedBookmark = {
                    title: 'Updated title',
                    description: 'Updated description'
                }
                return supertest(app)
                    .patch(`/api/bookmarks/`)
                    .set('Authorization', 'Bearer ' + token)
                    .send(updatedBookmark)
                    .expect(400, {error: {message: `Bookmark ID required`}})
            })
        })

        context('Given no data', () => {
            it('returns with 404', () => {
            const idToUpdate = 12345
            return supertest(app)
                .patch(`/api/bookmarks/${idToUpdate}`)
                .set('Authorization', 'Bearer ' + token)
                .expect(404, {error: {message: `Bookmark with id ${idToUpdate} does not exist`}})
            })
        })
    })
})