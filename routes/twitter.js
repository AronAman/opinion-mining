const express = require('express')
const router = express.Router()
const { searchTweets } = require('../services/twitter')

router.get('/', async (req, res) => {
	const query = req.query.q
	if (!query) {
		return res.send({ error: 'missing parameters' })
	}
	const tweets = await searchTweets(query)

	if (tweets.error) {
		return res.status(403).json(tweets.error)
	}

	const tweetsText = tweets.data.map(t => t.full_text)

	res.send(tweetsText)
})

module.exports = router