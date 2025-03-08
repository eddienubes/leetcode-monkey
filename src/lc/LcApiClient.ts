import { ApolloClient, gql, InMemoryCache } from '@apollo/client/core'
import { lc_QUERIES } from './queries/lc'
import {
  LcProblemDetails,
  lcRecentAcceptedSubmissions,
  lcUserProfile,
} from '@/lc/types/types'

export class LcApiClient {
  static MAX_RECENT_SUBMISSIONS = 20
  private readonly client = new ApolloClient({
    uri: 'https://lc.com/graphql',
    cache: new InMemoryCache(),
  })

  async getProfile(userSlug: string): Promise<lcUserProfile> {
    const results = await this.client.query({
      query: lc_QUERIES.profile,
      variables: {
        username: userSlug,
      },
    })

    return results.data
  }

  /**
   * Gets recent 20 submissions
   */
  async getAcceptedSubmissions(
    userSlug: string,
  ): Promise<lcRecentAcceptedSubmissions> {
    const results = await this.client.query({
      query: lc_QUERIES.acceptedSubmissions,
      variables: {
        username: userSlug,
      },
    })

    return results.data
  }

  async getProblem(slug: string): Promise<LcProblemDetails> {
    const results = await this.client.query({
      query: lc_QUERIES.problem,
      variables: {
        titleSlug: slug,
      },
    })

    return results.data
  }
}
