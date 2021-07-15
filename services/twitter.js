const Twitter = require('twitter')
const { TextAnalyticsClient, AzureKeyCredential } = require('@azure/ai-text-analytics')

const searchTweets = async (query) => {
	const twitterClient = new Twitter({
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
		bearer_token: process.env.TWITTER_BEARER_TOKEN
	})

	try {
		const tweets = await twitterClient.get('search/tweets', { q: query, count: 10, tweet_mode: 'extended', result_type: 'popular', lang: 'en' })
		// console.log(tweets.statuses)
		return {
			data: tweets.statuses.map(({ id, created_at, full_text }) => ({ id, created_at, text: full_text })),
			count: tweets.statuses.length
		}
	} catch (error) {
		if (Array.isArray(error) && error.length) {
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

const analyzeTweets = async (input) => {
	const textAnalClient = new TextAnalyticsClient(process.env.AZURE_ENDPOINT, new AzureKeyCredential(process.env.AZURE_KEY))
	if (!input.length) {
		return {
			error: {
				message: 'An error occured. Please try again later.'
			}
		}
	}

	try {
		const sentimentResult = await textAnalClient.analyzeSentiment(input)

		if (sentimentResult.error === undefined) {
			const filteredData = sentimentResult.map((s) => ({
				id: s.id,
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
				error: sentimentResult.error
			}
		}
	} catch (error) {
		return {
			error: error.message
		}
	}
}

module.exports = {
	searchTweets,
	analyzeTweets
}