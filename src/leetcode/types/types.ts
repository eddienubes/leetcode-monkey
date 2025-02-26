export interface LeetCodeUserProfile {
  allQuestionsCount: {
    difficulty: string;
    count: number;
  }[];
  matchedUser: {
    username: string;
    socialAccounts: string | null;
    githubUrl: string | null;
    contributions: {
      points: number;
      questionCount: number;
      testcaseCount: number;
    };
    profile: {
      realName: string;
      websites: string[];
      countryName: string | null;
      skillTags: string[];
      company: string | null;
      school: string | null;
      starRating: number;
      aboutMe: string;
      userAvatar: string;
      reputation: number;
      ranking: number;
    };
    submissionCalendar: string;
    submitStats: {
      acSubmissionNum: {
        difficulty: string;
        count: number;
        submissions: number;
      }[];
      totalSubmissionNum: {
        difficulty: string;
        count: number;
        submissions: number;
      }[];
    };
    badges: {
      id: string;
      displayName: string;
      icon: string;
      creationDate: string;
    }[];
    upcomingBadges: {
      name: string;
      icon: string;
    }[];
    activeBadge: {
      id: string;
    } | null;
  };
  recentSubmissionList: {
    title: string;
    titleSlug: string;
    timestamp: string;
    lang: string;
  }[];
}

export interface LeetCodeRecentAcceptedSubmissions {
  recentAcSubmissionList: {
    id: string;
    title: string;
    titleSlug: string;
    timestamp: string;
  }[];
}