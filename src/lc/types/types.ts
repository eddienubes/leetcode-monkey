import {
  LcUserSelect,
  LcUserToUserInChatSelect,
  SubmissionSelect,
} from '@/lc-users/LcUsersDao'
import { TgUserSelect } from '@/tg/TgUsersDao'
import { lcChatSettingsSelect, TgChatSelect } from '@/tg/TgChatsDao'

export interface lcUserProfile {
  allQuestionsCount: {
    difficulty: string
    count: number
  }[]
  matchedUser: {
    username: string
    socialAccounts: string | null
    githubUrl: string | null
    contributions: {
      points: number
      questionCount: number
      testcaseCount: number
    }
    profile: {
      realName: string
      websites: string[]
      countryName: string | null
      skillTags: string[]
      company: string | null
      school: string | null
      starRating: number
      aboutMe: string
      userAvatar: string
      reputation: number
      ranking: number
    }
    submissionCalendar: string
    submitStats: {
      acSubmissionNum: {
        difficulty: string
        count: number
        submissions: number
      }[]
      totalSubmissionNum: {
        difficulty: string
        count: number
        submissions: number
      }[]
    }
    badges: {
      id: string
      displayName: string
      icon: string
      creationDate: string
    }[]
    upcomingBadges: {
      name: string
      icon: string
    }[]
    activeBadge: {
      id: string
    } | null
  }
  recentSubmissionList: {
    title: string
    titleSlug: string
    timestamp: string
    lang: string
  }[]
}

export interface lcRecentAcceptedSubmissions {
  recentAcSubmissionList: {
    id: string
    title: string
    titleSlug: string
    timestamp: string
  }[]
}

export interface TgSubmissionNotifyJob {
  submission: SubmissionSelect
  tgUser: TgUserSelect
  tgChat: TgChatSelect
  lcUser: LcUserSelect
  lcUserInChat: LcUserToUserInChatSelect
  lcChatSettings: lcChatSettingsSelect
}

export interface TgSaveSubmissionJob {
  submission: SubmissionSelect
}

type TopicTag = {
  name: string;
  slug: string;
  translatedName: string | null;
};

type CodeSnippet = {
  lang: string;
  langSlug: string;
  code: string;
};

type SimilarQuestion = {
  title: string;
  titleSlug: string;
  difficulty: string;
  translatedTitle: string | null;
};

type Question = {
  questionId: string;
  questionFrontendId: string;
  boundTopicId: string | null;
  title: string;
  titleSlug: string;
  content: string;
  translatedTitle: string | null;
  translatedContent: string | null;
  isPaidOnly: boolean;
  difficulty: string;
  likes: number;
  dislikes: number;
  isLiked: boolean | null;
  similarQuestions: string; // JSON string, should be parsed into SimilarQuestion[]
  exampleTestcases: string; // JSON string, should be parsed into string[]
  contributors: any[];
  topicTags: TopicTag[];
  companyTagStats: any | null;
  codeSnippets: CodeSnippet[];
  stats: string; // JSON string, should be parsed into an object
  hints: string[];
  solution: any | null;
  status: any | null;
  sampleTestCase: string;
  metaData: string; // JSON string, should be parsed into an object
  judgerAvailable: boolean;
  judgeType: string;
  mysqlSchemas: any[];
  enableRunCode: boolean;
  enableTestMode: boolean;
  enableDebugger: boolean;
  envInfo: string;
};

export type LcProblemDetails = {
  data: {
    question: Question;
  };
};
