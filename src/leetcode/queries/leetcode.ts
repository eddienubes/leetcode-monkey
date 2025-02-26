import { gql } from '@apollo/client/core'

export const LEETCODE_QUERIES = {
  profile: gql`
    query ($username: String!) {
      allQuestionsCount {
        difficulty
        count
      }
      matchedUser(username: $username) {
        username
        socialAccounts
        githubUrl
        contributions {
          points
          questionCount
          testcaseCount
        }
        profile {
          realName
          websites
          countryName
          skillTags
          company
          school
          starRating
          aboutMe
          userAvatar
          reputation
          ranking
        }
        submissionCalendar
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        badges {
          id
          displayName
          icon
          creationDate
        }
        upcomingBadges {
          name
          icon
        }
        activeBadge {
          id
        }
      }
      recentSubmissionList(username: $username, limit: 20) {
        title
        titleSlug
        timestamp
        statusDisplay
        lang
      }
    }
  `,
  acceptedSubmissions: gql`
    query 
    recentAcSubmissions($username: String!) {
        recentAcSubmissionList(username: $username) {
        id    
        title    
        titleSlug    
        timestamp  
      }
    }
  `,
}
