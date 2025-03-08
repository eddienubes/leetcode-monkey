import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { LC_QUERIES } from './queries/lc'
import { LcRecentAcceptedSubmissions } from '@/lc/types/types'
import { Problem, UserProfile, LeetCode } from 'leetcode-query'

export class LcApiClient {
  static MAX_RECENT_SUBMISSIONS = 20
  private readonly client = new ApolloClient({
    uri: 'https://leetcode.com/graphql',
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      },
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }
    }
  })
  private readonly leetcode = new LeetCode()

  async getProfile(userSlug: string): Promise<UserProfile> {
    const hit = await this.leetcode.user(userSlug)

    return hit
  }

  /**
   * Gets recent 20 submissions
   */
  async getAcceptedSubmissions(
    userSlug: string,
  ): Promise<LcRecentAcceptedSubmissions> {
    const results = await this.client.query({
      query: LC_QUERIES.acceptedSubmissions,
      variables: {
        username: userSlug,
      },
    })

    return results.data
  }

  async getProblem(slug: string): Promise<Problem> {
    const hit = await this.leetcode.problem(slug)
    return hit
  }
}
