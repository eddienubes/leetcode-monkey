import { gql } from '@apollo/client/core'

export const lc_QUERIES = {
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
  problem: gql`
    query ($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
          questionId
          questionFrontendId
          boundTopicId
          title
          titleSlug
          content
          translatedTitle
          translatedContent
          isPaidOnly
          difficulty
          likes
          dislikes
          isLiked
          similarQuestions
          exampleTestcases
          contributors {
              username
              profileUrl
              avatarUrl
          }
          topicTags {
              name
              slug
              translatedName
          }
          companyTagStats
          codeSnippets {
              lang
              langSlug
              code
          }
          stats
          hints
          solution {
              id
              canSeeDetail
              paidOnly
              hasVideoSolution
              paidOnlyVideo
          }
          status
          sampleTestCase
          metaData
          judgerAvailable
          judgeType
          mysqlSchemas
          enableRunCode
          enableTestMode
          enableDebugger
          envInfo
          libraryUrl
          adminUrl
          challengeQuestion {
              id
              date
              incompleteChallengeCount
              streakCount
              type
          }
          note
      }
    }
  
  `
}
