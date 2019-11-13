function makeBookmarksArray() {
    return [
        { 
            id: 1,
            title: 'Book1', 
            url: 'www.instagram.com', 
            description: 'A good book', 
            rating: 3
        },
        {
            id: 2,
            title: 'Book2',
            url: 'www.amazon.com', 
            description: 'A great book', 
            rating: 4
        },
        {
            id: 3,
            title: 'Book3', 
            url: 'www.google.com', 
            description: 'An even better book',
            rating: 5
        }
    ]
}

function makeNewBookmark() {
    return {
        id: 4,
        title: 'Book4',
        url: 'https://www.facebook.com',
        description: 'A really good book',
        rating: 5
    }
}

function makeMaliciousBookmark() {
    const maliciousBm =  
        {
            id: 911,
            title: 'Malicious Title <script>alert("xss");</script',
            url: 'https://www.zillow.com',
            description: 'Malicious description <img src="https://url.to.file.which/does_not_exist" onerror="alert(document.cookie)"/>. But not all <strong>bad</bad>.',
            rating: 1
        }
    
    const expectedBm = {
        id: 911,
        title: 'Malicious Title &lt;script&gt;alert("xss");&lt;/script',
        url: 'https://www.zillow.com',
        description: 'Malicious description <img src="https://url.to.file.which/does_not_exist" />. But not all <strong>bad&lt;/bad&gt;.',
        rating: 1
    }

    return {
        maliciousBm,
        expectedBm
    }

}

module.exports = { makeBookmarksArray, makeNewBookmark, makeMaliciousBookmark }