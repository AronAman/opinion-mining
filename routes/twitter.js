const express = require('express')
const router = express.Router()
const { searchTweets, analyzeTweets } = require('../services/twitter')
// const dummyData = require('../dummy_data.json')

router.get('/', async (req, res) => {
	const query = req.query.q
	if (!query) {
		return res.send({ error: 'missing parameters' })
	}
	const tweets = await searchTweets(query)

	if (tweets.error) {
		return res.status(403).json(tweets.error)
	}

	const tweetsText = tweets.data.map(t => t.text)
	// console.log(tweetsText)

	const sentimentResult = await analyzeTweets(tweetsText)

	res.json(sentimentResult)
})

module.exports = router