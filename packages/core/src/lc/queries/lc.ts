import { gql } from '@apollo/client/core'

export const LC_QUERIES = {
  acceptedSubmissions: gql`
    query recentAcSubmissions($username: String!) {
      recentAcSubmissionList(username: $username) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `,
}
