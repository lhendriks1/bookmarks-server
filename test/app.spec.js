const app = require('../src/app')
const {API_TOKEN} = require('../src/config')

describe('App', () => {
    const token = API_TOKEN
    it('unauthorized request returns 401', () => {
        return supertest(app)
            .get('/bookmarks')
            .expect(401, {"error":"Unauthorized request"})
    })

    it('GET / bookmarks returns a list of bookmarks', () => {
        return supertest(app)
            .get('/bookmarks')
            .set('Authorization', 'Bearer' + token)
            .expect(200)
            .expect("Content-Type", /json/)
            .then(res => {
                expect(res.body).to.be.an('array')
                expect(res.body).to.have.lengthOf.at.least(1);
                const bookmark = res.body[0];
                expect(bookmark).to.include.all.keys('title', 'url', 'description', 'rating')
            })

    })
})