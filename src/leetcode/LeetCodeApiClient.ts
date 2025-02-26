import { ApolloClient, gql, InMemoryCache } from '@apollo/client/core'
import { LEETCODE_QUERIES } from './queries/leetcode'
import { LeetCodeRecentAcceptedSubmissions, LeetCodeUserProfile } from "@/leetcode/types/types";

export class LeetCodeApiClient {
  private readonly client = new ApolloClient({
    uri: 'https://leetcode.com/graphql',
    cache: new InMemoryCache(),
  })

  async getProfile(userSlug: string): Promise<LeetCodeUserProfile> {
    const results = await this.client.query({
      query: LEETCODE_QUERIES.profile,
      variables: {
        username: userSlug,
      },
    })

    return results.data
  }

  /**
   * Gets recent 20 submissions
   */
  async getAcceptedSubmissions(userSlug: string): Promise<LeetCodeRecentAcceptedSubmissions> {
    const results = await this.client.query({
      query: LEETCODE_QUERIES.acceptedSubmissions,
      variables: {
        username: userSlug,
      },
    })

    return results.data
  }
}
