const Twitter = require('twitter')

const client = new Twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	bearer_token: process.env.TWITTER_BEARER_TOKEN
})

const searchTweets = async (query) => {

	try {
		const tweets = await client.get('search/tweets', { q: query, count: 10, tweet_mode: 'extended', result_type: 'popular', lang: 'en' })
		// console.log(tweets.statuses)
		return {
			data: tweets.statuses.map(({ id, created_at, full_text }) => ({ id, created_at, full_text })),
			count: tweets.statuses.length
		}
	} catch (error) {
		if (typeof error === Array && error.length) {
			return {
				error: error[0].message
			}
		}

		console.log(error)
		return {
			error: 'An error occurred'
		}
	}
}

const analyzeTweets = async () => {
	//Todo
}

module.exports = {
	searchTweets
}