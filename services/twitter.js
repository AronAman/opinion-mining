const Twitter = require('twitter')
const { TextAnalyticsClient, AzureKeyCredential } = require('@azure/ai-text-analytics')

const searchTweets = async (query) => {
	const twitterClient = new Twitter({
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
		bearer_token: process.env.TWITTER_BEARER_TOKEN
	})

	try {
		const tweets = await twitterClient.get('search/tweets', { q: query, count: 50, tweet_mode: 'extended', result_type: 'mixed', lang: 'en' })
		console.log("tweets retrieved", tweets.statuses.length)
		return {
			data: tweets.statuses.map(({ id, created_at, full_text }) => ({ id, created_at, text: full_text })),
			count: tweets.statuses.length
		}
	} catch (error) {
		console.log(error)
		if (Array.isArray(error) && error.length) {
			return { error: { message: error[0].message } }
		}

		return { error: { message: 'An error occurred' } }
	}
}

const analyzeTweets = async (input) => {
	const textAnalClient = new TextAnalyticsClient(process.env.AZURE_ENDPOINT, new AzureKeyCredential(process.env.AZURE_KEY))
	if (!input.length) {
		return { error: { message: 'An error occured. Please try again later.' } }
	}

	try {

		const requests = []
		for (let i = 0; i < input.length; i += 10) {
			requests.push(Promise.resolve(textAnalClient.analyzeSentiment(input.slice(i, i + 10))))
		}

		const response = await Promise.all(requests)
		const errors = response.filter(res => res.errors !== undefined)
		const sentimentResult = response.reduce((acc, result) => {
			return acc.concat(result)
		}, [])

		console.log("analyzedTweets", sentimentResult.length)

		if (!errors.length && sentimentResult.length) {
			const filteredData = sentimentResult.map((s) => ({
				text: input[s.id],
				sentiment: s.sentiment !== 'mixed'
					? s.sentiment
					: (() => {
						const scores = s.confidenceScores
						const scoreValues = Object.values(scores)
						const topScoreIndex = scoreValues.indexOf(Math.max.apply(null, scoreValues))
						const sentiment = Object.keys(scores)[topScoreIndex]
						return sentiment
					})(),
				scores: s.confidenceScores
			}))
			return filteredData
		} else {
			console.error('Encountered an error:', sentimentResult.error)
			return {
				error: { message: errors[0].message }
			}
		}
	} catch (error) {
		console.log(error)
		return { error: { message: error.message } }
	}
}

module.exports = {
	searchTweets,
	analyzeTweets
}